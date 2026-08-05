import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_ASPHALT,
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
 * Dubai luxury compound on a long desert highway: marble villa, infinity pool,
 * Lamborghini, and kilometres of asphalt for driving. Peaceful exploration only.
 */
export function generateDubai(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const cx = Math.floor(W / 2);
  // Villa sits in the northern third so the highway has a long south run
  const villaX = cx - 11;
  const villaZ = Math.floor(D * 0.22);
  const roadCenterX = villaX + 27; // east of villa + terrace — highway stays outside
  const roadHalfW = 2; // total width ~5 blocks
  const roadNorthZ = Math.max(4, villaZ - 28);
  const roadSouthZ = D - 6;

  // Desert sand floor everywhere
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      w.setBlock(x, 1, z, BLOCK_SAND);
    }
  }

  // Soft dune undulation — keep the highway corridor flat
  for (let z = 2; z < D - 2; z++) {
    for (let x = 2; x < W - 2; x++) {
      if (isNearHighway(x, z, roadCenterX, roadHalfW, roadNorthZ, roadSouthZ, villaX, villaZ)) {
        continue;
      }
      const dx = x - cx;
      const dz = z - villaZ;
      const dist = Math.sqrt(dx * dx + dz * dz * 0.35);
      const noise = Math.sin(x * 0.35) * Math.cos(z * 0.18) + Math.sin((x + z) * 0.12);
      if (dist > 22 && noise > 0.55) {
        w.setBlock(x, 2, z, BLOCK_SAND);
      }
      if (dist > 36 && noise > 1.05) {
        w.setBlock(x, 3, z, BLOCK_SAND);
      }
    }
  }

  buildLuxuryVilla(w, villaX, villaZ);
  buildAsphaltHighway(w, villaX, villaZ, roadCenterX, roadHalfW, roadNorthZ, roadSouthZ);
  placeSkyline(w, cx);
  placeVillaEntranceStepFloor(w, villaX, villaZ);
  flattenLamborghiniPad(w, villaX, villaZ);

  const stairsOrigin = {
    x: villaX + 10.5,
    y: 1.01,
    z: villaZ + VILLA_DEPTH - 0.15,
  };

  const lamboX = villaX + 10.5;
  // Pad surface is top of block y=2 → world y=3; wheels sit just above
  const lamboY = 3.01;
  const lamboZ = villaZ + VILLA_DEPTH + 12;
  // Model nose is -Z locally; Math.PI aims +Z south down the highway
  const lamboRotation = Math.PI;

  const salonX = villaX + 9;
  const salonZ = villaZ + 6.5;
  // Sofa is rotated 90° — long axis runs along Z, front faces east (+X) toward the TV.
  const sofaSeatY = 3.62;
  const sofaFacingTv = Math.PI / 2;
  const brideSeatZ = salonZ - 0.42;
  const groomSeatZ = salonZ + 0.42;
  const seatX = salonX - 0.05;

  const props: PropSpec[] = [
    {
      kind: 'wedding-steps',
      x: stairsOrigin.x,
      y: stairsOrigin.y,
      z: stairsOrigin.z,
      rotationY: Math.PI,
    },
    ...placeVillaFurniture(villaX, villaZ),
    ...placePalmTrees(cx, villaZ, villaX, roadCenterX, roadNorthZ, roadSouthZ),
    {
      kind: 'lamborghini',
      x: lamboX,
      y: lamboY,
      z: lamboZ,
      rotationY: lamboRotation,
      scale: 1,
    },
  ];

  const locals = placeFriendlyLocals(villaX, villaZ, cx, roadCenterX);

  const npcs: NpcSpec[] = [
    {
      type: 'bride',
      x: seatX,
      y: sofaSeatY,
      z: brideSeatZ,
      rotationY: sofaFacingTv,
      pose: 'sitting',
    },
    {
      type: 'groom',
      x: seatX,
      y: sofaSeatY,
      z: groomSeatZ,
      rotationY: sofaFacingTv,
      pose: 'sitting',
    },
    ...locals.npcs,
  ];

  const interactables: InteractableSpec[] = [
    {
      kind: 'bride-chat',
      x: seatX,
      y: sofaSeatY,
      z: brideSeatZ,
      radius: 2.6,
    },
    {
      kind: 'groom-chat',
      x: seatX,
      y: sofaSeatY,
      z: groomSeatZ,
      radius: 2.6,
    },
    {
      kind: 'lamborghini-drive',
      x: lamboX,
      y: lamboY,
      z: lamboZ,
      radius: 3.2,
    },
    {
      kind: 'plasma-tv',
      x: villaX + 18.5,
      y: 3.01,
      z: villaZ + 6.5,
      radius: 4.5,
    },
    ...locals.interactables,
  ];

  const spawnX = villaX + 9;
  const spawnZ = villaZ + 26;

  return {
    playerSpawn: new THREE.Vector3(spawnX + 0.5, 3.01, spawnZ + 0.5),
    playerFacing: Math.PI,
    enemySpawnRegion: {
      minX: cx - 2,
      maxX: cx + 2,
      minZ: villaZ - 2,
      maxZ: villaZ + 2,
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

  // Ceiling lights — keep away from the east-wall TV (living room)
  w.setBlock(ox + 6, 6, oz + 5, BLOCK_LIGHT);
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

function isNearHighway(
  x: number,
  z: number,
  roadCenterX: number,
  roadHalfW: number,
  roadNorthZ: number,
  roadSouthZ: number,
  villaX: number,
  villaZ: number,
): boolean {
  // Main N–S highway corridor (+ shoulders)
  if (
    z >= roadNorthZ - 2 &&
    z <= roadSouthZ + 2 &&
    x >= roadCenterX - roadHalfW - 3 &&
    x <= roadCenterX + roadHalfW + 3
  ) {
    return true;
  }
  // Villa bypass / parking apron (south of house, outside walls)
  if (
    z >= villaZ + VILLA_DEPTH + 9 &&
    z <= villaZ + VILLA_DEPTH + 17 &&
    x >= villaX + 4 &&
    x <= roadCenterX + roadHalfW + 3
  ) {
    return true;
  }
  // South turnaround plaza
  if (z >= roadSouthZ - 14 && z <= roadSouthZ + 2 && x >= roadCenterX - 18 && x <= roadCenterX + 18) {
    return true;
  }
  return false;
}

/**
 * Long asphalt highway for Lamborghini driving: wide N–S strip past the villa,
 * connector to the parking pad, dashed center line, and a south U-turn loop.
 */
function buildAsphaltHighway(
  w: WorldWriter,
  villaX: number,
  villaZ: number,
  roadCenterX: number,
  roadHalfW: number,
  roadNorthZ: number,
  roadSouthZ: number,
): void {
  const paint = (x: number, z: number, centerDash = false): void => {
    if (x < 1 || x >= w.width - 1 || z < 1 || z >= w.depth - 1) return;
    w.setBlock(x, 3, z, BLOCK_AIR);
    w.setBlock(x, 4, z, BLOCK_AIR);
    w.setBlock(x, 1, z, BLOCK_STONE);
    w.setBlock(x, 2, z, centerDash ? BLOCK_PATH : BLOCK_ASPHALT);
  };

  const x0 = roadCenterX - roadHalfW;
  const x1 = roadCenterX + roadHalfW;

  // Main north–south highway (runs east of the villa, never through it)
  for (let z = roadNorthZ; z <= roadSouthZ; z++) {
    for (let x = x0; x <= x1; x++) {
      const dash = x === roadCenterX && z % 4 < 2;
      paint(x, z, dash);
    }
    // Gold shoulder trim
    w.setBlock(x0 - 1, 2, z, BLOCK_GOLD);
    w.setBlock(x1 + 1, 2, z, BLOCK_GOLD);
    w.setBlock(x0 - 1, 1, z, BLOCK_STONE);
    w.setBlock(x1 + 1, 1, z, BLOCK_STONE);
  }

  // East–west bypass: Lamborghini pad → highway, along the south outside the villa
  const bypassZ0 = villaZ + VILLA_DEPTH + 10;
  const bypassZ1 = villaZ + VILLA_DEPTH + 16;
  const bypassX0 = villaX + 5;
  for (let z = bypassZ0; z <= bypassZ1; z++) {
    for (let x = bypassX0; x <= x1; x++) {
      paint(x, z, x === roadCenterX && z % 4 < 2);
    }
    w.setBlock(bypassX0 - 1, 2, z, BLOCK_GOLD);
    w.setBlock(x1 + 1, 2, z, BLOCK_GOLD);
  }
  for (let x = bypassX0; x <= x1; x++) {
    w.setBlock(x, 2, bypassZ0 - 1, BLOCK_GOLD);
    w.setBlock(x, 2, bypassZ1 + 1, BLOCK_GOLD);
  }

  // Short north link from pad up to the bypass (east side of pool / pad)
  const linkX = villaX + 14;
  for (let z = villaZ + VILLA_DEPTH + 6; z < bypassZ0; z++) {
    paint(linkX, z, false);
    paint(linkX + 1, z, false);
    w.setBlock(linkX - 1, 2, z, BLOCK_GOLD);
    w.setBlock(linkX + 2, 2, z, BLOCK_GOLD);
  }

  // South turnaround plaza — solid asphalt pad (no hollow center / pit)
  const loopInner = roadSouthZ - 12;
  const loopOuter = roadSouthZ;
  const loopLeft = roadCenterX - 14;
  const loopRight = roadCenterX + 14;
  for (let z = loopInner; z <= loopOuter; z++) {
    for (let x = loopLeft; x <= loopRight; x++) {
      paint(x, z, x === roadCenterX && z % 4 < 2);
    }
  }
  // Gold trim around the plaza edge
  for (let x = loopLeft; x <= loopRight; x++) {
    w.setBlock(x, 1, loopOuter + 1, BLOCK_STONE);
    w.setBlock(x, 2, loopOuter + 1, BLOCK_GOLD);
    w.setBlock(x, 1, loopInner - 1, BLOCK_STONE);
    w.setBlock(x, 2, loopInner - 1, BLOCK_GOLD);
  }
  for (let z = loopInner; z <= loopOuter; z++) {
    w.setBlock(loopLeft - 1, 1, z, BLOCK_STONE);
    w.setBlock(loopLeft - 1, 2, z, BLOCK_GOLD);
    w.setBlock(loopRight + 1, 1, z, BLOCK_STONE);
    w.setBlock(loopRight + 1, 2, z, BLOCK_GOLD);
  }
}

/** Distant decorative skyscraper silhouettes along the far north edge. */
function placeSkyline(w: WorldWriter, cx: number): void {
  const towers: Array<[number, number, number]> = [];
  for (let i = -5; i <= 5; i++) {
    towers.push([cx + i * 10, 3 + (Math.abs(i) % 3), 10 + ((i * i) % 12)]);
  }

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
    { kind: 'plasma-tv', x: villaX + 18.5, y, z: villaZ + 6.5, rotationY: -Math.PI / 2, scale: 3.3 },
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

/** Camels & local Arab NPCs scattered around the compound — friendly chatter. */
function placeFriendlyLocals(
  villaX: number,
  villaZ: number,
  cx: number,
  roadCenterX: number,
): { npcs: NpcSpec[]; interactables: InteractableSpec[] } {
  const npcs: NpcSpec[] = [];
  const interactables: InteractableSpec[] = [];

  // Open sand beside the highway / villa — not on asphalt
  const camels: Array<[number, number, number, string]> = [
    [villaX - 12, villaZ + 30, Math.PI * 0.35, 'Jamal'],
    [roadCenterX + 14, villaZ + 55, -Math.PI * 0.6, 'Habibi-Deve'],
    [roadCenterX - 16, villaZ + 90, Math.PI, 'WAHEED-Camel'],
  ];
  for (const [x, z, rot, name] of camels) {
    npcs.push({
      type: 'camel',
      x: x + 0.5,
      y: 2.01,
      z: z + 0.5,
      rotationY: rot,
      wander: true,
      wanderRadius: 7,
    });
    interactables.push({
      kind: 'camel-chat',
      x: x + 0.5,
      y: 2.01,
      z: z + 0.5,
      radius: 3.2,
      speakerName: name,
    });
  }

  const arabs: Array<['arab-man' | 'arab-woman', number, number, number, string]> = [
    ['arab-man', villaX + 21, villaZ + 34, Math.PI * 1.15, 'Waheed'],
    ['arab-man', villaX - 10, villaZ + 28, Math.PI * 0.4, 'Ahmed'],
    ['arab-woman', roadCenterX + 12, villaZ + 40, -Math.PI * 0.3, 'Fatima'],
    ['arab-woman', cx - 18, villaZ + 20, Math.PI * 0.8, 'Layla'],
  ];
  for (const [type, x, z, rot, name] of arabs) {
    npcs.push({
      type,
      x: x + 0.5,
      y: 2.01,
      z: z + 0.5,
      rotationY: rot,
      wander: true,
      wanderRadius: 5.5,
    });
    interactables.push({
      kind: 'arab-chat',
      x: x + 0.5,
      y: 2.01,
      z: z + 0.5,
      radius: 2.8,
      speakerName: name,
    });
  }

  return { npcs, interactables };
}

function placePalmTrees(
  cx: number,
  villaZ: number,
  villaX: number,
  roadCenterX: number,
  roadNorthZ: number,
  roadSouthZ: number,
): PropSpec[] {
  const props: PropSpec[] = [];
  const spots: Array<[number, number]> = [
    [villaX - 4, villaZ + 8],
    [villaX - 5, villaZ + 18],
    [villaX + 24, villaZ + 8],
    [villaX + 2, villaZ - 4],
    [villaX + 18, villaZ - 4],
    [cx - 22, villaZ + 12],
    [cx + 28, villaZ + 16],
  ];

  // Roadside palm avenue along the highway
  for (let z = roadNorthZ + 4; z < roadSouthZ - 4; z += 8) {
    spots.push([roadCenterX - 6, z]);
    spots.push([roadCenterX + 6, z + 4]);
  }

  for (const [x, z] of spots) {
    if (isInVillaZone(x, z, villaX, villaZ) && z < villaZ + 20) continue;
    if (x >= villaX + 5 && x <= villaX + 17 && z >= villaZ + 20 && z <= villaZ + 27) continue;
    if (x >= villaX + 5 && x <= villaX + 15 && z >= villaZ + 26 && z <= villaZ + 32) continue;
    // Keep palms off the asphalt itself
    if (Math.abs(x - roadCenterX) <= 3) continue;
    // Keep palms off the south turnaround plaza
    if (
      z >= roadSouthZ - 14 &&
      z <= roadSouthZ + 2 &&
      x >= roadCenterX - 16 &&
      x <= roadCenterX + 16
    ) {
      continue;
    }
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
