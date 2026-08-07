import * as THREE from 'three';
import { BLOCK_AIR, BLOCK_ICE, BLOCK_ROCK, BLOCK_SNOW } from '../../data/blocks';
import type { GeneratorResult, WorldWriter } from './types';

/** Snow / ice planet with hostile aliens. */
export function generatePlanetSnow(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const cx = Math.floor(W / 2);
  const cz = Math.floor(D / 2);

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      w.setBlock(x, 1, z, BLOCK_SNOW);
      const ridge = Math.sin(x * 0.4 + z * 0.15) * Math.cos(z * 0.3);
      if (ridge > 0.55) {
        w.setBlock(x, 2, z, BLOCK_SNOW);
        if (ridge > 0.75) w.setBlock(x, 3, z, BLOCK_ICE);
      }
      if ((x + z) % 11 === 0 && Math.abs(x - cx) > 3) {
        w.setBlock(x, 2, z, BLOCK_ICE);
      }
    }
  }

  for (let y = 2; y < 6; y++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        w.setBlock(cx + dx, 1, cz + 6 + dz, BLOCK_SNOW);
        w.setBlock(cx + dx, y, cz + 6 + dz, BLOCK_AIR);
      }
    }
  }

  return {
    playerSpawn: new THREE.Vector3(cx + 0.5, 3.2, cz + 6.5),
    playerFacing: Math.PI,
    enemySpawnRegion: { minX: 6, maxX: W - 6, minZ: 6, maxZ: D - 6 },
    npcs: [],
    interactables: [{ kind: 'galaxy-return', x: cx, z: cz + 8, radius: 2.8 }],
    props: [],
    ambientFauna: [],
  };
}
