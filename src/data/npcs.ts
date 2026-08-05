export type NpcType = 'bride' | 'groom' | 'camel' | 'arab-man' | 'arab-woman';

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
};
