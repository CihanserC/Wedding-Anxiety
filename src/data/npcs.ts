export type NpcType = 'bride' | 'groom';

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
};
