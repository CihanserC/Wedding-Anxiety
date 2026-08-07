import type { SpawnRequest } from '../game/EnemyManager';

export type MapId =
  | 'concert-hall'
  | 'lighthouse'
  | 'wedding-hall'
  | 'bali'
  | 'dubai'
  | 'planet-desert'
  | 'planet-snow'
  | 'planet-rainforest'
  | 'planet-swamp'
  | 'planet-lava'
  | 'planet-ocean-mini'
  | 'planet-void';

export interface LevelDefinition {
  index: number;
  title: string;
  intro: string;
  clearMessage: string;
  totalEnemies: number;
  batches: SpawnRequest[];
  batchInterval: number;
  bossLevel?: boolean;
}

export interface AtmosphereConfig {
  ambientColor: number;
  ambientIntensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPosition: [number, number, number];
  fillColor: number;
  fillIntensity: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  skyColor: number;
}

export interface MapDefinition {
  id: MapId;
  displayName: string;
  /** Short label for in-game HUD. */
  shortName: string;
  description: string;
  worldSize: { width: number; depth: number; height: number };
  atmosphere: AtmosphereConfig;
  /** Optional looping background music for this map. */
  bgm?: 'mozart-allegro' | 'lighthouse-ambient' | 'wedding-hope' | 'bali-tropical' | 'dubai-luxury';
  /** Peaceful roam map: no combat, no wave clear, celebration-style exploration. */
  explorationOnly?: boolean;
  /** Galaxy planet surface — not part of the main campaign progression. */
  isPlanet?: boolean;
  levels: LevelDefinition[];
}

export const MAPS: MapDefinition[] = [
  {
    id: 'concert-hall',
    displayName: 'Klasik Müzik Salonu',
    shortName: 'Müzik Salonu',
    description:
      'Krem sütunların, kırmızı perdenin ve altın avizenin altında geçmişin eleştirileri seni bekliyor. Nefes al ve odaklan.',
    worldSize: { width: 48, depth: 56, height: 12 },
    bgm: 'mozart-allegro',
    atmosphere: {
      ambientColor: 0xfff0d0,
      ambientIntensity: 0.55,
      sunColor: 0xffe0a8,
      sunIntensity: 0.9,
      sunPosition: [30, 45, 20],
      fillColor: 0xffc890,
      fillIntensity: 0.3,
      fogColor: 0xf0d8b0,
      fogNear: 30,
      fogFar: 90,
      skyColor: 0xf6dcb0,
    },
    levels: [
      {
        index: 1,
        title: 'Perde Açılıyor',
        intro: 'Salon dolmaya başlıyor. İlk eleştiriler yaklaşıyor; sen sen ol, gülümse.',
        clearMessage: 'İlk sıralar sessizleşti. Alkış senin, Hilal.',
        totalEnemies: 6,
        batchInterval: 4,
        batches: [
          { type: 'merakli-teyze', count: 3 },
          { type: 'merakli-teyze', count: 3 },
        ],
      },
      {
        index: 2,
        title: 'Konçertoya Doğru',
        intro: 'Şimdi sıra daha ısrarcı bakışlarda. Ritmi kaybetme.',
        clearMessage: 'İyi çalıyorsun, Hilal. Bir perde daha kaldı.',
        totalEnemies: 9,
        batchInterval: 3.5,
        batches: [
          { type: 'merakli-teyze', count: 2 },
          { type: 'mukemmeliyetci-kuzen', count: 3 },
          { type: 'mukemmeliyetci-kuzen', count: 2 },
          { type: 'merakli-teyze', count: 2 },
        ],
      },
      {
        index: 3,
        title: 'Final Aryası',
        intro: 'Salonun sonu. Mükemmeliyetçi Kuzenler koro halinde geliyor. Emniyet kemerini bağla.',
        clearMessage: 'Salon senin. Şimdi denize doğru...',
        totalEnemies: 11,
        batchInterval: 3,
        batches: [
          { type: 'mukemmeliyetci-kuzen', count: 3 },
          { type: 'mukemmeliyetci-kuzen', count: 3 },
          { type: 'zaman-canavari', count: 2 },
          { type: 'mukemmeliyetci-kuzen', count: 3 },
        ],
      },
    ],
  },
  {
    id: 'lighthouse',
    displayName: 'Deniz Feneri',
    shortName: 'Deniz Feneri',
    description:
      'Gün batımında bir sahil. Fenerin ışığı zamanın geçtiğini fısıldıyor. Ama zaman düşman değil, sadece bir rüzgâr.',
    worldSize: { width: 56, depth: 56, height: 20 },
    bgm: 'lighthouse-ambient',
    atmosphere: {
      ambientColor: 0xfff8f0,
      ambientIntensity: 0.82,
      sunColor: 0xffc080,
      sunIntensity: 1.15,
      sunPosition: [-30, 20, 40],
      fillColor: 0xffffff,
      fillIntensity: 0.65,
      fogColor: 0xff9a5a,
      fogNear: 55,
      fogFar: 220,
      skyColor: 0xff8a3d,
    },
    levels: [
      {
        index: 1,
        title: 'Sahilde Alacakaranlık',
        intro: 'Denizin sesi dinginleştiriyor ama zaman durmuyor. İlk zaman canavarları yaklaşıyor.',
        clearMessage: 'Dalgalar gibi geldiler, dalgalar gibi geçtiler.',
        totalEnemies: 7,
        batchInterval: 3.5,
        batches: [
          { type: 'zaman-canavari', count: 2 },
          { type: 'zaman-canavari', count: 5 },
        ],
      },
      {
        index: 2,
        title: 'Fener Işığı Altında',
        intro: 'Işık kuleye vurdukça karanlık daha da koyulaşıyor. Zaman baskısı artıyor.',
        clearMessage: 'Fener senin yönünü buldu. Devam et.',
        totalEnemies: 10,
        batchInterval: 3,
        batches: [
          { type: 'zaman-canavari', count: 3 },
          { type: 'zaman-canavari', count: 3 },
          { type: 'merakli-teyze', count: 2 },
          { type: 'zaman-canavari', count: 2 },
        ],
      },
      {
        index: 3,
        title: 'Son Dalga',
        intro: 'Gün batıyor. Zaman canavarları ve eleştirmenler beraber saldırıyor. Nefes, nefes, nefes.',
        clearMessage: 'Deniz feneri senin. Şimdi düğüne...',
        totalEnemies: 13,
        batchInterval: 2.8,
        batches: [
          { type: 'zaman-canavari', count: 4 },
          { type: 'mukemmeliyetci-kuzen', count: 3 },
          { type: 'zaman-canavari', count: 3 },
          { type: 'mukemmeliyetci-kuzen', count: 3 },
        ],
      },
    ],
  },
  {
    id: 'wedding-hall',
    displayName: 'Düğün Salonu',
    shortName: 'Düğün Salonu',
    description:
      'Kubbeli, görkemli salona giriyorsun. Sarı neonlar "Hilal ❤️ Cihanser" diyor; nikâh sahnesi seni bekliyor. Bu gün, senin günün.',
    worldSize: { width: 64, depth: 72, height: 18 },
    bgm: 'wedding-hope',
    atmosphere: {
      ambientColor: 0xf0e6ff,
      ambientIntensity: 0.55,
      sunColor: 0xfff3d0,
      sunIntensity: 0.9,
      sunPosition: [28, 40, 18],
      fillColor: 0xa8c8ff,
      fillIntensity: 0.35,
      fogColor: 0xb8a8e0,
      fogNear: 35,
      fogFar: 130,
      skyColor: 0xd6c8ff,
    },
    levels: [
      {
        index: 1,
        title: 'Küçük Merak',
        intro: 'İlk konuklar gelmeye başladı. Meraklı Teyze zaten burada. Nefes al, gülümse, ateşle.',
        clearMessage: 'İyi başlangıç, Hilal. Ama gerçek düğün henüz başlamadı.',
        totalEnemies: 8,
        batchInterval: 4,
        batches: [
          { type: 'merakli-teyze', count: 3 },
          { type: 'fotograf-flasoru', count: 2 },
          { type: 'merakli-teyze', count: 3 },
        ],
      },
      {
        index: 2,
        title: 'Beklentiler',
        intro: 'Salonda ısrarcı beklentiler. Sen çok daha güçlüsün.',
        clearMessage: 'Beklentileri dağıttın. Ama son perde geliyor.',
        totalEnemies: 14,
        batchInterval: 3.5,
        batches: [
          { type: 'merakli-teyze', count: 2 },
          { type: 'mukemmeliyetci-kuzen', count: 2 },
          { type: 'fotograf-flasoru', count: 4 },
          { type: 'mukemmeliyetci-kuzen', count: 2 },
          { type: 'zaman-canavari', count: 2 },
          { type: 'mukemmeliyetci-kuzen', count: 2 },
        ],
      },
      {
        index: 3,
        title: 'Altın Canavarı',
        intro:
          'Son dalga. Herkesin beklentisinden doğan büyük gölge geliyor. Ama bu gün, senin günün.',
        clearMessage: 'Onu bloklara ayırdın, Hilal. Şimdi dans zamanı.',
        totalEnemies: 15,
        batchInterval: 3,
        batches: [
          { type: 'zaman-canavari', count: 2 },
          { type: 'fotograf-flasoru', count: 4 },
          { type: 'mukemmeliyetci-kuzen', count: 3 },
          { type: 'zaman-canavari', count: 2 },
          { type: 'merakli-teyze', count: 3 },
          { type: 'beklenti-golgesi', count: 1 },
        ],
        bossLevel: true,
      },
    ],
  },
  {
    id: 'bali',
    displayName: 'Bali Adası',
    shortName: 'Bali Adası',
    description:
      'Balayı başladı. Turkuaz deniz, akan nehir, tropik orman ve villanız sizi bekliyor. Dikkat: meraklı maymunlar saldırgan olabilir.',
    worldSize: { width: 96, depth: 96, height: 22 },
    bgm: 'bali-tropical',
    atmosphere: {
      ambientColor: 0xfff0c8,
      ambientIntensity: 0.65,
      sunColor: 0xffe8a0,
      sunIntensity: 1.15,
      sunPosition: [40, 55, 25],
      fillColor: 0x80d0ff,
      fillIntensity: 0.35,
      fogColor: 0xb8e0f0,
      fogNear: 45,
      fogFar: 160,
      skyColor: 0x87ceeb,
    },
    levels: [
      {
        index: 1,
        title: 'Tropik Sabah',
        intro: 'Plajda uyanıyorsun. Uzakta maymun çığlıkları… Keşfet, ama tetikte kal.',
        clearMessage: 'İlk maymun sürüsü dağıldı. Ada daha sakin görünüyor.',
        totalEnemies: 6,
        batchInterval: 4,
        batches: [
          { type: 'maymun', count: 3 },
          { type: 'maymun', count: 3 },
        ],
      },
      {
        index: 2,
        title: 'Maymun Ormanı',
        intro: 'Ormanın derinliklerinden daha fazla maymun geliyor. Villaya doğru çekil!',
        clearMessage: 'Orman sessizleşti. Ama villa henüz güvende değil.',
        totalEnemies: 12,
        batchInterval: 3.5,
        batches: [
          { type: 'maymun', count: 4 },
          { type: 'maymun', count: 4 },
          { type: 'maymun', count: 4 },
        ],
      },
      {
        index: 3,
        title: 'Villa Kuşatması',
        intro: 'Maymunlar villayı sardı! Infinity pool kenarında son savunma.',
        clearMessage: 'Bali senin. Balayı resmen başladı, yaşasın!',
        totalEnemies: 18,
        batchInterval: 3,
        batches: [
          { type: 'maymun', count: 5 },
          { type: 'maymun', count: 5 },
          { type: 'maymun', count: 4 },
          { type: 'maymun', count: 4 },
        ],
      },
    ],
  },
  {
    id: 'dubai',
    displayName: 'Dubai · Lüks Villa',
    shortName: 'Dubai Villa',
    description:
      'Çöl güneşi, beyaz mermer, sonsuzluk havuzu ve kilometrelerce asfalt. Lamborghini kapıda, savaş bitti, sadece sür. Batı kumlarında parlayan bir şey daha var…',
    worldSize: { width: 128, depth: 240, height: 20 },
    bgm: 'dubai-luxury',
    explorationOnly: true,
    atmosphere: {
      ambientColor: 0xffe8c8,
      ambientIntensity: 0.72,
      sunColor: 0xffd080,
      sunIntensity: 1.25,
      sunPosition: [45, 50, -20],
      fillColor: 0x80c0ff,
      fillIntensity: 0.3,
      fogColor: 0xe8d0a8,
      fogNear: 45,
      fogFar: 140,
      skyColor: 0x87b8e8,
    },
    levels: [
      {
        index: 1,
        title: 'Altın Şehir',
        intro:
          'Çöl güneşi, beyaz mermer ve sonsuzluk havuzu. Uzun asfalt seni bekliyor, Lambo\'ya bin, keşfet.',
        clearMessage: 'Dubai senin. Keyfini çıkar.',
        totalEnemies: 0,
        batchInterval: 999,
        batches: [],
      },
    ],
  },
  {
    id: 'planet-desert',
    displayName: 'Kum Diyar',
    shortName: 'Çöl Gezegen',
    description: 'Altın kumlar ve barışçıl gezginler.',
    worldSize: { width: 48, depth: 48, height: 14 },
    explorationOnly: true,
    isPlanet: true,
    atmosphere: {
      ambientColor: 0xffe8c0,
      ambientIntensity: 0.7,
      sunColor: 0xffd080,
      sunIntensity: 1.2,
      sunPosition: [40, 55, -15],
      fillColor: 0xffc070,
      fillIntensity: 0.28,
      fogColor: 0xe8d0a0,
      fogNear: 20,
      fogFar: 70,
      skyColor: 0xc8a878,
    },
    levels: [
      {
        index: 1,
        title: 'Kum Diyar',
        intro: 'Çöl gezegenine indin. Uzakta barışçıl gezginler var.',
        clearMessage: 'Kum Diyar keşfedildi.',
        totalEnemies: 0,
        batchInterval: 999,
        batches: [],
      },
    ],
  },
  {
    id: 'planet-snow',
    displayName: 'Buz Vadi',
    shortName: 'Kar Gezegen',
    description: 'Donmuş ovalar. Düşmanca yaşam formları dolaşıyor.',
    worldSize: { width: 48, depth: 48, height: 14 },
    explorationOnly: true,
    isPlanet: true,
    atmosphere: {
      ambientColor: 0xd0e8f8,
      ambientIntensity: 0.75,
      sunColor: 0xf0f8ff,
      sunIntensity: 0.95,
      sunPosition: [30, 50, 20],
      fillColor: 0xa0c8e8,
      fillIntensity: 0.35,
      fogColor: 0xc8dce8,
      fogNear: 18,
      fogFar: 65,
      skyColor: 0xb0c8d8,
    },
    levels: [
      {
        index: 1,
        title: 'Buz Vadi',
        intro: 'Buzlu bir dünyaya indin. Soğuk rüzgâr… ve düşmanlar.',
        clearMessage: 'Buz Vadi keşfedildi.',
        totalEnemies: 0,
        batchInterval: 999,
        batches: [],
      },
    ],
  },
  {
    id: 'planet-rainforest',
    displayName: 'Yeşil Taç',
    shortName: 'Orman Gezegen',
    description: 'Yoğun yağmur ormanı ve dost canlısı yerliler.',
    worldSize: { width: 48, depth: 48, height: 16 },
    explorationOnly: true,
    isPlanet: true,
    atmosphere: {
      ambientColor: 0xc8f0c0,
      ambientIntensity: 0.6,
      sunColor: 0xffe8a0,
      sunIntensity: 1.0,
      sunPosition: [25, 50, 30],
      fillColor: 0x60c080,
      fillIntensity: 0.3,
      fogColor: 0x88c098,
      fogNear: 22,
      fogFar: 70,
      skyColor: 0x6ab888,
    },
    levels: [
      {
        index: 1,
        title: 'Yeşil Taç',
        intro: 'Yağmur ormanı gezegenine indin. Yaprak hışırtıları…',
        clearMessage: 'Yeşil Taç keşfedildi.',
        totalEnemies: 0,
        batchInterval: 999,
        batches: [],
      },
    ],
  },
  {
    id: 'planet-swamp',
    displayName: 'Sis Bataklığı',
    shortName: 'Bataklık',
    description: 'Sisli bataklık. Bilge bir varlık seni bekliyor.',
    worldSize: { width: 48, depth: 48, height: 16 },
    explorationOnly: true,
    isPlanet: true,
    atmosphere: {
      ambientColor: 0xa8c080,
      ambientIntensity: 0.5,
      sunColor: 0xc8d090,
      sunIntensity: 0.55,
      sunPosition: [20, 40, 10],
      fillColor: 0x608050,
      fillIntensity: 0.3,
      fogColor: 0x687858,
      fogNear: 6,
      fogFar: 38,
      skyColor: 0x455040,
    },
    levels: [
      {
        index: 1,
        title: 'Sis Bataklığı',
        intro: 'Sis yoğun. Bir yerlerde bilge bir ses duyuluyor…',
        clearMessage: 'Sis Bataklığı keşfedildi.',
        totalEnemies: 0,
        batchInterval: 999,
        batches: [],
      },
    ],
  },
  {
    id: 'planet-lava',
    displayName: 'Kızıl Ateş',
    shortName: 'Lav Gezegen',
    description: 'Dev bir yanardağ. Lav akıyor. Karanlık bir lord tahtında bekliyor.',
    worldSize: { width: 40, depth: 40, height: 18 },
    explorationOnly: true,
    isPlanet: true,
    atmosphere: {
      ambientColor: 0x601818,
      ambientIntensity: 0.32,
      sunColor: 0xff5020,
      sunIntensity: 0.75,
      sunPosition: [20, 40, -35],
      fillColor: 0xff1808,
      fillIntensity: 0.55,
      fogColor: 0x280808,
      fogNear: 8,
      fogFar: 38,
      skyColor: 0x180404,
    },
    levels: [
      {
        index: 1,
        title: 'Kızıl Ateş',
        intro:
          'Yanardağ kükriyor. Lav nehirleri tahtın etrafında kıvrılıyor… Darth Vader seni bekliyor.',
        clearMessage: 'Kızıl Ateş keşfedildi.',
        totalEnemies: 0,
        batchInterval: 999,
        batches: [],
      },
    ],
  },
  {
    id: 'planet-ocean-mini',
    displayName: 'Mavi Damla',
    shortName: 'Okyanus',
    description: 'Neredeyse tamamen okyanus — minik bir ada.',
    worldSize: { width: 28, depth: 28, height: 12 },
    explorationOnly: true,
    isPlanet: true,
    atmosphere: {
      ambientColor: 0xc0e8f8,
      ambientIntensity: 0.7,
      sunColor: 0xfff0c0,
      sunIntensity: 1.15,
      sunPosition: [35, 50, 25],
      fillColor: 0x60b0e0,
      fillIntensity: 0.35,
      fogColor: 0x88c0d8,
      fogNear: 15,
      fogFar: 50,
      skyColor: 0x70b8e0,
    },
    levels: [
      {
        index: 1,
        title: 'Mavi Damla',
        intro: 'Uçsuz bucaksız okyanus. Ortada minik bir ada.',
        clearMessage: 'Mavi Damla keşfedildi.',
        totalEnemies: 0,
        batchInterval: 999,
        batches: [],
      },
    ],
  },
  {
    id: 'planet-void',
    displayName: 'Issız Kaya',
    shortName: 'Boş Gezegen',
    description: 'Issız bir kaya — ama gölgeler hareket ediyor.',
    worldSize: { width: 32, depth: 32, height: 10 },
    explorationOnly: true,
    isPlanet: true,
    atmosphere: {
      ambientColor: 0x808088,
      ambientIntensity: 0.45,
      sunColor: 0xc0c0c8,
      sunIntensity: 0.8,
      sunPosition: [25, 40, 15],
      fillColor: 0x606070,
      fillIntensity: 0.2,
      fogColor: 0x404048,
      fogNear: 12,
      fogFar: 45,
      skyColor: 0x181820,
    },
    levels: [
      {
        index: 1,
        title: 'Issız Kaya',
        intro: 'Sessizlik. Toz. Gölgeler.',
        clearMessage: 'Issız kaya keşfedildi.',
        totalEnemies: 0,
        batchInterval: 999,
        batches: [],
      },
    ],
  },
];

/** Campaign maps only (excludes galaxy planets). */
export function campaignMaps(): MapDefinition[] {
  return MAPS.filter((m) => !m.isPlanet);
}

export function getMapById(id: MapId): MapDefinition | undefined {
  return MAPS.find((m) => m.id === id);
}

export function getMapIndexById(id: MapId): number {
  return MAPS.findIndex((m) => m.id === id);
}

export function totalLevelCount(): number {
  return campaignMaps().reduce((sum, m) => sum + m.levels.length, 0);
}

export function totalMapCount(): number {
  return campaignMaps().length;
}
