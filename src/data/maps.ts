import type { SpawnRequest } from '../game/EnemyManager';

export type MapId = 'concert-hall' | 'lighthouse' | 'wedding-hall' | 'bali' | 'dubai';

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
];

export function totalLevelCount(): number {
  return MAPS.reduce((sum, m) => sum + m.levels.length, 0);
}

export function totalMapCount(): number {
  return MAPS.length;
}
