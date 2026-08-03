import * as THREE from 'three';
import {
  BLOCK_CARPET,
  BLOCK_FLOWER,
  BLOCK_GLASS,
  BLOCK_GOLD,
  BLOCK_GRASS,
  BLOCK_HEDGE,
  BLOCK_LIGHT,
  BLOCK_MARBLE,
  BLOCK_PATH,
  BLOCK_STONE,
  BLOCK_WOOD,
} from '../../data/blocks';
import type { WorldWriter, GeneratorResult, HallDecorations } from './types';

export function generateWeddingHall(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_GRASS);
    }
  }

  const hallWidth = 32;
  const hallDepth = 32;
  const hallX0 = Math.floor((W - hallWidth) / 2);
  const hallZ0 = D - hallDepth;

  generateGarden(w, hallZ0);
  generateHall(w, hallX0, hallZ0, hallWidth, hallDepth);

  const northWallZ = hallZ0 + hallDepth - 3;
  const centerX = hallX0 + hallWidth / 2;

  const statueSpecs: HallDecorations['statues'] = [
    { type: 'merakli-teyze', x: hallX0 + 5.5, y: 3, z: hallZ0 + 10, rotationY: Math.PI / 2 },
    { type: 'mukemmeliyetci-kuzen', x: hallX0 + 5.5, y: 3, z: hallZ0 + 22, rotationY: Math.PI / 2 },
    { type: 'zaman-canavari', x: hallX0 + hallWidth - 6.5, y: 3, z: hallZ0 + 10, rotationY: -Math.PI / 2 },
    { type: 'beklenti-golgesi', x: hallX0 + hallWidth - 6.5, y: 3, z: hallZ0 + 22, rotationY: -Math.PI / 2, scale: 0.65 },
  ];

  for (const spec of statueSpecs) {
    placeStatuePedestal(w, Math.floor(spec.x), Math.floor(spec.z));
  }

  const spawn = new THREE.Vector3(
    W * 0.5,
    1.01,
    Math.floor(hallZ0 * 0.35) + 0.5,
  );
  const spawnFacing = 0;

  return {
    playerSpawn: spawn,
    playerFacing: spawnFacing,
    enemySpawnRegion: {
      minX: hallX0 + 3,
      maxX: hallX0 + hallWidth - 4,
      minZ: hallZ0 + 3,
      maxZ: hallZ0 + hallDepth - 4,
    },
    bannerText: 'Hilal & Cihanser',
    bannerPosition: {
      x: centerX,
      y: 3.4,
      z: northWallZ - 0.01,
      rotationY: Math.PI,
      width: 8,
      height: 1.6,
    },
    decorations: {
      statues: statueSpecs,
      portrait: {
        x: centerX,
        y: 7.2,
        z: northWallZ - 0.02,
        rotationY: Math.PI,
        width: 7,
        height: 4.5,
        names: 'Hilal & Cihanser',
      },
    },
  };
}

function generateGarden(w: WorldWriter, hallZ0: number): void {
  const gardenZMax = hallZ0 - 1;
  const centerX = Math.floor(w.width / 2);

  for (let z = 0; z <= gardenZMax; z++) {
    for (let dx = -2; dx <= 2; dx++) {
      w.setBlock(centerX + dx, 0, z, BLOCK_PATH);
    }
  }

  const hedgeInsetX = 3;
  for (let z = 0; z <= gardenZMax - 1; z++) {
    w.setBlock(centerX - hedgeInsetX, 1, z, BLOCK_HEDGE);
    w.setBlock(centerX + hedgeInsetX, 1, z, BLOCK_HEDGE);
  }

  const outerHedgeX = Math.floor(w.width / 2) - 10;
  for (let z = 1; z <= gardenZMax - 1; z += 2) {
    w.setBlock(outerHedgeX, 1, z, BLOCK_HEDGE);
    w.setBlock(w.width - 1 - outerHedgeX, 1, z, BLOCK_HEDGE);
  }

  const flowerBeds: Array<[number, number]> = [
    [centerX - 6, 4],
    [centerX + 6, 4],
    [centerX - 6, 10],
    [centerX + 6, 10],
    [centerX - 8, 7],
    [centerX + 8, 7],
  ];
  for (const [fx, fz] of flowerBeds) {
    if (fz > gardenZMax) continue;
    w.setBlock(fx, 1, fz, BLOCK_FLOWER);
    w.setBlock(fx - 1, 1, fz, BLOCK_FLOWER);
    w.setBlock(fx + 1, 1, fz, BLOCK_FLOWER);
    w.setBlock(fx, 1, fz - 1, BLOCK_FLOWER);
    w.setBlock(fx, 1, fz + 1, BLOCK_FLOWER);
  }

  const fountainX = centerX;
  const fountainZ = Math.floor(gardenZMax * 0.65);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
        w.setBlock(fountainX + dx, 1, fountainZ + dz, BLOCK_STONE);
      }
    }
  }
  w.setBlock(fountainX, 2, fountainZ, BLOCK_GLASS);
  w.setBlock(fountainX, 3, fountainZ, BLOCK_GLASS);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      w.setBlock(fountainX + dx, 2, fountainZ + dz, BLOCK_GLASS);
    }
  }

  for (let dz = -3; dz <= 3; dz++) {
    if (dz === 0) continue;
    const z = fountainZ + dz;
    if (z < 0 || z > gardenZMax) continue;
    for (let dx = -2; dx <= 2; dx++) {
      w.setBlock(centerX + dx, 0, z, BLOCK_PATH);
    }
  }

  addGardenTrees(w, gardenZMax);
  addLanternPosts(w, centerX, gardenZMax);
  addRoseArch(w, centerX, Math.min(gardenZMax - 3, 18));
  addBenches(w, centerX, fountainZ);
  addGazebo(w, 8, Math.min(gardenZMax - 6, 16));
  addGazebo(w, w.width - 13, Math.min(gardenZMax - 6, 16));
  addHeartFlowerBed(w, centerX - 10, Math.min(8, gardenZMax - 2));
  addHeartFlowerBed(w, centerX + 10, Math.min(8, gardenZMax - 2));
  addCeremonyChairs(w, centerX, Math.min(14, gardenZMax - 4));
  addStringLights(w, centerX, gardenZMax);
  addWelcomePillars(w, centerX, 2);
  addReflectingPool(w, centerX + 9, Math.min(fountainZ, gardenZMax - 2));
}

/** Small trees scattered on the lawn: wood trunk + hedge canopy. */
function addGardenTrees(w: WorldWriter, gardenZMax: number): void {
  const spots: Array<[number, number]> = [
    [10, 3],
    [10, 12],
    [w.width - 11, 3],
    [w.width - 11, 12],
    [16, gardenZMax - 3],
    [w.width - 17, gardenZMax - 3],
  ];
  for (const [tx, tz] of spots) {
    if (tz < 1 || tz > gardenZMax) continue;
    w.setBlock(tx, 1, tz, BLOCK_WOOD);
    w.setBlock(tx, 2, tz, BLOCK_WOOD);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        w.setBlock(tx + dx, 3, tz + dz, BLOCK_HEDGE);
      }
    }
    w.setBlock(tx, 4, tz, BLOCK_HEDGE);
    w.setBlock(tx - 1, 4, tz, BLOCK_HEDGE);
    w.setBlock(tx + 1, 4, tz, BLOCK_HEDGE);
    w.setBlock(tx, 4, tz - 1, BLOCK_HEDGE);
    w.setBlock(tx, 4, tz + 1, BLOCK_HEDGE);
    w.setBlock(tx, 5, tz, BLOCK_FLOWER);
  }
}

/** Glowing lantern posts lining both sides of the path. */
function addLanternPosts(w: WorldWriter, centerX: number, gardenZMax: number): void {
  for (const z of [3, 10, 17]) {
    if (z > gardenZMax - 1) continue;
    for (const x of [centerX - 4, centerX + 4]) {
      w.setBlock(x, 1, z, BLOCK_WOOD);
      w.setBlock(x, 2, z, BLOCK_WOOD);
      w.setBlock(x, 3, z, BLOCK_LIGHT);
    }
  }
}

/** Rose arch over the path, near the hall entrance. */
function addRoseArch(w: WorldWriter, centerX: number, z: number): void {
  for (let y = 1; y <= 3; y++) {
    w.setBlock(centerX - 3, y, z, BLOCK_WOOD);
    w.setBlock(centerX + 3, y, z, BLOCK_WOOD);
  }
  for (let dx = -3; dx <= 3; dx++) {
    w.setBlock(centerX + dx, 4, z, BLOCK_FLOWER);
  }
  w.setBlock(centerX - 3, 4, z, BLOCK_FLOWER);
  w.setBlock(centerX + 3, 4, z, BLOCK_FLOWER);
  w.setBlock(centerX - 2, 5, z, BLOCK_FLOWER);
  w.setBlock(centerX, 5, z, BLOCK_FLOWER);
  w.setBlock(centerX + 2, 5, z, BLOCK_FLOWER);
}

/** Wooden benches flanking the fountain. */
function addBenches(w: WorldWriter, centerX: number, fountainZ: number): void {
  for (const dz of [-1, 1]) {
    w.setBlock(centerX - 5, 1, fountainZ + dz, BLOCK_WOOD);
    w.setBlock(centerX + 5, 1, fountainZ + dz, BLOCK_WOOD);
  }
}

/** Romantic gazebo: marble posts, gold roof, flowers inside. */
function addGazebo(w: WorldWriter, x0: number, z0: number): void {
  const size = 4;
  for (const [px, pz] of [
    [x0, z0],
    [x0 + size, z0],
    [x0, z0 + size],
    [x0 + size, z0 + size],
  ] as Array<[number, number]>) {
    for (let y = 1; y <= 3; y++) {
      w.setBlock(px, y, pz, BLOCK_MARBLE);
    }
  }
  for (let dx = 0; dx <= size; dx++) {
    for (let dz = 0; dz <= size; dz++) {
      w.setBlock(x0 + dx, 4, z0 + dz, BLOCK_GOLD);
    }
  }
  w.setBlock(x0 + 2, 5, z0 + 2, BLOCK_FLOWER);
  w.setBlock(x0 + 2, 1, z0 + 2, BLOCK_FLOWER);
  w.setBlock(x0 + 1, 1, z0 + 3, BLOCK_FLOWER);
  w.setBlock(x0 + 3, 1, z0 + 1, BLOCK_FLOWER);
}

/** Heart-shaped flower bed on the lawn. */
function addHeartFlowerBed(w: WorldWriter, cx: number, cz: number): void {
  const cells: Array<[number, number]> = [
    [0, 1],
    [-1, 0],
    [1, 0],
    [-2, 0],
    [2, 0],
    [-2, -1],
    [2, -1],
    [-1, -1],
    [1, -1],
    [0, -1],
    [0, -2],
    [-1, -2],
    [1, -2],
    [0, -3],
  ];
  for (const [dx, dz] of cells) {
    w.setBlock(cx + dx, 1, cz + dz, BLOCK_FLOWER);
  }
  w.setBlock(cx, 2, cz - 1, BLOCK_GOLD);
}

/** Outdoor ceremony chair rows flanking the aisle. */
function addCeremonyChairs(w: WorldWriter, centerX: number, startZ: number): void {
  for (let row = 0; row < 3; row++) {
    const z = startZ + row * 2;
    for (let i = 0; i < 3; i++) {
      w.setBlock(centerX - 6 - i, 1, z, BLOCK_WOOD);
      w.setBlock(centerX + 6 + i, 1, z, BLOCK_WOOD);
    }
  }
}

/** Soft glowing string lights spanning above the path. */
function addStringLights(w: WorldWriter, centerX: number, gardenZMax: number): void {
  for (const z of [5, 12, 19]) {
    if (z > gardenZMax - 1) continue;
    w.setBlock(centerX - 5, 4, z, BLOCK_WOOD);
    w.setBlock(centerX + 5, 4, z, BLOCK_WOOD);
    for (let dx = -4; dx <= 4; dx++) {
      if (dx % 2 === 0) w.setBlock(centerX + dx, 5, z, BLOCK_LIGHT);
      else w.setBlock(centerX + dx, 5, z, BLOCK_GOLD);
    }
  }
}

/** Twin welcome pillars at the garden entrance with floral tops. */
function addWelcomePillars(w: WorldWriter, centerX: number, z: number): void {
  for (const side of [-5, 5]) {
    const x = centerX + side;
    for (let y = 1; y <= 3; y++) w.setBlock(x, y, z, BLOCK_MARBLE);
    w.setBlock(x, 4, z, BLOCK_GOLD);
    w.setBlock(x, 5, z, BLOCK_FLOWER);
    w.setBlock(x - 1, 4, z, BLOCK_FLOWER);
    w.setBlock(x + 1, 4, z, BLOCK_FLOWER);
  }
}

/** Small reflecting glass pool beside the fountain lawn. */
function addReflectingPool(w: WorldWriter, x0: number, z0: number): void {
  for (let dx = 0; dx < 4; dx++) {
    for (let dz = 0; dz < 3; dz++) {
      const edge = dx === 0 || dx === 3 || dz === 0 || dz === 2;
      if (edge) w.setBlock(x0 + dx, 1, z0 + dz, BLOCK_STONE);
      else w.setBlock(x0 + dx, 1, z0 + dz, BLOCK_GLASS);
    }
  }
  w.setBlock(x0 + 1, 2, z0 + 1, BLOCK_FLOWER);
  w.setBlock(x0 + 2, 2, z0 + 1, BLOCK_LIGHT);
}

function generateHall(w: WorldWriter, x0: number, z0: number, W: number, D: number): void {
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      const border = x < 2 || x >= W - 2 || z < 2 || z >= D - 2;
      if (!border) {
        w.setBlock(x0 + x, 0, z0 + z, BLOCK_STONE);
      }
    }
  }

  const carpetLow = 0;
  const carpetHigh = Math.floor(D * 0.9);
  for (let z = carpetLow; z < carpetHigh; z++) {
    for (let dx = -2; dx < 2; dx++) {
      w.setBlock(x0 + Math.floor(W / 2) + dx, 0, z0 + z, BLOCK_CARPET);
    }
  }

  const wallHeight = 5;
  const doorHalf = 2;
  const centerX = Math.floor(W / 2);
  for (let y = 1; y <= wallHeight; y++) {
    for (let x = 2; x < W - 2; x++) {
      const doorZone = Math.abs(x - centerX) <= doorHalf;
      if (!doorZone) w.setBlock(x0 + x, y, z0 + 2, BLOCK_STONE);
      w.setBlock(x0 + x, y, z0 + D - 3, BLOCK_STONE);
    }
    for (let z = 2; z < D - 2; z++) {
      w.setBlock(x0 + 2, y, z0 + z, BLOCK_STONE);
      w.setBlock(x0 + W - 3, y, z0 + z, BLOCK_STONE);
    }
  }

  for (let y = 2; y <= 3; y++) {
    for (let x = 5; x < W - 5; x += 4) {
      if (Math.abs(x - centerX) <= doorHalf) continue;
      w.setBlock(x0 + x, y, z0 + 2, BLOCK_GLASS);
      w.setBlock(x0 + x, y, z0 + D - 3, BLOCK_GLASS);
    }
    for (let z = 5; z < D - 5; z += 4) {
      w.setBlock(x0 + 2, y, z0 + z, BLOCK_GLASS);
      w.setBlock(x0 + W - 3, y, z0 + z, BLOCK_GLASS);
    }
  }

  const altarLocalZ = D - 6;
  for (let x = W / 2 - 3; x < W / 2 + 3; x++) {
    w.setBlock(x0 + Math.floor(x), 1, z0 + altarLocalZ, BLOCK_GOLD);
    w.setBlock(x0 + Math.floor(x), 1, z0 + altarLocalZ + 1, BLOCK_GOLD);
  }
  for (let x = W / 2 - 2; x < W / 2 + 2; x++) {
    w.setBlock(x0 + Math.floor(x), 2, z0 + altarLocalZ, BLOCK_GOLD);
  }
  w.setBlock(x0 + Math.floor(W / 2 - 2), 3, z0 + altarLocalZ, BLOCK_GOLD);
  w.setBlock(x0 + Math.floor(W / 2 + 1), 3, z0 + altarLocalZ, BLOCK_GOLD);
  w.setBlock(x0 + Math.floor(W / 2 - 1), 4, z0 + altarLocalZ, BLOCK_GOLD);
  w.setBlock(x0 + Math.floor(W / 2), 4, z0 + altarLocalZ, BLOCK_GOLD);

  const tableSpots: Array<[number, number]> = [
    [6, 8],
    [W - 8, 8],
    [6, 14],
    [W - 8, 14],
    [6, 20],
    [W - 8, 20],
  ];
  for (const [tx, tz] of tableSpots) {
    for (let dx = 0; dx < 3; dx++) {
      for (let dz = 0; dz < 3; dz++) {
        w.setBlock(x0 + tx + dx, 1, z0 + tz + dz, BLOCK_WOOD);
      }
    }
    w.setBlock(x0 + tx + 1, 2, z0 + tz + 1, BLOCK_FLOWER);
  }

  const flowerPositions: Array<[number, number]> = [
    [3, 3],
    [W - 4, 3],
    [3, D - 4],
    [W - 4, D - 4],
    [3, D / 2],
    [W - 4, D / 2],
    [W / 2 - 4, altarLocalZ - 2],
    [W / 2 + 3, altarLocalZ - 2],
  ];
  for (const [fx, fz] of flowerPositions) {
    w.setBlock(x0 + Math.floor(fx), 1, z0 + Math.floor(fz), BLOCK_FLOWER);
    w.setBlock(x0 + Math.floor(fx), 2, z0 + Math.floor(fz), BLOCK_FLOWER);
  }

  for (let x = 2; x < W - 2; x += 3) {
    w.setBlock(x0 + x, wallHeight + 1, z0 + 2, BLOCK_FLOWER);
    w.setBlock(x0 + x, wallHeight + 1, z0 + D - 3, BLOCK_FLOWER);
  }
}

function placeStatuePedestal(w: WorldWriter, x: number, z: number): void {
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      w.setBlock(x + dx, 1, z + dz, BLOCK_MARBLE);
    }
  }
  w.setBlock(x, 2, z, BLOCK_MARBLE);
  w.setBlock(x - 1, 2, z, BLOCK_MARBLE);
  w.setBlock(x + 1, 2, z, BLOCK_MARBLE);
  w.setBlock(x, 2, z - 1, BLOCK_MARBLE);
  w.setBlock(x, 2, z + 1, BLOCK_MARBLE);
}
