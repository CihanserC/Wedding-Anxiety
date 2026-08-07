import * as THREE from 'three';
import { BLOCK_ROCK, BLOCK_SAND, BLOCK_PATH } from '../../data/blocks';
import type { GeneratorResult, NpcSpec, WorldWriter } from './types';

/** Desert planet — dunes and peaceful alien camp. */
export function generatePlanetDesert(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const cx = Math.floor(W / 2);
  const cz = Math.floor(D / 2);

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      const h = Math.sin(x * 0.25) * Math.cos(z * 0.2) > 0.35 ? 2 : 1;
      w.setBlock(x, 1, z, BLOCK_SAND);
      if (h === 2) w.setBlock(x, 2, z, BLOCK_SAND);
    }
  }

  // Camp path
  for (let z = cz - 4; z <= cz + 4; z++) {
    w.setBlock(cx, 1, z, BLOCK_PATH);
    w.setBlock(cx + 1, 1, z, BLOCK_PATH);
  }

  const npcs: NpcSpec[] = [
    { type: 'alien-peaceful', x: cx + 3, y: 2, z: cz, rotationY: Math.PI, wander: true, wanderRadius: 4 },
    { type: 'alien-peaceful', x: cx - 4, y: 2, z: cz + 2, rotationY: 0.5, wander: true, wanderRadius: 3 },
  ];

  return {
    playerSpawn: new THREE.Vector3(cx + 0.5, 3.2, cz + 6.5),
    playerFacing: Math.PI,
    enemySpawnRegion: { minX: 4, maxX: W - 4, minZ: 4, maxZ: D - 4 },
    npcs,
    interactables: [
      { kind: 'alien-chat', x: cx + 3, z: cz, radius: 2.5, speakerName: 'Zorak' },
      { kind: 'galaxy-return', x: cx, z: cz + 8, radius: 2.8 },
    ],
    props: [],
  };
}
