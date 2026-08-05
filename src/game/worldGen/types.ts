import * as THREE from 'three';
import type { BlockId } from '../../data/blocks';
import type { EnemyType } from '../../data/enemies';
import type { NpcType } from '../../data/npcs';

export interface WorldWriter {
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  setBlock(x: number, y: number, z: number, id: BlockId): void;
  getBlock(x: number, y: number, z: number): BlockId;
}

export interface BannerSpec {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  width: number;
  height: number;
  style?: 'classic' | 'neon';
}

export interface SpawnRegion {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface StatueSpec {
  type: EnemyType;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  scale?: number;
}

export interface PortraitSpec {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  width: number;
  height: number;
  names: string;
}

export type NpcPose = 'standing' | 'sitting';

export interface NpcSpec {
  type: NpcType;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  pose?: NpcPose;
  /** Slow idle wander near spawn (Dubai locals). */
  wander?: boolean;
  wanderRadius?: number;
}

export interface HallDecorations {
  statues: StatueSpec[];
  portrait?: PortraitSpec;
}

export type PropKind =
  | 'grand-piano'
  | 'cello'
  | 'violin'
  | 'music-stand'
  | 'sun'
  | 'cat'
  | 'lighthouse'
  | 'car'
  | 'cake-table'
  | 'wedding-arch'
  | 'wedding-steps'
  | 'balloon-cluster'
  | 'suzy-cat'
  | 'palm-tree'
  | 'broadleaf-tree'
  | 'tropical-bush'
  | 'banana-plant'
  | 'fern'
  | 'treasure-chest'
  | 'boat'
  | 'king-bed'
  | 'sofa'
  | 'plasma-tv'
  | 'dining-chair'
  | 'dining-table'
  | 'lamborghini';

export interface PropSpec {
  kind: PropKind;
  x: number;
  y: number;
  z: number;
  rotationY?: number;
  scale?: number;
}

export interface InteractableSpec {
  kind:
    | 'cat'
    | 'piano'
    | 'altar'
    | 'cake'
    | 'suzy-cat'
    | 'bride-chat'
    | 'groom-chat'
    | 'camel-chat'
    | 'arab-chat'
    | 'treasure-chest'
    | 'lamborghini-drive'
    | 'plasma-tv';
  x: number;
  y: number;
  z: number;
  radius?: number;
  /** Optional display name override for local Dubai chatter NPCs. */
  speakerName?: string;
}

export interface TreasureChestSpec {
  x: number;
  y: number;
  z: number;
  rotationY?: number;
}

export interface CollisionBox {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

export interface FaunaSpawnSpec {
  type: 'inek' | 'kertenkele';
  x: number;
  y: number;
  z: number;
}

export interface GeneratorResult {
  playerSpawn: THREE.Vector3;
  playerFacing: number;
  enemySpawnRegion: SpawnRegion;
  bannerText?: string;
  bannerPosition?: BannerSpec;
  decorations?: HallDecorations;
  props?: PropSpec[];
  npcs?: NpcSpec[];
  interactables?: InteractableSpec[];
  collisionBoxes?: CollisionBox[];
  ambientFauna?: FaunaSpawnSpec[];
  /** Hidden after Bali clear — spawned in epilogue among rocks. */
  treasureChest?: TreasureChestSpec;
}
