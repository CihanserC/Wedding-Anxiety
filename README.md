# Düğün Anksiyetesi

> Hilal için tarayıcıda çalışan, Minecraft tarzı voxel dünyada düğün anksiyetesini sembolik düşmanlara karşı yenme temalı 3D FPS oyunu.

**Ana mesaj:** Anksiyete yenilmez bir düşman değil — yönetilebilir ve aşılabilir. Bu oyun terapötik ve eğlenceli bir ton taşır: stresi "vurarak" azaltmak, aşamaları geçmek ve sonunda huzurlu bir düğün sahnesine ulaşmak.

## Konsept

Hilal, üç farklı mekânda toplam 9 aşamalık bir yolculuğa çıkar. Her mekânda anksiyete kaynaklarını temsil eden düşmanlarla savaşır:

- **Meraklı Teyze** — "Ne zaman evleneceksiniz?" sorularıyla sinsice yaklaşır (stalker davranışı)
- **Mükemmeliyetçi Kuzen** — Karşılaştırma baskısı; ani hamlelerle dalar (dasher davranışı)
- **Zaman Canavarı** — Geri sayım stresi; hızlı ve doğrudan saldırır
- **Beklenti Gölgesi (boss)** — Herkesin beklentisinden doğan büyük gölge; sadece son aşamada çıkar (floater davranışı)

Anksiyete metresi %100'e ulaşırsa kaybedersin; düşmanları vurdukça metre azalır.

## Haritalar

Yolculuk üç haritadan oluşur, her haritada 3 level vardır:

| # | Harita | Tema | Ağırlıklı düşman |
|---|--------|------|------------------|
| 1 | **Klasik Müzik Salonu** | Krem mermer, kırmızı perde, sahne, sütunlar, avize, koltuk sıraları | Mükemmeliyetçi Kuzen ("eleştiri") |
| 2 | **Deniz Feneri** | Gün batımı, deniz, kayalık ada, beyaz fener kulesi, bekçi evi | Zaman Canavarı ("zaman geçişi") |
| 3 | **Düğün Salonu** | Bahçe, çeşme, kırmızı halı, altın kemer, "Hilal & Cihanser" pankartı | Hepsi + Boss (Level 3) |

Her harita kendi ışıklandırma ve atmosferine sahiptir (deniz fenerinde turuncu gün batımı gibi). Level'lar arası kısa bir nefes molası ve Hilal'e özel bir cesaret mesajı vardır.

## Silahlar

| Tuş | Silah | Özellik |
|-----|-------|---------|
| `1` | Gülümseme Tabancası | Dengeli hasar, orta hız |
| `2` | Sabır Tüfeği | Saçma etkili (pellet + spread), yakın mesafede güçlü |
| `3` | Enerji Kalkanı | Hızlı atış, kısa menzil |

Silahlar ekranda elinde görünür; fare tekerleği ile de silahlar arasında geçiş yapılabilir.

## Kontroller

| Tuş | Aksiyon |
|-----|---------|
| `W` `A` `S` `D` | Hareket |
| `Fare` | Bakış (pointer lock) |
| `Sol Tık` | Ateş |
| `1` `2` `3` | Silah değiştir |
| `Fare Tekerleği` | Silahlar arası geçiş |
| `Space` | Zıpla |
| `Shift` | Koş |
| `Esc` | Fareyi serbest bırak / duraklat |

## Kurulum ve Çalıştırma

Node.js 18+ gereklidir.

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173/Wedding-Anxiety/` açılır.

### Üretim Derlemesi

```bash
npm run build
```

Derleme çıktısı `dist/` klasörüne yazılır. Yerelde önizlemek için:

```bash
npm run preview
```

## Deploy

### Netlify (aktif)

Repo Netlify'a bağlıdır; `main` branch'ine her push otomatik deploy tetikler.

- Build command: `npm run build`
- Publish directory: `dist`
- `vite.config.ts` içinde `base` yolu Netlify ortamında `/` olarak ayarlanır (`process.env.NETLIFY` kontrolü ile), GitHub Pages için `/Wedding-Anxiety/` kalır.

### GitHub Pages (alternatif)

`npm run build` sonrası `dist/` içeriğini `gh-pages` branch'ine kopyalayıp GitHub → Settings → Pages üzerinden yayınlayabilirsin.

## Teknoloji

- [Three.js](https://threejs.org/) r160+ — WebGL render
- [Vite](https://vitejs.dev/) — Dev server + build
- TypeScript (strict mode)
- Web Audio API — prosedürel ses efektleri (harici asset yok)
- Voxel InstancedMesh rendering (blok tipi başına tek instanced mesh)
- Özel AABB çarpışma + DDA raycast

## Proje Yapısı

```
src/
├── main.ts                      # Giriş noktası
├── game/
│   ├── Game.ts                  # Ana oyun döngüsü, map/level progression, state machine
│   ├── World.ts                 # Voxel grid, MapDefinition'a göre dünya kurulumu, AABB spawn
│   ├── worldGen/
│   │   ├── types.ts             # WorldWriter, GeneratorResult, BannerSpec tipleri
│   │   ├── concertHall.ts       # Map 1: Klasik Müzik Salonu generator
│   │   ├── lighthouse.ts        # Map 2: Deniz Feneri generator
│   │   └── weddingHall.ts       # Map 3: Bahçe + Düğün Salonu generator
│   ├── Player.ts                # FPS controller + AABB collision
│   ├── WeaponSystem.ts          # Çoklu silah raycast + cooldown + pellet/spread
│   ├── EnemyManager.ts          # Spawn (radius/height duyarlı), güncelleme, temas
│   ├── AnxietyMeter.ts          # Stres metre
│   ├── WaveManager.ts           # LevelState yönetimi
│   └── AudioManager.ts          # Prosedürel Web Audio SFX
├── entities/
│   ├── Enemy.ts                 # Düşman AI (stalker/dasher/floater), ölüm animasyonu
│   ├── enemyMeshes/index.ts     # Tip bazlı düşman mesh factory
│   ├── PlayerRig.ts             # Elde görünen silah viewmodel (bob + recoil)
│   └── Projectile.ts            # Tracer / muzzle flash / hit spark efektleri
├── rendering/
│   ├── VoxelMesh.ts             # InstancedMesh builder
│   ├── Lighting.ts              # Per-map atmosfer (ambient/sun/fog/sky)
│   └── WallSign.ts              # Canvas dokulu duvar yazısı ("Hilal & Cihanser")
├── input/
│   └── InputManager.ts          # Klavye + pointer lock + silah seçimi
├── ui/
│   ├── HUD.ts                   # Anksiyete barı, harita/level, skor, silah, crosshair
│   ├── MenuScreen.ts            # Başlangıç / kazanç / kayıp ekranları
│   └── DialogueBox.ts           # Level arası ve harita geçişi mesajları
└── data/
    ├── blocks.ts                # 17 blok tipi tanımı
    ├── maps.ts                  # 3 harita × 3 level tanımı + atmosfer ayarları
    ├── enemies.ts               # Düşman stats + davranış tipleri
    ├── weapons.ts               # 3 silah tanımı
    └── messages.ts              # Türkçe metinler, Hilal'e özel mesajlar
```

## Not

Bu oyun Hilal için, düğün öncesi anksiyeteyi bir gülümsemeyle karşılamasına bir hediye olarak yapıldı. İyi eğlenceler ve iyi bir düğün! 💐
