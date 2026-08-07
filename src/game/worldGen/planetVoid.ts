import * as THREE from 'three';
import { BLOCK_AIR, BLOCK_ROCK, BLOCK_STONE } from '../../data/blocks';
import type { GeneratorResult, WorldWriter } from './types';

/** Empty barren rock — nothing here. */
export function generatePlanetVoid(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const cx = Math.floor(W / 2);
  const cz = Math.floor(D / 2);

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      const crater = Math.sin(x * 0.5) * Math.cos(z * 0.4);
      w.setBlock(x, 1, z, crater > 0.5 ? BLOCK_STONE : BLOCK_ROCK);
      if (crater > 0.7) w.setBlock(x, 2, z, BLOCK_STONE);
    }
  }

  for (let y = 2; y < 6; y++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        w.setBlock(cx + dx, y, cz + dz, BLOCK_AIR);
      }
    }
  }

  return {
    playerSpawn: new THREE.Vector3(cx + 0.5, 3.2, cz + 0.5),
    playerFacing: 0,
    enemySpawnRegion: { minX: 2, maxX: W - 2, minZ: 2, maxZ: D - 2 },
    npcs: [],
    interactables: [{ kind: 'galaxy-return', x: cx, z: cz + 3, radius: 2.5 }],
    props: [],
  };
}
