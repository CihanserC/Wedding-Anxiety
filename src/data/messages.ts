export const START_MESSAGES = {
  title: 'Düğün Anksiyetesi',
  subtitle: 'Hilal için özel bir oyun - 3 harita, 9 aşama',
  intro:
    'Merhaba Hilal! Yolculuk klasik müzik salonunda başlıyor, sahilde bir deniz feneri altında devam ediyor ve düğün salonunda son buluyor. Her mekânda üç aşama seni bekliyor.',
  controlsTitle: 'Kontroller',
  controls: [
    'W A S D - Hareket',
    'Fare - Bakış',
    'Sol Tık - Ateş',
    '1 · 2 · 3 - Silah Değiştir (Gülümseme · Sabır · Enerji Kalkanı)',
    'Fare Tekerleği - Silahlar arası geçiş',
    'E - Etkileşim',
    'Space - Zıpla',
    'Shift - Koş',
    'Esc - Duraklat',
    'M - Sessiz / Ses Aç',
  ],
  startButton: 'Başla, Hilal!',
  tip: 'İpucu: Anksiyete metren savaşta yavaşça yükselir; düşmanları vurdukça azalır. Onlara değmene izin verme.',
};

export const WIN_MESSAGES = {
  title: 'Kazandın!',
  body: 'Tebrikler Hilal artık sıkıntıların geride kaldı.',
  finaleBody: 'Tebrikler Hilal, oyunu bitirdin! Artık düğün salonunda özgürce dolaşabilirsin.',
  button: 'Tekrar Oyna',
  continuePlayingButton: 'Oynamaya Devam Et',
};

export const LOSE_MESSAGES = {
  title: 'Anksiyete Bir An Bastırdı',
  body:
    'Sorun değil Hilal. Bu sadece bir oyun; gerçek düğünde de böyle olursa nefes al, birine tutun, ve devam et. Bir daha dene, göreceksin onu yeneceksin.',
  button: 'Tekrar Dene',
};

export const HUD_LABELS = {
  anxiety: 'Anksiyete',
  map: 'Harita',
  level: 'Level',
  score: 'Skor',
  enemiesLeft: 'Kalan Düşman',
  reloading: 'Nefes al…',
};

export const CAT_FEED_MESSAGES = {
  prompt: 'E - Kediyi besle',
  title: 'Tebrikler, haritayı geçtin!',
  body:
    'Kediyi beslediğin için şefkatin ve sıcacık kalbinin getirdiği kozmik kader puanları seni bir sonraki haritaya ışınladı.',
  button: 'Sonraki Harita',
};

export const PIANO_PLAY_MESSAGES = {
  prompt: 'E - Piyano çal',
  title: 'Tebrikler, haritayı geçtin!',
  body:
    'Piyano çalmayı bilmediğin için bastığın kötü nota bütün canavarları kaçırdı. Tebrikler, bu haritayı geçtin!',
  button: 'Sonraki Harita',
};

export const ALTAR_MESSAGES = {
  prompt: 'E - Bir an dur, nefes al',
  title: 'Nikâh Masasında Bir An',
  body: 'Salonun ortasında durdun. Derin bir nefes aldın; bu gün senin, Hilal.',
};

export const WAVE_TRANSITION_LABELS = {
  breather: 'Bir nefes molası',
  continueButton: 'Devam Et',
};

export const WEDDING_NPC_MESSAGES = {
  groomStressed: 'Oh olamaz, çok gerginim. Bu teyzeler, dayılar... alın üzerimden!',
  brideStressed: 'Keşke birisi beni kurtarsa...',
  chatPrompt: 'E - Sohbet et',
  choiceTitle: 'Ne söylemek istersin?',
  choices: {
    a: 'Harika Bir Düğündü!',
    b: 'Wow bu teyzeler çok can sıkıcıydı, neyse ki sizin için onları hakladım',
    c: 'Sırada Ne Var?',
  },
  responses: {
    groom: {
      a: 'Haklısın Hilal, gerçekten büyülü bir gün oldu. Seninle evlenmek hayatımın en güzel kararı.',
      b: 'Vay be, sen gerçek bir kahramansın! Artık biraz nefes alabiliriz sanırım.',
      c: 'Sırada balayı, sonra da uzun ve mutlu bir hayat var. Seninle her şey güzel olacak.',
    },
    bride: {
      a: 'Çok teşekkür ederim Hilal! Bugün her şey hayal ettiğim gibi geçti, sen de buna çok katkı sağladın.',
      b: 'İnanılmazsın! Onları haklamadan düğün bitmezdi zaten. Artık rahatça dans edebiliriz.',
      c: 'Belki biraz dinlenip pasta keseriz? Sonra da yıldızların altında dans ederiz.',
    },
  },
};
