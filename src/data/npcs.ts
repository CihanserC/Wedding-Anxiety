export type NpcType =
  | 'bride'
  | 'groom'
  | 'camel'
  | 'arab-man'
  | 'arab-woman'
  | 'conductor'
  | 'pianist'
  | 'cellist'
  | 'violinist'
  | 'guest-man'
  | 'guest-woman'
  | 'alien-peaceful'
  | 'darth-vader'
  | 'master-yoda'
  | 'frog';

export interface NpcStats {
  type: NpcType;
  displayName: string;
  height: number;
  radius: number;
}

export const NPC_STATS: Record<NpcType, NpcStats> = {
  bride: {
    type: 'bride',
    displayName: 'Hilal',
    height: 1.72,
    radius: 0.32,
  },
  groom: {
    type: 'groom',
    displayName: 'Cihanser',
    height: 1.78,
    radius: 0.3,
  },
  camel: {
    type: 'camel',
    displayName: 'Deve',
    height: 2.1,
    radius: 0.55,
  },
  'arab-man': {
    type: 'arab-man',
    displayName: 'Waheed',
    height: 1.76,
    radius: 0.32,
  },
  'arab-woman': {
    type: 'arab-woman',
    displayName: 'Fatima',
    height: 1.68,
    radius: 0.3,
  },
  conductor: {
    type: 'conductor',
    displayName: 'Şef',
    height: 1.78,
    radius: 0.3,
  },
  pianist: {
    type: 'pianist',
    displayName: 'Piyanist',
    height: 1.45,
    radius: 0.3,
  },
  cellist: {
    type: 'cellist',
    displayName: 'Çellist',
    height: 1.5,
    radius: 0.32,
  },
  violinist: {
    type: 'violinist',
    displayName: 'Kemancı',
    height: 1.68,
    radius: 0.28,
  },
  'guest-man': {
    type: 'guest-man',
    displayName: 'Davetli',
    height: 1.68,
    radius: 0.28,
  },
  'guest-woman': {
    type: 'guest-woman',
    displayName: 'Davetli',
    height: 1.62,
    radius: 0.28,
  },
  'alien-peaceful': {
    type: 'alien-peaceful',
    displayName: 'Uzaylı',
    height: 1.55,
    radius: 0.35,
  },
  'darth-vader': {
    type: 'darth-vader',
    displayName: 'Darth Vader',
    height: 1.95,
    radius: 0.4,
  },
  'master-yoda': {
    type: 'master-yoda',
    displayName: 'Usta Yoda',
    height: 0.95,
    radius: 0.28,
  },
  frog: {
    type: 'frog',
    displayName: 'Kurbağa',
    height: 0.55,
    radius: 0.28,
  },
};
