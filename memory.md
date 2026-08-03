# Proje Hafızası — Wedding Anxiety

> Bu dosya, projede nerede kaldığımızı ve neler yapıldığını özetleyen çalışma notudur.
> Yeni bir oturuma başlarken önce burayı oku. Son güncelleme: **3 Ağustos 2026**.

## Proje nedir?

Hilal için hediye olarak yapılan, tarayıcıda çalışan Minecraft tarzı voxel 3D FPS oyunu.
Tema: düğün anksiyetesini sembolik düşmanlara karşı "vurarak" yenmek.
Stack: **Three.js + TypeScript (strict) + Vite**. Harici asset yok; sesler Web Audio ile prosedürel, dokular canvas ile üretiliyor.

## Şu anki durum

- `npm run build` **sıfır hatayla geçiyor** (tsc + vite).
- Oyun 3 harita × 3 level = 9 aşamalık tam bir progression'a sahip.
- Netlify'a bağlı: `main`'e push → otomatik deploy. `vite.config.ts` içinde `base`, Netlify'da `/`, GitHub Pages'te `/Wedding-Anxiety/`.
- Son commit: `e5901c0 game v0.1`. Multi-map sistemi, bug fix'ler ve harita dekorasyonları **henüz commit edilmedi** (working tree'de).

### En son eklenenler (3 Ağustos 2026 — harita detayları)
- **Map 1:** Çatı (mermer + altın noktalar), kısa koltuklar (tek blok), sahnede piyano/çello/keman/nota sehpası; arka planda Mozart *Eine kleine Nachtmusik* Allegro teması (prosedürel Web Audio; isteğe bağlı `public/mozart-allegro.mp3`).
- **Map 2:** Fener kulesi girilebilir (kapı + spiral merdiven + cam fener odası); ufukta kocaman turuncu gün batımı güneşi; yola kadar uzanan path.
- **Map 3 bahçe:** Ağaçlar, fener direkleri, gül kemeri, banklar, gazebolar + kalp çiçek yatakları, tören sandalyeleri, yol üstü string light'lar, karşılama sütunları, yansıma havuzu.
- Props sistemi (`MapProps.ts`) Game'e bağlandı; `World.props` atanıyor.

## Yapılanlar (kronolojik)

### 1. Kurulum ve deploy
- Proje build/run talimatları netleştirildi (`npm run dev` / `npm run build`).
- Netlify deploy sorunu çözüldü: dosyalar git'e eklenip push edildi, `vite.config.ts`'te `base: process.env.NETLIFY ? '/' : '/Wedding-Anxiety/'` yapıldı.

### 2. Karakter yenileme (scarier & diverse)
- `src/entities/enemyMeshes/index.ts` — her düşman tipine özel mesh factory:
  - **Meraklı Teyze** (stalker), **Mükemmeliyetçi Kuzen** (dasher), **Zaman Canavarı**, **Beklenti Gölgesi** (boss, floater).
- `Enemy.ts` — davranış varyasyonları, tip bazlı animasyonlar, ölüm animasyonu (`dying` durumu).
- `enemies.ts` — `behavior` alanı eklendi, renkler koyulaştırıldı.

### 3. Silah sistemi
- `src/data/weapons.ts` — 3 silah: Tabanca (pistol), Tüfek (rifle, pellet+spread), Enerji Kalkanı (shield).
- `src/entities/PlayerRig.ts` — elde görünen viewmodel; bob + recoil animasyonu.
- `WeaponSystem.fire(weaponId, ...)` — silah tanımına göre hasar/menzil/pellet.
- `InputManager` — 1/2/3 tuşları ve fare tekerleği ile silah değiştirme.
- HUD'da aktif silah adı gösteriliyor.

### 4. Harita genişletme
- Bahçe (yol, çitler, çiçek tarhları, çeşme) + düğün salonu düzeni.
- `src/rendering/WallSign.ts` — canvas dokulu **"Hilal & Cihanser"** pankartı kuzey duvarda.

### 5. Multi-map sistemi + bug fix'ler (SON YAPILAN İŞ)
- **Halı bug'ı düzeltildi:** `BLOCK_CARPET.solid: true` yapıldı (plan y=1 decal öneriyordu ama solid yapmak daha temiz — düşmanlar artık halının altına düşmüyor).
- **Boss sıkışma bug'ı düzeltildi:**
  - Boss radius 1.0 → **0.85**, height 3.6 → **3.2**.
  - `World.randomSpawnPoint(rand, awayFrom, minDist, radius, height)` — AABB duyarlı; `boxCollides` ile hem gövde hem zemin doğrulanıyor.
  - Salon kapısı tam duvar yüksekliğinde (5 blok) açıklık — boss geçebiliyor.
- **Yeni bloklar** (`blocks.ts`, toplam 17): MARBLE, CURTAIN, SEAT, WATER (non-solid, yarı saydam), ROCK, SAND, LIGHT.
- **`src/data/maps.ts`** — `MapDefinition` + `LevelDefinition` + `AtmosphereConfig`; 3 harita × 3 level. Boss sadece wedding-hall Level 3'te.
- **World refactor** — `World(mapDef)` constructor, `disposeMesh()`, per-map generator switch:
  - `worldGen/concertHall.ts` — mermer zemin, sahne, kırmızı perde, sütunlar, avize, koltuk sıraları.
  - `worldGen/lighthouse.ts` — deniz, ada, beyaz fener kulesi (kırmızı bant + LIGHT lamba), bekçi evi, iskele.
  - `worldGen/weddingHall.ts` — bahçe + salon + banner (eski layout, bug fix'li).
  - `worldGen/types.ts` — `WorldWriter`, `GeneratorResult`, `BannerSpec`, `SpawnRegion`.
- **Progression** (`Game.ts`) — `mapIndex/levelIndex/stagesCleared`; `loadMap()` world/mesh/ışık swap yapıyor; harita geçişinde "Yeni Yolculuk" diyaloğu; `Player/WeaponSystem/EnemyManager.setWorld()` eklendi.
- **Işıklandırma** (`Lighting.ts`) — `SceneLighting.apply(atmosphere)`; her haritanın kendi ambient/sun/fog/sky rengi (deniz feneri = turuncu gün batımı).
- **UI** — HUD: "Harita 1/3 · Klasik Müzik Salonu" + "Level 2/3 (5/9)"; `MenuScreen.showWin/showLose` yeni imzalar; `messages.ts` sadeleştirildi (level metinleri artık `maps.ts` içinde).
- **WaveManager** — `WAVES` kaldırıldı; artık sadece `LevelState` + `makeLevelState(level)`.
- Önceki oturumdan kalan bozuk `src/rendering/WeddingDecorations.ts` silindi (derlenmeyen artık dosya).

## Bilinen notlar / dikkat edilecekler

- **Plan sapması:** Halı fix'i planda "y=1 non-solid decal" idi; `solid: true` yapıldı çünkü decal yaklaşımı düşmanların halının içine gömülü görünmesine yol açıyordu.
- Spawn yönü: tüm haritalarda oyuncu kuzeye bakarak doğar (`world.spawnFacing`, şu an hepsi 0).
- Deniz feneri haritasında su non-solid — oyuncu suya düşebilir; ada `enemyRegion` içinde spawn güvenli.
- tsconfig strict + `noUnusedLocals` + `noUnusedParameters` — kullanılmayan import bırakma.
- HUD/dialog metinleri Türkçe; oyuncuya hitap "Hilal".

## Manuel test edilmesi gerekenler (henüz oynanarak doğrulanmadı)

1. Map 1'de koltuk/sahne/perde görünümü ve spawn noktası.
2. Map 3'te halı üstünde düşman spawn → düşme yok mu?
3. Boss (Map 3 L3) duvara sıkışmadan kapıdan geçiyor mu?
4. Level 1→2→3 ve harita geçişlerinde world swap + ışık değişimi düzgün mü?
5. Deniz fenerinde adada kalınabiliyor mu, fener ve bekçi evi görünüyor mu?

## Olası sonraki adımlar

- Multi-map değişikliklerini commit + push (Netlify deploy tetiklenir).
- Oyun içi manuel test (yukarıdaki liste).
- İsteğe bağlı fikirler: harita seçme ekranı, skor tablosu (localStorage), mobil dokunmatik kontroller, müzik.
