export type EnemyType =
  | 'merakli-teyze'
  | 'mukemmeliyetci-kuzen'
  | 'zaman-canavari'
  | 'beklenti-golgesi';

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
}

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  'merakli-teyze': {
    type: 'merakli-teyze',
    displayName: 'Meraklı Teyze',
    hp: 2,
    speed: 1.4,
    contactDamage: 6,
    radius: 0.45,
    height: 1.7,
    color: 0xc078d8,
    accentColor: 0xffd1e8,
    scoreValue: 50,
    anxietyReward: 6,
    contactAnxietyPerSecond: 14,
  },
  'mukemmeliyetci-kuzen': {
    type: 'mukemmeliyetci-kuzen',
    displayName: 'Mükemmeliyetçi Kuzen',
    hp: 3,
    speed: 2.2,
    contactDamage: 8,
    radius: 0.45,
    height: 1.8,
    color: 0x38c8c0,
    accentColor: 0xe8fff8,
    scoreValue: 80,
    anxietyReward: 8,
    contactAnxietyPerSecond: 18,
  },
  'zaman-canavari': {
    type: 'zaman-canavari',
    displayName: 'Zaman Canavarı',
    hp: 2,
    speed: 3.6,
    contactDamage: 10,
    radius: 0.4,
    height: 1.5,
    color: 0xff7a3d,
    accentColor: 0xffe28a,
    scoreValue: 120,
    anxietyReward: 10,
    contactAnxietyPerSecond: 22,
  },
  'beklenti-golgesi': {
    type: 'beklenti-golgesi',
    displayName: 'Beklenti Gölgesi',
    hp: 45,
    speed: 1.9,
    contactDamage: 22,
    radius: 0.9,
    height: 3.2,
    color: 0x2c1a52,
    accentColor: 0x7a4bd6,
    scoreValue: 1000,
    anxietyReward: 40,
    contactAnxietyPerSecond: 32,
    isBoss: true,
  },
};
