import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_GRASS,
  BLOCK_HEDGE,
  BLOCK_ROCK,
  BLOCK_WATER,
  BLOCK_WOOD,
} from '../../data/blocks';
import type { GeneratorResult, NpcSpec, PropSpec, WorldWriter } from './types';

/** Tropical rainforest planet. */
export function generatePlanetRainforest(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const cx = Math.floor(W / 2);
  const cz = Math.floor(D / 2);

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      const edge = x < 2 || z < 2 || x >= W - 2 || z >= D - 2;
      w.setBlock(x, 1, z, edge ? BLOCK_WATER : BLOCK_GRASS);
    }
  }

  // Tree trunks (voxel)
  for (let i = 0; i < 28; i++) {
    const tx = 4 + ((i * 7) % (W - 8));
    const tz = 4 + ((i * 11) % (D - 8));
    if (Math.hypot(tx - cx, tz - (cz + 6)) < 4) continue;
    const th = 3 + (i % 3);
    for (let y = 2; y <= th; y++) w.setBlock(tx, y, tz, BLOCK_WOOD);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        w.setBlock(tx + dx, th + 1, tz + dy, BLOCK_HEDGE);
      }
    }
  }

  // Clear spawn
  for (let y = 2; y < 8; y++) {
    for (let dz = -2; dz <= 2; dz++) {
      for (let dx = -2; dx <= 2; dx++) {
        w.setBlock(cx + dx, y, cz + 6 + dz, BLOCK_AIR);
      }
    }
  }
  w.setBlock(cx, 1, cz + 6, BLOCK_GRASS);

  const props: PropSpec[] = [
    { kind: 'palm-tree', x: cx + 5, y: 2, z: cz - 2, scale: 1.1 },
    { kind: 'broadleaf-tree', x: cx - 6, y: 2, z: cz + 1, scale: 1.2 },
    { kind: 'fern', x: cx + 2, y: 2, z: cz - 4 },
  ];

  const npcs: NpcSpec[] = [
    { type: 'alien-peaceful', x: cx - 3, y: 2, z: cz, rotationY: 1, wander: true, wanderRadius: 5 },
    { type: 'alien-peaceful', x: cx + 4, y: 2, z: cz - 3, rotationY: -0.8, wander: true, wanderRadius: 4 },
  ];

  return {
    playerSpawn: new THREE.Vector3(cx + 0.5, 3.2, cz + 6.5),
    playerFacing: Math.PI,
    enemySpawnRegion: { minX: 4, maxX: W - 4, minZ: 4, maxZ: D - 4 },
    npcs,
    props,
    interactables: [
      { kind: 'alien-chat', x: cx - 3, z: cz, radius: 2.5, speakerName: 'Luma' },
      { kind: 'galaxy-return', x: cx, z: cz + 8, radius: 2.8 },
    ],
  };
}
