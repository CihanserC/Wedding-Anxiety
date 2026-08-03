import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_CARPET,
  BLOCK_FLOWER,
  BLOCK_GLASS,
  BLOCK_GOLD,
  BLOCK_GRASS,
  BLOCK_HEDGE,
  BLOCK_PATH,
  BLOCK_STONE,
  BLOCK_WOOD,
  BLOCKS,
  isSolidBlock,
  type BlockId,
} from '../data/blocks';
import { buildVoxelMeshes, type VoxelInstanceInput } from '../rendering/VoxelMesh';

export interface WorldBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  floorY: number;
  ceilY: number;
}

export interface HallRegion {
  x0: number;
  z0: number;
  width: number;
  depth: number;
  wallHeight: number;
  altarZ: number;
  northWallZ: number;
  entranceZ: number;
}

/**
 * Voxel arena. Uses a flat 3D array indexed as
 * [x + width * (z + depth * y)]. Positions are 1-block cells; render
 * meshes are centered at (x+0.5, y+0.5, z+0.5).
 *
 * Layout: garden in the south (low Z), open entrance, then the wedding hall
 * to the north (high Z). The hall region is offset inside the larger world.
 */
export class World {
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  readonly hall: HallRegion;
  private readonly cells: Uint8Array;
  private group: THREE.Group | null = null;

  constructor(width = 48, depth = 56, height = 10) {
    this.width = width;
    this.depth = depth;
    this.height = height;
    this.cells = new Uint8Array(width * depth * height);

    const hallWidth = 32;
    const hallDepth = 32;
    const hallX0 = Math.floor((width - hallWidth) / 2);
    const hallZ0 = depth - hallDepth;
    this.hall = {
      x0: hallX0,
      z0: hallZ0,
      width: hallWidth,
      depth: hallDepth,
      wallHeight: 5,
      altarZ: hallZ0 + hallDepth - 6,
      northWallZ: hallZ0 + hallDepth - 3,
      entranceZ: hallZ0 + 2,
    };

    this.generateWorld();
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

  /** Initial player spawn: middle of the garden path facing the hall. */
  playerSpawn(): THREE.Vector3 {
    const gardenPathZ = Math.floor(this.hall.z0 * 0.35);
    return new THREE.Vector3(
      this.width * 0.5,
      this.bounds().floorY + 0.01,
      gardenPathZ + 0.5,
    );
  }

  /** Enemies spawn inside the hall interior only. */
  randomSpawnPoint(rand: () => number, awayFrom?: THREE.Vector3, minDist = 6): THREE.Vector3 {
    const h = this.hall;
    const minX = h.x0 + 3;
    const maxX = h.x0 + h.width - 4;
    const minZ = h.z0 + 3;
    const maxZ = h.z0 + h.depth - 4;
    const y = this.bounds().floorY;
    for (let tries = 0; tries < 64; tries++) {
      const x = Math.floor(minX + rand() * (maxX - minX));
      const z = Math.floor(minZ + rand() * (maxZ - minZ));
      if (this.isSolidAt(x, y, z)) continue;
      if (this.isSolidAt(x, y + 1, z)) continue;
      const p = new THREE.Vector3(x + 0.5, y, z + 0.5);
      if (awayFrom && p.distanceTo(awayFrom) < minDist) continue;
      return p;
    }
    return new THREE.Vector3(h.x0 + h.width * 0.5, y, h.z0 + h.depth * 0.5);
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
    return this.group;
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

  private generateWorld(): void {
    this.generateGround();
    this.generateGarden();
    this.generateWeddingHall();
  }

  private generateGround(): void {
    for (let z = 0; z < this.depth; z++) {
      for (let x = 0; x < this.width; x++) {
        this.setBlock(x, 0, z, BLOCK_GRASS);
      }
    }
  }

  private generateGarden(): void {
    const gardenZMax = this.hall.z0 - 1;
    const centerX = Math.floor(this.width / 2);

    for (let z = 0; z <= gardenZMax; z++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setBlock(centerX + dx, 0, z, BLOCK_PATH);
      }
    }

    const hedgeInsetX = 3;
    for (let z = 0; z <= gardenZMax - 1; z++) {
      this.setBlock(centerX - hedgeInsetX, 1, z, BLOCK_HEDGE);
      this.setBlock(centerX + hedgeInsetX, 1, z, BLOCK_HEDGE);
    }

    const outerHedgeX = Math.floor(this.width / 2) - 10;
    for (let z = 1; z <= gardenZMax - 1; z += 2) {
      this.setBlock(outerHedgeX, 1, z, BLOCK_HEDGE);
      this.setBlock(this.width - 1 - outerHedgeX, 1, z, BLOCK_HEDGE);
    }

    const flowerBeds: Array<[number, number]> = [
      [centerX - 6, 4],
      [centerX + 6, 4],
      [centerX - 6, 10],
      [centerX + 6, 10],
      [centerX - 8, 7],
      [centerX + 8, 7],
    ];
    for (const [fx, fz] of flowerBeds) {
      if (fz > gardenZMax) continue;
      this.setBlock(fx, 1, fz, BLOCK_FLOWER);
      this.setBlock(fx - 1, 1, fz, BLOCK_FLOWER);
      this.setBlock(fx + 1, 1, fz, BLOCK_FLOWER);
      this.setBlock(fx, 1, fz - 1, BLOCK_FLOWER);
      this.setBlock(fx, 1, fz + 1, BLOCK_FLOWER);
    }

    const fountainX = centerX;
    const fountainZ = Math.floor(gardenZMax * 0.65);
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
          this.setBlock(fountainX + dx, 1, fountainZ + dz, BLOCK_STONE);
        }
      }
    }
    this.setBlock(fountainX, 2, fountainZ, BLOCK_GLASS);
    this.setBlock(fountainX, 3, fountainZ, BLOCK_GLASS);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (dx === 0 && dz === 0) continue;
        this.setBlock(fountainX + dx, 2, fountainZ + dz, BLOCK_GLASS);
      }
    }

    for (let dz = -3; dz <= 3; dz++) {
      if (dz === 0) continue;
      const z = fountainZ + dz;
      if (z < 0 || z > gardenZMax) continue;
      for (let dx = -2; dx <= 2; dx++) {
        this.setBlock(centerX + dx, 0, z, BLOCK_PATH);
      }
    }
  }

  private generateWeddingHall(): void {
    const h = this.hall;
    const W = h.width;
    const D = h.depth;
    const x0 = h.x0;
    const z0 = h.z0;

    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const border = x < 2 || x >= W - 2 || z < 2 || z >= D - 2;
        if (!border) {
          this.setBlock(x0 + x, 0, z0 + z, BLOCK_STONE);
        }
      }
    }

    const centerZLow = Math.floor(D * 0.2);
    const centerZHigh = Math.floor(D * 0.9);
    for (let z = centerZLow; z < centerZHigh; z++) {
      for (let dx = -2; dx < 2; dx++) {
        this.setBlock(x0 + Math.floor(W / 2) + dx, 0, z0 + z, BLOCK_CARPET);
      }
    }

    const carpetToGardenStart = 0;
    for (let z = carpetToGardenStart; z < centerZLow; z++) {
      for (let dx = -2; dx < 2; dx++) {
        this.setBlock(x0 + Math.floor(W / 2) + dx, 0, z0 + z, BLOCK_CARPET);
      }
    }

    const wallHeight = h.wallHeight;
    for (let y = 1; y <= wallHeight; y++) {
      for (let x = 2; x < W - 2; x++) {
        const doorZone = Math.abs(x - Math.floor(W / 2)) <= 2 && y <= 3;
        if (!doorZone) this.setBlock(x0 + x, y, z0 + 2, BLOCK_STONE);
        this.setBlock(x0 + x, y, z0 + D - 3, BLOCK_STONE);
      }
      for (let z = 2; z < D - 2; z++) {
        this.setBlock(x0 + 2, y, z0 + z, BLOCK_STONE);
        this.setBlock(x0 + W - 3, y, z0 + z, BLOCK_STONE);
      }
    }

    for (let y = 2; y <= 3; y++) {
      for (let x = 5; x < W - 5; x += 4) {
        if (Math.abs(x - Math.floor(W / 2)) <= 2) continue;
        this.setBlock(x0 + x, y, z0 + 2, BLOCK_GLASS);
        this.setBlock(x0 + x, y, z0 + D - 3, BLOCK_GLASS);
      }
      for (let z = 5; z < D - 5; z += 4) {
        this.setBlock(x0 + 2, y, z0 + z, BLOCK_GLASS);
        this.setBlock(x0 + W - 3, y, z0 + z, BLOCK_GLASS);
      }
    }

    const altarLocalZ = D - 6;
    for (let x = W / 2 - 3; x < W / 2 + 3; x++) {
      this.setBlock(x0 + Math.floor(x), 1, z0 + altarLocalZ, BLOCK_GOLD);
      this.setBlock(x0 + Math.floor(x), 1, z0 + altarLocalZ + 1, BLOCK_GOLD);
    }
    for (let x = W / 2 - 2; x < W / 2 + 2; x++) {
      this.setBlock(x0 + Math.floor(x), 2, z0 + altarLocalZ, BLOCK_GOLD);
    }
    this.setBlock(x0 + Math.floor(W / 2 - 2), 3, z0 + altarLocalZ, BLOCK_GOLD);
    this.setBlock(x0 + Math.floor(W / 2 + 1), 3, z0 + altarLocalZ, BLOCK_GOLD);
    this.setBlock(x0 + Math.floor(W / 2 - 1), 4, z0 + altarLocalZ, BLOCK_GOLD);
    this.setBlock(x0 + Math.floor(W / 2), 4, z0 + altarLocalZ, BLOCK_GOLD);

    const tableSpots: Array<[number, number]> = [
      [6, 8],
      [W - 8, 8],
      [6, 14],
      [W - 8, 14],
      [6, 20],
      [W - 8, 20],
    ];
    for (const [tx, tz] of tableSpots) {
      for (let dx = 0; dx < 3; dx++) {
        for (let dz = 0; dz < 3; dz++) {
          this.setBlock(x0 + tx + dx, 1, z0 + tz + dz, BLOCK_WOOD);
        }
      }
      this.setBlock(x0 + tx + 1, 2, z0 + tz + 1, BLOCK_FLOWER);
    }

    const flowerPositions: Array<[number, number]> = [
      [3, 3],
      [W - 4, 3],
      [3, D - 4],
      [W - 4, D - 4],
      [3, D / 2],
      [W - 4, D / 2],
      [W / 2 - 4, altarLocalZ - 2],
      [W / 2 + 3, altarLocalZ - 2],
    ];
    for (const [fx, fz] of flowerPositions) {
      this.setBlock(x0 + Math.floor(fx), 1, z0 + Math.floor(fz), BLOCK_FLOWER);
      this.setBlock(x0 + Math.floor(fx), 2, z0 + Math.floor(fz), BLOCK_FLOWER);
    }

    for (let x = 2; x < W - 2; x += 3) {
      this.setBlock(x0 + x, wallHeight + 1, z0 + 2, BLOCK_FLOWER);
      this.setBlock(x0 + x, wallHeight + 1, z0 + D - 3, BLOCK_FLOWER);
    }
  }
}
