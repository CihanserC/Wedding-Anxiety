import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_HEDGE,
  BLOCK_ROCK,
  BLOCK_SWAMP,
  BLOCK_WATER,
  BLOCK_WOOD,
} from '../../data/blocks';
import type {
  GeneratorResult,
  InteractableSpec,
  NpcSpec,
  PropSpec,
  WorldWriter,
} from './types';

/** Misty swamp planet — elevated tree-hut, Master Yoda at ground level, frogs. */
export function generatePlanetSwamp(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const cx = Math.floor(W / 2);
  const cz = Math.floor(D / 2);

  // Terrain: rock base, swamp/water mosaic
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      const edge = x < 2 || z < 2 || x >= W - 2 || z >= D - 2;
      const puddle = Math.sin(x * 0.42) * Math.cos(z * 0.38) > 0.15;
      const deep = Math.sin(x * 0.25 + 1) * Math.cos(z * 0.3) > 0.55;
      if (edge || deep) w.setBlock(x, 1, z, BLOCK_WATER);
      else w.setBlock(x, 1, z, puddle ? BLOCK_WATER : BLOCK_SWAMP);
      if (deep && !edge) w.setBlock(x, 2, z, BLOCK_WATER);
    }
  }

  // Mangrove trunks scattered around
  for (let i = 0; i < 22; i++) {
    const tx = 3 + ((i * 9) % (W - 6));
    const tz = 3 + ((i * 13) % (D - 6));
    // Keep clear of hut island and spawn
    if (Math.hypot(tx - cx, tz - (cz - 6)) < 7) continue;
    if (Math.hypot(tx - cx, tz - (cz + 8)) < 5) continue;
    placeMangrove(w, tx, tz, 3 + (i % 4));
  }

  // Raised tree-hut island (north of center)
  const hutX = cx;
  const hutZ = cz - 6;
  const platformY = 4;

  for (let dz = -5; dz <= 5; dz++) {
    for (let dx = -5; dx <= 5; dx++) {
      if (dx * dx + dz * dz > 28) continue;
      w.setBlock(hutX + dx, 1, hutZ + dz, BLOCK_SWAMP);
      w.setBlock(hutX + dx, 2, hutZ + dz, BLOCK_AIR);
      if (dx * dx + dz * dz <= 18) {
        // Clear air above island
        for (let y = 2; y <= 8; y++) w.setBlock(hutX + dx, y, hutZ + dz, BLOCK_AIR);
      }
    }
  }

  // Thick mangrove trunk under hut
  for (let y = 1; y <= platformY; y++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (Math.abs(dx) + Math.abs(dz) <= 2) {
          w.setBlock(hutX + dx, y, hutZ + dz, BLOCK_WOOD);
        }
      }
    }
  }

  // Root buttresses
  for (const [dx, dz] of [
    [2, 0],
    [-2, 0],
    [0, 2],
    [0, -2],
    [2, 2],
    [-2, 2],
    [2, -2],
    [-2, -2],
  ] as Array<[number, number]>) {
    for (let y = 1; y <= 3; y++) {
      w.setBlock(hutX + dx, y, hutZ + dz, BLOCK_WOOD);
    }
  }

  // Platform deck
  for (let dz = -2; dz <= 3; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      w.setBlock(hutX + dx, platformY, hutZ + dz, BLOCK_WOOD);
    }
  }

  // Hut walls on platform (door open toward +Z / spawn)
  for (let y = platformY + 1; y <= platformY + 3; y++) {
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const wall = Math.abs(dx) === 1 || Math.abs(dz) === 1;
        const door = dx === 0 && dz === 1;
        if (wall && !door) {
          w.setBlock(hutX + dx, y, hutZ + dz, BLOCK_WOOD);
        } else if (!wall) {
          w.setBlock(hutX + dx, y, hutZ + dz, BLOCK_AIR);
        }
      }
    }
  }
  // Roof
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(hutX + dx, platformY + 4, hutZ + dz, BLOCK_HEDGE);
    }
  }
  w.setBlock(hutX, platformY + 5, hutZ, BLOCK_HEDGE);

  // Root stairs from ground toward porch (+Z side)
  for (let step = 0; step < 4; step++) {
    const sy = 1 + step;
    const sz = hutZ + 2 + step;
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(hutX + dx, sy, sz, BLOCK_WOOD);
      for (let y = sy + 1; y <= platformY + 2; y++) {
        w.setBlock(hutX + dx, y, sz, BLOCK_AIR);
      }
    }
  }

  // Porch clear (veranda in front of door)
  for (let dz = 2; dz <= 4; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(hutX + dx, platformY, hutZ + dz, BLOCK_WOOD);
      for (let y = platformY + 1; y <= platformY + 3; y++) {
        w.setBlock(hutX + dx, y, hutZ + dz, BLOCK_AIR);
      }
    }
  }

  // Spawn pad south
  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      w.setBlock(cx + dx, 1, cz + 8 + dz, BLOCK_SWAMP);
      for (let y = 2; y < 8; y++) w.setBlock(cx + dx, y, cz + 8 + dz, BLOCK_AIR);
    }
  }

  // Yoda at ground level south of the hut (reachable without climbing)
  const yodaX = hutX + 0.5;
  const yodaZ = hutZ + 6.5;
  const yodaY = 2.01;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(hutX + dx, 1, Math.floor(yodaZ) + dz, BLOCK_SWAMP);
      for (let y = 2; y <= 5; y++) {
        w.setBlock(hutX + dx, y, Math.floor(yodaZ) + dz, BLOCK_AIR);
      }
    }
  }

  const npcs: NpcSpec[] = [
    {
      type: 'master-yoda',
      x: yodaX,
      y: yodaY,
      z: yodaZ,
      // Face player spawn to the south (+Z)
      rotationY: 0,
    },
  ];

  const frogSpots: Array<[number, number, number, string]> = [
    [cx - 6, 2, cz + 2, 'Kurbağa Gıp'],
    [cx + 7, 2, cz - 2, 'Kurbağa Vırak'],
    [cx - 3, 2, cz + 10, 'Kurbağa Blup'],
    [cx + 5, 2, cz + 6, 'Kurbağa Şıp'],
  ];
  for (const [fx, fy, fz] of frogSpots) {
    w.setBlock(Math.floor(fx), 1, Math.floor(fz), BLOCK_SWAMP);
    for (let y = 2; y < 5; y++) w.setBlock(Math.floor(fx), y, Math.floor(fz), BLOCK_AIR);
    npcs.push({
      type: 'frog',
      x: fx,
      y: fy,
      z: fz,
      rotationY: Math.random() * Math.PI * 2,
      wander: true,
      wanderRadius: 4.5,
    });
  }

  const props: PropSpec[] = [
    { kind: 'fern', x: hutX - 4, y: 2, z: hutZ + 1, scale: 1.1 },
    { kind: 'fern', x: hutX + 4.5, y: 2, z: hutZ - 1, scale: 0.9 },
    { kind: 'fern', x: cx + 3, y: 2, z: cz + 5, scale: 1 },
    { kind: 'broadleaf-tree', x: cx - 8, y: 2, z: cz + 4, scale: 1.15 },
    { kind: 'broadleaf-tree', x: cx + 9, y: 2, z: cz - 4, scale: 1.05 },
    { kind: 'boat', x: cx + 6, y: 2.05, z: cz + 12, rotationY: -0.6, scale: 0.85 },
    { kind: 'boat', x: cx - 7, y: 2.05, z: cz - 1, rotationY: 1.2, scale: 0.75 },
  ];

  const interactables: InteractableSpec[] = [
    { kind: 'yoda-chat', x: yodaX, y: yodaY, z: yodaZ, radius: 3.2 },
    { kind: 'galaxy-return', x: cx, z: cz + 10, radius: 2.8 },
  ];
  for (let i = 0; i < frogSpots.length; i++) {
    const [fx, fy, fz, name] = frogSpots[i];
    interactables.push({
      kind: 'frog-chat',
      x: fx,
      y: fy,
      z: fz,
      radius: 2.4,
      speakerName: name,
    });
  }

  return {
    playerSpawn: new THREE.Vector3(cx + 0.5, 3.2, cz + 8.5),
    playerFacing: Math.PI,
    enemySpawnRegion: { minX: 4, maxX: W - 4, minZ: 4, maxZ: D - 4 },
    npcs,
    props,
    interactables,
  };
}

function placeMangrove(w: WorldWriter, tx: number, tz: number, height: number): void {
  if (tx < 1 || tz < 1 || tx >= w.width - 1 || tz >= w.depth - 1) return;
  w.setBlock(tx, 1, tz, BLOCK_SWAMP);
  for (let y = 2; y <= height; y++) {
    w.setBlock(tx, y, tz, BLOCK_WOOD);
  }
  // Canopy
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const wx = tx + dx;
      const wz = tz + dy;
      if (wx < 1 || wz < 1 || wx >= w.width - 1 || wz >= w.depth - 1) continue;
      w.setBlock(wx, height + 1, wz, BLOCK_HEDGE);
    }
  }
  // Small root knees
  for (const [dx, dz] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as Array<[number, number]>) {
    w.setBlock(tx + dx, 2, tz + dz, BLOCK_WOOD);
  }
}
