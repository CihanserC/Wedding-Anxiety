export type WeaponId = 'pistol' | 'rifle' | 'shield' | 'happiness' | 'lightsaber';

export interface WeaponDefinition {
  id: WeaponId;
  displayName: string;
  damage: number;
  cooldown: number;
  range: number;
  pellets: number;
  spread: number;
  tracerColor: number;
  muzzleColor: number;
  muzzleSize: number;
  recoil: number;
  /** Star Wars-style traveling bolt instead of instant tracer line */
  boltStyle?: boolean;
}

export const WEAPONS: Record<WeaponId, WeaponDefinition> = {
  pistol: {
    id: 'pistol',
    displayName: 'Gülümseme Tabancası',
    damage: 1,
    cooldown: 0.22,
    range: 60,
    pellets: 1,
    spread: 0,
    tracerColor: 0xfff4a0,
    muzzleColor: 0xfff2b0,
    muzzleSize: 0.08,
    recoil: 0.05,
  },
  rifle: {
    id: 'rifle',
    displayName: 'Sabır Tüfeği',
    damage: 1,
    cooldown: 0.72,
    range: 48,
    pellets: 5,
    spread: 0.14,
    tracerColor: 0xff5030,
    muzzleColor: 0xffb060,
    muzzleSize: 0.14,
    recoil: 0.16,
  },
  shield: {
    id: 'shield',
    displayName: 'Enerji Kalkanı',
    damage: 2,
    cooldown: 0.55,
    range: 12,
    pellets: 1,
    spread: 0,
    tracerColor: 0x60d0ff,
    muzzleColor: 0xa0e8ff,
    muzzleSize: 0.18,
    recoil: 0.08,
  },
  happiness: {
    id: 'happiness',
    displayName: 'Mutluluk Işını',
    damage: 1,
    cooldown: 0.28,
    range: 55,
    pellets: 1,
    spread: 0,
    tracerColor: 0xff2020,
    muzzleColor: 0xff6060,
    muzzleSize: 0.1,
    recoil: 0.07,
    boltStyle: true,
  },
  /** Cheat-only — not in WEAPON_ORDER */
  lightsaber: {
    id: 'lightsaber',
    displayName: 'Kırmızı Işın Kılıcı',
    damage: 4,
    cooldown: 0.38,
    range: 11,
    pellets: 1,
    spread: 0,
    tracerColor: 0xff2020,
    muzzleColor: 0xff4040,
    muzzleSize: 0.06,
    recoil: 0,
  },
};

export const WEAPON_ORDER: WeaponId[] = ['pistol', 'rifle', 'shield', 'happiness'];
