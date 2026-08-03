import type { SpawnRequest } from '../game/EnemyManager';

export type MapId = 'concert-hall' | 'lighthouse' | 'wedding-hall';

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
  description: string;
  worldSize: { width: number; depth: number; height: number };
  atmosphere: AtmosphereConfig;
  /** Optional looping background music for this map. */
  bgm?: 'mozart-allegro';
  levels: LevelDefinition[];
}

export const MAPS: MapDefinition[] = [
  {
    id: 'concert-hall',
    displayName: 'Klasik Müzik Salonu',
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
        intro: 'Salon dolmaya başlıyor. İlk eleştiriler yaklaşıyor — sen sen ol, gülümse.',
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
    description:
      'Gün batımında bir sahil. Fenerin ışığı zamanın geçtiğini fısıldıyor. Ama zaman düşman değil, sadece bir rüzgâr.',
    worldSize: { width: 56, depth: 56, height: 20 },
    atmosphere: {
      ambientColor: 0xffb070,
      ambientIntensity: 0.6,
      sunColor: 0xffb060,
      sunIntensity: 1.1,
      sunPosition: [-30, 20, 40],
      fillColor: 0x804080,
      fillIntensity: 0.35,
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
          { type: 'zaman-canavari', count: 3 },
          { type: 'zaman-canavari', count: 4 },
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
        intro: 'Gün batıyor. Zaman canavarları ve eleştirmenler beraber saldırıyor. Nefes — nefes — nefes.',
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
    description:
      'Bahçeden geçip salona giriyorsun. Kuzey duvarda "Hilal & Cihanser" yazıyor. Bu gün, senin günün.',
    worldSize: { width: 48, depth: 56, height: 12 },
    atmosphere: {
      ambientColor: 0xf0e6ff,
      ambientIntensity: 0.55,
      sunColor: 0xfff3d0,
      sunIntensity: 0.9,
      sunPosition: [28, 40, 18],
      fillColor: 0xa8c8ff,
      fillIntensity: 0.35,
      fogColor: 0xb8a8e0,
      fogNear: 30,
      fogFar: 100,
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
          { type: 'merakli-teyze', count: 3 },
          { type: 'merakli-teyze', count: 2 },
        ],
      },
      {
        index: 2,
        title: 'Beklentiler',
        intro: 'Salonda ısrarcı beklentiler. Sen çok daha güçlüsün.',
        clearMessage: 'Beklentileri dağıttın. Ama son perde geliyor.',
        totalEnemies: 12,
        batchInterval: 3.5,
        batches: [
          { type: 'merakli-teyze', count: 2 },
          { type: 'mukemmeliyetci-kuzen', count: 3 },
          { type: 'mukemmeliyetci-kuzen', count: 2 },
          { type: 'zaman-canavari', count: 2 },
          { type: 'mukemmeliyetci-kuzen', count: 3 },
        ],
      },
      {
        index: 3,
        title: 'Beklenti Gölgesi',
        intro:
          'Son dalga. Herkesin beklentisinden doğan büyük gölge geliyor. Ama bu gün, senin günün.',
        clearMessage: 'Onu bloklara ayırdın, Hilal. Şimdi dans zamanı.',
        totalEnemies: 14,
        batchInterval: 3,
        batches: [
          { type: 'zaman-canavari', count: 3 },
          { type: 'mukemmeliyetci-kuzen', count: 3 },
          { type: 'zaman-canavari', count: 3 },
          { type: 'merakli-teyze', count: 4 },
          { type: 'beklenti-golgesi', count: 1 },
        ],
        bossLevel: true,
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
