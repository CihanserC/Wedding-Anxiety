# Düğün Anksiyetesi

> Hilal için tarayıcıda çalışan, Minecraft tarzı voxel dünyada düğün anksiyetesini sembolik düşmanlara karşı yenme temalı 3D FPS oyunu.

**Ana mesaj:** Anksiyete yenilmez bir düşman değil — yönetilebilir ve aşılabilir. Bu oyun terapötik ve eğlenceli bir ton taşır: stresi "vurarak" azaltmak, dalgaları geçmek ve sonunda huzurlu bir düğün sahnesine ulaşmak.

## Konsept

Hilal, bloklu bir düğün mekanında anksiyete kaynaklarını temsil eden düşmanlarla savaşır:

- **Meraklı Teyze** — "Ne zaman evleneceksiniz?" sorularıyla yavaşça yaklaşır
- **Mükemmeliyetçi Kuzen** — Karşılaştırma baskısı, orta hızda gruplar hâlinde gelir
- **Zaman Canavarı** — Geri sayım stresi, hızlı ve doğrudan saldırır
- **Beklenti Gölgesi (boss)** — Herkesin beklentisi, dalga 3'ün büyük patronu

3 dalga: küçük stresler → beklentiler → büyük anksiyete. Her dalga arası kısa bir nefes molası ve Hilal'e özel bir cesaret mesajı vardır. Anksiyete metresi %100'e ulaşırsa kaybedersin; düşmanları vurdukça metre azalır.

## Kontroller

| Tuş | Aksiyon |
|-----|---------|
| `W` `A` `S` `D` | Hareket |
| `Fare` | Bakış (pointer lock) |
| `Sol Tık` | Ateş — Gülümseme Tabancası |
| `Space` | Zıpla |
| `Shift` | Koş |
| `Esc` | Fareyi serbest bırak / duraklat |

## Kurulum ve Çalıştırma

Node.js 18+ gereklidir.

```bash
npm install
npm run dev
```

Tarayıcıda otomatik olarak `http://localhost:5173/Wedding-Anxiety/` açılır (Vite `base` yolu GitHub Pages ile uyumlu ayarlanmıştır).

### Üretim Derlemesi

```bash
npm run build
```

Derleme çıktısı `dist/` klasörüne yazılır. Yerelde önizlemek için:

```bash
npm run preview
```

## GitHub Pages Deploy

Vite yapılandırmasında `base: '/Wedding-Anxiety/'` ayarı, GitHub Pages'in bu repo altındaki alt yolunda çalışması için hazırlanmıştır.

**Manuel deploy (en basit yol):**

1. `npm run build` çalıştır.
2. `dist/` klasörünün içeriğini repo'nun `gh-pages` branch'ine (veya `main` branch'inin `docs/` klasörüne) kopyala.
3. GitHub → Settings → Pages üzerinden ilgili branch'i / klasörü Pages kaynağı olarak seç.

**GitHub Actions ile otomatik deploy (opsiyonel):**

`.github/workflows/deploy.yml` gibi bir dosya oluşturabilirsin:

```yaml
name: Deploy
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

Deploy sonrası oyun şu adreste erişilebilir olur:

**https://cihanserc.github.io/Wedding-Anxiety/**

Hilal'e tek link göndermek yeterlidir, kurulum gerekmez. 🌸

## Teknoloji

- [Three.js](https://threejs.org/) r160+ — WebGL render
- [Vite](https://vitejs.dev/) — Dev server + build
- TypeScript (strict mode)
- Web Audio API — prosedürel ses efektleri (harici asset yok)
- Özel voxel InstancedMesh chunking (küçük arena için yeterli)
- Özel AABB çarpışma + DDA raycast

## Proje Yapısı

```
src/
├── main.ts                  # Giriş noktası
├── game/
│   ├── Game.ts              # Ana oyun döngüsü, state machine
│   ├── World.ts             # Voxel grid + wedding hall generator
│   ├── Player.ts            # FPS controller + AABB collision
│   ├── WeaponSystem.ts      # Raycast + cooldown
│   ├── EnemyManager.ts      # Spawn, güncelleme, temas
│   ├── AnxietyMeter.ts      # Stres metre
│   ├── WaveManager.ts       # 3 dalga tanımı
│   └── AudioManager.ts      # Prosedürel Web Audio SFX
├── entities/
│   ├── Enemy.ts             # Düşman mesh + AI
│   └── Projectile.ts        # Tracer / muzzle flash efektleri
├── rendering/
│   ├── VoxelMesh.ts         # InstancedMesh builder
│   └── Lighting.ts          # Ambient + directional
├── input/
│   └── InputManager.ts      # Klavye + pointer lock
├── ui/
│   ├── HUD.ts               # Anksiyete barı, dalga, skor, crosshair
│   ├── MenuScreen.ts        # Başlangıç / kazanç / kayıp
│   └── DialogueBox.ts       # Dalga arası mesajlar
└── data/
    ├── blocks.ts            # Blok tipi tanımları
    ├── enemies.ts           # Düşman stats
    └── messages.ts          # Türkçe metinler, Hilal'e özel mesajlar
```

## Not

Bu oyun Hilal için, düğün öncesi anksiyeteyi bir gülümsemeyle karşılamasına bir hediye olarak yapıldı. İyi eğlenceler ve iyi bir düğün! 💐
