import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_CURTAIN,
  BLOCK_FLOWER,
  BLOCK_GLASS,
  BLOCK_GRASS,
  BLOCK_MARBLE,
  BLOCK_PATH,
  BLOCK_ROCK,
  BLOCK_SAND,
  BLOCK_WATER,
  BLOCK_WOOD,
} from '../../data/blocks';
import type { BlockId } from '../../data/blocks';
import type { GeneratorResult, WorldWriter } from './types';

/**
 * Sunset lighthouse coastline: sea, rocky island, GLB lighthouse model
 * on a rock pad, and a keeper's cottage with the feedable cat.
 */
export function generateLighthouse(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      w.setBlock(x, 1, z, BLOCK_WATER);
    }
  }

  const centerX = Math.floor(W / 2);

  const islandMinZ = 6;
  const islandMaxZ = D - 6;
  const islandMinX = 6;
  const islandMaxX = W - 6;
  for (let z = islandMinZ; z <= islandMaxZ; z++) {
    for (let x = islandMinX; x <= islandMaxX; x++) {
      const dx = x - centerX;
      const dz = z - Math.floor((islandMinZ + islandMaxZ) / 2);
      const inside = dx * dx * 1.3 + dz * dz * 1.0 <= 260;
      if (inside) {
        w.setBlock(x, 1, z, BLOCK_ROCK);
        if (isEdge(dx * dx * 1.3 + dz * dz * 1.0, 260)) {
          w.setBlock(x, 1, z, BLOCK_SAND);
        }
      }
    }
  }

  for (let z = islandMinZ - 1; z <= islandMinZ + 3; z++) {
    for (let x = centerX - 5; x <= centerX + 5; x++) {
      if (getRoughDist(x - centerX, z - islandMinZ - 1) < 5) {
        w.setBlock(x, 1, z, BLOCK_SAND);
      }
    }
  }

  const pathTopZ = islandMinZ + 6;
  for (let z = islandMinZ; z <= pathTopZ; z++) {
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(centerX + dx, 1, z, BLOCK_PATH);
    }
  }

  const towerX = centerX;
  const towerZ = pathTopZ + 5;

  // Path and plaza leading to the GLB lighthouse
  for (let z = pathTopZ; z <= towerZ - 3; z++) {
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(centerX + dx, 1, z, BLOCK_PATH);
    }
  }

  const spawnPlazaZ = towerZ - 5;
  for (let z = spawnPlazaZ; z <= towerZ - 3; z++) {
    for (let dx = -4; dx <= 8; dx++) {
      w.setBlock(towerX + dx, 1, z, BLOCK_PATH);
    }
  }

  // Solid rock pad under the lighthouse model (collision base)
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      w.setBlock(towerX + dx, 1, towerZ + dz, BLOCK_ROCK);
      if (Math.abs(dx) <= 2 && Math.abs(dz) <= 2) {
        w.setBlock(towerX + dx, 2, towerZ + dz, BLOCK_ROCK);
      }
    }
  }

  // ── Keeper's cottage ───────────────────────────────────────────────
  const cottageX = centerX - 8;
  const cottageZ = towerZ - 1;
  const cottageW = 6;
  const cottageD = 5;
  const cottageWallH = 4;
  for (let y = 1; y <= cottageWallH; y++) {
    for (let x = 0; x < cottageW; x++) {
      w.setBlock(cottageX + x, y, cottageZ, BLOCK_MARBLE);
      w.setBlock(cottageX + x, y, cottageZ + cottageD - 1, BLOCK_MARBLE);
    }
    for (let z = 0; z < cottageD; z++) {
      w.setBlock(cottageX, y, cottageZ + z, BLOCK_MARBLE);
      w.setBlock(cottageX + cottageW - 1, y, cottageZ + z, BLOCK_MARBLE);
    }
  }

  const doorX = cottageX + Math.floor(cottageW / 2) - 1;
  for (let dx = 0; dx < 2; dx++) {
    // Keep y=1 solid; clearing it left a pit at the threshold
    w.setBlock(doorX + dx, 1, cottageZ, BLOCK_WOOD);
    for (let y = 2; y <= 3; y++) {
      w.setBlock(doorX + dx, y, cottageZ, BLOCK_AIR);
    }
    w.setBlock(doorX + dx, 4, cottageZ, BLOCK_WOOD);
  }
  w.setBlock(doorX - 1, 1, cottageZ, BLOCK_WOOD);
  w.setBlock(doorX - 1, 2, cottageZ, BLOCK_WOOD);
  w.setBlock(doorX - 1, 3, cottageZ, BLOCK_WOOD);
  w.setBlock(doorX + 2, 1, cottageZ, BLOCK_WOOD);
  w.setBlock(doorX + 2, 2, cottageZ, BLOCK_WOOD);
  w.setBlock(doorX + 2, 3, cottageZ, BLOCK_WOOD);

  w.setBlock(cottageX + 1, 3, cottageZ + cottageD - 1, BLOCK_GLASS);
  w.setBlock(cottageX + cottageW - 2, 3, cottageZ + cottageD - 1, BLOCK_GLASS);

  for (let x = -1; x <= cottageW; x++) {
    for (let z = -1; z <= cottageD; z++) {
      w.setBlock(cottageX + x, cottageWallH + 1, cottageZ + z, BLOCK_CURTAIN);
    }
  }
  for (let x = 1; x < cottageW - 1; x++) {
    for (let z = 1; z < cottageD - 1; z++) {
      w.setBlock(cottageX + x, 1, cottageZ + z, BLOCK_WOOD);
      w.setBlock(cottageX + x, cottageWallH + 2, cottageZ + z, BLOCK_CURTAIN);
    }
  }

  // Solid ground at cottage door; always land, not only over water
  const setGround = (gx: number, gz: number, block: BlockId): void => {
    if (gx < 0 || gx >= W || gz < 0 || gz >= D) return;
    const cell = w.getBlock(gx, 1, gz);
    if (cell === BLOCK_WATER || cell === BLOCK_AIR) {
      w.setBlock(gx, 1, gz, block);
    }
  };
  // Cottage footprint
  for (let dz = 0; dz < cottageD; dz++) {
    for (let dx = 0; dx < cottageW; dx++) {
      setGround(cottageX + dx, cottageZ + dz, BLOCK_ROCK);
    }
  }
  // Door threshold + approach (south of cottageZ)
  for (let dz = -5; dz <= -1; dz++) {
    for (let dx = -1; dx <= cottageW; dx++) {
      const block = dz >= -2 ? BLOCK_PATH : BLOCK_SAND;
      setGround(cottageX + dx, cottageZ + dz, block);
    }
  }
  for (let dz = -3; dz <= 0; dz++) {
    setGround(cottageX - 1, cottageZ + dz, BLOCK_SAND);
    setGround(cottageX + cottageW, cottageZ + dz, BLOCK_SAND);
  }

  // Path branch: main island path → cottage door
  for (let x = cottageX + cottageW - 1; x <= centerX + 1; x++) {
    w.setBlock(x, 1, cottageZ, BLOCK_PATH);
    w.setBlock(x, 1, cottageZ - 1, BLOCK_PATH);
  }
  for (let z = cottageZ + 1; z <= towerZ - 4; z++) {
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(centerX + dx, 1, z, BLOCK_PATH);
    }
  }

  const catX = cottageX + cottageW / 2;
  const catZ = cottageZ + cottageD / 2 + 0.5;

  scatterGrass(w, centerX, islandMinZ, islandMaxZ, islandMinX, islandMaxX);

  const dockX = centerX;
  const dockZ0 = islandMinZ - 1;
  for (let dz = 0; dz < 4; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(dockX + dx, 1, dockZ0 - dz, BLOCK_WOOD);
    }
  }

  // Wider combat arena; solid sand around the tower approach
  const arenaMinX = centerX - 12;
  const arenaMaxX = centerX + 14;
  const arenaMinZ = pathTopZ;
  const arenaMaxZ = towerZ + 8;
  for (let z = arenaMinZ; z <= arenaMaxZ; z++) {
    for (let x = arenaMinX; x <= arenaMaxX; x++) {
      if (w.getBlock(x, 1, z) === BLOCK_WATER) {
        w.setBlock(x, 1, z, BLOCK_SAND);
      }
    }
  }

  const spawn = new THREE.Vector3(towerX + 0.5, 2.01, spawnPlazaZ + 0.5);
  const lighthouseCx = towerX + 0.5;
  const lighthouseCz = towerZ + 0.5;
  const lighthouseHalf = 2.2;
  const lighthouseHeight = 16;
  const carX = centerX + 5;
  const carZ = spawnPlazaZ + 0.5;

  // Parking pad under the car — no water pits around the wheels
  for (let z = Math.floor(carZ) - 3; z <= Math.floor(carZ) + 3; z++) {
    for (let x = Math.floor(carX) - 4; x <= Math.floor(carX) + 4; x++) {
      if (x < 1 || x >= W - 1 || z < 1 || z >= D - 1) continue;
      w.setBlock(x, 2, z, BLOCK_AIR);
      w.setBlock(x, 3, z, BLOCK_AIR);
      w.setBlock(x, 1, z, BLOCK_SAND);
      w.setBlock(x, 0, z, BLOCK_ROCK);
    }
  }

  // Grassy picnic lawn south of the lighthouse (replaces grey rock plaza)
  layPicnicLawn(w, {
    minX: towerX - 8,
    maxX: towerX + 11,
    minZ: spawnPlazaZ - 1,
    maxZ: towerZ + 5,
    towerX,
    towerZ,
    centerX,
    carX: Math.floor(carX),
    carZ: Math.floor(carZ),
    cottageX,
    cottageZ,
    cottageW,
    cottageD,
  });
  scatterPicnicFlowers(w, towerX - 5, spawnPlazaZ + 2);

  const picnicX = towerX - 5;
  const picnicZ = spawnPlazaZ + 2.5;

  return {
    playerSpawn: spawn,
    playerFacing: Math.PI,
    /** Enemies spawn north/east/west of the player; never on top of them. */
    enemySpawnRegion: {
      minX: arenaMinX + 2,
      maxX: arenaMaxX - 2,
      minZ: towerZ + 5,
      maxZ: arenaMaxZ - 1,
    },
    collisionBoxes: [
      {
        minX: lighthouseCx - lighthouseHalf,
        minY: 2,
        minZ: lighthouseCz - lighthouseHalf,
        maxX: lighthouseCx + lighthouseHalf,
        maxY: 2 + lighthouseHeight,
        maxZ: lighthouseCz + lighthouseHalf,
      },
    ],
    props: [
      { kind: 'sun', x: centerX - 18, y: 15, z: D + 28 },
      // public/lighthouse.glb — sits on the rock pad at island floor height
      { kind: 'lighthouse', x: towerX + 0.5, y: 2, z: towerZ + 0.5, scale: 1 },
      // public/car.glb — parked on sand beside the approach path
      { kind: 'car', x: carX, y: 2, z: carZ, rotationY: -Math.PI / 2, scale: 1 },
      { kind: 'cat', x: catX, y: 2, z: catZ, rotationY: Math.PI },
      // Picnic lawn west of the approach path (away from the parked car)
      { kind: 'coastal-picnic', x: picnicX, y: 2, z: picnicZ, rotationY: 0 },
      { kind: 'coastal-pine', x: towerX - 7, y: 2, z: spawnPlazaZ + 1 },
      { kind: 'coastal-pine', x: towerX + 9, y: 2, z: spawnPlazaZ, scale: 0.9 },
      { kind: 'coastal-pine', x: towerX + 2, y: 2, z: towerZ + 4, scale: 0.85 },
      { kind: 'coastal-tree', x: towerX + 8, y: 2, z: towerZ + 2 },
      { kind: 'coastal-tree', x: towerX - 3, y: 2, z: spawnPlazaZ + 4, scale: 0.9 },
    ],
    interactables: [{ kind: 'cat', x: catX, y: 2, z: catZ, radius: 2.8 }],
  };
}

function isEdge(value: number, threshold: number): boolean {
  return value > threshold - 30 && value <= threshold;
}

function getRoughDist(dx: number, dz: number): number {
  return Math.sqrt(dx * dx + dz * dz * 0.6);
}

function scatterGrass(
  w: WorldWriter,
  centerX: number,
  islandMinZ: number,
  islandMaxZ: number,
  islandMinX: number,
  islandMaxX: number,
): void {
  const positions: Array<[number, number]> = [
    [centerX - 4, islandMinZ + 3],
    [centerX + 5, islandMinZ + 4],
    [centerX - 6, islandMinZ + 8],
    [centerX + 7, islandMinZ + 10],
    [centerX + 3, islandMinZ + 14],
    [centerX - 3, islandMaxZ - 4],
  ];
  for (const [gx, gz] of positions) {
    if (gx < islandMinX || gx > islandMaxX || gz < islandMinZ || gz > islandMaxZ) continue;
    w.setBlock(gx, 1, gz, BLOCK_GRASS);
    w.setBlock(gx + 1, 1, gz, BLOCK_GRASS);
    w.setBlock(gx, 1, gz + 1, BLOCK_GRASS);
  }
}

function layPicnicLawn(
  w: WorldWriter,
  opts: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    towerX: number;
    towerZ: number;
    centerX: number;
    carX: number;
    carZ: number;
    cottageX: number;
    cottageZ: number;
    cottageW: number;
    cottageD: number;
  },
): void {
  const {
    minX,
    maxX,
    minZ,
    maxZ,
    towerX,
    towerZ,
    centerX,
    carX,
    carZ,
    cottageX,
    cottageZ,
    cottageW,
    cottageD,
  } = opts;

  for (let z = minZ; z <= maxZ; z++) {
    for (let x = minX; x <= maxX; x++) {
      if (Math.abs(x - towerX) <= 3 && Math.abs(z - towerZ) <= 3) continue;
      if (Math.abs(x - centerX) <= 1) continue;
      if (Math.abs(x - carX) <= 4 && Math.abs(z - carZ) <= 3) continue;
      if (x >= cottageX && x < cottageX + cottageW && z >= cottageZ && z < cottageZ + cottageD) continue;

      const cell = w.getBlock(x, 1, z);
      if (cell === BLOCK_WATER || cell === BLOCK_WOOD) continue;
      if (
        cell === BLOCK_ROCK ||
        cell === BLOCK_PATH ||
        cell === BLOCK_SAND ||
        cell === BLOCK_GRASS
      ) {
        w.setBlock(x, 1, z, BLOCK_GRASS);
        w.setBlock(x, 2, z, BLOCK_AIR);
      }
    }
  }
}

function scatterPicnicFlowers(w: WorldWriter, picnicX: number, picnicZ: number): void {
  const spots: Array<[number, number]> = [
    [picnicX + 3, picnicZ + 3],
    [picnicX + 7, picnicZ + 1],
    [picnicX + 5, picnicZ + 4],
    [picnicX - 4, picnicZ + 2],
    [picnicX + 9, picnicZ + 3],
    [picnicX + 2, picnicZ + 5],
    [picnicX - 2, picnicZ + 4],
    [picnicX + 8, picnicZ + 5],
  ];
  for (const [fx, fz] of spots) {
    if (w.getBlock(fx, 1, fz) !== BLOCK_GRASS) continue;
    w.setBlock(fx, 2, fz, BLOCK_FLOWER);
  }
}
