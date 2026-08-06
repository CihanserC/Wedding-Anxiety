# Düğün Anksiyetesi

> Hilal için tarayıcıda çalışan, Minecraft tarzı voxel dünyada düğün anksiyetesini sembolik düşmanlara karşı yenme temalı 3D FPS oyunu.

**Ana mesaj:** Anksiyete yenilmez bir düşman değil; yönetilebilir ve aşılabilir. Bu oyun terapötik ve eğlenceli bir ton taşır: stresi "vurarak" azaltmak, aşamaları geçmek ve sonunda huzurlu bir düğün sahnesine ulaşmak.

## Konsept

Hilal, beş farklı mekânda toplam 13 aşamalık bir yolculuğa çıkar. Ana hikâye üç haritada (9 aşama) tamamlanır; Bali balayı ve Dubai keşif modu bonus içeriktir.

### Düşmanlar

- **Meraklı Teyze** - "Ne zaman evleneceksiniz?" sorularıyla doğrudan yaklaşır (chase)
- **Mükemmeliyetçi Kuzen** - Karşılaştırma baskısı; dur-kalk yaparak sinsice yaklaşır (stalker)
- **Zaman Canavarı** - Geri sayım stresi; ani hız patlamalarıyla saldırır (dasher)
- **Fotoğraf Flaşörü** - Ani flaşlarla anksiyete sıçratır; mesafede durup parlar (flasher)
- **Beklenti Gölgesi (boss)** - Herkesin beklentisinden doğan büyük gölge; fazlarla güçlenir (floater)

Anksiyete metresi %100'e ulaşırsa kaybedersin; düşmanları vurdukça metre azalır.

## Haritalar

| # | Harita | Aşama | Tema |
|---|--------|-------|------|
| 1 | **Klasik Müzik Salonu** | 3 level | Krem mermer, kırmızı perde, sahne, avize |
| 2 | **Deniz Feneri** | 3 level | Gün batımı, deniz, beyaz fener kulesi |
| 3 | **Düğün Salonu** | 3 level + boss | Bahçe, kırmızı halı, "Hilal & Cihanser" pankartı |
| 4 | **Bali Adası** *(bonus)* | 3 level | Tropik ada, maymunlar, gizli hazine |
| 5 | **Dubai · Lüks Villa** *(özel)* | Keşif | Villa, Lamborghini, gün batımı finali |

Her harita kendi ışıklandırma ve atmosferine sahiptir. Level'lar arası nefes molası ve Hilal'e özel cesaret mesajları vardır.

## Silahlar

| Tuş | Silah | Özellik |
|-----|-------|---------|
| `1` | Gülümseme Tabancası | Dengeli hasar, orta hız |
| `2` | Sabır Tüfeği | Saçma etkili (pellet + spread), yakın mesafede güçlü |
| `3` | Enerji Kalkanı | Hızlı atış, kısa menzil |
| `4` | Mutluluk Işını | Uzaktaki düşmanlara ulaşan enerji topu |

Silahlar ekranda elinde görünür; fare tekerleği ile de silahlar arasında geçiş yapılabilir.

## Kontroller

| Tuş | Aksiyon |
|-----|---------|
| `W` `A` `S` `D` | Hareket |
| `Fare` | Bakış (pointer lock) |
| `Sol Tık` | Ateş |
| `1` `2` `3` `4` | Silah değiştir |
| `Fare Tekerleği` | Silahlar arası geçiş |
| `E` | Etkileşim |
| `Space` | Zıpla |
| `Shift` | Koş |
| `Esc` | Duraklat |
| `M` | Sessiz / ses aç |
| `"` | Hile konsolu |

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

## Teknoloji

- [Three.js](https://threejs.org/) r160+ - WebGL render
- [Vite](https://vitejs.dev/) - Dev server + build
- TypeScript (strict mode)
- Web Audio API - prosedürel ses efektleri + harita BGM
- Voxel InstancedMesh rendering
- Özel AABB çarpışma + DDA raycast

## Proje Yapısı

```
src/
├── game/
│   ├── Game.ts                  # Ana oyun döngüsü
│   ├── interactions/            # Harita etkileşim modülleri
│   ├── worldGen/                # Harita generator'ları (5 harita)
│   └── ...
├── data/                        # maps, enemies, weapons, messages
├── entities/                    # Düşman, silah viewmodel
├── rendering/                   # Voxel, ışık, props
└── ui/                          # HUD, menü, diyalog
```

## Not

Bu oyun Hilal için, düğün öncesi anksiyeteyi bir gülümsemeyle karşılamasına bir hediye olarak yapıldı. İyi eğlenceler ve iyi bir düğün!
