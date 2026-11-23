import JSZip from 'jszip';

export interface AndroidProjectFile {
  path: string;
  phase: string;
  summary: string;
  language: 'kotlin' | 'xml' | 'gradle' | 'markdown';
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidProjectFile[] = [
  {
    path: 'README_KURULUM.md',
    phase: 'Aşama 1–8',
    summary: 'Android Studio kurulum, derleme, Android Auto Desktop Head Unit ve APK oluşturma rehberi',
    language: 'markdown',
    content: `# AutoMusic Pro — Android Studio Kurulum ve Derleme Rehberi

## Gereksinimler
- Android Studio Ladybug / Meerkat (2024.2+)
- JDK 17
- Android SDK 35 (minSdk 26 / Android 8.0+)
- Gradle 8.9+

## Kurulum Adımları
1. İndirdiğiniz \`AutoMusicPro-Android.zip\` arşivini bir klasöre çıkartın.
2. Android Studio'da **File -> Open** menüsünden klasörü seçin.
3. \`local.properties\` içine (isteğe bağlı) harici lisanslı müzik katalog anahtarınızı ekleyin:
   \`CATALOG_API_KEY=\` (Kaynak koda sabit yazılmaz, BuildConfig üzerinden okunur.)
4. **Sync Project with Gradle Files** ile bağımlılıkları indirin.
5. **Run 'app'** ile Android telefona veya emülatöre yükleyin.

## Android Auto Testi (DHU)
1. Android SDK Manager'dan **Android Auto Desktop Head Unit Emulator** bileşenini yükleyin.
2. Telefonda Android Auto Geliştirici Modunu açıp **Baş Ünitesi Sunucusunu Başlat** seçeneğini etkinleştirin.
3. Terminalde:
   \`adb forward tcp:5277 tcp:5277\`
   \`./desktop-head-unit\`

## Release APK Oluşturma
\`./gradlew assembleRelease\`
APK çıktısı: \`app/build/outputs/apk/release/app-release.apk\`
`,
  },
  {
    path: 'settings.gradle.kts',
    phase: 'Aşama 1',
    summary: 'Gradle proje ayarları ve modül tanımı',
    language: 'gradle',
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}
rootProject.name = "AutoMusicPro"
include(":app")
`,
  },
  {
    path: 'build.gradle.kts',
    phase: 'Aşama 1',
    summary: 'Kök Gradle eklenti sürümleri (Kotlin, Compose, KSP)',
    language: 'gradle',
    content: `plugins {
    id("com.android.application") version "8.7.2" apply false
    id("org.jetbrains.kotlin.android") version "2.0.21" apply false
    id("org.jetbrains.kotlin.plugin.compose") version "2.0.21" apply false
    id("com.google.devtools.ksp") version "2.0.21-1.0.27" apply false
}
`,
  },
  {
    path: 'app/build.gradle.kts',
    phase: 'Aşama 1',
    summary: 'Media3, ExoPlayer, Compose Material 3, Room, DataStore, Retrofit, WorkManager bağımlılıkları',
    language: 'gradle',
    content: `import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("com.google.devtools.ksp")
}

val localProps = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}

android {
    namespace = "com.automusicpro.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.automusicpro.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField("String", "CATALOG_API_KEY", "\\"\${localProps.getProperty("CATALOG_API_KEY", "")}\\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2024.10.01")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.activity:activity-compose:1.9.3")
    implementation("androidx.navigation:navigation-compose:2.8.4")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.8.7")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.8.7")

    // Media3 (ExoPlayer, MediaSession, Android Auto MediaLibraryService, DownloadManager)
    val media3Version = "1.5.0"
    implementation("androidx.media3:media3-exoplayer:\$media3Version")
    implementation("androidx.media3:media3-session:\$media3Version")
    implementation("androidx.media3:media3-datasource-okhttp:\$media3Version")
    implementation("androidx.media3:media3-ui:\$media3Version")

    // Room Local Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:\$roomVersion")
    implementation("androidx.room:room-ktx:\$roomVersion")
    ksp("androidx.room:room-compiler:\$roomVersion")

    // Preferences DataStore & WorkManager
    implementation("androidx.datastore:datastore-preferences:1.1.1")
    implementation("androidx.work:work-runtime-ktx:2.10.0")

    // Retrofit + OkHttp + Coroutines
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-guava:1.9.0")

    testImplementation("junit:junit:4.13.2")
}
`,
  },
  {
    path: 'app/src/main/AndroidManifest.xml',
    phase: 'Aşama 1 & 7',
    summary: 'Ön plan medya servisi, Android Auto medya bildirimi ve izin tanımları',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:name=".AutoMusicApplication"
        android:allowBackup="true"
        android:label="AutoMusic Pro"
        android:supportsRtl="true"
        android:theme="@style/Theme.AutoMusicPro">

        <!-- Android Auto resmi medya uygulama tanımlayıcısı -->
        <meta-data
            android:name="com.google.android.gms.car.application"
            android:resource="@xml/automotive_app_desc" />

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Media3 MediaLibraryService: Arka plan oynatma + Kilit ekranı + Bluetooth + Android Auto -->
        <service
            android:name=".player.AutoMusicPlaybackService"
            android:exported="true"
            android:foregroundServiceType="mediaPlayback">
            <intent-filter>
                <action android:name="androidx.media3.session.MediaLibraryService" />
                <action android:name="android.media.browse.MediaBrowserService" />
            </intent-filter>
        </service>

        <!-- Media3 Çevrimdışı İndirme Servisi -->
        <service
            android:name=".download.AutoMusicDownloadService"
            android:exported="false"
            android:foregroundServiceType="dataSync">
            <intent-filter>
                <action android:name="androidx.media3.exoplayer.downloadService.action.RESTART" />
                <category android:name="android.intent.category.DEFAULT" />
            </intent-filter>
        </service>
    </application>
</manifest>
`,
  },
  {
    path: 'app/src/main/res/xml/automotive_app_desc.xml',
    phase: 'Aşama 7',
    summary: 'Google Android Auto resmi medya şablonu beyanı',
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<automotiveApp>
    <uses name="media" />
</automotiveApp>
`,
  },
  {
    path: 'app/src/main/java/com/automusicpro/app/ui/theme/Theme.kt',
    phase: 'Aşama 2',
    summary: 'Jetpack Compose Material 3 Siyah & Altın koyu tema',
    language: 'kotlin',
    content: `package com.automusicpro.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val ObsidianBlack = Color(0xFF09090B)
val CarbonSurface = Color(0xFF141418)
val CarbonElevated = Color(0xFF1C1C22)
val BurnishedGold = Color(0xFFD4AF37)
val SoftGold = Color(0xFFE5C158)
val WarmIvory = Color(0xFFF5F2EB)
val MutedStone = Color(0xFFA19E95)

private val AutoMusicDarkScheme = darkColorScheme(
    primary = BurnishedGold,
    onPrimary = ObsidianBlack,
    secondary = SoftGold,
    onSecondary = ObsidianBlack,
    background = ObsidianBlack,
    onBackground = WarmIvory,
    surface = CarbonSurface,
    onSurface = WarmIvory,
    surfaceVariant = CarbonElevated,
    onSurfaceVariant = MutedStone
)

@Composable
fun AutoMusicProTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = AutoMusicDarkScheme,
        content = content
    )
}
`,
  },
  {
    path: 'app/src/main/java/com/automusicpro/app/data/local/Entities.kt',
    phase: 'Aşama 4',
    summary: 'Room veritabanı varlıkları: Kategoriler, Favoriler, Çalma Listeleri, Kaldığı Yer, İndirme Arşivi',
    language: 'kotlin',
    content: `package com.automusicpro.app.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "categories")
data class CategoryEntity(
    @PrimaryKey val id: String,
    val displayOrder: Int,
    val name: String,
    val subtitle: String,
    val language: String,
    val genre: String,
    val isQuran: Boolean = false
)

@Entity(tableName = "favorites")
data class FavoriteEntity(
    @PrimaryKey val contentId: String,
    val type: String, // "track" | "artist" | "surah" | "reciter"
    val title: String,
    val subtitle: String,
    val categoryId: String,
    val streamUrl: String?,
    val addedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "playlists")
data class PlaylistEntity(
    @PrimaryKey val id: String,
    val name: String,
    val isQuranPlaylist: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "playlist_items", primaryKeys = ["playlistId", "contentId"])
data class PlaylistItemEntity(
    val playlistId: String,
    val contentId: String,
    val positionIndex: Int,
    val title: String,
    val artistName: String,
    val categoryId: String,
    val streamUrl: String,
    val downloadAllowed: Boolean
)

@Entity(tableName = "playback_resume")
data class PlaybackResumeEntity(
    @PrimaryKey val contentId: String,
    val positionMs: Long,
    val updatedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "downloaded_archive")
data class DownloadedArchiveEntity(
    @PrimaryKey val contentId: String,
    val title: String,
    val artistName: String,
    val categoryId: String,
    val localUri: String,
    val sizeBytes: Long,
    val bitrateKbps: Int,
    val savedAt: Long = System.currentTimeMillis()
)
`,
  },
  {
    path: 'app/src/main/java/com/automusicpro/app/data/local/AutoMusicDao.kt',
    phase: 'Aşama 4',
    summary: 'Room DAO: Favoriler, sınırsız çalma listesi, sıralama ve arşiv sorguları',
    language: 'kotlin',
    content: `package com.automusicpro.app.data.local

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import kotlinx.coroutines.flow.Flow

@Dao
interface AutoMusicDao {
    @Query("SELECT * FROM categories ORDER BY displayOrder ASC")
    fun observeCategories(): Flow<List<CategoryEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertCategories(categories: List<CategoryEntity>)

    @Query("SELECT * FROM favorites ORDER BY addedAt DESC")
    fun observeFavorites(): Flow<List<FavoriteEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun addFavorite(favorite: FavoriteEntity)

    @Query("DELETE FROM favorites WHERE contentId = :contentId")
    suspend fun removeFavorite(contentId: String)

    @Query("SELECT * FROM playlists ORDER BY createdAt DESC")
    fun observePlaylists(): Flow<List<PlaylistEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsertPlaylist(playlist: PlaylistEntity)

    @Query("UPDATE playlists SET name = :newName WHERE id = :playlistId")
    suspend fun renamePlaylist(playlistId: String, newName: String)

    @Query("DELETE FROM playlists WHERE id = :playlistId")
    suspend fun deletePlaylist(playlistId: String)

    @Query("SELECT * FROM playlist_items WHERE playlistId = :playlistId ORDER BY positionIndex ASC")
    fun observePlaylistItems(playlistId: String): Flow<List<PlaylistItemEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPlaylistItem(item: PlaylistItemEntity)

    @Query("DELETE FROM playlist_items WHERE playlistId = :playlistId AND contentId = :contentId")
    suspend fun removePlaylistItem(playlistId: String, contentId: String)

    @Query("SELECT * FROM downloaded_archive ORDER BY savedAt DESC")
    fun observeDownloads(): Flow<List<DownloadedArchiveEntity>>

    @Query("SELECT EXISTS(SELECT 1 FROM downloaded_archive WHERE contentId = :contentId)")
    suspend fun isAlreadyDownloaded(contentId: String): Boolean

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveDownloadRecord(record: DownloadedArchiveEntity)

    @Query("DELETE FROM downloaded_archive WHERE contentId = :contentId")
    suspend fun deleteDownloadRecord(contentId: String)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveResumePoint(point: PlaybackResumeEntity)

    @Query("SELECT * FROM playback_resume WHERE contentId = :contentId LIMIT 1")
    suspend fun getResumePoint(contentId: String): PlaybackResumeEntity?
}
`,
  },
  {
    path: 'app/src/main/java/com/automusicpro/app/data/local/AutoMusicPreferences.kt',
    phase: 'Aşama 4 & 6',
    summary: 'DataStore ayarları: Akıllı tek seferlik indirme varsayılan değerleri',
    language: 'kotlin',
    content: `package com.automusicpro.app.data.local

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

private val Context.dataStore by preferencesDataStore(name = "automusic_pro_prefs")

data class SmartDownloadConfig(
    val autoSaveOnPlay: Boolean = true,          // Otomatik kayıt: AÇIK
    val wifiOnly: Boolean = false,               // Yalnızca Wi-Fi: KAPALI
    val allowMobileData: Boolean = true,         // Mobil veriyle indirme: AÇIK
    val preferredBitrateKbps: Int = 320,         // Tercih edilen kalite: 320 kbps
    val preventDuplicateDownload: Boolean = true,// Aynı dosyayı tekrar indirme: KAPALI
    val minFreeSpaceGb: Int = 2                  // 2 GB boş alan koruması
)

class AutoMusicPreferences(private val context: Context) {
    private object Keys {
        val AUTO_SAVE = booleanPreferencesKey("auto_save_on_play")
        val WIFI_ONLY = booleanPreferencesKey("wifi_only")
        val MOBILE_DATA = booleanPreferencesKey("allow_mobile_data")
        val BITRATE = intPreferencesKey("preferred_bitrate_kbps")
        val PREVENT_DUP = booleanPreferencesKey("prevent_duplicate")
    }

    val downloadConfig: Flow<SmartDownloadConfig> = context.dataStore.data.map { prefs ->
        SmartDownloadConfig(
            autoSaveOnPlay = prefs[Keys.AUTO_SAVE] ?: true,
            wifiOnly = prefs[Keys.WIFI_ONLY] ?: false,
            allowMobileData = prefs[Keys.MOBILE_DATA] ?: true,
            preferredBitrateKbps = prefs[Keys.BITRATE] ?: 320,
            preventDuplicateDownload = prefs[Keys.PREVENT_DUP] ?: true
        )
    }

    suspend fun updateConfig(transform: (SmartDownloadConfig) -> SmartDownloadConfig) {
        context.dataStore.edit { prefs ->
            val current = SmartDownloadConfig(
                autoSaveOnPlay = prefs[Keys.AUTO_SAVE] ?: true,
                wifiOnly = prefs[Keys.WIFI_ONLY] ?: false,
                allowMobileData = prefs[Keys.MOBILE_DATA] ?: true,
                preferredBitrateKbps = prefs[Keys.BITRATE] ?: 320,
                preventDuplicateDownload = prefs[Keys.PREVENT_DUP] ?: true
            )
            val next = transform(current)
            prefs[Keys.AUTO_SAVE] = next.autoSaveOnPlay
            prefs[Keys.WIFI_ONLY] = next.wifiOnly
            prefs[Keys.MOBILE_DATA] = next.allowMobileData
            prefs[Keys.BITRATE] = next.preferredBitrateKbps
            prefs[Keys.PREVENT_DUP] = next.preventDuplicateDownload
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/automusicpro/app/data/remote/QuranRepository.kt',
    phase: 'Aşama 5',
    summary: '114 Sure, 6 Kari, Retrofit Türkçe Diyanet Meali ve soyut katalog arayüzü',
    language: 'kotlin',
    content: `package com.automusicpro.app.data.remote

import retrofit2.http.GET
import retrofit2.http.Path

data class SurahMealResponse(
    val code: Int,
    val data: List<QuranEditionDto>
)

data class QuranEditionDto(
    val number: Int,
    val name: String,
    val ayahs: List<AyahDto>
)

data class AyahDto(
    val number: Int,
    val numberInSurah: Int,
    val text: String
)

interface QuranApiService {
    @GET("v1/surah/{surahNumber}/editions/quran-uthmani,tr.diyanet")
    suspend fun getSurahWithTurkishMeal(@Path("surahNumber") surahNumber: Int): SurahMealResponse
}

data class ReciterProfile(
    val id: String,
    val nameTr: String,
    val surahBaseUrl: String,
    val everyAyahFolder: String?,
    val bitrateKbps: Int
)

interface MusicCatalogRepository {
    suspend fun getTracksByCategory(categoryId: String): Result<List<TrackMetadata>>
    suspend fun searchCatalog(query: String): Result<List<TrackMetadata>>
}

data class TrackMetadata(
    val contentId: String,
    val title: String,
    val artistName: String,
    val categoryId: String,
    val streamUrl: String,
    val downloadAllowed: Boolean,
    val licenseName: String,
    val bitrateKbps: Int
)

object QuranRecitersCatalog {
    val reciters = listOf(
        ReciterProfile("abdurrahman-el-ussi", "Abdurrahman el-Ussi", "https://server6.mp3quran.net/aloosi", null, 128),
        ReciterProfile("misari-rasid-el-afasi", "Mişari Raşid el-Afasi", "https://server8.mp3quran.net/afs", "Alafasy_128kbps", 128),
        ReciterProfile("abdurrahman-es-sudeys", "Abdurrahman es-Sudeys", "https://server11.mp3quran.net/sds", "Abdurrahmaan_As-Sudais_192kbps", 192),
        ReciterProfile("maher-el-muaykili", "Maher el-Muaykıli", "https://server12.mp3quran.net/maher", "MaherAlMuaiqly128kbps", 128),
        ReciterProfile("abdulbasit-abdussamed", "Abdülbasit Abdüssamed", "https://server7.mp3quran.net/basit", "Abdul_Basit_Murattal_192kbps", 192),
        ReciterProfile("mahmud-halil-el-husari", "Mahmud Halil el-Husari", "https://server13.mp3quran.net/husr", "Husary_128kbps", 128)
    )

    fun buildSurahAudioUrl(reciter: ReciterProfile, surahNumber: Int): String {
        val padded = surahNumber.toString().padStart(3, '0')
        return "\${reciter.surahBaseUrl}/\$padded.mp3"
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/automusicpro/app/download/SmartDownloadManager.kt',
    phase: 'Aşama 6',
    summary: 'Akıllı tek seferlik indirme: 2 GB boş alan kontrolü, benzersiz contentId, izinli indirme ve yerel öncelik',
    language: 'kotlin',
    content: `package com.automusicpro.app.download

import android.content.Context
import android.net.Uri
import android.os.StatFs
import androidx.annotation.OptIn
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.offline.DownloadManager
import androidx.media3.exoplayer.offline.DownloadRequest
import androidx.media3.exoplayer.offline.DownloadService
import com.automusicpro.app.data.local.AutoMusicDao
import com.automusicpro.app.data.local.SmartDownloadConfig
import com.automusicpro.app.data.remote.TrackMetadata
import java.io.File

@OptIn(UnstableApi::class)
class SmartDownloadManager(
    private val context: Context,
    private val dao: AutoMusicDao
) {
    private val archiveDir: File = File(context.filesDir, "automusic_archive").apply { mkdirs() }

    fun getAvailableFreeSpaceGb(): Double {
        val stat = StatFs(archiveDir.absolutePath)
        val freeBytes = stat.availableBytes
        return freeBytes.toDouble() / (1024.0 * 1024.0 * 1024.0)
    }

    fun getArchiveSizeGb(): Double {
        val totalBytes = archiveDir.walkTopDown().filter { it.isFile }.sumOf { it.length() }
        return totalBytes.toDouble() / (1024.0 * 1024.0 * 1024.0)
    }

    suspend fun enqueueIfEligible(track: TrackMetadata, config: SmartDownloadConfig): Boolean {
        // 1. Yalnızca indirme izni olan lisanslı içerikler kaydedilir (DRM aşımı yapılmaz)
        if (!track.downloadAllowed || !config.autoSaveOnPlay) return false

        // 2. Aynı benzersiz içerik kimliği (contentId) zaten arşivdeyse tekrar indirme
        if (config.preventDuplicateDownload && dao.isAlreadyDownloaded(track.contentId)) {
            return false
        }

        // 3. Telefonun boş alanı 2 GB altındaysa yeni indirmeleri durdur
        if (getAvailableFreeSpaceGb() < config.minFreeSpaceGb) {
            return false
        }

        val request = DownloadRequest.Builder(track.contentId, Uri.parse(track.streamUrl))
            .build()

        DownloadService.sendAddDownload(
            context,
            AutoMusicDownloadService::class.java,
            request,
            false
        )
        return true
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/automusicpro/app/player/AutoMusicPlaybackService.kt',
    phase: 'Aşama 3 & 7',
    summary: 'Media3 ExoPlayer + MediaLibraryService (Arka plan oynatma, ses odağı, Android Auto gezinme ağacı)',
    language: 'kotlin',
    content: `package com.automusicpro.app.player

import android.os.Bundle
import androidx.annotation.OptIn
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.LibraryResult
import androidx.media3.session.MediaLibraryService
import androidx.media3.session.MediaSession
import com.google.common.collect.ImmutableList
import com.google.common.util.concurrent.Futures
import com.google.common.util.concurrent.ListenableFuture

@OptIn(UnstableApi::class)
class AutoMusicPlaybackService : MediaLibraryService() {

    private var player: ExoPlayer? = null
    private var mediaLibrarySession: MediaLibrarySession? = null
    private var equalizerController: AudioEqualizerController? = null

    override fun onCreate() {
        super.onCreate()
        val audioAttributes = AudioAttributes.Builder()
            .setUsage(C.USAGE_MEDIA)
            .setContentType(C.AUDIO_CONTENT_TYPE_MUSIC)
            .build()

        val exoPlayer = ExoPlayer.Builder(this)
            .setAudioAttributes(audioAttributes, /* handleAudioFocus = */ true)
            .setHandleAudioBecomingNoisy(true)
            .build()

        player = exoPlayer
        equalizerController = AudioEqualizerController(exoPlayer.audioSessionId)

        mediaLibrarySession = MediaLibrarySession.Builder(this, exoPlayer, AutoMusicLibraryCallback())
            .build()
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaLibrarySession? {
        return mediaLibrarySession
    }

    override fun onDestroy() {
        equalizerController?.release()
        mediaLibrarySession?.release()
        player?.release()
        super.onDestroy()
    }

    private inner class AutoMusicLibraryCallback : MediaLibrarySession.Callback {
        override fun onGetLibraryRoot(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<MediaItem>> {
            val root = MediaItem.Builder()
                .setMediaId("ROOT")
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle("AutoMusic Pro")
                        .setIsBrowsable(true)
                        .setIsPlayable(false)
                        .build()
                )
                .build()
            return Futures.immediateFuture(LibraryResult.ofItem(root, params))
        }

        override fun onGetChildren(
            session: MediaLibrarySession,
            browser: MediaSession.ControllerInfo,
            parentId: String,
            page: Int,
            pageSize: Int,
            params: LibraryParams?
        ): ListenableFuture<LibraryResult<ImmutableList<MediaItem>>> {
            val items = when (parentId) {
                "ROOT" -> listOf(
                    browsableItem("CAT_ALL", "Ana Kategoriler"),
                    browsableItem("ARTISTS", "Sanatçılar"),
                    browsableItem("FAVORITES", "Favoriler"),
                    browsableItem("PLAYLISTS", "Çalma Listeleri"),
                    browsableItem("QURAN", "Kur'an-ı Kerim"),
                    browsableItem("RECENT", "Son Dinlenenler")
                )
                else -> emptyList()
            }
            return Futures.immediateFuture(LibraryResult.ofItemList(ImmutableList.copyOf(items), params))
        }

        private fun browsableItem(id: String, title: String): MediaItem {
            return MediaItem.Builder()
                .setMediaId(id)
                .setMediaMetadata(
                    MediaMetadata.Builder()
                        .setTitle(title)
                        .setIsBrowsable(true)
                        .setIsPlayable(false)
                        .setExtras(Bundle())
                        .build()
                )
                .build()
        }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/automusicpro/app/player/AudioEqualizerController.kt',
    phase: 'Aşama 8',
    summary: 'Cihaz destekli Ekolayzır, Bas Güçlendirme, Araba ve Kulaklık profilleri (güvenli devre dışı bırakma)',
    language: 'kotlin',
    content: `package com.automusicpro.app.player

import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer

enum class AudioProfile {
    DUZ, ARABA, KULAKLIK, BAS_GUCLENDIRICI, VOKAL_KURAN, TASAVVUF
}

class AudioEqualizerController(audioSessionId: Int) {
    private var equalizer: Equalizer? = null
    private var bassBoost: BassBoost? = null

    val isSupported: Boolean

    init {
        isSupported = try {
            equalizer = Equalizer(0, audioSessionId).apply { enabled = true }
            bassBoost = BassBoost(0, audioSessionId).apply { enabled = true }
            true
        } catch (_: Exception) {
            // Desteklemeyen cihazlarda güvenli şekilde devre dışı bırakılır
            equalizer = null
            bassBoost = null
            false
        }
    }

    fun applyProfile(profile: AudioProfile) {
        val eq = equalizer ?: return
        val bass = bassBoost
        val bands = eq.numberOfBands.toInt()
        val gains = when (profile) {
            AudioProfile.DUZ -> listOf(0, 0, 0, 0, 0)
            AudioProfile.ARABA -> listOf(400, 200, 100, 300, 200)
            AudioProfile.KULAKLIK -> listOf(200, 100, 0, 200, 300)
            AudioProfile.BAS_GUCLENDIRICI -> listOf(600, 400, 0, 100, 100)
            AudioProfile.VOKAL_KURAN -> listOf(-100, 100, 400, 300, 100)
            AudioProfile.TASAVVUF -> listOf(200, 300, 200, 100, 200)
        }
        for (i in 0 until minOf(bands, gains.size)) {
            eq.setBandLevel(i.toShort(), gains[i].toShort())
        }
        bass?.let {
            if (it.strengthSupported) {
                val strength: Short = when (profile) {
                    AudioProfile.ARABA -> 550
                    AudioProfile.BAS_GUCLENDIRICI -> 850
                    AudioProfile.KULAKLIK -> 250
                    else -> 0
                }
                it.setStrength(strength)
            }
        }
    }

    fun release() {
        runCatching { equalizer?.release() }
        runCatching { bassBoost?.release() }
    }
}
`,
  },
  {
    path: 'app/src/main/java/com/automusicpro/app/MainActivity.kt',
    phase: 'Aşama 2',
    summary: 'Ana giriş aktivitesi ve 5 sekmeli alt gezinme (Ana Sayfa, Ara, Kur’an, Kütüphanem, Ayarlar)',
    language: 'kotlin',
    content: `package com.automusicpro.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LibraryMusic
import androidx.compose.material.icons.filled.MenuBook
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.automusicpro.app.ui.theme.AutoMusicProTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AutoMusicProTheme {
                var selectedTab by remember { mutableStateOf(0) }
                val tabs = listOf(
                    "Ana Sayfa" to Icons.Default.Home,
                    "Ara" to Icons.Default.Search,
                    "Kur'an" to Icons.Default.MenuBook,
                    "Kütüphanem" to Icons.Default.LibraryMusic,
                    "Ayarlar" to Icons.Default.Settings
                )
                Scaffold(
                    bottomBar = {
                        NavigationBar {
                            tabs.forEachIndexed { index, (label, icon) ->
                                NavigationBarItem(
                                    selected = selectedTab == index,
                                    onClick = { selectedTab = index },
                                    icon = { Icon(icon, contentDescription = label) },
                                    label = { Text(label) }
                                )
                            }
                        }
                    }
                ) { innerPadding ->
                    Text(
                        text = "AutoMusic Pro — \${tabs[selectedTab].first}",
                        modifier = Modifier.padding(innerPadding)
                    )
                }
            }
        }
    }
}
`,
  },
];

export async function downloadAndroidStudioProjectZip(): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder('AutoMusicPro-Android');
  if (!root) return;

  for (const file of ANDROID_PROJECT_FILES) {
    root.file(file.path, file.content);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'AutoMusicPro-Android-Kotlin-Compose.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
