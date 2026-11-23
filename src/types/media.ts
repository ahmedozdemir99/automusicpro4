export type RepeatMode = 'off' | 'all' | 'one';

export type EqPresetId =
  | 'flat'
  | 'car'
  | 'headphones'
  | 'bass_boost'
  | 'vocal_quran'
  | 'tasavvuf'
  | 'custom';

export type NavTabId = 'home' | 'search' | 'quran' | 'library' | 'settings';

export type AppScreen =
  | { name: 'home' }
  | { name: 'categories' }
  | { name: 'artists' }
  | { name: 'artist_detail'; artistId: string }
  | { name: 'track_list'; categoryId?: string; categoryIds?: string[]; title: string }
  | { name: 'now_playing' }
  | { name: 'quran' }
  | { name: 'reciter_select' }
  | { name: 'surah_list'; reciterId: string }
  | { name: 'surah_detail'; surahNumber: number; reciterId: string }
  | { name: 'favorites' }
  | { name: 'playlists' }
  | { name: 'playlist_detail'; playlistId: string }
  | { name: 'create_playlist' }
  | { name: 'search' }
  | { name: 'downloads' }
  | { name: 'storage' }
  | { name: 'audio_settings' }
  | { name: 'general_settings' };

export type ArtworkMotif =
  | 'quran'
  | 'anatolia'
  | 'karadeniz'
  | 'tasavvuf'
  | 'arabic'
  | 'pop_rock'
  | 'nostalgia'
  | 'studio';

export interface MusicCategory {
  id: string;
  order: number;
  name: string;
  subtitle: string;
  language: string;
  genre: string;
  motif: ArtworkMotif;
  accentHex: string;
  archiveQuery: string;
  isQuran?: boolean;
  isCustom?: boolean;
}

export interface MediaItem {
  contentId: string;
  title: string;
  arabicTitle?: string;
  artistId: string;
  artistName: string;
  album: string;
  categoryId: string;
  language: string;
  genre: string;
  durationSec: number;
  streamUrl: string;
  coverUrl?: string;
  sourceProvider: 'mp3quran' | 'everyayah' | 'internet_archive' | 'jamendo' | 'local_file';
  downloadAllowed: boolean;
  licenseName: string;
  bitrateKbps?: number;
  format: 'MP3' | 'AAC' | 'FLAC' | 'OGG' | 'WAV';
  motif: ArtworkMotif;
  surahNumber?: number;
  reciterId?: string;
  ayahNumber?: number;
  isLocalFile?: boolean;
}

export interface ArtistSummary {
  id: string;
  name: string;
  categoryIds: string[];
  language: string;
  genre: string;
  trackCount: number;
  motif: ArtworkMotif;
  isReciter?: boolean;
}

export interface Reciter {
  id: string;
  nameTr: string;
  nameAr: string;
  style: string;
  country: string;
  bitrateKbps: number;
  surahBaseUrl: string;
  everyAyahFolder?: string;
  licenseName: string;
}

export interface SurahInfo {
  number: number;
  nameTr: string;
  nameAr: string;
  meaningTr: string;
  ayahCount: number;
  revelation: 'Mekke' | 'Medine';
}

export interface AyahItem {
  numberInSurah: number;
  globalNumber: number;
  arabicText: string;
  turkishMeal: string;
  audioUrl?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  items: MediaItem[];
  categoryFilterIds?: string[];
  isQuranPlaylist?: boolean;
}

export interface DownloadSettings {
  autoSaveOnPlay: boolean;
  wifiOnly: boolean;
  allowMobileData: boolean;
  preferredBitrateKbps: 128 | 192 | 256 | 320;
  storageLocation: 'app_archive';
  userQuotaGb: number | null;
  preventDuplicateDownload: boolean;
  minFreeSpaceGb: number;
}

export interface DownloadRecord {
  contentId: string;
  item: MediaItem;
  sizeBytes: number;
  savedAt: number;
  mimeType: string;
}

export interface DownloadProgress {
  contentId: string;
  title: string;
  progress: number; // 0..100
  status: 'queued' | 'downloading' | 'completed' | 'paused_low_storage' | 'error';
  errorMessage?: string;
}

export interface EqualizerSettings {
  enabled: boolean;
  preset: EqPresetId;
  bandsDb: [number, number, number, number, number]; // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz (-12..+12)
  bassBoostDb: number; // 0..12
  trebleBoostDb: number; // -6..+12
}

export interface PlaybackResumePoint {
  contentId: string;
  positionSec: number;
  updatedAt: number;
}

export interface CatalogProviderStatus {
  quranApiConnected: boolean;
  internetArchiveConnected: boolean;
  jamendoConfigured: boolean;
  localArchiveReady: boolean;
}
