import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_CARPET,
  BLOCK_GLASS,
  BLOCK_GOLD,
  BLOCK_LIGHT,
  BLOCK_MARBLE,
  BLOCK_PATH,
  BLOCK_ROCK,
  BLOCK_SAND,
  BLOCK_STONE,
  BLOCK_WATER,
} from '../../data/blocks';
import type {
  CollisionBox,
  GeneratorResult,
  InteractableSpec,
  NpcSpec,
  PropSpec,
  WorldWriter,
} from './types';

const VILLA_DEPTH = 16;

/**
 * Dubai luxury compound: desert dunes, marble villa with infinity pool,
 * Lamborghini out front, bride & groom lounging in the living room.
 * Peaceful exploration only — no combat spawns.
 */
export function generateDubai(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const cx = Math.floor(W / 2);
  const cz = Math.floor(D / 2);

  // Desert sand floor everywhere
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      w.setBlock(x, 1, z, BLOCK_SAND);
    }
  }

  // Soft dune undulation (extra sand mounds)
  for (let z = 2; z < D - 2; z++) {
    for (let x = 2; x < W - 2; x++) {
      const dx = x - cx;
      const dz = z - cz;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const noise = Math.sin(x * 0.35) * Math.cos(z * 0.28) + Math.sin((x + z) * 0.15);
      if (dist > 18 && noise > 0.55) {
        w.setBlock(x, 2, z, BLOCK_SAND);
      }
      if (dist > 26 && noise > 1.1) {
        w.setBlock(x, 3, z, BLOCK_SAND);
      }
    }
  }

  const villaX = cx - 11;
  const villaZ = cz - 10;
  buildLuxuryVilla(w, villaX, villaZ);
  buildApproachRoad(w, villaX, villaZ, cx);
  placeSkyline(w, cx);
  placeVillaEntranceStepFloor(w, villaX, villaZ);
  flattenLamborghiniPad(w, villaX, villaZ);

  const stairsOrigin = {
    x: villaX + 10.5,
    y: 1.01,
    z: villaZ + VILLA_DEPTH - 0.15,
  };

  const lamboX = villaX + 10.5;
  const lamboY = 2.01;
  const lamboZ = villaZ + VILLA_DEPTH + 12;
  const lamboRotation = Math.PI;

  const salonX = villaX + 9;
  const salonZ = villaZ + 6.5;
  const sofaX = salonX;
  const sofaZ = salonZ;

  const props: PropSpec[] = [
    {
      kind: 'wedding-steps',
      x: stairsOrigin.x,
      y: stairsOrigin.y,
      z: stairsOrigin.z,
      rotationY: Math.PI,
    },
    ...placeVillaFurniture(villaX, villaZ),
    ...placePalmTrees(cx, cz, villaX, villaZ),
    {
      kind: 'lamborghini',
      x: lamboX,
      y: lamboY,
      z: lamboZ,
      rotationY: lamboRotation,
      scale: 1,
    },
  ];

  const npcs: NpcSpec[] = [
    {
      type: 'bride',
      x: sofaX - 0.55,
      y: 3.01,
      z: sofaZ + 0.15,
      rotationY: Math.PI * 0.5 + 0.2,
    },
    {
      type: 'groom',
      x: sofaX + 0.55,
      y: 3.01,
      z: sofaZ + 0.15,
      rotationY: Math.PI * 0.5 - 0.2,
    },
  ];

  const interactables: InteractableSpec[] = [
    {
      kind: 'bride-chat',
      x: sofaX - 0.55,
      y: 3.01,
      z: sofaZ,
      radius: 2.6,
    },
    {
      kind: 'groom-chat',
      x: sofaX + 0.55,
      y: 3.01,
      z: sofaZ,
      radius: 2.6,
    },
    {
      kind: 'lamborghini-drive',
      x: lamboX,
      y: lamboY,
      z: lamboZ,
      radius: 3.2,
    },
  ];

  const spawnX = villaX + 9;
  const spawnZ = villaZ + 26;

  return {
    playerSpawn: new THREE.Vector3(spawnX + 0.5, 2.01, spawnZ + 0.5),
    playerFacing: Math.PI,
    enemySpawnRegion: {
      minX: cx - 2,
      maxX: cx + 2,
      minZ: cz - 2,
      maxZ: cz + 2,
    },
    bannerText: 'Dubai · Lüks Villa',
    bannerPosition: {
      x: villaX + 11,
      y: 8.5,
      z: villaZ - 0.6,
      rotationY: 0,
      style: 'classic',
      width: 8,
      height: 2.2,
    },
    props,
    npcs,
    interactables,
    collisionBoxes: buildVillaEntranceStairCollisionBoxes(stairsOrigin),
  };
}

function buildLuxuryVilla(w: WorldWriter, ox: number, oz: number): void {
  const vw = 22;
  const vd = VILLA_DEPTH;
  const wallH = 5;

  // Raised marble platform + interior floor
  for (let z = 0; z < vd; z++) {
    for (let x = 0; x < vw; x++) {
      w.setBlock(ox + x, 1, oz + z, BLOCK_MARBLE);
      w.setBlock(ox + x, 2, oz + z, BLOCK_MARBLE);
    }
  }

  // Outer terrace ring
  for (let z = -2; z < vd + 2; z++) {
    for (let x = -2; x < vw + 2; x++) {
      if (x >= 0 && x < vw && z >= 0 && z < vd) continue;
      const wx = ox + x;
      const wz = oz + z;
      if (wx < 1 || wx >= w.width - 1 || wz < 1 || wz >= w.depth - 1) continue;
      w.setBlock(wx, 1, wz, BLOCK_MARBLE);
      w.setBlock(wx, 2, wz, BLOCK_PATH);
    }
  }

  // White marble columns + glass walls (gold accents)
  for (let y = 3; y <= 2 + wallH; y++) {
    for (let x = 0; x < vw; x++) {
      const isCorner = x === 0 || x === vw - 1;
      const isWindow = x % 3 === 1;
      const isGoldBand = y === 3 || y === 2 + wallH;
      if (isCorner) {
        w.setBlock(ox + x, y, oz, BLOCK_MARBLE);
        w.setBlock(ox + x, y, oz + vd - 1, BLOCK_MARBLE);
      } else if (isWindow && y >= 4 && y <= 6) {
        w.setBlock(ox + x, y, oz, BLOCK_GLASS);
        w.setBlock(ox + x, y, oz + vd - 1, BLOCK_GLASS);
      } else if (isGoldBand) {
        w.setBlock(ox + x, y, oz, y === 3 ? BLOCK_GOLD : BLOCK_MARBLE);
        w.setBlock(ox + x, y, oz + vd - 1, y === 3 ? BLOCK_GOLD : BLOCK_MARBLE);
      } else {
        w.setBlock(ox + x, y, oz, BLOCK_MARBLE);
        w.setBlock(ox + x, y, oz + vd - 1, BLOCK_MARBLE);
      }
    }
    for (let z = 0; z < vd; z++) {
      const isCorner = z === 0 || z === vd - 1;
      const isWindow = z % 3 === 1;
      const isGoldBand = y === 3 || y === 2 + wallH;
      if (isCorner) {
        w.setBlock(ox, y, oz + z, BLOCK_MARBLE);
        w.setBlock(ox + vw - 1, y, oz + z, BLOCK_MARBLE);
      } else if (isWindow && y >= 4 && y <= 6) {
        w.setBlock(ox, y, oz + z, BLOCK_GLASS);
        w.setBlock(ox + vw - 1, y, oz + z, BLOCK_GLASS);
      } else if (isGoldBand) {
        w.setBlock(ox, y, oz + z, y === 3 ? BLOCK_GOLD : BLOCK_MARBLE);
        w.setBlock(ox + vw - 1, y, oz + z, y === 3 ? BLOCK_GOLD : BLOCK_MARBLE);
      } else {
        w.setBlock(ox, y, oz + z, BLOCK_MARBLE);
        w.setBlock(ox + vw - 1, y, oz + z, BLOCK_MARBLE);
      }
    }
  }

  // Open south entrance (front)
  for (let dx = 9; dx <= 12; dx++) {
    for (let y = 3; y <= 6; y++) {
      w.setBlock(ox + dx, y, oz + vd - 1, BLOCK_AIR);
    }
    w.setBlock(ox + dx, 2, oz + vd - 1, BLOCK_PATH);
  }

  // Living-area carpet under sofa / lounge
  for (let z = 4; z <= 8; z++) {
    for (let x = 6; x <= 12; x++) {
      w.setBlock(ox + x, 2, oz + z, BLOCK_CARPET);
    }
  }

  // Interior gold trim — flush against north/south walls
  for (let x = 2; x < vw - 2; x++) {
    w.setBlock(ox + x, 3, oz + 1, BLOCK_GOLD);
    w.setBlock(ox + x, 3, oz + vd - 2, BLOCK_GOLD);
  }

  // Ceiling lights
  w.setBlock(ox + 6, 6, oz + 5, BLOCK_LIGHT);
  w.setBlock(ox + 15, 6, oz + 5, BLOCK_LIGHT);
  w.setBlock(ox + 11, 6, oz + 10, BLOCK_LIGHT);

  // Flat luxury roof with gold edge
  const roofY = 3 + wallH;
  for (let z = -1; z < vd + 1; z++) {
    for (let x = -1; x < vw + 1; x++) {
      const edge = x === -1 || x === vw || z === -1 || z === vd;
      w.setBlock(ox + x, roofY, oz + z, edge ? BLOCK_GOLD : BLOCK_MARBLE);
    }
  }
  for (let z = 1; z < vd - 1; z++) {
    for (let x = 1; x < vw - 1; x++) {
      w.setBlock(ox + x, roofY + 1, oz + z, BLOCK_STONE);
    }
  }

  // Infinity pool on south terrace (front of villa) — set back so entrance stairs fit in front
  const poolX0 = ox + 5;
  const poolZ0 = oz + vd + 4;
  for (let z = 0; z < 7; z++) {
    for (let x = 0; x < 12; x++) {
      const px = poolX0 + x;
      const pz = poolZ0 + z;
      if (px < 1 || px >= w.width - 1 || pz < 1 || pz >= w.depth - 1) continue;
      if (x === 0 || x === 11 || z === 0 || z === 6) {
        w.setBlock(px, 1, pz, BLOCK_MARBLE);
        w.setBlock(px, 2, pz, BLOCK_MARBLE);
      } else {
        w.setBlock(px, 1, pz, BLOCK_ROCK);
        w.setBlock(px, 2, pz, BLOCK_WATER);
        w.setBlock(px, 3, pz, BLOCK_AIR);
      }
    }
  }

  // Stairs / steps from south terrace down toward approach
  for (let s = 0; s < 3; s++) {
    for (let dx = 9; dx <= 12; dx++) {
      w.setBlock(ox + dx, 2, oz + vd + 8 + s, BLOCK_MARBLE);
      if (s >= 1) w.setBlock(ox + dx, 1, oz + vd + 8 + s, BLOCK_PATH);
    }
  }
}

/** Gold/marble approach pad in front of the villa entrance (matches wedding hall steps). */
function placeVillaEntranceStepFloor(w: WorldWriter, ox: number, oz: number): void {
  const centerX = ox + 10.5;
  const frontZ = oz + VILLA_DEPTH - 1;
  for (let zOff = 1; zOff <= 4; zOff++) {
    for (let dx = -2; dx <= 2; dx++) {
      const block = (zOff + dx) % 2 === 0 ? BLOCK_GOLD : BLOCK_MARBLE;
      const wx = Math.floor(centerX) + dx;
      const wz = frontZ + zOff;
      if (wx < 1 || wx >= w.width - 1 || wz < 1 || wz >= w.depth - 1) continue;
      w.setBlock(wx, 1, wz, block);
    }
  }
}

/** Wedding-hall stair collision mirrored south (+Z) toward the desert approach. */
function buildVillaEntranceStairCollisionBoxes(origin: {
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
    const localZ = (stepCount - 1 - i) * stepD;
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

/** Flat parking slab behind the infinity pool — no dunes or dips. */
function flattenLamborghiniPad(w: WorldWriter, ox: number, oz: number): void {
  const padMinX = ox + 6;
  const padMaxX = ox + 14;
  const padMinZ = oz + VILLA_DEPTH + 10;
  const padMaxZ = oz + VILLA_DEPTH + 15;

  for (let z = padMinZ; z <= padMaxZ; z++) {
    for (let x = padMinX; x <= padMaxX; x++) {
      if (x < 1 || x >= w.width - 1 || z < 1 || z >= w.depth - 1) continue;
      w.setBlock(x, 3, z, BLOCK_AIR);
      w.setBlock(x, 2, z, BLOCK_PATH);
      w.setBlock(x, 1, z, BLOCK_STONE);
    }
  }

  for (let z = padMinZ; z <= padMaxZ; z++) {
    w.setBlock(padMinX - 1, 2, z, BLOCK_GOLD);
    w.setBlock(padMaxX + 1, 2, z, BLOCK_GOLD);
  }
  for (let x = padMinX; x <= padMaxX; x++) {
    w.setBlock(x, 2, padMinZ - 1, BLOCK_GOLD);
    w.setBlock(x, 2, padMaxZ + 1, BLOCK_GOLD);
  }
}

function buildApproachRoad(w: WorldWriter, villaX: number, villaZ: number, _cx: number): void {
  const roadZ0 = villaZ + 24;
  const roadZ1 = villaZ + 30;
  for (let z = roadZ0; z <= roadZ1; z++) {
    for (let x = villaX + 7; x <= villaX + 14; x++) {
      if (x < 1 || x >= w.width - 1 || z < 1 || z >= w.depth - 1) continue;
      w.setBlock(x, 1, z, BLOCK_STONE);
      w.setBlock(x, 2, z, BLOCK_PATH);
    }
  }
  // Gold trim along road edges
  for (let z = roadZ0; z <= roadZ1; z++) {
    w.setBlock(villaX + 6, 2, z, BLOCK_GOLD);
    w.setBlock(villaX + 15, 2, z, BLOCK_GOLD);
  }
}

/** Distant decorative skyscraper silhouettes along the north edge. */
function placeSkyline(w: WorldWriter, cx: number): void {
  const towers: Array<[number, number, number]> = [
    [cx - 28, 4, 12],
    [cx - 22, 3, 16],
    [cx - 16, 5, 10],
    [cx - 8, 4, 18],
    [cx, 6, 22],
    [cx + 6, 5, 14],
    [cx + 14, 4, 11],
    [cx + 22, 3, 15],
    [cx + 28, 4, 9],
  ];

  for (const [tx, tz, h] of towers) {
    const baseW = 2 + (h % 3);
    for (let y = 2; y < 2 + h && y < w.height - 1; y++) {
      for (let dx = 0; dx < baseW; dx++) {
        for (let dz = 0; dz < baseW; dz++) {
          const wx = tx + dx;
          const wz = tz + dz;
          if (wx < 1 || wx >= w.width - 1 || wz < 1 || wz >= w.depth - 1) continue;
          const glass = y > 4 && (dx + dz + y) % 3 === 0;
          w.setBlock(wx, y, wz, glass ? BLOCK_GLASS : BLOCK_STONE);
        }
      }
    }
    // Gold spire tip
    const tipY = Math.min(w.height - 1, 2 + h);
    w.setBlock(tx + 1, tipY, tz + 1, BLOCK_GOLD);
  }
}

function placeVillaFurniture(villaX: number, villaZ: number): PropSpec[] {
  const y = 3.01;
  const props: PropSpec[] = [
    { kind: 'king-bed', x: villaX + 4.5, y, z: villaZ + 4.5, rotationY: 0 },
    // Sofa faces east toward TV — bride & groom sit here
    { kind: 'sofa', x: villaX + 9, y, z: villaZ + 6.5, rotationY: Math.PI / 2 },
    { kind: 'plasma-tv', x: villaX + 18.5, y, z: villaZ + 6.5, rotationY: -Math.PI / 2 },
    { kind: 'dining-table', x: villaX + 15, y, z: villaZ + 12, rotationY: 0 },
  ];

  const tableX = villaX + 15;
  const tableZ = villaZ + 12;
  const chairs: Array<[number, number, number]> = [
    [tableX, tableZ - 1.0, Math.PI],
    [tableX, tableZ + 1.0, 0],
    [tableX - 1.1, tableZ, Math.PI / 2],
    [tableX + 1.1, tableZ, -Math.PI / 2],
  ];
  for (const [cx, cz, rot] of chairs) {
    props.push({ kind: 'dining-chair', x: cx, y, z: cz, rotationY: rot });
  }

  return props;
}

function isInVillaZone(x: number, z: number, villaX: number, villaZ: number): boolean {
  const vw = 22;
  const vd = VILLA_DEPTH;
  return (
    x >= villaX - 3 &&
    x <= villaX + vw + 3 &&
    z >= villaZ - 3 &&
    z <= villaZ + vd + 12
  );
}

function placePalmTrees(cx: number, cz: number, villaX: number, villaZ: number): PropSpec[] {
  const props: PropSpec[] = [];
  const spots: Array<[number, number]> = [
    [villaX - 4, villaZ + 8],
    [villaX - 5, villaZ + 18],
    [villaX + 24, villaZ + 8],
    [villaX + 25, villaZ + 18],
    [villaX + 2, villaZ - 4],
    [villaX + 18, villaZ - 4],
    [villaX + 10, villaZ + 28],
    [villaX + 16, villaZ + 28],
    [cx - 20, cz + 10],
    [cx + 22, cz + 12],
    [cx - 18, cz - 14],
    [cx + 20, cz - 12],
    [cx - 10, cz + 24],
    [cx + 12, cz + 22],
  ];

  for (const [x, z] of spots) {
    if (isInVillaZone(x, z, villaX, villaZ) && z < villaZ + 20) continue;
    // Keep palms off the pool and road; allow garden row south of pool
    if (x >= villaX + 5 && x <= villaX + 17 && z >= villaZ + 20 && z <= villaZ + 27) continue;
    if (x >= villaX + 5 && x <= villaX + 15 && z >= villaZ + 26 && z <= villaZ + 32) continue;
    props.push({
      kind: 'palm-tree',
      x: x + 0.5,
      y: 2.01,
      z: z + 0.5,
      rotationY: ((x * 7 + z * 3) % 360) * (Math.PI / 180),
      scale: 0.95 + ((x + z) % 4) * 0.06,
    });
  }

  return props;
}
