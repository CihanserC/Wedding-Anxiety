# Proje Hafızası - Wedding Anxiety

> Bu dosya, projede nerede kaldığımızı ve neler yapıldığını özetleyen çalışma notudur.
> Yeni bir oturuma başlarken önce burayı oku. Son güncelleme: **4 Ağustos 2026**.

## Proje nedir?

Hilal için hediye olarak yapılan, tarayıcıda çalışan Minecraft tarzı voxel 3D FPS oyunu.
Tema: düğün anksiyetesini sembolik düşmanlara karşı "vurarak" yenmek.
Stack: **Three.js + TypeScript (strict) + Vite**. Harici asset yok; sesler Web Audio ile prosedürel, dokular canvas ile üretiliyor.

## Şu anki durum

- `npm run build` **sıfır hatayla geçiyor** (tsc + vite).
- Oyun 3 harita × 3 level = 9 aşamalık tam bir progression'a sahip.
- Netlify'a bağlı: `main`'e push → otomatik deploy.
- **Faz A cilası tamamlandı** (4 Ağustos 2026): pause menü, ayarlar (sessiz/slider/hassasiyet), silah isimleri hizalandı, Map 2-3 BGM, suya düşme kurtarma, fotoğraf sıkıştırma, README güncellendi.

### Faz A - yapılanlar

- **Pause menü** (`PauseScreen.ts`): Esc ile duraklat, ayarlar, ana menüye dön.
- **Ayarlar** (`GameSettings.ts` + localStorage): fare hassasiyeti, SFX/müzik slider, M ile sessiz.
- **Su düşme**: deniz fenerinde ada dışına düşünce spawn'a dön + anksiyete +8.
- **Silahlar**: Gülümseme Tabancası, Sabır Tüfeği (5 pellet + spread), Enerji Kalkanı (tek atış, kısa menzil).
- **BGM**: Map 1 Mozart, Map 2 lighthouse-ambient, Map 3 wedding-hope (prosedürel).
- **Görseller**: `couple.jpg` ~402 KB, `game_won.JPG` ~364 KB (önce ~11 MB / ~3.4 MB).

### Faz B - yapılanlar (4 Ağustos 2026)

- **Flaşör Babaanne**: yeni düşman tipi; mesafede flaş atar (+12 anksiyete). Map 3 Level 2-3'te.
- **Boss fazları**: Beklenti Gölgesi %60 HP'de 2 teyze çağırır, %30'da hızlanır.
- **Nikâh masası etkileşimi**: Map 3'te E ile nefes molası (−15 anksiyete, level başına 1 kez).

### Sonraki adım (isteğe bağlı)

- 4. harita (Hazırlık Odası / Davetiye Ofisi)

## TODO — hatırlat

- [ ] **Gelin (Hilal) sohbet ağacı**: Epilogda gelinle konuşurken Hilal'e özel, kişisel diyaloglar yaz (mevcut 3 seçenek + cevaplar genişletilecek / yenilenecek).
- [ ] **Damat (Cihanser) sohbet ağacı**: Damatla konuşurken Cihanser'e özel, kişisel diyaloglar yaz (gelinden ayrı içerik; aynı şablonu paylaşmasın).
- [x] Epilog E tuşu metinleri: "E - Gelinle sohbet et" / "E - Damatla sohbet et" (genel "Sohbet et" kaldırıldı).

> **Hatırlatma:** Yukarıdaki gelin/damat sohbet TODO'ları henüz yapılmadı — bir sonraki içerik oturumunda Hilal ve Cihanser için ayrı sohbet metinleri yazılacak.

## Bilinen notlar

- tsconfig strict + `noUnusedLocals` + `noUnusedParameters`.
- HUD/dialog metinleri Türkçe; oyuncuya hitap "Hilal".
- Piyano (Map 1) ve kedi (Map 2) E ile harita atlama şakası; bilinçli tasarım.
- `WeddingDecorations.ts` aktif ve kullanılıyor (portre + dekor).

## Manuel test listesi

1. Esc → pause → ayarlar → devam
2. M ile sessiz, slider'lar
3. Map 2'de suya düşünce spawn'a dönüş
4. Map 1-3 BGM değişimi
5. Sabır Tüfeği yakın mesafe hasarı
6. Boss kapıdan geçiş (Map 3 L3)
