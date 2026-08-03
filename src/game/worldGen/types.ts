import * as THREE from 'three';
import type { BlockId } from '../../data/blocks';
import type { EnemyType } from '../../data/enemies';

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

export interface HallDecorations {
  statues: StatueSpec[];
  portrait?: PortraitSpec;
}

export type PropKind = 'grand-piano' | 'cello' | 'violin' | 'music-stand' | 'sun' | 'cat';

export interface PropSpec {
  kind: PropKind;
  x: number;
  y: number;
  z: number;
  rotationY?: number;
  scale?: number;
}

export interface InteractableSpec {
  kind: 'cat' | 'piano';
  x: number;
  y: number;
  z: number;
  radius?: number;
}

export interface GeneratorResult {
  playerSpawn: THREE.Vector3;
  playerFacing: number;
  enemySpawnRegion: SpawnRegion;
  bannerText?: string;
  bannerPosition?: BannerSpec;
  decorations?: HallDecorations;
  props?: PropSpec[];
  interactables?: InteractableSpec[];
}
