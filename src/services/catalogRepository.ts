import { AyahItem, CatalogProviderStatus, CuratedPlaylist, MediaItem, MusicCategory, Reciter } from '../types/media';
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
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .trim();
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
    const res = await fetch(`/api/quran/surah/${surahNumber}`);
    if (!res.ok) {
      throw new Error("Sure meali şu anda yüklenemedi. İnternet bağlantınızı kontrol edin.");
    }
    const json = (await res.json()) as {
      source: string;
      ayahs: Array<{ numberInSurah: number; globalNumber: number; arabicText: string; turkishMeal: string }>;
    };
    const ayahs: AyahItem[] = json.ayahs.map((a) => ({
      ...a,
      audioUrl: buildAyahAudioUrl(reciter, surahNumber, a.numberInSurah),
    }));
    return { ayahs, source: json.source };
  }
}

export interface DbCategoriesPayload {
  categories: MusicCategory[];
  playlistsSummary: Array<{
    id: string;
    categoryId: string;
    categoryName: string;
    title: string;
    subtitle: string;
    description: string;
    motif: MusicCategory['motif'];
    trackCount: number;
  }>;
}

export class DatabaseCatalogRepository {
  async fetchCategoriesAndPlaylists(): Promise<DbCategoriesPayload | null> {
    try {
      const res = await fetch('/api/db/categories');
      if (!res.ok) return null;
      return (await res.json()) as DbCategoriesPayload;
    } catch {
      return null;
    }
  }

  async createCategory(name: string, subtitle: string, language: string, genre: string): Promise<MusicCategory | null> {
    try {
      const res = await fetch('/api/db/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, subtitle, language, genre }),
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { category: MusicCategory };
      return data.category;
    } catch {
      return null;
    }
  }

  async getCategoryPlaylistsAndTracks(
    categoryId: string,
    forceRefresh = false
  ): Promise<{ playlists: CuratedPlaylist[]; tracks: MediaItem[]; notice?: string }> {
    const qs = forceRefresh ? '?refresh=1' : '';
    const res = await fetch(`/api/db/categories/${encodeURIComponent(categoryId)}/playlists${qs}`);
    if (!res.ok) {
      return {
        playlists: [],
        tracks: [],
        notice: 'Veritabanı listelerine şu an ulaşılamıyor. Telefonunuzdan ses dosyası yükleyebilirsiniz.',
      };
    }
    const data = (await res.json()) as {
      playlists?: CuratedPlaylist[];
      tracks?: MediaItem[];
      notice?: string;
    };
    return {
      playlists: data.playlists ?? [],
      tracks: data.tracks ?? [],
      notice: data.notice,
    };
  }

  async fetchAllCachedTracks(): Promise<MediaItem[]> {
    try {
      const res = await fetch('/api/db/tracks');
      if (!res.ok) return [];
      const data = (await res.json()) as { tracks?: MediaItem[] };
      return data.tracks ?? [];
    } catch {
      return [];
    }
  }

  async searchTracks(query: string, category?: MusicCategory): Promise<{ tracks: MediaItem[]; notice?: string }> {
    const params = new URLSearchParams({
      q: query,
      categoryId: category?.id ?? 'turkuler',
      language: category?.language ?? 'Türkçe',
      genre: category?.genre ?? 'Müzik',
      motif: category?.motif ?? 'turkuler',
      searchMode: '1',
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
      databaseConnected: false,
      quranApiConnected: true,
      internetArchiveConnected: false,
      jamendoConfigured: false,
      localArchiveReady: true,
    };
  }
}

export const quranRepository = new QuranCatalogRepository();
export const openMusicRepository = new DatabaseCatalogRepository();
