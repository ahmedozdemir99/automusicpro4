import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  Heart,
  Layers,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Shuffle,
  Upload,
} from 'lucide-react';
import { ArtworkCover } from '../components/ArtworkCover';
import { TrackRow } from '../components/TrackRow';
import { useAutoMusic } from '../context/AutoMusicContext';
import { RECITERS, SURAHS, buildSurahMediaItem } from '../data/quranData';
import { normalizeSearchText } from '../services/catalogRepository';
import { ArtistSummary, MediaItem } from '../types/media';

// ============================================================
// Screen 2: Müzik Kategorileri (All 17 + Multi-Category Joint Playlist + Add Category)
// ============================================================
export const CategoriesScreen: React.FC = () => {
  const { categories, addCategory, navigate, loadCategoryTracks, createPlaylist, showToast } = useAutoMusic();
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newLanguage, setNewLanguage] = useState('Türkçe');
  const [buildingCombined, setBuildingCombined] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleCreateCombinedPlaylist = async () => {
    if (selectedIds.length < 2) {
      showToast('Ortak liste için en az 2 kategori seçin.');
      return;
    }
    setBuildingCombined(true);
    try {
      const combinedTracks: MediaItem[] = [];
      for (const cid of selectedIds) {
        const items = await loadCategoryTracks(cid);
        combinedTracks.push(...items.slice(0, 12));
      }
      const names = categories
        .filter((c) => selectedIds.includes(c.id))
        .map((c) => c.name);
      const pl = createPlaylist(
        `Karma: ${names.slice(0, 2).join(' + ')}${names.length > 2 ? ` (+${names.length - 2})` : ''}`,
        `${names.join(', ')} kategorilerinden ortak çalma listesi`,
        combinedTracks,
        false,
        selectedIds
      );
      setMultiSelectMode(false);
      setSelectedIds([]);
      navigate({ name: 'playlist_detail', playlistId: pl.id });
    } finally {
      setBuildingCombined(false);
    }
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addCategory(newName, newSubtitle, newLanguage, newName);
    setNewName('');
    setNewSubtitle('');
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Müzik Kategorileri</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            {categories.length} ayrı kategori · İleride yeni kategoriler kolayca eklenebilir
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setMultiSelectMode((v) => !v);
              setSelectedIds([]);
            }}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
              multiSelectMode
                ? 'bg-[#D4AF37] text-[#09090B] border-[#D4AF37]'
                : 'bg-[#141418] text-[#F5F2EB] border-white/10 hover:border-[#D4AF37]/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            {multiSelectMode ? 'Çoklu Seçimi İptal Et' : 'Ortak Liste İçin Kategori Seç'}
          </button>

          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141418] hover:bg-[#1C1C22] border border-white/10 text-xs font-medium text-[#F5F2EB] transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            Yeni Kategori Ekle
          </button>
        </div>
      </div>

      {multiSelectMode && (
        <div className="p-4 rounded-2xl bg-[#17150F] border border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm text-[#F5F2EB]">
            <span className="font-mono tabular-nums font-semibold text-[#D4AF37]">{selectedIds.length}</span>{' '}
            kategori seçildi. Birden fazla kategori seçerek ortak çalma listesi oluşturabilirsiniz.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={selectedIds.length < 2 || buildingCombined}
              onClick={() => void handleCreateCombinedPlaylist()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] disabled:opacity-40 text-[#09090B] text-xs font-semibold whitespace-nowrap"
            >
              {buildingCombined && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Ortak Çalma Listesi Oluştur
            </button>
          </div>
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAddCategory}
          className="p-5 rounded-2xl bg-[#121216] border border-white/[0.08] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div className="space-y-1">
            <label className="text-xs text-[#9B978E]">Kategori Adı</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Örn: Klasik Enstrümantal"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#9B978E]">Açıklama</label>
            <input
              type="text"
              value={newSubtitle}
              onChange={(e) => setNewSubtitle(e.target.value)}
              placeholder="Kısa kategori açıklaması"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-[#9B978E]">Dil</label>
            <input
              type="text"
              value={newLanguage}
              onChange={(e) => setNewLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B0B0E] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="h-[42px] px-4 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold"
          >
            Kategoriyi Kaydet
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const isSelected = selectedIds.includes(cat.id);
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                if (multiSelectMode) {
                  toggleSelect(cat.id);
                } else if (cat.isQuran) {
                  navigate({ name: 'quran' });
                } else {
                  navigate({ name: 'track_list', categoryId: cat.id, title: cat.name });
                }
              }}
              className={`group p-4 rounded-2xl border text-left transition-colors flex items-center gap-4 ${
                isSelected
                  ? 'bg-[#1D1A10] border-[#D4AF37]'
                  : 'bg-[#121216] hover:bg-[#19181F] border-white/[0.06] hover:border-[#D4AF37]/30'
              }`}
            >
              <ArtworkCover motif={cat.motif} categoryId={cat.id} title={cat.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono tabular-nums text-[#D4AF37]">
                    {String(cat.order).padStart(2, '0')}
                  </span>
                  {multiSelectMode ? (
                    <span
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        isSelected ? 'bg-[#D4AF37] border-[#D4AF37] text-[#09090B]' : 'border-white/25'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#7C7970]">{cat.language}</span>
                  )}
                </div>
                <p className="text-base font-semibold text-[#F5F2EB] truncate mt-0.5">{cat.name}</p>
                <p className="text-xs text-[#9B978E] truncate mt-0.5">{cat.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// Screen 3: Sanatçı Listesi & Screen 4: Sanatçı Detayları
// ============================================================
export const ArtistsScreen: React.FC = () => {
  const { catalogTracksByCategory, favoriteArtistIds, toggleFavoriteArtist, navigate } = useAutoMusic();
  const [query, setQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const artists = useMemo<ArtistSummary[]>(() => {
    const map = new Map<string, ArtistSummary>();

    // Include all 6 Quran reciters as authentic artists
    for (const rec of RECITERS) {
      map.set(`reciter:${rec.id}`, {
        id: `reciter:${rec.id}`,
        name: rec.nameTr,
        categoryIds: ['kuran'],
        language: 'Arapça',
        genre: "Kur'an Tilaveti",
        trackCount: 114,
        motif: 'quran',
        isReciter: true,
      });
    }

    // Aggregate loaded open-catalog & local archive tracks by artist
    for (const tracks of Object.values(catalogTracksByCategory)) {
      for (const t of tracks) {
        const existing = map.get(t.artistId);
        if (existing) {
          existing.trackCount += 1;
          if (!existing.categoryIds.includes(t.categoryId)) {
            existing.categoryIds.push(t.categoryId);
          }
        } else {
          map.set(t.artistId, {
            id: t.artistId,
            name: t.artistName,
            categoryIds: [t.categoryId],
            language: t.language,
            genre: t.genre,
            trackCount: 1,
            motif: t.motif,
          });
        }
      }
    }

    return Array.from(map.values());
  }, [catalogTracksByCategory]);

  const filtered = useMemo(() => {
    const norm = normalizeSearchText(query);
    return artists.filter((a) => {
      if (onlyFavorites && !favoriteArtistIds.includes(a.id)) return false;
      if (!norm) return true;
      return (
        normalizeSearchText(a.name).includes(norm) ||
        normalizeSearchText(a.genre).includes(norm) ||
        normalizeSearchText(a.language).includes(norm)
      );
    });
  }, [artists, favoriteArtistIds, onlyFavorites, query]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">Sanatçılar ve Kariler</h1>
          <p className="text-sm text-[#9B978E] mt-1">
            Bir sanatçı seçerek tüm kayıtlarını sıralı veya karışık dinleyebilirsiniz
          </p>
        </div>
        <div className="flex items-center gap-1 p-1 bg-[#141418] border border-white/[0.08] rounded-xl">
          <button
            type="button"
            onClick={() => setOnlyFavorites(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              !onlyFavorites ? 'bg-[#D4AF37] text-[#09090B]' : 'text-[#A19E95] hover:text-[#F5F2EB]'
            }`}
          >
            Tümü ({artists.length})
          </button>
          <button
            type="button"
            onClick={() => setOnlyFavorites(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              onlyFavorites ? 'bg-[#D4AF37] text-[#09090B]' : 'text-[#A19E95] hover:text-[#F5F2EB]'
            }`}
          >
            Favoriler
          </button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-[#8C887F] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Sanatçı veya kari adına göre ara..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121216] border border-white/10 text-sm text-[#F5F2EB] placeholder:text-[#7C7970] focus:border-[#D4AF37] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((artist) => {
          const isFav = favoriteArtistIds.includes(artist.id);
          return (
            <div
              key={artist.id}
              className="p-4 rounded-2xl bg-[#121216] border border-white/[0.06] hover:border-[#D4AF37]/30 flex items-center justify-between gap-3 transition-colors"
            >
              <button
                type="button"
                onClick={() => navigate({ name: 'artist_detail', artistId: artist.id })}
                className="flex items-center gap-3.5 min-w-0 text-left flex-1"
              >
                <ArtworkCover motif={artist.motif} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F5F2EB] truncate">{artist.name}</p>
                  <p className="text-xs text-[#9B978E] truncate mt-0.5">
                    {artist.genre} · {artist.trackCount} kayıt
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => toggleFavoriteArtist(artist.id)}
                aria-label="Sanatçıyı favorilere ekle"
                className={`min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg ${
                  isFav ? 'text-[#D4AF37]' : 'text-[#8C887F] hover:text-[#F5F2EB]'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFav ? 'fill-[#D4AF37]' : ''}`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ArtistDetailScreen: React.FC<{ artistId: string }> = ({ artistId }) => {
  const { catalogTracksByCategory, favoriteArtistIds, toggleFavoriteArtist, playQueue, goBack, navigate } =
    useAutoMusic();

  const isReciter = artistId.startsWith('reciter:');
  const reciter = isReciter ? RECITERS.find((r) => `reciter:${r.id}` === artistId) : undefined;

  const tracks = useMemo<MediaItem[]>(() => {
    if (reciter) {
      return SURAHS.map((s) => buildSurahMediaItem(s, reciter));
    }
    return Object.values(catalogTracksByCategory)
      .flat()
      .filter((t) => t.artistId === artistId);
  }, [artistId, catalogTracksByCategory, reciter]);

  const artistName = reciter?.nameTr ?? tracks[0]?.artistName ?? 'Sanatçı';
  const motif = reciter ? 'quran' : tracks[0]?.motif ?? 'studio';
  const isFav = favoriteArtistIds.includes(artistId);

  return (
    <div className="space-y-6 pb-10">
      <button
        type="button"
        onClick={goBack}
        className="inline-flex items-center gap-1.5 text-sm text-[#A19E95] hover:text-[#F5F2EB]"
      >
        <ChevronLeft className="w-4 h-4" />
        Geri
      </button>

      <div className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <ArtworkCover motif={motif} arabicTitle={reciter?.nameAr} size="lg" />
        <div className="space-y-3 flex-1">
          <p className="text-xs text-[#D4AF37]">{reciter ? "Kur'an-ı Kerim Karisi" : 'Sanatçı'}</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">{artistName}</h1>
          <p className="text-sm text-[#9B978E]">
            {tracks.length} kayıt{reciter ? ` · ${reciter.style} · ${reciter.country}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void playQueue(tracks, false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold"
            >
              <Play className="w-4 h-4 fill-current" />
              Sıralı Çal
            </button>
            <button
              type="button"
              onClick={() => void playQueue(tracks, true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-sm font-medium text-[#F5F2EB]"
            >
              <Shuffle className="w-4 h-4 text-[#D4AF37]" />
              Karışık Çal
            </button>
            <button
              type="button"
              onClick={() => toggleFavoriteArtist(artistId)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm font-medium text-[#F5F2EB]"
            >
              <Heart className={`w-4 h-4 ${isFav ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-[#9B978E]'}`} />
              {isFav ? 'Favori Sanatçı' : 'Favorilere Ekle'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
        {tracks.map((item, idx) => (
          <TrackRow
            key={item.contentId}
            item={item}
            index={idx}
            queueContext={tracks}
            onOpenDetail={
              item.surahNumber && item.reciterId
                ? () =>
                    navigate({
                      name: 'surah_detail',
                      surahNumber: item.surahNumber!,
                      reciterId: item.reciterId!,
                    })
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================
// Screen 5: Şarkı Listesi (Category Track List + Filters + Real Open Catalog + Local Upload)
// ============================================================
export const TrackListScreen: React.FC<{ categoryId?: string; title: string }> = ({ categoryId, title }) => {
  const {
    categories,
    catalogTracksByCategory,
    catalogNotices,
    loadingCategories,
    loadCategoryTracks,
    importLocalAudioFiles,
    playQueue,
    goBack,
  } = useAutoMusic();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [filterText, setFilterText] = useState('');
  const [artistFilter, setArtistFilter] = useState('all');
  const [formatFilter, setFormatFilter] = useState('all');

  const category = categories.find((c) => c.id === categoryId);
  const tracks = categoryId ? catalogTracksByCategory[categoryId] ?? [] : [];
  const isLoading = categoryId ? Boolean(loadingCategories[categoryId]) : false;
  const notice = categoryId ? catalogNotices[categoryId] : undefined;

  useEffect(() => {
    if (categoryId && tracks.length === 0 && !isLoading) {
      void loadCategoryTracks(categoryId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const artistOptions = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => set.add(t.artistName));
    return Array.from(set).sort();
  }, [tracks]);

  const filteredTracks = useMemo(() => {
    const norm = normalizeSearchText(filterText);
    return tracks.filter((t) => {
      if (artistFilter !== 'all' && t.artistName !== artistFilter) return false;
      if (formatFilter !== 'all' && t.format !== formatFilter) return false;
      if (!norm) return true;
      return (
        normalizeSearchText(t.title).includes(norm) ||
        normalizeSearchText(t.artistName).includes(norm) ||
        normalizeSearchText(t.album).includes(norm)
      );
    });
  }, [artistFilter, filterText, formatFilter, tracks]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-1.5 text-sm text-[#A19E95] hover:text-[#F5F2EB]"
        >
          <ChevronLeft className="w-4 h-4" />
          Kategoriler
        </button>

        {categoryId && (
          <button
            type="button"
            onClick={() => void loadCategoryTracks(categoryId)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141418] border border-white/10 text-xs text-[#CFCBC2] hover:text-[#D4AF37]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Açık Kataloğu Yenile
          </button>
        )}
      </div>

      {/* Category Header */}
      <div className="p-6 rounded-3xl bg-[#121216] border border-white/[0.07] flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <ArtworkCover motif={category?.motif ?? 'studio'} size="lg" />
        <div className="space-y-3 flex-1">
          <p className="text-xs text-[#D4AF37]">
            {category ? `${category.language} · ${category.genre}` : 'Müzik Listesi'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F5F2EB]">{title}</h1>
          {category && <p className="text-sm text-[#9B978E]">{category.subtitle}</p>}

          <div className="flex flex-wrap items-center gap-2.5 pt-1">
            <button
              type="button"
              disabled={filteredTracks.length === 0}
              onClick={() => void playQueue(filteredTracks, false)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D4AF37] disabled:opacity-40 hover:bg-[#E5C158] text-[#09090B] text-sm font-semibold"
            >
              <Play className="w-4 h-4 fill-current" />
              Sıralı Çal
            </button>
            <button
              type="button"
              disabled={filteredTracks.length === 0}
              onClick={() => void playQueue(filteredTracks, true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] disabled:opacity-40 hover:bg-white/[0.1] border border-white/10 text-sm font-medium text-[#F5F2EB]"
            >
              <Shuffle className="w-4 h-4 text-[#D4AF37]" />
              Karışık Çal
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.aac,.m4a,.flac,.wav,.ogg"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0 && categoryId) {
                  void importLocalAudioFiles(e.target.files, categoryId);
                  e.target.value = '';
                }
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-sm font-medium text-[#F5F2EB]"
            >
              <Upload className="w-4 h-4 text-[#D4AF37]" />
              Cihazdan Ses Ekle (MP3/FLAC)
            </button>
          </div>
        </div>
      </div>

      {/* Filters Row (Sanatçı, Albüm, Format) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8C887F] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Şarkı, sanatçı veya albüm filtrele..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121216] border border-white/10 text-sm text-[#F5F2EB] placeholder:text-[#7C7970] focus:border-[#D4AF37] focus:outline-none"
          />
        </div>
        <select
          value={artistFilter}
          onChange={(e) => setArtistFilter(e.target.value)}
          aria-label="Sanatçıya göre filtrele"
          className="px-3.5 py-2.5 rounded-xl bg-[#121216] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
        >
          <option value="all">Tüm Sanatçılar ({artistOptions.length})</option>
          {artistOptions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          value={formatFilter}
          onChange={(e) => setFormatFilter(e.target.value)}
          aria-label="Ses formatına göre filtrele"
          className="px-3.5 py-2.5 rounded-xl bg-[#121216] border border-white/10 text-sm text-[#F5F2EB] focus:border-[#D4AF37] focus:outline-none"
        >
          <option value="all">Tüm Formatlar (MP3 / AAC / FLAC / OGG)</option>
          <option value="MP3">MP3</option>
          <option value="FLAC">FLAC</option>
          <option value="AAC">AAC</option>
          <option value="OGG">OGG</option>
        </select>
      </div>

      {/* Track List or Transparent Provider Notice */}
      {isLoading ? (
        <div className="p-12 rounded-2xl bg-[#121216] border border-white/[0.06] flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
          <p className="text-sm text-[#9B978E]">Açık lisanslı ses kataloğu taranıyor...</p>
        </div>
      ) : filteredTracks.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#121216] border border-white/[0.06] space-y-3">
          <p className="text-base font-semibold text-[#F5F2EB]">
            Bu kategoride henüz bağlı çevrimiçi kayıt bulunmadı
          </p>
          <p className="text-sm text-[#9B978E] max-w-2xl leading-relaxed">
            {notice ||
              'AutoMusic Pro sahte ses bağlantıları oluşturmaz. Ticari veya lisanslı bir müzik katalog sağlayıcısını (örn. Jamendo API) sunucu ortam değişkenlerinden bağlayabilir ya da kendi MP3/AAC/FLAC dosyalarınızı doğrudan bu kategoriye ekleyerek çevrimdışı arşivde dinleyebilirsiniz.'}
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#D4AF37] text-[#09090B] text-xs font-semibold"
          >
            <Upload className="w-4 h-4" />
            Bu Kategoriye Ses Dosyası Ekle
          </button>
        </div>
      ) : (
        <div className="bg-[#121216] border border-white/[0.06] rounded-2xl p-2">
          {filteredTracks.map((item, idx) => (
            <TrackRow key={item.contentId} item={item} index={idx} queueContext={filteredTracks} />
          ))}
        </div>
      )}
    </div>
  );
};
