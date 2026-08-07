import type { AiCharacterId } from './aiPrompts';

interface FallbackEntry {
  keywords: string[];
  reply: string;
}

const VADER_FALLBACKS: FallbackEntry[] = [
  { keywords: ['güç', 'guc', 'force'], reply: 'Güç seninle olabilir… ama benimle asla boy ölçüşemezsin.' },
  { keywords: ['imparator', 'empire'], reply: 'İmparatorluğun gölgesi her yere uzanır. Sen de onun altına gireceksin.' },
  { keywords: ['korku', 'kork'], reply: 'Korkunu hissediyorum. İyi. Korku seni daha itaatkâr yapar.' },
  { keywords: ['hilal', 'gelin', 'düğün'], reply: 'Hilal… Adın yıldızlarda yankılanıyor. Ama kaderin benimle kesişti.' },
  { keywords: ['kimsin', 'sen kim'], reply: 'Ben Darth Vader. Galaktik İmparatorluğun Kara Lordu.' },
  { keywords: ['jedi', 'yoda'], reply: 'Jedi\'ler yok oldu. Yoda bir gölge… Ben ise karanlığın ta kendisiyim.' },
  { keywords: ['yardım', 'yardim'], reply: 'Yardım mı? İmparatorluk merhamet dağıtmaz. Emir verir.' },
  { keywords: ['savaş', 'savas', 'dövüş'], reply: 'Işık kılıcımı çekmemi istersen, sonunu düşün.' },
  { keywords: ['barış', 'baris'], reply: 'Barış, düzenle gelir. Düzen ise korkuyla.' },
  { keywords: ['neden', 'niye'], reply: 'Nedenler zayıflara aittir. Ben sonuçları getiririm.' },
  { keywords: ['aşk', 'ask', 'sevgi'], reply: 'Aşk… Bir zamanlar biliyordum. Sonra karanlık her şeyi yuttu.' },
  { keywords: ['merhaba', 'selam', 'hey'], reply: 'Konuşmaya cüret ediyorsun. Dinliyorum… şimdilik.' },
  { keywords: ['veda', 'güle', 'hoşça'], reply: 'Git. Ama unutma: karanlık her yerde seni bekler.' },
  { keywords: ['lav', 'ateş', 'mustafar'], reply: 'Bu gezegen benim irademin aynasıdır. Ateş ve çelik.' },
  { keywords: ['ölüm', 'olum', 'öldür'], reply: 'Ölüm bir kaçıştır. Asıl ceza, benim gölgemde yaşamaktır.' },
];

const VADER_DEFAULTS = [
  'İmparatorluğa karşı durmak… Cesurca. Ve aptalca.',
  'Nefesini duyuyorum. Kalbinin çarpışını da.',
  'Kaderinden kaçamazsın. Ben kaderim.',
  'Sözlerin boş. Güç ise her şeydir.',
  'Yeterince konuştuk. Şimdi itaat et… veya yok ol.',
];

const YODA_FALLBACKS: FallbackEntry[] = [
  { keywords: ['güç', 'guc', 'force'], reply: 'Güç sende var. Hissetmeyi öğrenmelisin.' },
  { keywords: ['korku', 'kork'], reply: 'Korku yolunu karanlık yapar. Bırak korkuyu.' },
  { keywords: ['hilal', 'gelin', 'düğün'], reply: 'Hilal, güçlü bir kalbi var. Düğün korkusu, büyüme getirebilir.' },
  { keywords: ['kimsin', 'sen kim'], reply: 'Yoda benim. Jedi Ustası, uzun yıllardır.' },
  { keywords: ['vader', 'karanlık'], reply: 'Karanlık yola sapmış biri. Merhamet hâlâ mümkün, belki.' },
  { keywords: ['yardım', 'yardim'], reply: 'Yardım etmek isterim sana. Dinle kalbini.' },
  { keywords: ['sabır', 'sabir'], reply: 'Sabır, en büyük silahtır. Acele etme.' },
  { keywords: ['öğren', 'ogren', 'eğit'], reply: 'Öğrenmeye açık ol. Bilgelik yavaş gelir.' },
  { keywords: ['merhaba', 'selam', 'hey'], reply: 'Hoş geldin, genç Padawan. Bekliyordum seni.' },
  { keywords: ['veda', 'güle', 'hoşça'], reply: 'Güle güle. Yolun aydınlık olsun.' },
  { keywords: ['bataklık', 'sis'], reply: 'Sis, gerçeği gizler. Sabırla bakarsan, görürsün.' },
  { keywords: ['neden', 'niye'], reply: 'Neden diye sorma hep. Nasıl diye sor bazen.' },
  { keywords: ['aşk', 'ask', 'sevgi'], reply: 'Sevgi, Güç\'ün en saf hâli. Koru onu.' },
  { keywords: ['savaş', 'savas'], reply: 'Savaş son çaredir. Barış, daha zor yoldur.' },
  { keywords: ['jedi'], reply: 'Jedi olmak, silah taşımak değil. Dengede durmaktır.' },
];

const YODA_DEFAULTS = [
  'Hızlı konuşmak, bilgelik getirmez.',
  'Doğru yolu seçersen, Güç yanında olur.',
  'Görmek için bakmak yetmez. Hissetmelisin.',
  'Küçük adımlarla büyük yol alınır.',
  'Sabırlı ol, genç Padawan. Zamanı gelince anlaşılır her şey.',
];

function pickFallback(entries: FallbackEntry[], defaults: string[], message: string): string {
  const lower = message.toLowerCase();
  for (const entry of entries) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.reply;
  }
  const idx = Math.abs(hashStr(lower)) % defaults.length;
  return defaults[idx];
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

export function getScriptedFallback(characterId: AiCharacterId, userMessage: string): string {
  if (characterId === 'darth-vader') {
    return pickFallback(VADER_FALLBACKS, VADER_DEFAULTS, userMessage);
  }
  return pickFallback(YODA_FALLBACKS, YODA_DEFAULTS, userMessage);
}
