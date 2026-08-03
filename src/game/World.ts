import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_STONE,
  BLOCKS,
  isSolidBlock,
  type BlockId,
} from '../data/blocks';
import { buildVoxelMeshes, type VoxelInstanceInput } from '../rendering/VoxelMesh';
import type { MapDefinition } from '../data/maps';
import { generateConcertHall } from './worldGen/concertHall';
import { generateLighthouse } from './worldGen/lighthouse';
import { generateWeddingHall } from './worldGen/weddingHall';
import type {
  GeneratorResult,
  SpawnRegion,
  WorldWriter,
  BannerSpec,
  HallDecorations,
  PropSpec,
  InteractableSpec,
} from './worldGen/types';

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  floorY: number;
  ceilY: number;
}

/**
 * Voxel arena driven by a MapDefinition. The active generator lays out blocks
 * for the chosen map (concert hall, lighthouse, wedding hall) and returns
 * player spawn + enemy spawn region + optional wall banner.
 */
export class World {
  readonly mapDef: MapDefinition;
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  readonly spawn: THREE.Vector3;
  readonly spawnFacing: number;
  readonly enemyRegion: SpawnRegion;
  readonly banner: { text: string; position: BannerSpec } | null;
  readonly decorations: HallDecorations | null;
  readonly props: PropSpec[];
  readonly interactables: InteractableSpec[];
  private readonly cells: Uint8Array;
  private group: THREE.Group | null = null;
  private meshes: THREE.InstancedMesh[] = [];

  constructor(mapDef: MapDefinition) {
    this.mapDef = mapDef;
    this.width = mapDef.worldSize.width;
    this.depth = mapDef.worldSize.depth;
    this.height = mapDef.worldSize.height;
    this.cells = new Uint8Array(this.width * this.depth * this.height);

    const writer: WorldWriter = {
      width: this.width,
      depth: this.depth,
      height: this.height,
      setBlock: (x, y, z, id) => this.setBlock(x, y, z, id),
      getBlock: (x, y, z) => this.getBlock(x, y, z),
    };

    const result = this.runGenerator(mapDef, writer);
    this.spawn = result.playerSpawn;
    this.spawnFacing = result.playerFacing;
    this.enemyRegion = result.enemySpawnRegion;
    this.banner = result.bannerText && result.bannerPosition
      ? { text: result.bannerText, position: result.bannerPosition }
      : null;
    this.decorations = result.decorations ?? null;
    this.props = result.props ?? [];
    this.interactables = result.interactables ?? [];
  }

  private runGenerator(mapDef: MapDefinition, writer: WorldWriter): GeneratorResult {
    switch (mapDef.id) {
      case 'concert-hall':
        return generateConcertHall(writer);
      case 'lighthouse':
        return generateLighthouse(writer);
      case 'wedding-hall':
        return generateWeddingHall(writer);
    }
  }

  private idx(x: number, y: number, z: number): number {
    return x + this.width * (z + this.depth * y);
  }

  private inBounds(x: number, y: number, z: number): boolean {
    return (
      x >= 0 &&
      x < this.width &&
      y >= 0 &&
      y < this.height &&
      z >= 0 &&
      z < this.depth
    );
  }

  getBlock(x: number, y: number, z: number): BlockId {
    if (!this.inBounds(x, y, z)) return BLOCK_STONE;
    return this.cells[this.idx(x, y, z)] as BlockId;
  }

  setBlock(x: number, y: number, z: number, id: BlockId): void {
    if (!this.inBounds(x, y, z)) return;
    this.cells[this.idx(x, y, z)] = id;
  }

  isSolidAt(x: number, y: number, z: number): boolean {
    return isSolidBlock(this.getBlock(x, y, z));
  }

  boxCollides(min: THREE.Vector3, max: THREE.Vector3): boolean {
    const x0 = Math.floor(min.x);
    const x1 = Math.floor(max.x - 1e-4);
    const y0 = Math.floor(min.y);
    const y1 = Math.floor(max.y - 1e-4);
    const z0 = Math.floor(min.z);
    const z1 = Math.floor(max.z - 1e-4);
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        for (let x = x0; x <= x1; x++) {
          if (this.isSolidAt(x, y, z)) return true;
        }
      }
    }
    return false;
  }

  bounds(): WorldBounds {
    return {
      minX: 1,
      maxX: this.width - 1,
      minZ: 1,
      maxZ: this.depth - 1,
      floorY: 1,
      ceilY: this.height - 1,
    };
  }

  playerSpawn(): THREE.Vector3 {
    return this.spawn.clone();
  }

  /**
   * AABB-aware ground spawn: rejects points where the enemy's full box would
   * overlap solids. This prevents wide bosses from spawning wedged in walls.
   */
  randomSpawnPoint(
    rand: () => number,
    awayFrom?: THREE.Vector3,
    minDist = 6,
    radius = 0.45,
    height = 1.8,
  ): THREE.Vector3 {
    const r = this.enemyRegion;
    const floorY = this.bounds().floorY;
    const inset = Math.ceil(radius) + 1;
    const minX = r.minX + inset;
    const maxX = r.maxX - inset;
    const minZ = r.minZ + inset;
    const maxZ = r.maxZ - inset;

    for (let tries = 0; tries < 96; tries++) {
      const x = minX + rand() * Math.max(0.01, maxX - minX);
      const z = minZ + rand() * Math.max(0.01, maxZ - minZ);
      const y = floorY;
      const min = new THREE.Vector3(x - radius, y, z - radius);
      const max = new THREE.Vector3(x + radius, y + height, z + radius);
      if (this.boxCollides(min, max)) continue;

      const floorMin = new THREE.Vector3(x - radius, y - 0.1, z - radius);
      const floorMax = new THREE.Vector3(x + radius, y, z + radius);
      if (!this.boxCollides(floorMin, floorMax)) continue;

      const p = new THREE.Vector3(x, y + 0.01, z);
      if (awayFrom && p.distanceTo(awayFrom) < minDist) continue;
      return p;
    }
    return new THREE.Vector3((r.minX + r.maxX) / 2, floorY + 0.01, (r.minZ + r.maxZ) / 2);
  }

  buildMesh(): THREE.Group {
    if (this.group) return this.group;
    const buckets = new Map<BlockId, Array<[number, number, number]>>();
    for (let y = 0; y < this.height; y++) {
      for (let z = 0; z < this.depth; z++) {
        for (let x = 0; x < this.width; x++) {
          const id = this.cells[this.idx(x, y, z)] as BlockId;
          if (id === BLOCK_AIR) continue;
          if (!this.isExposed(x, y, z)) continue;
          let arr = buckets.get(id);
          if (!arr) {
            arr = [];
            buckets.set(id, arr);
          }
          arr.push([x, y, z]);
        }
      }
    }
    const inputs: VoxelInstanceInput[] = [];
    for (const [blockId, positions] of buckets) {
      inputs.push({ blockId, positions });
    }
    const built = buildVoxelMeshes(inputs);
    this.group = built.group;
    this.meshes = built.meshes;
    return this.group;
  }

  disposeMesh(): void {
    if (!this.group) return;
    for (const mesh of this.meshes) {
      mesh.geometry.dispose();
      const mat = mesh.material as THREE.Material | THREE.Material[];
      if (Array.isArray(mat)) {
        for (const m of mat) m.dispose();
      } else {
        mat.dispose();
      }
      if (mesh.parent) mesh.parent.remove(mesh);
    }
    if (this.group.parent) this.group.parent.remove(this.group);
    this.meshes = [];
    this.group = null;
  }

  private isExposed(x: number, y: number, z: number): boolean {
    const neighbors: Array<[number, number, number]> = [
      [x + 1, y, z],
      [x - 1, y, z],
      [x, y + 1, z],
      [x, y - 1, z],
      [x, y, z + 1],
      [x, y, z - 1],
    ];
    for (const [nx, ny, nz] of neighbors) {
      if (!this.inBounds(nx, ny, nz)) return true;
      const id = this.cells[this.idx(nx, ny, nz)] as BlockId;
      if (id === BLOCK_AIR) return true;
      if (BLOCKS[id].opacity < 1) return true;
    }
    return false;
  }
}
