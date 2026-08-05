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
    '1 · 2 · 3 · 4 - Silah Değiştir (Gülümseme · Sabır · Enerji Kalkanı · Mutluluk Işını)',
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
  bouquet: 'Gelin Buketi',
};

export const CAT_FEED_MESSAGES = {
  prompt: 'E - Kediyi besle',
  mapSkipHint: 'Kediyi besle — sonraki haritaya geçmek için E ile etkileş.',
  title: 'Tebrikler, haritayı geçtin!',
  body:
    'Kediyi beslediğin için şefkatin ve sıcacık kalbinin getirdiği kozmik kader puanları seni bir sonraki haritaya ışınladı.',
  button: 'Sonraki Harita',
};

export const PIANO_PLAY_MESSAGES = {
  prompt: 'E - Piyano çal',
  mapSkipHint: 'Sahnedeki piyanoya git — sonraki haritaya geçmek için E ile çal.',
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

export const CAKE_MESSAGES = {
  prompt: 'E - Düğün pastasından bir dilim al',
  title: 'Şeker Patlaması!',
  body:
    'Lezzetli bir dilim düğün pastası ısırdın — tadı dillere destan! Tatlı mutluluk damarlarında dolaşırken adımların hafifliyor. Bir süre hiçbir şey seni yavaşlatamaz.',
};

export const SUZY_CAT_MESSAGES = {
  prompt: 'E - Suzy Çıtçıt\'ı sev',
};

export const WAVE_TRANSITION_LABELS = {
  breather: 'Bir nefes molası',
  continueButton: 'Devam Et',
};

export const WEDDING_NPC_MESSAGES = {
  groomStressed: 'Oh olamaz, çok gerginim. Bu teyzeler, dayılar... alın üzerimden!',
  brideStressed: 'Keşke birisi beni kurtarsa...',
  groomChatPrompt: 'E - Cihanser ile sohbet et',
  brideChatPrompt: 'E - Hilal ile sohbet et',
  choiceTitle: 'Ne söylemek istersin?',
  choices: {
    groom: {
      a: 'Harika Bir Düğündü!',
      b: 'Duyduğuma göre bilgisayar mühendisiymişsin. Bu oyunu neden yaptın?',
      c: 'Sırada Ne Var?',
    },
    bride: {
      a: 'Harika Bir Düğündü!',
      b: 'Diyetisyenlik nasıl gidiyor, Hilal?',
      c: 'Sırada Ne Var?',
    },
  },
  responses: {
    groom: {
      a: 'Gerçekten büyülü bir gün oldu. Hilal ile evlenmek hayatımın en güzel kararı.',
      b:
        'Düğün gününde yaşadığımız o küçük stresleri eğlenceli bir şekilde yenip aslında ne kadar önemsiz olduklarını görmeni istedim. Kafamızdaki o anksiyete canavarlarını bu oyuna döktük; onlara silahla vurup gülmek ikimizi de rahatlatır diye düşündüm.',
      c: 'Sırada balayı, sonra da uzun ve mutlu bir hayat var. Seninle her şey güzel olacak.',
    },
    bride: {
      a: 'Çok teşekkür ederim! Bugün her şey hayal ettiğim gibi geçti, sen de buna çok katkı sağladın.',
      b:
        'İyi gidiyor, teşekkürler! Şu ara özellikle bağırsak-beyin ekseninde vagus sinir stimülasyonunun, Bifidobacterium ve Faecalibacterium gibi butirat üreten kommensal türlerin çeşitliliğine bağlı olarak enteroendokrin hücrelerden serotonin salınımını modüle ettiğini inceliyorum.',
      c: 'Belki biraz dinlenip pasta keseriz? Sonra da yıldızların altında dans ederiz.',
    },
  },
};
