import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_CARPET,
  BLOCK_FLOWER,
  BLOCK_GLASS,
  BLOCK_GOLD,
  BLOCK_GRASS,
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

/**
 * Voxel arena for the wedding hall. Uses a flat 3D array indexed as
 * [x + width * (z + depth * y)]. Positions are 1-block cells; render
 * meshes are centered at (x+0.5, y+0.5, z+0.5).
 */
export class World {
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  private readonly cells: Uint8Array;
  private group: THREE.Group | null = null;

  constructor(width = 32, depth = 32, height = 10) {
    this.width = width;
    this.depth = depth;
    this.height = height;
    this.cells = new Uint8Array(width * depth * height);
    this.generateWeddingHall();
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

  /**
   * AABB vs voxel grid collision test. `min` and `max` are world-space
   * corners of the box. Returns true if the box overlaps any solid cell.
   */
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

  /** Random spawnable ground cell (walkable air above solid floor). */
  randomSpawnPoint(rand: () => number, awayFrom?: THREE.Vector3, minDist = 6): THREE.Vector3 {
    const b = this.bounds();
    for (let tries = 0; tries < 64; tries++) {
      const x = Math.floor(b.minX + 1 + rand() * (b.maxX - b.minX - 2));
      const z = Math.floor(b.minZ + 1 + rand() * (b.maxZ - b.minZ - 2));
      const y = b.floorY;
      if (this.isSolidAt(x, y, z)) continue;
      if (this.isSolidAt(x, y + 1, z)) continue;
      const p = new THREE.Vector3(x + 0.5, y, z + 0.5);
      if (awayFrom && p.distanceTo(awayFrom) < minDist) continue;
      return p;
    }
    return new THREE.Vector3(this.width * 0.5, b.floorY, this.depth * 0.5);
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

  /**
   * A block is exposed (worth rendering) if any face touches air/transparent.
   * We skip fully-buried blocks to keep instance counts small.
   */
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

  private generateWeddingHall(): void {
    const W = this.width;
    const D = this.depth;

    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        this.setBlock(x, 0, z, BLOCK_GRASS);
      }
    }

    for (let z = 0; z < D; z++) {
      for (let x = 0; x < W; x++) {
        const border = x < 2 || x >= W - 2 || z < 2 || z >= D - 2;
        if (!border) {
          this.setBlock(x, 0, z, BLOCK_STONE);
        }
      }
    }

    const centerZLow = Math.floor(D * 0.35);
    const centerZHigh = Math.floor(D * 0.9);
    for (let z = centerZLow; z < centerZHigh; z++) {
      for (let x = W / 2 - 2; x < W / 2 + 2; x++) {
        this.setBlock(Math.floor(x), 0, z, BLOCK_CARPET);
      }
    }

    const wallHeight = 5;
    for (let y = 1; y <= wallHeight; y++) {
      for (let x = 2; x < W - 2; x++) {
        this.setBlock(x, y, 2, BLOCK_STONE);
        this.setBlock(x, y, D - 3, BLOCK_STONE);
      }
      for (let z = 2; z < D - 2; z++) {
        this.setBlock(2, y, z, BLOCK_STONE);
        this.setBlock(W - 3, y, z, BLOCK_STONE);
      }
    }

    for (let y = 2; y <= 3; y++) {
      for (let x = 5; x < W - 5; x += 4) {
        this.setBlock(x, y, 2, BLOCK_GLASS);
        this.setBlock(x, y, D - 3, BLOCK_GLASS);
      }
      for (let z = 5; z < D - 5; z += 4) {
        this.setBlock(2, y, z, BLOCK_GLASS);
        this.setBlock(W - 3, y, z, BLOCK_GLASS);
      }
    }

    const altarZ = D - 6;
    for (let x = W / 2 - 3; x < W / 2 + 3; x++) {
      this.setBlock(Math.floor(x), 1, altarZ, BLOCK_GOLD);
      this.setBlock(Math.floor(x), 1, altarZ + 1, BLOCK_GOLD);
    }
    for (let x = W / 2 - 2; x < W / 2 + 2; x++) {
      this.setBlock(Math.floor(x), 2, altarZ, BLOCK_GOLD);
    }
    this.setBlock(Math.floor(W / 2 - 2), 3, altarZ, BLOCK_GOLD);
    this.setBlock(Math.floor(W / 2 + 1), 3, altarZ, BLOCK_GOLD);
    this.setBlock(Math.floor(W / 2 - 1), 4, altarZ, BLOCK_GOLD);
    this.setBlock(Math.floor(W / 2), 4, altarZ, BLOCK_GOLD);

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
          this.setBlock(tx + dx, 1, tz + dz, BLOCK_WOOD);
        }
      }
      this.setBlock(tx + 1, 2, tz + 1, BLOCK_FLOWER);
    }

    const flowerPositions: Array<[number, number]> = [
      [3, 3],
      [W - 4, 3],
      [3, D - 4],
      [W - 4, D - 4],
      [3, D / 2],
      [W - 4, D / 2],
      [W / 2 - 4, altarZ - 2],
      [W / 2 + 3, altarZ - 2],
    ];
    for (const [fx, fz] of flowerPositions) {
      this.setBlock(Math.floor(fx), 1, Math.floor(fz), BLOCK_FLOWER);
      this.setBlock(Math.floor(fx), 2, Math.floor(fz), BLOCK_FLOWER);
    }

    for (let x = 2; x < W - 2; x += 3) {
      this.setBlock(x, wallHeight + 1, 2, BLOCK_FLOWER);
      this.setBlock(x, wallHeight + 1, D - 3, BLOCK_FLOWER);
    }
  }
}
