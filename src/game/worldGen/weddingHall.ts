import * as THREE from 'three';
import {
  BLOCK_CARPET,
  BLOCK_CURTAIN,
  BLOCK_FLOWER,
  BLOCK_GLASS,
  BLOCK_GOLD,
  BLOCK_GRASS,
  BLOCK_HEDGE,
  BLOCK_LIGHT,
  BLOCK_MARBLE,
  BLOCK_PATH,
  BLOCK_SEAT,
  BLOCK_WOOD,
} from '../../data/blocks';
import type { WorldWriter, GeneratorResult, CollisionBox } from './types';

/**
 * Grand luxury wedding hall: south garden approach, marble palace with dome,
 * guest tables, raised ceremony stage, neon banner, couple portrait, cake.
 */
export function generateWeddingHall(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_GRASS);
    }
  }

  const hallWidth = 50;
  const hallDepth = 50;
  const hallX0 = Math.floor((W - hallWidth) / 2);
  const hallZ0 = D - hallDepth;

  generateGarden(w, hallX0, hallZ0, hallWidth);
  generateHall(w, hallX0, hallZ0, hallWidth, hallDepth);

  const northWallZ = hallZ0 + hallDepth - 3;
  const centerX = hallX0 + hallWidth / 2;
  const stageFrontZ = hallZ0 + hallDepth - 12;
  const altarWorldZ = hallZ0 + hallDepth - 7;
  const coupleZ = stageFrontZ + 1.5;
  const cakeTableX = centerX + 5.5;

  const spawn = new THREE.Vector3(
    W * 0.5,
    1.01,
    Math.floor(hallZ0 * 0.4) + 0.5,
  );
  const spawnFacing = Math.PI;
  const stairsOrigin = { x: centerX, y: 1.01, z: stageFrontZ - 0.15 };

  return {
    playerSpawn: spawn,
    playerFacing: spawnFacing,
    enemySpawnRegion: {
      minX: hallX0 + 4,
      maxX: hallX0 + hallWidth - 5,
      minZ: hallZ0 + 4,
      maxZ: stageFrontZ - 2,
    },
    bannerText: 'Hilal ❤️ Cihanser',
    bannerPosition: {
      x: centerX,
      y: 7.2,
      z: northWallZ - 0.01,
      rotationY: Math.PI,
      width: 12.5,
      height: 2.1,
      style: 'neon',
    },
    decorations: {
      statues: [],
      portrait: {
        x: centerX,
        y: 4.4,
        z: northWallZ - 0.02,
        rotationY: Math.PI,
        width: 5,
        height: 3.5,
        names: 'Hilal & Cihanser',
      },
    },
    collisionBoxes: buildWeddingStairCollisionBoxes(stairsOrigin),
    npcs: [
      {
        type: 'bride',
        x: centerX - 0.55,
        y: 2.01,
        z: coupleZ,
        rotationY: Math.PI,
      },
      {
        type: 'groom',
        x: centerX + 0.55,
        y: 2.01,
        z: coupleZ,
        rotationY: Math.PI,
      },
    ],
    props: [
      {
        kind: 'wedding-steps',
        x: stairsOrigin.x,
        y: stairsOrigin.y,
        z: stairsOrigin.z,
        rotationY: 0,
      },
      {
        kind: 'wedding-arch',
        x: centerX,
        y: 2.01,
        z: altarWorldZ - 0.5,
        rotationY: Math.PI,
        scale: 1,
      },
      {
        kind: 'cake-table',
        x: cakeTableX,
        y: 2.01,
        z: coupleZ + 0.5,
        rotationY: Math.PI,
        scale: 1,
      },
      {
        kind: 'suzy-cat',
        x: centerX - 3.0,
        y: 2.01,
        z: coupleZ - 0.7,
        rotationY: Math.PI,
        scale: 1.55,
      },
      {
        kind: 'balloon-cluster',
        x: centerX - 5,
        y: 1.01,
        z: 10,
        rotationY: 0,
      },
      {
        kind: 'balloon-cluster',
        x: centerX + 5,
        y: 1.01,
        z: 14,
        rotationY: 0.4,
      },
      {
        kind: 'balloon-cluster',
        x: centerX - 4.5,
        y: 1.01,
        z: hallZ0 - 10,
        rotationY: -0.3,
      },
      {
        kind: 'balloon-cluster',
        x: centerX + 4,
        y: 1.01,
        z: hallZ0 - 6,
        rotationY: 0.2,
      },
    ],
    interactables: [
      {
        kind: 'altar',
        x: centerX,
        y: 2.01,
        z: altarWorldZ - 1,
        radius: 3.5,
      },
      {
        kind: 'bride-chat',
        x: centerX - 0.55,
        y: 2.01,
        z: coupleZ,
        radius: 2.4,
      },
      {
        kind: 'groom-chat',
        x: centerX + 0.55,
        y: 2.01,
        z: coupleZ,
        radius: 2.4,
      },
      {
        kind: 'cake',
        x: cakeTableX,
        y: 2.01,
        z: coupleZ + 0.5,
        radius: 3.2,
      },
      {
        kind: 'suzy-cat',
        x: centerX - 3.0,
        y: 2.01,
        z: coupleZ - 0.7,
        radius: 2.2,
      },
    ],
  };
}

function generateGarden(w: WorldWriter, hallX0: number, hallZ0: number, hallWidth: number): void {
  const gardenZMax = hallZ0 - 1;
  const centerX = Math.floor(w.width / 2);
  const hallCenterLocal = Math.floor(hallWidth / 2);

  // Wide path from south to hall entrance
  for (let z = 0; z <= gardenZMax; z++) {
    for (let dx = -2; dx <= 2; dx++) {
      w.setBlock(centerX + dx, 0, z, BLOCK_PATH);
    }
  }

  // Marble plaza in front of the doors
  for (let z = hallZ0 - 4; z < hallZ0; z++) {
    for (let dx = -6; dx <= 6; dx++) {
      w.setBlock(hallX0 + hallCenterLocal + dx, 0, z, BLOCK_MARBLE);
    }
  }

  // Hedge borders along garden edges
  for (let z = 2; z <= gardenZMax - 1; z++) {
    w.setBlock(2, 1, z, BLOCK_HEDGE);
    w.setBlock(w.width - 3, 1, z, BLOCK_HEDGE);
    if (z % 3 === 0) {
      w.setBlock(2, 2, z, BLOCK_HEDGE);
      w.setBlock(w.width - 3, 2, z, BLOCK_HEDGE);
    }
  }

  // Flower clusters flanking the path
  const flowerSpots: Array<[number, number]> = [
    [centerX - 6, 4],
    [centerX + 6, 4],
    [centerX - 8, 8],
    [centerX + 8, 8],
    [centerX - 7, 12],
    [centerX + 7, 12],
    [centerX - 9, 16],
    [centerX + 9, 16],
    [centerX - 5, hallZ0 - 6],
    [centerX + 5, hallZ0 - 6],
  ];
  for (const [fx, fz] of flowerSpots) {
    if (fz < 0 || fz > gardenZMax) continue;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > 1) continue;
        const x = fx + dx;
        const z = fz + dz;
        if (x < 1 || x >= w.width - 1) continue;
        if (w.getBlock(x, 0, z) === BLOCK_PATH) continue;
        w.setBlock(x, 1, z, BLOCK_FLOWER);
      }
    }
  }
}

function generateHall(w: WorldWriter, x0: number, z0: number, HW: number, HD: number): void {
  const wallHeight = 9;
  const centerX = Math.floor(HW / 2);
  const doorHalf = 3;
  const stageFrontLocal = HD - 12;
  const northWallLocal = HD - 3;
  const southWallLocal = 2;

  // Interior floor — marble
  for (let z = 0; z < HD; z++) {
    for (let x = 0; x < HW; x++) {
      const border = x < 2 || x >= HW - 2 || z < 2 || z >= HD - 2;
      if (!border) {
        w.setBlock(x0 + x, 0, z0 + z, BLOCK_MARBLE);
      }
    }
  }

  // Carpet aisle
  for (let z = southWallLocal; z < stageFrontLocal; z++) {
    for (let dx = -2; dx < 2; dx++) {
      w.setBlock(x0 + centerX + dx, 0, z0 + z, BLOCK_CARPET);
    }
  }

  // Walls with gold trim
  for (let y = 1; y <= wallHeight; y++) {
    for (let x = 2; x < HW - 2; x++) {
      const doorZone = Math.abs(x - centerX) <= doorHalf;
      // South wall (entrance)
      if (!(y <= 4 && doorZone)) {
        const block = y === 1 || y === wallHeight ? BLOCK_GOLD : BLOCK_MARBLE;
        w.setBlock(x0 + x, y, z0 + southWallLocal, block);
      }
      // North wall
      {
        const block = y === 1 || y === wallHeight ? BLOCK_GOLD : BLOCK_MARBLE;
        w.setBlock(x0 + x, y, z0 + northWallLocal, block);
      }
    }
    for (let z = 2; z < HD - 2; z++) {
      const block = y === 1 || y === wallHeight ? BLOCK_GOLD : BLOCK_MARBLE;
      w.setBlock(x0 + 2, y, z0 + z, block);
      w.setBlock(x0 + HW - 3, y, z0 + z, block);
    }
  }

  // Gold arch above south doorway
  for (let x = centerX - doorHalf - 1; x <= centerX + doorHalf + 1; x++) {
    w.setBlock(x0 + x, 5, z0 + southWallLocal, BLOCK_GOLD);
  }
  w.setBlock(x0 + centerX - doorHalf - 1, 4, z0 + southWallLocal, BLOCK_GOLD);
  w.setBlock(x0 + centerX + doorHalf + 1, 4, z0 + southWallLocal, BLOCK_GOLD);

  // Windows
  for (let y = 3; y <= 5; y++) {
    for (let x = 6; x < HW - 6; x += 5) {
      if (Math.abs(x - centerX) <= doorHalf + 1) continue;
      w.setBlock(x0 + x, y, z0 + southWallLocal, BLOCK_GLASS);
      w.setBlock(x0 + x, y, z0 + northWallLocal, BLOCK_GLASS);
    }
    for (let z = 7; z < HD - 7; z += 5) {
      w.setBlock(x0 + 2, y, z0 + z, BLOCK_GLASS);
      w.setBlock(x0 + HW - 3, y, z0 + z, BLOCK_GLASS);
    }
  }

  // Columns along the sides
  const columnXs = [5, HW - 6];
  for (let z = 8; z < stageFrontLocal - 2; z += 7) {
    for (const cx of columnXs) {
      for (let y = 1; y <= wallHeight - 1; y++) {
        w.setBlock(x0 + cx, y, z0 + z, BLOCK_MARBLE);
      }
      w.setBlock(x0 + cx, 1, z0 + z, BLOCK_GOLD);
      w.setBlock(x0 + cx, wallHeight, z0 + z, BLOCK_GOLD);
    }
  }

  // Guest tables and chairs on both sides of the aisle
  placeGuestTables(w, x0, z0, HW, centerX, stageFrontLocal);

  // Raised marble stage with gold border
  for (let z = stageFrontLocal; z < northWallLocal; z++) {
    for (let x = 4; x < HW - 4; x++) {
      w.setBlock(x0 + x, 1, z0 + z, BLOCK_MARBLE);
    }
  }
  for (let x = 4; x < HW - 4; x++) {
    w.setBlock(x0 + x, 1, z0 + stageFrontLocal, BLOCK_GOLD);
  }
  for (let z = stageFrontLocal; z < northWallLocal; z++) {
    w.setBlock(x0 + 4, 1, z0 + z, BLOCK_GOLD);
    w.setBlock(x0 + HW - 5, 1, z0 + z, BLOCK_GOLD);
  }

  addStageFrontSteps(w, x0, z0, centerX, stageFrontLocal);

  // Marble pad where the ceremony arch sits (3D prop handles the arch art)
  const altarLocalZ = HD - 7;
  for (let x = centerX - 5; x < centerX + 5; x++) {
    w.setBlock(x0 + x, 2, z0 + altarLocalZ, BLOCK_MARBLE);
    w.setBlock(x0 + x, 2, z0 + altarLocalZ + 1, BLOCK_MARBLE);
  }
  for (let x = centerX - 4; x < centerX + 4; x++) {
    w.setBlock(x0 + x, 2, z0 + altarLocalZ, BLOCK_GOLD);
  }

  // Curtain panels flanking the portrait zone on the north wall
  for (let y = 2; y <= wallHeight - 1; y++) {
    for (let dx = 8; dx <= 14; dx++) {
      w.setBlock(x0 + centerX - dx, y, z0 + northWallLocal, BLOCK_CURTAIN);
      w.setBlock(x0 + centerX + dx - 1, y, z0 + northWallLocal, BLOCK_CURTAIN);
    }
  }

  // Chandelier under the dome center
  const chandZ = Math.floor(HD * 0.42);
  const chandY = wallHeight - 1;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > 3) continue;
      w.setBlock(x0 + centerX + dx, chandY, z0 + chandZ + dz, BLOCK_GOLD);
    }
  }
  w.setBlock(x0 + centerX, chandY - 1, z0 + chandZ, BLOCK_LIGHT);
  w.setBlock(x0 + centerX, chandY + 1, z0 + chandZ, BLOCK_GOLD);
  w.setBlock(x0 + centerX - 1, chandY - 1, z0 + chandZ, BLOCK_LIGHT);
  w.setBlock(x0 + centerX + 1, chandY - 1, z0 + chandZ, BLOCK_LIGHT);

  addHallDome(w, x0, z0, HW, HD, wallHeight);
}

/** Halı önünde sarı-beyaz zemin (çarpışma collisionBoxes ile). */
function addStageFrontSteps(
  w: WorldWriter,
  x0: number,
  z0: number,
  centerX: number,
  stageFrontLocal: number,
): void {
  for (let zOff = -4; zOff <= -1; zOff++) {
    for (let dx = -3; dx < 3; dx++) {
      const block = (zOff + dx) % 2 === 0 ? BLOCK_GOLD : BLOCK_MARBLE;
      w.setBlock(x0 + centerX + dx, 0, z0 + stageFrontLocal + zOff, block);
    }
  }
}

/** Görsel merdivenle aynı ölçülerde basamak çarpışma kutuları. */
function buildWeddingStairCollisionBoxes(origin: {
  x: number;
  y: number;
  z: number;
}): CollisionBox[] {
  const stepCount = 7;
  const totalH = 1.0;
  const stepH = totalH / stepCount;
  const stepD = 0.42;
  const width = 4.2;
  const boxes: CollisionBox[] = [];

  for (let i = 0; i < stepCount; i++) {
    const w = width - i * 0.08;
    const depth = stepD - 0.02;
    const localZ = -((stepCount - 1 - i) * stepD);
    const minY = origin.y + stepH * i;
    const maxY = origin.y + stepH * (i + 1);
    const centerZ = origin.z + localZ;
    boxes.push({
      minX: origin.x - w * 0.5,
      maxX: origin.x + w * 0.5,
      minY,
      maxY,
      minZ: centerZ - depth * 0.5,
      maxZ: centerZ + depth * 0.5,
    });
  }

  return boxes;
}

function placeGuestTables(
  w: WorldWriter,
  x0: number,
  z0: number,
  HW: number,
  centerX: number,
  stageFrontLocal: number,
): void {
  const aisleClear = 6;
  const tableCenters: Array<[number, number]> = [];

  // Left and right table clusters — spaced for a spacious luxury feel
  for (let z = 8; z < stageFrontLocal - 4; z += 6) {
    tableCenters.push([centerX - 12, z]);
    tableCenters.push([centerX + 11, z]);
    if (z + 3 < stageFrontLocal - 4) {
      tableCenters.push([centerX - 18, z + 3]);
      tableCenters.push([centerX + 17, z + 3]);
    }
  }

  for (const [tx, tz] of tableCenters) {
    if (tx < 5 || tx >= HW - 6) continue;
    if (Math.abs(tx - centerX) < aisleClear) continue;

    // 2×2 wood table top
    for (let dx = 0; dx < 2; dx++) {
      for (let dz = 0; dz < 2; dz++) {
        w.setBlock(x0 + tx + dx, 1, z0 + tz + dz, BLOCK_WOOD);
      }
    }
    // Center gold accent on table
    w.setBlock(x0 + tx, 1, z0 + tz, BLOCK_MARBLE);
    w.setBlock(x0 + tx + 1, 1, z0 + tz + 1, BLOCK_MARBLE);

    // Chairs around the table
    const seats: Array<[number, number]> = [
      [tx - 1, tz],
      [tx - 1, tz + 1],
      [tx + 2, tz],
      [tx + 2, tz + 1],
      [tx, tz - 1],
      [tx + 1, tz + 2],
    ];
    for (const [sx, sz] of seats) {
      if (sx < 4 || sx >= HW - 4) continue;
      if (Math.abs(sx - centerX) < aisleClear - 1) continue;
      if (sz < 4 || sz >= stageFrontLocal - 1) continue;
      w.setBlock(x0 + sx, 1, z0 + sz, BLOCK_SEAT);
    }
  }
}

/** Hollow stepped spherical ceiling — concave voxel dome visible from inside. */
function addHallDome(
  w: WorldWriter,
  x0: number,
  z0: number,
  HW: number,
  HD: number,
  wallHeight: number,
): void {
  const cx = x0 + (HW - 1) / 2;
  const cz = z0 + (HD - 1) / 2;
  const hallMinX = x0 + 2;
  const hallMaxX = x0 + HW - 3;
  const hallMinZ = z0 + 2;
  const hallMaxZ = z0 + HD - 3;
  const radiusX = (hallMaxX - hallMinX) / 2;
  const radiusZ = (hallMaxZ - hallMinZ) / 2;
  const domeLayers = 10;
  const baseY = wallHeight + 1;
  const maxY = w.height - 2;

  for (let x = hallMinX; x <= hallMaxX; x++) {
    for (let z = hallMinZ; z <= hallMaxZ; z++) {
      const dx = (x - cx) / radiusX;
      const dz = (z - cz) / radiusZ;
      const horiz = dx * dx + dz * dz;

      let layerIndex: number;
      if (horiz <= 1) {
        layerIndex = Math.max(0, Math.round(domeLayers * Math.sqrt(1 - horiz)) - 1);
      } else {
        const cornerDist = Math.max(Math.abs(dx), Math.abs(dz));
        layerIndex = Math.max(0, Math.round((1 - Math.min(1, cornerDist)) * 1.5));
      }

      const y = Math.min(baseY + layerIndex, maxY);
      const block =
        layerIndex >= domeLayers - 2
          ? BLOCK_MARBLE
          : layerIndex % 2 === 0
            ? BLOCK_GOLD
            : BLOCK_MARBLE;
      w.setBlock(x, y, z, block);
    }
  }

  const peakY = Math.min(baseY + domeLayers - 1, maxY);
  w.setBlock(Math.floor(cx), Math.min(peakY + 1, maxY), Math.floor(cz), BLOCK_GLASS);
  w.setBlock(Math.floor(cx), peakY, Math.floor(cz), BLOCK_LIGHT);
}
