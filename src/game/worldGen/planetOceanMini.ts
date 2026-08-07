import * as THREE from 'three';
import { BLOCK_AIR, BLOCK_GRASS, BLOCK_ROCK, BLOCK_SAND, BLOCK_WATER } from '../../data/blocks';
import type { GeneratorResult, WorldWriter } from './types';

/** Tiny island in a vast ocean — mostly empty. */
export function generatePlanetOceanMini(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const cx = Math.floor(W / 2);
  const cz = Math.floor(D / 2);

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      w.setBlock(x, 1, z, BLOCK_WATER);
    }
  }

  // Tiny island
  for (let z = cz - 3; z <= cz + 3; z++) {
    for (let x = cx - 3; x <= cx + 3; x++) {
      const dx = x - cx;
      const dz = z - cz;
      if (dx * dx + dz * dz <= 9) {
        const edge = dx * dx + dz * dz > 5;
        w.setBlock(x, 1, z, edge ? BLOCK_SAND : BLOCK_GRASS);
        for (let y = 2; y < 5; y++) w.setBlock(x, y, z, BLOCK_AIR);
      }
    }
  }

  return {
    playerSpawn: new THREE.Vector3(cx + 0.5, 3.2, cz + 0.5),
    playerFacing: 0,
    enemySpawnRegion: { minX: 2, maxX: W - 2, minZ: 2, maxZ: D - 2 },
    npcs: [],
    interactables: [{ kind: 'galaxy-return', x: cx, z: cz + 2, radius: 2.5 }],
    props: [{ kind: 'palm-tree', x: cx - 1, y: 2, z: cz - 1, scale: 0.85 }],
  };
}
