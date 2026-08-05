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
import { generateBali } from './worldGen/bali';
import { generateConcertHall } from './worldGen/concertHall';
import { generateDubai } from './worldGen/dubai';
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
  NpcSpec,
  CollisionBox,
  FaunaSpawnSpec,
  TreasureChestSpec,
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
 * for the chosen map and returns player spawn + enemy spawn region + extras.
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
  readonly npcs: NpcSpec[];
  readonly interactables: InteractableSpec[];
  readonly collisionBoxes: CollisionBox[];
  readonly ambientFauna: FaunaSpawnSpec[];
  readonly treasureChest: TreasureChestSpec | null;
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
    this.npcs = result.npcs ?? [];
    this.interactables = result.interactables ?? [];
    this.collisionBoxes = result.collisionBoxes ?? [];
    this.ambientFauna = result.ambientFauna ?? [];
    this.treasureChest = result.treasureChest ?? null;
  }

  private runGenerator(mapDef: MapDefinition, writer: WorldWriter): GeneratorResult {
    switch (mapDef.id) {
      case 'concert-hall':
        return generateConcertHall(writer);
      case 'lighthouse':
        return generateLighthouse(writer);
      case 'wedding-hall':
        return generateWeddingHall(writer);
      case 'bali':
        return generateBali(writer);
      case 'dubai':
        return generateDubai(writer);
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
    for (const box of this.collisionBoxes) {
      if (
        min.x < box.maxX &&
        max.x > box.minX &&
        min.y < box.maxY &&
        max.y > box.minY &&
        min.z < box.maxZ &&
        max.z > box.minZ
      ) {
        return true;
      }
    }
    return false;
  }

  /**
   * Vehicle body overlap — ignores floor slabs under each column so the car
   * can drive off raised asphalt onto lower sand without snagging the road lip.
   */
  vehicleBodyCollides(
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    bodyMinY: number,
    bodyMaxY: number,
    groundClearance = 0.06,
  ): boolean {
    const x0 = Math.floor(minX);
    const x1 = Math.floor(maxX - 1e-4);
    const z0 = Math.floor(minZ);
    const z1 = Math.floor(maxZ - 1e-4);
    const yEnd = Math.floor(bodyMaxY - 1e-4);

    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        let topSolid = -1;
        for (let y = this.height - 1; y >= 0; y--) {
          if (this.isSolidAt(x, y, z)) {
            topSolid = y;
            break;
          }
        }
        if (topSolid < 0) continue;

        const checkFrom = Math.max(bodyMinY, topSolid + 1 + groundClearance);
        for (let y = Math.floor(checkFrom); y <= yEnd; y++) {
          if (this.isSolidAt(x, y, z)) return true;
        }
      }
    }

    const min = new THREE.Vector3(minX, bodyMinY, minZ);
    const max = new THREE.Vector3(maxX, bodyMaxY, maxZ);
    for (const box of this.collisionBoxes) {
      if (
        min.x < box.maxX &&
        max.x > box.minX &&
        min.y < box.maxY &&
        max.y > box.minY &&
        min.z < box.maxZ &&
        max.z > box.minZ
      ) {
        return true;
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
   * Find a clear standing pose near (x, z): feet on the top solid surface,
   * body AABB free of solids. Returns null if nothing nearby works.
   */
  resolveStandingPoint(
    x: number,
    z: number,
    radius: number,
    height: number,
    searchRadius = 8,
  ): THREE.Vector3 | null {
    const tryAt = (px: number, pz: number): THREE.Vector3 | null => {
      const fx = Math.floor(px);
      const fz = Math.floor(pz);
      let topSolid = -1;
      for (let y = this.height - 1; y >= 0; y--) {
        if (this.isSolidAt(fx, y, fz)) {
          topSolid = y;
          break;
        }
      }
      if (topSolid < 0) return null;

      const standY = topSolid + 1.01;
      const min = new THREE.Vector3(px - radius, standY, pz - radius);
      const max = new THREE.Vector3(px + radius, standY + height, pz + radius);
      if (this.boxCollides(min, max)) return null;

      // Need solid ground under the feet
      const floorMin = new THREE.Vector3(px - radius, topSolid, pz - radius);
      const floorMax = new THREE.Vector3(px + radius, standY, pz + radius);
      if (!this.boxCollides(floorMin, floorMax)) return null;

      return new THREE.Vector3(px, standY, pz);
    };

    const direct = tryAt(x, z);
    if (direct) return direct;

    for (let r = 1; r <= searchRadius; r++) {
      for (let dz = -r; dz <= r; dz++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
          const found = tryAt(x + dx, z + dz);
          if (found) return found;
        }
      }
    }
    return null;
  }

  /**
   * AABB-aware ground spawn: rejects points where the enemy's full box would
   * overlap solids. `avoid` can be one or many anchors; spawn must stay
   * at least `minDist` from each. Falls back to the farthest valid land tile.
   */
  randomSpawnPoint(
    rand: () => number,
    avoid?: THREE.Vector3 | THREE.Vector3[],
    minDist = 8,
    radius = 0.45,
    height = 1.8,
  ): THREE.Vector3 {
    const anchors = avoid
      ? Array.isArray(avoid)
        ? avoid
        : [avoid]
      : [];
    const r = this.enemyRegion;
    const floorY = this.bounds().floorY;
    const standY = floorY + 1.01;
    const inset = Math.ceil(radius) + 1;
    const minX = r.minX + inset;
    const maxX = r.maxX - inset;
    const minZ = r.minZ + inset;
    const maxZ = r.maxZ - inset;

    const isValid = (x: number, z: number): boolean => {
      const min = new THREE.Vector3(x - radius, standY, z - radius);
      const max = new THREE.Vector3(x + radius, standY + height, z + radius);
      if (this.boxCollides(min, max)) return false;
      const fx = Math.floor(x);
      const fz = Math.floor(z);
      if (!this.isSolidAt(fx, floorY, fz)) return false;
      const floorMin = new THREE.Vector3(x - radius, floorY, z - radius);
      const floorMax = new THREE.Vector3(x + radius, standY, z + radius);
      if (!this.boxCollides(floorMin, floorMax)) return false;
      const p = new THREE.Vector3(x, standY, z);
      for (const a of anchors) {
        if (p.distanceTo(a) < minDist) return false;
      }
      return true;
    };

    for (let tries = 0; tries < 128; tries++) {
      const x = minX + rand() * Math.max(0.01, maxX - minX);
      const z = minZ + rand() * Math.max(0.01, maxZ - minZ);
      if (isValid(x, z)) return new THREE.Vector3(x, standY, z);
    }

    let best: THREE.Vector3 | null = null;
    let bestDist = -1;
    for (let gz = Math.floor(minZ); gz <= Math.ceil(maxZ); gz++) {
      for (let gx = Math.floor(minX); gx <= Math.ceil(maxX); gx++) {
        const x = gx + 0.5;
        const z = gz + 0.5;
        if (!isValid(x, z)) continue;
        const p = new THREE.Vector3(x, standY, z);
        let nearest = Infinity;
        for (const a of anchors) nearest = Math.min(nearest, p.distanceTo(a));
        if (nearest > bestDist) {
          bestDist = nearest;
          best = p;
        }
      }
    }
    if (best) return best;

    return new THREE.Vector3((r.minX + r.maxX) / 2, standY, (r.minZ + r.maxZ) / 2);
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
