export type WeaponId = 'pistol' | 'rifle' | 'shield';

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
};

export const WEAPON_ORDER: WeaponId[] = ['pistol', 'rifle', 'shield'];
