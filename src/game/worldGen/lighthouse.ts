import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_CURTAIN,
  BLOCK_GLASS,
  BLOCK_GOLD,
  BLOCK_GRASS,
  BLOCK_LIGHT,
  BLOCK_MARBLE,
  BLOCK_PATH,
  BLOCK_ROCK,
  BLOCK_SAND,
  BLOCK_WATER,
  BLOCK_WOOD,
} from '../../data/blocks';
import type { GeneratorResult, WorldWriter } from './types';

/**
 * Sunset lighthouse coastline: sea, rocky island, tall tower with
 * exterior stairs to an open rooftop gallery, and a keeper's cottage.
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
  const shaftTopY = 11;
  const galleryY = 12;
  const canopyY = 16;
  const hatch: Array<[number, number]> = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ];
  const isHatch = (dx: number, dz: number): boolean =>
    hatch.some(([hx, hz]) => hx === dx && hz === dz);

  // Path to the door
  for (let z = pathTopZ; z <= towerZ - 3; z++) {
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(centerX + dx, 1, z, BLOCK_PATH);
    }
  }

  // Interior floor
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      w.setBlock(towerX + dx, 1, towerZ + dz, BLOCK_ROCK);
    }
  }

  // Shaft walls at ±3
  for (let y = 1; y <= shaftTopY; y++) {
    for (let dx = -3; dx <= 3; dx++) {
      for (let dz = -3; dz <= 3; dz++) {
        const onEdge = Math.abs(dx) === 3 || Math.abs(dz) === 3;
        if (!onEdge) continue;
        if (dz === -3 && Math.abs(dx) <= 1 && y <= 3) continue; // south door
        const isRedBand = y === 8 || y === 9;
        w.setBlock(towerX + dx, y, towerZ + dz, isRedBand ? BLOCK_CURTAIN : BLOCK_MARBLE);
      }
    }
  }

  for (let y = 4; y <= 7; y += 3) {
    w.setBlock(towerX - 3, y, towerZ, BLOCK_GLASS);
    w.setBlock(towerX + 3, y, towerZ, BLOCK_GLASS);
    w.setBlock(towerX, y, towerZ + 3, BLOCK_GLASS);
  }

  // ── East-side straight stairs → solid rooftop landing (no gap) ─────
  // Gallery deck is at dz ∈ [-3, 3]. Stairs must end inside that range.
  const stairCount = galleryY - 2; // treads at y=2 .. y=galleryY
  const stairTopZ = 1; // land next to gallery center-east
  const stairStartZ = stairTopZ - stairCount;

  // Ground approach from the south path to the stair foot
  for (let x = towerX + 1; x <= towerX + 5; x++) {
    w.setBlock(x, 1, towerZ - 4, BLOCK_PATH);
  }
  for (let z = Math.min(towerZ - 4, towerZ + stairStartZ - 1); z <= towerZ + stairStartZ; z++) {
    w.setBlock(towerX + 4, 1, z, BLOCK_PATH);
    w.setBlock(towerX + 5, 1, z, BLOCK_PATH);
  }

  // Straight 2-wide stairs climbing north along the east face
  for (let k = 0; k <= stairCount; k++) {
    const stepY = 2 + k;
    const stepZ = stairStartZ + k;
    w.setBlock(towerX + 4, stepY, towerZ + stepZ, BLOCK_WOOD);
    w.setBlock(towerX + 5, stepY, towerZ + stepZ, BLOCK_WOOD);
  }

  // Hatch open to the sky (center of gallery)
  for (const [hx, hz] of hatch) {
    for (let y = 2; y <= canopyY + 1; y++) {
      w.setBlock(towerX + hx, y, towerZ + hz, BLOCK_AIR);
    }
  }

  // Full rooftop gallery at ±3
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      if (isHatch(dx, dz)) continue;
      w.setBlock(towerX + dx, galleryY, towerZ + dz, BLOCK_MARBLE);
    }
  }

  // Solid landing bridge: stairs (x+4/+5) → gallery (x+3..0), 3 cells deep
  for (let dz = stairTopZ - 1; dz <= stairTopZ + 1; dz++) {
    w.setBlock(towerX + 5, galleryY, towerZ + dz, BLOCK_WOOD);
    w.setBlock(towerX + 4, galleryY, towerZ + dz, BLOCK_WOOD);
    w.setBlock(towerX + 3, galleryY, towerZ + dz, BLOCK_WOOD);
    w.setBlock(towerX + 2, galleryY, towerZ + dz, BLOCK_WOOD);
    w.setBlock(towerX + 1, galleryY, towerZ + dz, BLOCK_WOOD);
  }

  // Clear ONLY headroom above the landing (never delete the floor itself)
  for (let dz = stairTopZ - 1; dz <= stairTopZ + 1; dz++) {
    for (let dx = 1; dx <= 5; dx++) {
      for (let y = galleryY + 1; y <= galleryY + 3; y++) {
        w.setBlock(towerX + dx, y, towerZ + dz, BLOCK_AIR);
      }
    }
  }

  // East wall cutout just below gallery so the last climb isn't blocked
  // (walls only go to shaftTopY, but clear anyway for safety)
  for (let y = galleryY - 2; y <= galleryY - 1; y++) {
    for (let dz = stairTopZ - 1; dz <= stairTopZ + 1; dz++) {
      w.setBlock(towerX + 3, y, towerZ + dz, BLOCK_AIR);
    }
  }

  // Outer rail at ±5
  for (let dx = -5; dx <= 5; dx++) {
    for (let dz = -5; dz <= 5; dz++) {
      if (Math.abs(dx) !== 5 && Math.abs(dz) !== 5) continue;
      w.setBlock(towerX + dx, galleryY, towerZ + dz, BLOCK_MARBLE);
      w.setBlock(towerX + dx, galleryY + 1, towerZ + dz, BLOCK_GOLD);
    }
  }

  for (const [px, pz] of [
    [-5, -5],
    [-5, 5],
    [5, -5],
    [5, 5],
  ] as Array<[number, number]>) {
    for (let y = galleryY + 1; y <= canopyY - 1; y++) {
      w.setBlock(towerX + px, y, towerZ + pz, BLOCK_MARBLE);
    }
  }

  // Canopy over the inner gallery only
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      if (isHatch(dx, dz)) continue;
      if (Math.abs(dx) === 3 || Math.abs(dz) === 3) {
        w.setBlock(towerX + dx, canopyY, towerZ + dz, BLOCK_CURTAIN);
      }
    }
  }
  w.setBlock(towerX - 2, canopyY, towerZ - 2, BLOCK_CURTAIN);
  w.setBlock(towerX + 2, canopyY, towerZ - 2, BLOCK_CURTAIN);
  w.setBlock(towerX - 2, canopyY, towerZ + 2, BLOCK_CURTAIN);
  w.setBlock(towerX + 2, canopyY, towerZ + 2, BLOCK_CURTAIN);
  w.setBlock(towerX - 2, canopyY - 1, towerZ - 2, BLOCK_LIGHT);
  w.setBlock(towerX, canopyY + 1, towerZ, BLOCK_LIGHT);

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
    for (let y = 1; y <= 3; y++) {
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

  const spawn = new THREE.Vector3(centerX + 0.5, 2.01, islandMinZ - 3 + 0.5);
  return {
    playerSpawn: spawn,
    playerFacing: 0,
    enemySpawnRegion: {
      minX: islandMinX + 2,
      maxX: islandMaxX - 2,
      minZ: islandMinZ + 2,
      maxZ: pathTopZ + 2,
    },
    props: [
      { kind: 'sun', x: centerX - 18, y: 15, z: D + 28 },
      { kind: 'cat', x: catX, y: 2, z: catZ, rotationY: Math.PI },
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
