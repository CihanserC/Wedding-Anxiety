import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_LAVA,
  BLOCK_ROCK,
  BLOCK_STONE,
} from '../../data/blocks';
import type { GeneratorResult, NpcSpec, PropSpec, WorldWriter } from './types';

/** Lava planet — volcano, throne, TIE Advanced; Darth Vader awaits. */
export function generatePlanetLava(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const H = w.height;
  const cx = Math.floor(W / 2);
  const cz = Math.floor(D / 2);

  // Base terrain + lava rivers
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      const river =
        Math.abs(Math.sin(x * 0.35) * 8 + z - cz) < 2.4 ||
        Math.abs(x - cx) < 1.4 ||
        // Cascades from volcano toward platform
        (z < cz - 4 && Math.abs(x - cx) < 2.2 + (cz - 4 - z) * 0.15);
      if (river) {
        w.setBlock(x, 1, z, BLOCK_LAVA);
      } else {
        w.setBlock(x, 1, z, BLOCK_STONE);
        if ((x * 3 + z * 5) % 17 === 0) w.setBlock(x, 2, z, BLOCK_ROCK);
      }
    }
  }

  // Giant conical volcano at the north (low Z)
  const vox = cx;
  const voz = Math.max(4, cz - 14);
  const peakY = Math.min(H - 2, 16);
  for (let y = 1; y <= peakY; y++) {
    const t = y / peakY;
    const radius = Math.max(1.2, 9.5 * (1 - t * 0.92));
    for (let z = Math.floor(voz - radius - 1); z <= Math.ceil(voz + radius + 1); z++) {
      for (let x = Math.floor(vox - radius - 1); x <= Math.ceil(vox + radius + 1); x++) {
        if (x < 0 || x >= W || z < 0 || z >= D) continue;
        const dx = x - vox + 0.5;
        const dz = z - voz + 0.5;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > radius) continue;

        const craterR = Math.max(1.1, 2.4 * (1 - t));
        const inCrater = y >= peakY - 2 && dist < craterR;

        if (inCrater) {
          w.setBlock(x, y, z, BLOCK_LAVA);
          continue;
        }

        // Outer shell rock, inner stone, lava veins on slopes
        if (dist > radius - 0.9) {
          w.setBlock(x, y, z, BLOCK_ROCK);
        } else if (dist < radius * 0.35 && y > peakY * 0.45) {
          w.setBlock(x, y, z, BLOCK_LAVA);
        } else {
          w.setBlock(x, y, z, BLOCK_STONE);
        }

        // Side lava channels flowing down
        if (Math.abs(dx) < 1.1 && dz > 0 && y < peakY - 1 && dist > craterR) {
          w.setBlock(x, y, z, BLOCK_LAVA);
        }
      }
    }
  }

  // Clear air above volcano slopes for silhouette
  for (let z = Math.max(0, voz - 2); z < Math.min(D, voz + 4); z++) {
    for (let x = Math.max(0, vox - 3); x < Math.min(W, vox + 4); x++) {
      for (let y = peakY + 1; y < H; y++) w.setBlock(x, y, z, BLOCK_AIR);
    }
  }

  // Elevated Vader platform (wider dais)
  for (let dz = -4; dz <= 3; dz++) {
    for (let dx = -4; dx <= 4; dx++) {
      const px = cx + dx;
      const pz = cz - 5 + dz;
      if (px < 0 || px >= W || pz < 0 || pz >= D) continue;
      w.setBlock(px, 1, pz, BLOCK_ROCK);
      w.setBlock(px, 2, pz, BLOCK_STONE);
      if (Math.abs(dx) <= 3 && Math.abs(dz) <= 2) {
        w.setBlock(px, 3, pz, BLOCK_ROCK);
        for (let y = 4; y < 8; y++) w.setBlock(px, y, pz, BLOCK_AIR);
      } else {
        for (let y = 3; y < 8; y++) w.setBlock(px, y, pz, BLOCK_AIR);
      }
    }
  }

  // Spawn pad
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      w.setBlock(cx + dx, 1, cz + 6 + dz, BLOCK_STONE);
      for (let y = 2; y < 6; y++) w.setBlock(cx + dx, y, cz + 6 + dz, BLOCK_AIR);
    }
  }

  // Bridge across lava toward Vader
  for (let z = cz - 2; z <= cz + 5; z++) {
    for (const dx of [-1, 0, 1]) {
      w.setBlock(cx + dx, 1, z, BLOCK_STONE);
      w.setBlock(cx + dx, 2, z, BLOCK_STONE);
      for (let y = 3; y < 6; y++) w.setBlock(cx + dx, y, z, BLOCK_AIR);
    }
  }

  // TIE landing strip (right of platform)
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = 0; dx <= 3; dx++) {
      const px = cx + 5 + dx;
      const pz = cz - 4 + dz;
      if (px >= W || pz < 0 || pz >= D) continue;
      w.setBlock(px, 1, pz, BLOCK_ROCK);
      w.setBlock(px, 2, pz, BLOCK_STONE);
      for (let y = 3; y < 7; y++) w.setBlock(px, y, pz, BLOCK_AIR);
    }
  }

  const npcs: NpcSpec[] = [
    { type: 'darth-vader', x: cx, y: 4, z: cz - 5, rotationY: 0 },
  ];

  const props: PropSpec[] = [
    { kind: 'vader-throne', x: cx + 0.5, y: 4, z: cz - 7.2, rotationY: Math.PI },
    {
      kind: 'tie-advanced',
      x: cx + 6.5,
      y: 3,
      z: cz - 4,
      rotationY: -0.65,
      scale: 1.15,
    },
  ];

  return {
    playerSpawn: new THREE.Vector3(cx + 0.5, 3.2, cz + 6.5),
    playerFacing: Math.PI,
    enemySpawnRegion: { minX: 4, maxX: W - 4, minZ: 4, maxZ: D - 4 },
    npcs,
    interactables: [
      { kind: 'vader-chat', x: cx, z: cz - 5, radius: 3.5 },
      { kind: 'galaxy-return', x: cx, z: cz + 8, radius: 2.8 },
    ],
    props,
  };
}
