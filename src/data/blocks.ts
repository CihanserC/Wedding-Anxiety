export type BlockId =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17;

export interface BlockDefinition {
  id: BlockId;
  name: string;
  color: number;
  solid: boolean;
  opacity: number;
}

export const BLOCK_AIR: BlockId = 0;
export const BLOCK_GRASS: BlockId = 1;
export const BLOCK_STONE: BlockId = 2;
export const BLOCK_WOOD: BlockId = 3;
export const BLOCK_FLOWER: BlockId = 4;
export const BLOCK_CARPET: BlockId = 5;
export const BLOCK_GLASS: BlockId = 6;
export const BLOCK_GOLD: BlockId = 7;
export const BLOCK_PATH: BlockId = 8;
export const BLOCK_HEDGE: BlockId = 9;
export const BLOCK_MARBLE: BlockId = 10;
export const BLOCK_CURTAIN: BlockId = 11;
export const BLOCK_SEAT: BlockId = 12;
export const BLOCK_WATER: BlockId = 13;
export const BLOCK_ROCK: BlockId = 14;
export const BLOCK_SAND: BlockId = 15;
export const BLOCK_LIGHT: BlockId = 16;
export const BLOCK_ASPHALT: BlockId = 17;

export const BLOCKS: Record<BlockId, BlockDefinition> = {
  0: { id: 0, name: 'air', color: 0x000000, solid: false, opacity: 0 },
  1: { id: 1, name: 'grass', color: 0x5aa845, solid: true, opacity: 1 },
  2: { id: 2, name: 'stone', color: 0x9e9aa8, solid: true, opacity: 1 },
  3: { id: 3, name: 'wood', color: 0x8a5a3b, solid: true, opacity: 1 },
  4: { id: 4, name: 'flower', color: 0xff6fa8, solid: false, opacity: 1 },
  5: { id: 5, name: 'carpet', color: 0xb43a4e, solid: true, opacity: 1 },
  6: { id: 6, name: 'glass', color: 0xbfe6ff, solid: true, opacity: 0.35 },
  7: { id: 7, name: 'gold', color: 0xf5c542, solid: true, opacity: 1 },
  8: { id: 8, name: 'path', color: 0xc8bfa8, solid: true, opacity: 1 },
  9: { id: 9, name: 'hedge', color: 0x2f5f2f, solid: true, opacity: 1 },
  10: { id: 10, name: 'marble', color: 0xf1e6d0, solid: true, opacity: 1 },
  11: { id: 11, name: 'curtain', color: 0x6a1220, solid: true, opacity: 1 },
  12: { id: 12, name: 'seat', color: 0x5c1a2a, solid: true, opacity: 1 },
  13: { id: 13, name: 'water', color: 0x2a70b0, solid: false, opacity: 0.55 },
  14: { id: 14, name: 'rock', color: 0x5a5560, solid: true, opacity: 1 },
  15: { id: 15, name: 'sand', color: 0xe4cf9a, solid: true, opacity: 1 },
  16: { id: 16, name: 'light', color: 0xfff2a0, solid: true, opacity: 1 },
  17: { id: 17, name: 'asphalt', color: 0x3a3a40, solid: true, opacity: 1 },
};

export function isSolidBlock(id: BlockId): boolean {
  return BLOCKS[id].solid;
}

export function getBlockColor(id: BlockId): number {
  return BLOCKS[id].color;
}
