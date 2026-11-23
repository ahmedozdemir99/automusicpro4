import { AyahItem, CatalogProviderStatus, MediaItem, MusicCategory, Reciter } from '../types/media';
import { RECITERS, SURAHS, buildAyahAudioUrl, buildSurahMediaItem } from '../data/quranData';

// Turkish & Arabic accent-insensitive search normalizer
export function normalizeSearchText(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/[âàáä]/g, 'a')
    .replace(/[îìíïı]/g, 'i')
    .replace(/[ûùúü]/g, 'u')
    .replace(/[ôòóö]/g, 'o')
    .replace(/[ç]/g, 'c')
    .replace(/[ğ]/g, 'g')
    .replace(/[ş]/g, 's')
    .replace(/['’‘`]/g, '')
    // Strip Arabic Tashkeel (diacritics) for clean Arabic matching
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
}

export interface MediaCatalogRepository {
  readonly providerId: string;
  getCategoryTracks(category: MusicCategory): Promise<{ tracks: MediaItem[]; notice?: string }>;
  searchTracks(query: string, category?: MusicCategory): Promise<{ tracks: MediaItem[]; notice?: string }>;
}

export class QuranCatalogRepository {
  getReciters(): Reciter[] {
    return RECITERS;
  }

  getReciterById(reciterId: string): Reciter {
    return RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0];
  }

  getSurahTracksForReciter(reciterId: string): MediaItem[] {
    const reciter = this.getReciterById(reciterId);
    return SURAHS.map((surah) => buildSurahMediaItem(surah, reciter));
  }

  async fetchSurahAyahsWithMeal(surahNumber: number, reciterId: string): Promise<{ ayahs: AyahItem[]; source: string }> {
    const reciter = this.getReciterById(reciterId);
    const res = await fetch(`/api/quran/surah/${surahNumber}`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Kur’an servisi HTML döndürdü. Cloudflare Pages Functions dağıtımını kontrol edin.');
    }
    const json = (await res.json()) as {
      source?: string;
      error?: string;
      ayahs?: Array<{ numberInSurah: number; globalNumber: number; arabicText: string; turkishMeal: string }>;
    };
    if (!res.ok || !Array.isArray(json.ayahs) || json.ayahs.length === 0) {
      throw new Error(json.error || 'Sure metni yüklenemedi. Lütfen yeniden deneyin.');
    }
    const ayahs: AyahItem[] = json.ayahs.map((a) => ({
      ...a,
      audioUrl: buildAyahAudioUrl(reciter, surahNumber, a.numberInSurah),
    }));
    return { ayahs, source: json.source || "Kur’an metni" };
  }
}

export class OpenMusicCatalogRepository implements MediaCatalogRepository {
  readonly providerId = 'open_licensed_catalog';
  private memoryCache = new Map<string, { tracks: MediaItem[]; notice?: string }>();

  async getCategoryTracks(category: MusicCategory): Promise<{ tracks: MediaItem[]; notice?: string }> {
    if (category.isQuran) {
      return { tracks: quranRepository.getSurahTracksForReciter(RECITERS[0].id) };
    }
    if (this.memoryCache.has(category.id)) {
      return this.memoryCache.get(category.id)!;
    }
    const params = new URLSearchParams({
      q: category.archiveQuery || category.name,
      categoryId: category.id,
      language: category.language,
      genre: category.genre,
      motif: category.motif,
    });
    const res = await fetch(`/api/catalog/open-music?${params.toString()}`);
    if (!res.ok) {
      return {
        tracks: [],
        notice: 'Açık lisanslı katalog bağlantısı şu an kurulamadı. Yerel ses dosyalarınızı ekleyebilirsiniz.',
      };
    }
    const data = (await res.json()) as { tracks: MediaItem[]; notice?: string };
    const result = { tracks: data.tracks ?? [], notice: data.notice };
    this.memoryCache.set(category.id, result);
    return result;
  }

  async searchTracks(query: string, category?: MusicCategory): Promise<{ tracks: MediaItem[]; notice?: string }> {
    const params = new URLSearchParams({
      q: query,
      categoryId: category?.id ?? 'nostalji',
      language: category?.language ?? 'Türkçe',
      genre: category?.genre ?? 'Açık Arşiv',
      motif: category?.motif ?? 'studio',
    });
    const res = await fetch(`/api/catalog/open-music?${params.toString()}`);
    if (!res.ok) {
      return { tracks: [], notice: 'Çevrimiçi katalog araması tamamlanamadı.' };
    }
    const data = (await res.json()) as { tracks: MediaItem[]; notice?: string };
    return { tracks: data.tracks ?? [], notice: data.notice };
  }
}

export async function fetchCatalogProviderStatus(): Promise<CatalogProviderStatus> {
  try {
    const res = await fetch('/api/catalog/status');
    if (!res.ok) throw new Error('status unavailable');
    return (await res.json()) as CatalogProviderStatus;
  } catch {
    return {
      quranApiConnected: true,
      internetArchiveConnected: false,
      jamendoConfigured: false,
      localArchiveReady: true,
    };
  }
}

export const quranRepository = new QuranCatalogRepository();
export const openMusicRepository = new OpenMusicCatalogRepository();
