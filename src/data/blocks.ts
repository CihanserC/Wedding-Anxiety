export type BlockId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

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

export const BLOCKS: Record<BlockId, BlockDefinition> = {
  0: { id: 0, name: 'air', color: 0x000000, solid: false, opacity: 0 },
  1: { id: 1, name: 'grass', color: 0x5aa845, solid: true, opacity: 1 },
  2: { id: 2, name: 'stone', color: 0x9e9aa8, solid: true, opacity: 1 },
  3: { id: 3, name: 'wood', color: 0x8a5a3b, solid: true, opacity: 1 },
  4: { id: 4, name: 'flower', color: 0xff6fa8, solid: false, opacity: 1 },
  5: { id: 5, name: 'carpet', color: 0xb43a4e, solid: false, opacity: 1 },
  6: { id: 6, name: 'glass', color: 0xbfe6ff, solid: true, opacity: 0.35 },
  7: { id: 7, name: 'gold', color: 0xf5c542, solid: true, opacity: 1 },
};

export function isSolidBlock(id: BlockId): boolean {
  return BLOCKS[id].solid;
}

export function getBlockColor(id: BlockId): number {
  return BLOCKS[id].color;
}
