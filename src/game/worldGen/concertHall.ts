import * as THREE from 'three';
import {
  BLOCK_CARPET,
  BLOCK_CURTAIN,
  BLOCK_GOLD,
  BLOCK_MARBLE,
  BLOCK_SEAT,
  BLOCK_WOOD,
} from '../../data/blocks';
import type { GeneratorResult, WorldWriter } from './types';

/**
 * Classical concert hall: marble floor, red curtain backdrop, elevated stage,
 * gold columns lining the sides, chandelier cluster overhead, and rows of
 * theater seats facing the stage.
 */
export function generateConcertHall(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_MARBLE);
    }
  }

  const wallHeight = 8;
  for (let y = 1; y <= wallHeight; y++) {
    for (let x = 1; x < W - 1; x++) {
      w.setBlock(x, y, 1, BLOCK_MARBLE);
      w.setBlock(x, y, D - 2, BLOCK_MARBLE);
    }
    for (let z = 1; z < D - 1; z++) {
      w.setBlock(1, y, z, BLOCK_MARBLE);
      w.setBlock(W - 2, y, z, BLOCK_MARBLE);
    }
  }

  // Ceiling with a gold trim strip along the center aisle line
  const ceilingY = wallHeight + 1;
  for (let z = 1; z < D - 1; z++) {
    for (let x = 1; x < W - 1; x++) {
      w.setBlock(x, ceilingY, z, BLOCK_MARBLE);
    }
  }
  for (let z = 4; z < D - 4; z += 6) {
    for (let x = 4; x < W - 4; x += 6) {
      w.setBlock(x, ceilingY, z, BLOCK_GOLD);
    }
  }

  const stageBackZ = D - 4;
  const stageFrontZ = D - 10;
  for (let z = stageFrontZ; z <= stageBackZ; z++) {
    for (let x = 3; x < W - 3; x++) {
      w.setBlock(x, 1, z, BLOCK_WOOD);
    }
  }
  for (let z = stageFrontZ; z <= stageBackZ; z++) {
    for (let x = 3; x < W - 3; x++) {
      w.setBlock(x, 2, z, BLOCK_WOOD);
    }
  }

  const curtainZ = stageBackZ + 1;
  for (let y = 1; y <= wallHeight; y++) {
    for (let x = 3; x < W - 3; x++) {
      w.setBlock(x, y, curtainZ, BLOCK_CURTAIN);
    }
  }
  for (let y = wallHeight - 2; y <= wallHeight; y++) {
    for (let x = 3; x < W - 3; x += 2) {
      w.setBlock(x, y, curtainZ - 1, BLOCK_CURTAIN);
    }
  }

  const columnX = [4, 6, W - 7, W - 5];
  const columnZs: number[] = [];
  for (let z = 4; z < stageFrontZ - 2; z += 6) columnZs.push(z);
  for (const cx of columnX) {
    for (const cz of columnZs) {
      for (let y = 1; y <= wallHeight - 1; y++) {
        w.setBlock(cx, y, cz, BLOCK_MARBLE);
      }
      w.setBlock(cx, wallHeight, cz, BLOCK_GOLD);
      w.setBlock(cx, 1, cz, BLOCK_GOLD);
    }
  }

  const centerX = Math.floor(W / 2);
  const chandelierZ = Math.floor((stageFrontZ + 4) / 2);
  const chandelierY = wallHeight - 1;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > 3) continue;
      w.setBlock(centerX + dx, chandelierY, chandelierZ + dz, BLOCK_GOLD);
    }
  }
  w.setBlock(centerX, chandelierY - 1, chandelierZ, BLOCK_GOLD);
  w.setBlock(centerX, chandelierY + 1, chandelierZ, BLOCK_GOLD);

  const aisleHalf = 2;
  const audienceStart = 5;
  const audienceEnd = stageFrontZ - 3;
  for (let z = audienceStart; z < audienceEnd; z++) {
    for (let dx = -aisleHalf; dx < aisleHalf; dx++) {
      w.setBlock(centerX + dx, 0, z, BLOCK_CARPET);
    }
  }

  // Low single-block seat rows, inset from the walls
  const seatRowGap = 2;
  for (let z = audienceStart; z < audienceEnd; z += seatRowGap) {
    for (let x = 6; x < W - 6; x++) {
      if (Math.abs(x - centerX) < aisleHalf) continue;
      w.setBlock(x, 1, z, BLOCK_SEAT);
    }
  }

  for (let y = 1; y <= 3; y++) {
    for (let dx = -aisleHalf; dx < aisleHalf; dx++) {
      w.setBlock(centerX + dx, y, 1, BLOCK_CURTAIN);
    }
  }
  for (let dx = -aisleHalf; dx < aisleHalf; dx++) {
    w.setBlock(centerX + dx, 4, 1, BLOCK_GOLD);
  }

  const stepZ = stageFrontZ - 1;
  for (let x = centerX - 3; x <= centerX + 2; x++) {
    w.setBlock(x, 1, stepZ, BLOCK_WOOD);
  }

  const spawn = new THREE.Vector3(centerX + 0.5, 1.01, 3.5);
  const stageTopY = 3;
  const stageMidZ = stageFrontZ + 3;
  const pianoX = centerX + 6;
  const pianoZ = stageMidZ;
  return {
    playerSpawn: spawn,
    playerFacing: 0,
    enemySpawnRegion: {
      minX: 4,
      maxX: W - 5,
      minZ: 5,
      maxZ: audienceEnd,
    },
    props: [
      { kind: 'grand-piano', x: pianoX, y: stageTopY, z: pianoZ, rotationY: Math.PI + 0.5 },
      { kind: 'cello', x: centerX - 4, y: stageTopY, z: stageMidZ - 0.5, rotationY: Math.PI - 0.3 },
      { kind: 'cello', x: centerX - 7, y: stageTopY, z: stageMidZ + 0.5, rotationY: Math.PI + 0.4 },
      { kind: 'violin', x: centerX + 2.5, y: stageTopY, z: stageMidZ + 1, rotationY: Math.PI + 0.2 },
      { kind: 'music-stand', x: centerX - 2.5, y: stageTopY, z: stageMidZ - 1.5, rotationY: Math.PI },
      { kind: 'music-stand', x: centerX + 1.5, y: stageTopY, z: stageMidZ - 1.5, rotationY: Math.PI },
      { kind: 'music-stand', x: centerX - 5.5, y: stageTopY, z: stageMidZ - 1, rotationY: Math.PI + 0.15 },
    ],
    interactables: [{ kind: 'piano', x: pianoX, y: stageTopY, z: pianoZ, radius: 3.2 }],
  };
}
