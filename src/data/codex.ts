/** Ana menü ansiklopedisi, karakterler, düşmanlar, silahlar, haritalar. */

export interface CodexEntry {
  id: string;
  name: string;
  role: string;
  blurb: string;
  tags?: string[];
}

export const CODEX_CHARACTERS: CodexEntry[] = [
  {
    id: 'hilal',
    name: 'Hilal',
    role: 'Gelin · Kahraman',
    blurb:
      'Oyunun kalbi. Klasik müzik salonundan çöle uzanan yolculukta anksiyete canavarlarıyla yüzleşir, nefes alır ve kendi gününü geri alır. Cesaret, mizah ve biraz pasta ile her dalgayı geçer.',
    tags: ['Oyuncu', 'Gelin'],
  },
  {
    id: 'cihanser',
    name: 'Cihanser',
    role: 'Damat · Geliştirici',
    blurb:
      'Düğün gününün küçük streslerini bir oyuna döken bilgisayar mühendisi. Epilogda ve Dubai villasında sohbet edebilirsin; bazen gergin, her zaman Hilal\'in yanında.',
    tags: ['NPC', 'Damat'],
  },
  {
    id: 'suzy',
    name: 'Suzy Çıtçıt',
    role: 'Düğün Kedisi',
    blurb:
      'Salonun en tatlı misafiri. Sevmek için yaklaş; kedi enerjisi anksiyeteyi biraz yumuşatır. Deniz fenerindeki kuzeni ise harita atlamana yardım edebilir…',
    tags: ['NPC', 'Kedi'],
  },
  {
    id: 'waheed',
    name: 'Waheed',
    role: 'Dubai Yerel Rehberi',
    blurb:
      'Çöl kenarında dolaşan dost canlısı komşu. Türkçe bilmez; selam verdiğinde saf Arapça saçmalık ve "WAHEEEED" çığlıkları duyarsın. Habibi vibe garantili.',
    tags: ['NPC', 'Dubai'],
  },
  {
    id: 'fatima',
    name: 'Fatima & Layla',
    role: 'Dubai Komşuları',
    blurb:
      'Villanın çevresinde gezinen yerel kadınlar. Sohbetleri Waheed kadar anlaşılmaz ama sıcaklıkları evrensel. Deveye selam vermeyi unutma.',
    tags: ['NPC', 'Dubai'],
  },
  {
    id: 'deve',
    name: 'Deve',
    role: 'Çöl Dostu',
    blurb:
      'Dubai kumlarında ağır ağır gezen, selamlaşmayı seven deve. Konuşamaz ama "WAHEEEED" dilini mükemmel konuşur.',
    tags: ['NPC', 'Hayvan'],
  },
];

export const CODEX_ENEMIES: CodexEntry[] = [
  {
    id: 'merakli-teyze',
    name: 'Meraklı Teyze',
    role: 'Yavaş · Takipçi',
    blurb:
      'Herkesin düğününü kendi düğünü sanan klasik teyze enerjisi. Yavaş yürür ama yaklaşırsa anksiyeteyi hızla yükseltir. Gülümseme Tabancası ile nazikçe uzaklaştır.',
    tags: ['Konser', 'Düğün'],
  },
  {
    id: 'mukemmeliyetci-kuzen',
    name: 'Mükemmeliyetçi Kuzen',
    role: 'Hızlı · Eleştirmen',
    blurb:
      'Kontrol listesiyle peşine düşer; konuşma balonlarıyla seni yargılar, uzaktan checklist fırlatır, yakına gelince kısa lunge yapar. Mesafe koy, Sabır Tüfeği ile dağıt.',
    tags: ['Konser', 'Düğün'],
  },
  {
    id: 'zaman-canavari',
    name: 'Zaman Canavarı',
    role: 'Hücumcu',
    blurb:
      '"Geç kaldın!" diye bağıran panik. Aniden üzerine koşar. Enerji Kalkanı yakın mesafede hayat kurtarır.',
    tags: ['Deniz Feneri', 'Düğün'],
  },
  {
    id: 'fotograf-flasoru',
    name: 'Fotoğraf Flaşörü',
    role: 'Flaş · Körlük',
    blurb:
      'Her anı ölümsüzleştirmek ister, özellikle seni. Flaş patladığında görüşün bulanıklaşır; kalkanla karşı koy veya mesafe bırak.',
    tags: ['Deniz Feneri', 'Düğün'],
  },
  {
    id: 'beklenti-golgesi',
    name: 'Altın Canavarı',
    role: 'Boss',
    blurb:
      'Herkesin senden beklediği şeylerin birleşmiş gölgesi. Düğün salonunun son perdesi. Faz geçişlerinde güçlenir; sabırlı ol, nefes al, gölgeyi bloklara ayır.',
    tags: ['Boss', 'Düğün'],
  },
  {
    id: 'maymun',
    name: 'Maymun',
    role: 'Bali · Saldırgan',
    blurb:
      'Balayı adasının meraklı sakinleri, maalesef biraz fazla meraklı. Tropik ormanda sürü halinde gelirler. Villanı koru!',
    tags: ['Bali'],
  },
  {
    id: 'inek',
    name: 'İnek',
    role: 'Barışçıl Fauna',
    blurb:
      'Bali\'de otlayan zararsız inek. Düşman sayılmaz; vurmak zorunda değilsin. Adanın sakin yüzü.',
    tags: ['Bali', 'Dost'],
  },
  {
    id: 'kertenkele',
    name: 'Kertenkele',
    role: 'Barışçıl Fauna',
    blurb:
      'Kayalıklarda güneşlenen minik kertenkele. Zararsız keşif süsü, anksiyete yaratmaz.',
    tags: ['Bali', 'Dost'],
  },
  {
    id: 'ari',
    name: 'Arı',
    role: 'Barışçıl Fauna',
    blurb:
      'Muz ağacı ve çiçekler arasında vızıldayan minik uçan arı. Zararsız; sadece tropik atmosferi tamamlar.',
    tags: ['Bali', 'Dost'],
  },
];

export const CODEX_WEAPONS: CodexEntry[] = [
  {
    id: 'pistol',
    name: 'Gülümseme Tabancası',
    role: '1 · Hızlı · Tek atış',
    blurb:
      'Nazik ama etkili. Düşük hasar, yüksek atış hızı. İlk dalgalarda ve uzak hedeflerde güvenilir dostun. Gülümsemek de bir silahtır.',
    tags: ['Varsayılan'],
  },
  {
    id: 'rifle',
    name: 'Sabır Tüfeği',
    role: '2 · Saçma · Güçlü',
    blurb:
      'Bekle, nefes al, ateş et. Daha yavaş ama yakın-orta mesafede birden fazla peletle alanı temizler. Sabır ödüllendirilir.',
    tags: ['Saçma'],
  },
  {
    id: 'shield',
    name: 'Enerji Kalkanı',
    role: '3 · Yakın · Savunma',
    blurb:
      'Flaşörlere ve hücumculara karşı kısa menzilli enerji darbesi. Temas anında panik yapma, kalkanı aç.',
    tags: ['Savunma'],
  },
  {
    id: 'happiness',
    name: 'Mutluluk Işını',
    role: '4 · Yıldız Savaşı cıvatası',
    blurb:
      'Kırmızı mutluluk cıvatası düşmana doğru yol alır. Görsel olarak en tatlı silah; menzili uzun, ritmi dengeli. Level 2\'den itibaren keşfet.',
    tags: ['Özel'],
  },
];

export const CODEX_MAPS: CodexEntry[] = [
  {
    id: 'concert-hall',
    name: 'Klasik Müzik Salonu',
    role: 'Ana Hikâye · 3 aşama',
    blurb:
      'Krem sütunlar, kırmızı perde, altın avize. Yolculuk burada başlar. Sahnedeki piyanoyu çalarsan… belki tüm salon susturabilirsin.',
    tags: ['Ana'],
  },
  {
    id: 'lighthouse',
    name: 'Deniz Feneri',
    role: 'Ana Hikâye · 3 aşama',
    blurb:
      'Sahil, fırtına ve yalnız bir fener. Zaman canavarları ve flaşörler burada yoğunlaşır. Kediyi beslemek haritayı atlamanı sağlayabilir.',
    tags: ['Ana'],
  },
  {
    id: 'wedding-hall',
    name: 'Düğün Salonu',
    role: 'Ana Hikâye · 3 aşama + Boss',
    blurb:
      'Büyük gün. Altar, pasta, Suzy Çıtçıt ve Altın Canavarı. Boss\'u yendikten sonra epilogda özgürce dolaş, sonra Bali seni bekler.',
    tags: ['Ana', 'Boss'],
  },
  {
    id: 'bali',
    name: 'Bali Adası',
    role: 'Bonus · Balayı · 3 aşama',
    blurb:
      'Turkuaz deniz, tropik villa, meraklı maymunlar. Temizledikten sonra kayalıkların arasında gizli bir hazine… Dubai\'nin kapısını açar.',
    tags: ['Bonus'],
  },
  {
    id: 'dubai',
    name: 'Dubai · Lüks Villa',
    role: 'Özel · Keşif',
    blurb:
      'Mermer villa, infinity pool, sarı Lamborghini ve kilometrelerce çöl yolu. Savaş yok, sadece huzur. Çölde bir sır daha fısıldıyor olabilir…',
    tags: ['Özel', 'Keşif'],
  },
];

export type CodexPageId = 'guide' | 'characters' | 'enemies' | 'weapons' | 'maps' | 'controls';

/** Karakter / düşman / silah / harita, Oyun Rehberi altındaki sayfalar */
export const CODEX_GUIDE_PAGES: Array<{ id: Exclude<CodexPageId, 'guide' | 'controls'>; label: string; hint: string }> = [
  { id: 'characters', label: 'Karakterler', hint: 'Hilal, Cihanser ve dostlar' },
  { id: 'enemies', label: 'Düşmanlar', hint: 'Anksiyetenin yüzleri' },
  { id: 'weapons', label: 'Silahlar', hint: 'Gülümseme, sabır, kalkan…' },
  { id: 'maps', label: 'Haritalar', hint: '5 dünya, 13 aşama' },
];
