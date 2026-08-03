export const START_MESSAGES = {
  title: 'Düğün Anksiyetesi',
  subtitle: 'Hilal için özel bir oyun',
  intro:
    'Merhaba Hilal! Bugün düğün anksiyetesini yenme günü. Bloklu düğün salonunda seni bekleyen stres canavarlarına karşı savaşacaksın. Hazır mısın?',
  controlsTitle: 'Kontroller',
  controls: [
    'W A S D — Hareket',
    'Fare — Bakış',
    'Sol Tık — Ateş (Gülümseme Tabancası)',
    'Space — Zıpla',
    'Shift — Koş',
    'Esc — Fareyi Serbest Bırak',
  ],
  startButton: 'Başla, Hilal!',
  tip: 'İpucu: Düşmanları vurdukça anksiyete metren azalır. Onlara değmene izin verme.',
};

export const WAVE_INTRO_MESSAGES: Record<number, { title: string; body: string }> = {
  1: {
    title: 'Dalga 1 — Küçük Stresler',
    body:
      'Hazırlan Hilal! İlk dalga küçük meraklarla geliyor. Nefes al, odaklan, ateşle.',
  },
  2: {
    title: 'Dalga 2 — Beklentiler',
    body:
      'İyi gidiyorsun. Şimdi biraz daha ısrarcı beklentiler geliyor. Sen çok daha güçlüsün.',
  },
  3: {
    title: 'Dalga 3 — Büyük Anksiyete',
    body:
      'Son dalga. Beklenti Gölgesi seni bekliyor. Ama unutma: bu gün, senin günün. Onu bloklara ayır.',
  },
};

export const WAVE_CLEAR_MESSAGES: Record<number, string> = {
  1: 'Harika gidiyorsun Hilal! Her soru sadece bir blok — sen daha güçlüsün. Nefes al, sonraki dalga geliyor.',
  2: 'Beklentiler ağır gelebilir ama senin hikayen senin. Bir dalga daha kaldı; sen zaten yarısını geçtin.',
};

export const WIN_MESSAGES = {
  title: 'Tebrikler Hilal! 💐',
  body:
    'Anksiyeteyi yendin. Bu düğün senin günün — keyfini çıkar, gülümse, dans et. Sana bu blok blok mekan gibi güzel bir hayat diliyoruz.',
  button: 'Tekrar Oyna',
};

export const LOSE_MESSAGES = {
  title: 'Anksiyete Bir An Bastırdı',
  body:
    'Sorun değil Hilal. Bu sadece bir oyun — gerçek düğünde de böyle olursa nefes al, birine tutun, ve devam et. Bir daha dene, göreceksin onu yeneceksin.',
  button: 'Tekrar Dene',
};

export const HUD_LABELS = {
  anxiety: 'Anksiyete',
  wave: 'Dalga',
  score: 'Skor',
  enemiesLeft: 'Kalan Düşman',
  reloading: 'Nefes al…',
};

export const WAVE_TRANSITION_LABELS = {
  breather: 'Bir nefes molası',
  continueButton: 'Devam Et',
};
