export type EnemyType =
  | 'merakli-teyze'
  | 'mukemmeliyetci-kuzen'
  | 'zaman-canavari'
  | 'fotograf-flasoru'
  | 'beklenti-golgesi'
  | 'maymun'
  | 'inek'
  | 'kertenkele';

export type EnemyBehavior = 'chase' | 'stalker' | 'dasher' | 'floater' | 'flasher' | 'wander';

export interface EnemyStats {
  type: EnemyType;
  displayName: string;
  hp: number;
  speed: number;
  contactDamage: number;
  radius: number;
  height: number;
  color: number;
  accentColor: number;
  scoreValue: number;
  anxietyReward: number;
  contactAnxietyPerSecond: number;
  isBoss?: boolean;
  behavior: EnemyBehavior;
}

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  'merakli-teyze': {
    type: 'merakli-teyze',
    displayName: 'Meraklı Teyze',
    hp: 2,
    speed: 1.4,
    contactDamage: 6,
    radius: 0.45,
    height: 1.9,
    color: 0x4a1d5c,
    accentColor: 0xc9a3b3,
    scoreValue: 50,
    anxietyReward: 6,
    contactAnxietyPerSecond: 14,
    behavior: 'chase',
  },
  'mukemmeliyetci-kuzen': {
    type: 'mukemmeliyetci-kuzen',
    displayName: 'Mükemmeliyetçi Kuzen',
    hp: 3,
    speed: 2.2,
    contactDamage: 8,
    radius: 0.45,
    height: 2.1,
    color: 0x0d2b3a,
    accentColor: 0x88b0c0,
    scoreValue: 80,
    anxietyReward: 8,
    contactAnxietyPerSecond: 18,
    behavior: 'stalker',
  },
  'zaman-canavari': {
    type: 'zaman-canavari',
    displayName: 'Zaman Canavarı',
    hp: 2,
    speed: 2.4,
    contactDamage: 10,
    radius: 0.4,
    height: 1.7,
    color: 0xd5c7a8,
    accentColor: 0x8b3a1a,
    scoreValue: 120,
    anxietyReward: 10,
    contactAnxietyPerSecond: 22,
    behavior: 'dasher',
  },
  'fotograf-flasoru': {
    type: 'fotograf-flasoru',
    displayName: 'Fotoğraf Flaşörü',
    hp: 2,
    speed: 2.0,
    contactDamage: 4,
    radius: 0.42,
    height: 1.85,
    color: 0x2a2a35,
    accentColor: 0xfff8e0,
    scoreValue: 90,
    anxietyReward: 9,
    contactAnxietyPerSecond: 10,
    behavior: 'flasher',
  },
  'beklenti-golgesi': {
    type: 'beklenti-golgesi',
    displayName: 'Beklenti Gölgesi',
    hp: 45,
    speed: 1.9,
    contactDamage: 22,
    radius: 0.85,
    height: 3.2,
    color: 0x6b4f0a,
    accentColor: 0xf5c542,
    scoreValue: 1000,
    anxietyReward: 40,
    contactAnxietyPerSecond: 32,
    isBoss: true,
    behavior: 'floater',
  },
  maymun: {
    type: 'maymun',
    displayName: 'Maymun',
    hp: 2,
    speed: 2.0,
    contactDamage: 5,
    radius: 0.35,
    height: 1.1,
    color: 0x8b5a2b,
    accentColor: 0xd4a574,
    scoreValue: 40,
    anxietyReward: 5,
    contactAnxietyPerSecond: 16,
    behavior: 'chase',
  },
  inek: {
    type: 'inek',
    displayName: 'İnek',
    hp: 4,
    speed: 0.6,
    contactDamage: 0,
    radius: 0.55,
    height: 1.35,
    color: 0xf5f0e6,
    accentColor: 0x5c3a1e,
    scoreValue: 25,
    anxietyReward: 2,
    contactAnxietyPerSecond: 0,
    behavior: 'wander',
  },
  kertenkele: {
    type: 'kertenkele',
    displayName: 'Kertenkele',
    hp: 1,
    speed: 1.8,
    contactDamage: 0,
    radius: 0.22,
    height: 0.35,
    color: 0x4a8f3a,
    accentColor: 0x8fd96a,
    scoreValue: 15,
    anxietyReward: 1,
    contactAnxietyPerSecond: 0,
    behavior: 'wander',
  },
};
