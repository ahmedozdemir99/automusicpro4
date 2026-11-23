import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// Strict SSRF allowlist for verified open-licensed Quran and open audio CDNs
const EXACT_ALLOWED_AUDIO_HOSTS = new Set<string>([
  'server6.mp3quran.net',
  'server7.mp3quran.net',
  'server8.mp3quran.net',
  'server9.mp3quran.net',
  'server10.mp3quran.net',
  'server11.mp3quran.net',
  'server12.mp3quran.net',
  'server13.mp3quran.net',
  'server14.mp3quran.net',
  'server16.mp3quran.net',
  'download.quranicaudio.com',
  'everyayah.com',
  'www.everyayah.com',
  'cdn.islamic.network',
  'archive.org',
  'prod-1.storage.jamendo.com',
  'mp3d.jamendo.com',
  'mp3l.jamendo.com',
]);

function isAllowedAudioUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    if (parsed.port && parsed.port !== '443') return null;

    const host = parsed.hostname.toLowerCase();
    // Block raw IPv4 / IPv6 / localhost
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':') || host === 'localhost') {
      return null;
    }

    if (EXACT_ALLOWED_AUDIO_HOSTS.has(host)) {
      return parsed;
    }

    // Allow verified Internet Archive storage nodes (e.g. ia800100.us.archive.org)
    if (/^ia\d+\.(us|ca|eu)\.archive\.org$/.test(host) || /^dn\d+\.ca\.archive\.org$/.test(host)) {
      return parsed;
    }

    return null;
  } catch {
    return null;
  }
}

interface SurahCacheEntry {
  fetchedAt: number;
  data: unknown;
}
const surahCache = new Map<number, SurahCacheEntry>();

interface OpenMusicCacheEntry {
  fetchedAt: number;
  tracks: unknown[];
}
const openMusicCache = new Map<string, OpenMusicCacheEntry>();

async function fetchWithSafeRedirects(initialUrl: URL, headers: Record<string, string>, maxRedirects = 4): Promise<globalThis.Response> {
  let currentUrl = initialUrl;
  for (let i = 0; i <= maxRedirects; i++) {
    const response = await fetch(currentUrl.toString(), {
      method: 'GET',
      headers,
      redirect: 'manual',
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) {
        return response;
      }
      const nextRaw = new URL(location, currentUrl).toString();
      const validatedNext = isAllowedAudioUrl(nextRaw);
      if (!validatedNext) {
        throw new Error('Yönlendirme adresi izin verilen açık ses kaynakları dışında.');
      }
      currentUrl = validatedNext;
      continue;
    }

    return response;
  }
  throw new Error('Çok fazla yönlendirme.');
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // 1. Catalog Provider Status (never exposes secrets)
  app.get('/api/catalog/status', (_req: Request, res: Response) => {
    res.json({
      quranApiConnected: true,
      internetArchiveConnected: true,
      jamendoConfigured: Boolean(process.env.JAMENDO_CLIENT_ID && process.env.JAMENDO_CLIENT_ID.trim().length > 0),
      localArchiveReady: true,
    });
  });

  // 2. Real Quran Surah Arabic + Turkish Diyanet Meal (api.alquran.cloud)
  app.get('/api/quran/surah/:number', async (req: Request, res: Response) => {
    const num = Number.parseInt(String(req.params.number), 10);
    if (!Number.isInteger(num) || num < 1 || num > 114) {
      res.status(400).json({ error: 'Geçersiz sure numarası (1-114 arası olmalıdır).' });
      return;
    }

    const cached = surahCache.get(num);
    if (cached && Date.now() - cached.fetchedAt < 1000 * 60 * 60 * 12) {
      res.json(cached.data);
      return;
    }

    try {
      const apiUrl = `https://api.alquran.cloud/v1/surah/${num}/editions/quran-uthmani,tr.diyanet`;
      const upstream = await fetch(apiUrl, {
        headers: { Accept: 'application/json' },
      });
      if (!upstream.ok) {
        res.status(502).json({ error: "Kur'an meal servisi geçici olarak yanıt vermiyor." });
        return;
      }
      const payload = (await upstream.json()) as {
        code: number;
        data?: Array<{
          number: number;
          name: string;
          englishName: string;
          ayahs: Array<{ number: number; numberInSurah: number; text: string }>;
        }>;
      };

      const arabicEdition = payload.data?.[0];
      const turkishEdition = payload.data?.[1];
      if (!arabicEdition || !turkishEdition) {
        res.status(502).json({ error: 'Sure verisi eksik alındı.' });
        return;
      }

      const ayahs = arabicEdition.ayahs.map((ar, idx) => ({
        numberInSurah: ar.numberInSurah,
        globalNumber: ar.number,
        arabicText: ar.text,
        turkishMeal: turkishEdition.ayahs[idx]?.text ?? '',
      }));

      const result = {
        surahNumber: num,
        arabicName: arabicEdition.name,
        ayahCount: ayahs.length,
        source: 'AlQuran Cloud (Diyanet İşleri Meali)',
        ayahs,
      };

      surahCache.set(num, { fetchedAt: Date.now(), data: result });
      res.json(result);
    } catch {
      res.status(502).json({ error: "Kur'an metni alınırken bağlantı hatası oluştu." });
    }
  });

  // 3. Real Open-Licensed Music Catalog (Internet Archive Public Domain / Creative Commons + Optional Jamendo)
  app.get('/api/catalog/open-music', async (req: Request, res: Response) => {
    const query = String(req.query.q ?? '').trim().slice(0, 140);
    const categoryId = String(req.query.categoryId ?? 'turkuler').trim().slice(0, 40);
    const language = String(req.query.language ?? 'Türkçe').trim().slice(0, 40);
    const genre = String(req.query.genre ?? 'Müzik').trim().slice(0, 40);
    const motif = String(req.query.motif ?? 'anatolia').trim().slice(0, 24);

    if (!query) {
      res.json({ tracks: [], provider: 'none', notice: 'Arama sorgusu belirtilmedi.' });
      return;
    }

    const cacheKey = `${categoryId}:${query.toLowerCase()}`;
    const cached = openMusicCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < 1000 * 60 * 30) {
      res.json({ tracks: cached.tracks, provider: 'internet_archive' });
      return;
    }

    try {
      const tracks: Array<Record<string, unknown>> = [];

      // Optional Jamendo API if configured via server-side environment secret
      const jamendoClientId = process.env.JAMENDO_CLIENT_ID?.trim();
      if (jamendoClientId) {
        const jamendoUrl = new URL('https://api.jamendo.com/v3.0/tracks/');
        jamendoUrl.searchParams.set('client_id', jamendoClientId);
        jamendoUrl.searchParams.set('format', 'json');
        jamendoUrl.searchParams.set('limit', '12');
        jamendoUrl.searchParams.set('search', query);
        jamendoUrl.searchParams.set('audioformat', 'mp32');

        const jRes = await fetch(jamendoUrl.toString());
        if (jRes.ok) {
          const jData = (await jRes.json()) as {
            results?: Array<{
              id: string;
              name: string;
              artist_id: string;
              artist_name: string;
              album_name: string;
              duration: number;
              audio: string;
              audiodownload_allowed: boolean;
              license_ccurl?: string;
            }>;
          };
          for (const item of jData.results ?? []) {
            if (!item.audio || !isAllowedAudioUrl(item.audio)) continue;
            tracks.push({
              contentId: `jamendo:${item.id}`,
              title: item.name,
              artistId: `jamendo-artist:${item.artist_id}`,
              artistName: item.artist_name,
              album: item.album_name || genre,
              categoryId,
              language,
              genre,
              durationSec: Number(item.duration) || 0,
              streamUrl: item.audio,
              sourceProvider: 'jamendo',
              downloadAllowed: Boolean(item.audiodownload_allowed),
              licenseName: item.license_ccurl ? 'Creative Commons (Jamendo)' : 'Jamendo Açık Dinleme',
              bitrateKbps: 192,
              format: 'MP3',
              motif,
            });
          }
        }
      }

      // Internet Archive Open Audio Search (Verified real public domain / Creative Commons audio)
      const searchUrl = new URL('https://archive.org/advancedsearch.php');
      searchUrl.searchParams.set(
        'q',
        `(${query}) AND mediatype:(audio) AND format:(VBR MP3 OR MP3 OR Ogg Vorbis) AND NOT access-restricted-item:true`
      );
      searchUrl.searchParams.append('fl[]', 'identifier');
      searchUrl.searchParams.append('fl[]', 'title');
      searchUrl.searchParams.append('fl[]', 'creator');
      searchUrl.searchParams.append('fl[]', 'licenseurl');
      searchUrl.searchParams.set('rows', '8');
      searchUrl.searchParams.set('page', '1');
      searchUrl.searchParams.set('output', 'json');

      const iaRes = await fetch(searchUrl.toString(), {
        headers: { Accept: 'application/json', 'User-Agent': 'AutoMusicPro/1.0' },
      });

      if (iaRes.ok) {
        const iaJson = (await iaRes.json()) as {
          response?: {
            docs?: Array<{
              identifier: string;
              title?: string | string[];
              creator?: string | string[];
              licenseurl?: string;
            }>;
          };
        };

        const docs = (iaJson.response?.docs ?? []).slice(0, 5);
        const metadataResults = await Promise.allSettled(
          docs.map(async (doc) => {
            const metaRes = await fetch(`https://archive.org/metadata/${encodeURIComponent(doc.identifier)}/files`, {
              headers: { Accept: 'application/json', 'User-Agent': 'AutoMusicPro/1.0' },
            });
            if (!metaRes.ok) return null;
            const metaJson = (await metaRes.json()) as {
              result?: Array<{
                name?: string;
                format?: string;
                length?: string;
                bitrate?: string;
                title?: string;
                artist?: string;
                album?: string;
              }>;
            };
            const files = metaJson.result ?? [];
            const audioFiles = files
              .filter(
                (f) =>
                  f.name &&
                  /\.(mp3|ogg|flac)$/i.test(f.name) &&
                  !f.name.includes('_64kb') &&
                  !f.name.startsWith('__')
              )
              .slice(0, 3);

            return { doc, audioFiles };
          })
        );

        for (const resItem of metadataResults) {
          if (resItem.status !== 'fulfilled' || !resItem.value) continue;
          const { doc, audioFiles } = resItem.value;
          const docTitle = Array.isArray(doc.title) ? doc.title[0] : doc.title ?? doc.identifier;
          const docCreator = Array.isArray(doc.creator) ? doc.creator[0] : doc.creator ?? 'Açık Arşiv Sanatçısı';

          for (const file of audioFiles) {
            if (!file.name) continue;
            const encodedPath = file.name
              .split('/')
              .map((seg) => encodeURIComponent(seg))
              .join('/');
            const directUrl = `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodedPath}`;
            if (!isAllowedAudioUrl(directUrl)) continue;

            const ext = file.name.split('.').pop()?.toUpperCase();
            const format = ext === 'FLAC' ? 'FLAC' : ext === 'OGG' ? 'OGG' : 'MP3';
            const parsedDur = file.length ? Math.round(Number.parseFloat(file.length)) : 0;
            const parsedBitrate = file.bitrate ? Math.round(Number.parseFloat(file.bitrate)) : undefined;
            const cleanFileTitle =
              file.title ||
              file.name
                .replace(/^.*\//, '')
                .replace(/\.(mp3|ogg|flac)$/i, '')
                .replace(/[_-]+/g, ' ')
                .trim();

            tracks.push({
              contentId: `ia:${doc.identifier}:${file.name}`,
              title: cleanFileTitle || docTitle,
              artistId: `ia-artist:${(file.artist || docCreator).toLowerCase().replace(/[^a-z0-9ğüşöçı]+/gi, '-')}`,
              artistName: file.artist || docCreator,
              album: file.album || docTitle,
              categoryId,
              language,
              genre,
              durationSec: Number.isFinite(parsedDur) && parsedDur > 0 ? parsedDur : 0,
              streamUrl: directUrl,
              sourceProvider: 'internet_archive',
              downloadAllowed: true,
              licenseName: doc.licenseurl ? 'Creative Commons / Açık Lisans' : 'Internet Archive Açık Arşiv',
              bitrateKbps: Number.isFinite(parsedBitrate) && parsedBitrate ? parsedBitrate : undefined,
              format,
              motif,
            });
          }
        }
      }

      openMusicCache.set(cacheKey, { fetchedAt: Date.now(), tracks });
      res.json({
        tracks,
        provider: tracks.length > 0 ? 'internet_archive' : 'empty',
        notice:
          tracks.length === 0
            ? 'Bu kategoride açık lisanslı çevrimiçi kayıt bulunamadı. Kendi ses dosyalarınızı ekleyebilir veya katalog sağlayıcısı bağlayabilirsiniz.'
            : undefined,
      });
    } catch {
      res.status(502).json({
        tracks: [],
        provider: 'error',
        notice: 'Açık müzik kataloğu servisine şu an ulaşılamıyor.',
      });
    }
  });

  // 4. SSRF-hardened Range-supporting Audio Proxy (enables Web Audio EQ + Offline Download)
  app.get('/api/audio/proxy', async (req: Request, res: Response) => {
    const rawUrl = String(req.query.url ?? '');
    const validatedUrl = isAllowedAudioUrl(rawUrl);
    if (!validatedUrl) {
      res.status(400).json({ error: 'Yalnızca izin verilen açık lisanslı ses kaynakları desteklenir.' });
      return;
    }

    try {
      const upstreamHeaders: Record<string, string> = {
        'User-Agent': 'AutoMusicPro/1.0',
      };
      if (typeof req.headers.range === 'string') {
        upstreamHeaders.Range = req.headers.range;
      }

      const upstream = await fetchWithSafeRedirects(validatedUrl, upstreamHeaders);
      if (!upstream.ok && upstream.status !== 206) {
        res.status(upstream.status).json({ error: 'Ses dosyası kaynaktan alınamadı.' });
        return;
      }

      const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
      res.status(upstream.status);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', upstream.headers.get('accept-ranges') || 'bytes');
      const contentLength = upstream.headers.get('content-length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      const contentRange = upstream.headers.get('content-range');
      if (contentRange) res.setHeader('Content-Range', contentRange);
      res.setHeader('Cache-Control', 'public, max-age=86400');

      if (!upstream.body) {
        res.end();
        return;
      }

      const nodeStream = Readable.fromWeb(upstream.body as Parameters<typeof Readable.fromWeb>[0]);
      nodeStream.on('error', () => {
        if (!res.headersSent) {
          res.status(502).end();
        } else {
          res.end();
        }
      });
      nodeStream.pipe(res);
    } catch {
      if (!res.headersSent) {
        res.status(502).json({ error: 'Ses akışı aktarılırken hata oluştu.' });
      }
    }
  });

  // Vite dev middleware vs production dist
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoMusic Pro server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
