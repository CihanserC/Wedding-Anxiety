import * as THREE from 'three';
import {
  BLOCK_AIR,
  BLOCK_CARPET,
  BLOCK_GLASS,
  BLOCK_GOLD,
  BLOCK_GRASS,
  BLOCK_HEDGE,
  BLOCK_LIGHT,
  BLOCK_MARBLE,
  BLOCK_PATH,
  BLOCK_ROCK,
  BLOCK_SAND,
  BLOCK_WATER,
  BLOCK_WOOD,
} from '../../data/blocks';
import type {
  CollisionBox,
  FaunaSpawnSpec,
  GeneratorResult,
  PropSpec,
  TreasureChestSpec,
  WorldWriter,
} from './types';

/**
 * Vast Bali honeymoon island: ocean, sandy beaches, winding river,
 * tropical vegetation props, a luxury villa with infinity pool, and wildlife.
 */
export function generateBali(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;
  const cx = Math.floor(W / 2);
  const cz = Math.floor(D / 2);

  // Ocean floor everywhere
  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_ROCK);
      w.setBlock(x, 1, z, BLOCK_WATER);
    }
  }

  // Main island ellipse (~70×65)
  const islandA = 35 * 35;
  const islandB = 32 * 32;
  for (let z = 4; z < D - 4; z++) {
    for (let x = 4; x < W - 4; x++) {
      const dx = x - cx;
      const dz = z - cz;
      const v = (dx * dx) / islandA + (dz * dz) / islandB;
      if (v <= 1) {
        const edge = v > 0.82;
        w.setBlock(x, 1, z, edge ? BLOCK_SAND : BLOCK_GRASS);
      }
    }
  }

  // Raised grass hills
  placeHills(w, cx, cz);

  // Winding river from inland to south shore
  carveRiver(w, cx, cz);

  // Paths
  const villaX = cx - 18;
  const villaZ = cz - 14;
  for (let z = cz + 8; z <= villaZ + 16; z++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (isLand(w, cx + dx, z)) w.setBlock(cx + dx, 1, z, BLOCK_PATH);
    }
  }
  for (let x = Math.min(cx, villaX + 8); x <= Math.max(cx, villaX + 8); x++) {
    for (let dz = -1; dz <= 1; dz++) {
      const z = villaZ + 16 + dz;
      if (isLand(w, x, z)) w.setBlock(x, 1, z, BLOCK_PATH);
    }
  }

  // Villa
  buildVilla(w, villaX, villaZ);

  // Short wooden dock on south beach for the nearshore boat
  placeSouthDock(w, cx, cz);

  // Voxel vegetation patches (hedges only — no pink flower blocks)
  scatterHedges(w, cx, cz);

  // Hidden rocky cove for the post-clear treasure chest
  const treasureChest = placeRockyCove(w, cx, cz);

  const boats = placeBoats(cx, cz);
  const props = [
    ...placeTropicalProps(cx, cz, villaX, villaZ),
    ...placeVillaFurniture(villaX, villaZ),
    ...boats,
  ];
  const collisionBoxes = boats.flatMap((boat) => buildBoatCollisionBoxes(boat));
  const ambientFauna = placeFauna(w, cx, cz);

  const spawnX = cx + 6;
  const spawnZ = cz + 22;
  return {
    playerSpawn: new THREE.Vector3(spawnX + 0.5, 2.01, spawnZ + 0.5),
    playerFacing: Math.PI,
    enemySpawnRegion: {
      minX: cx - 22,
      maxX: cx + 22,
      minZ: cz - 18,
      maxZ: cz + 18,
    },
    props,
    collisionBoxes,
    ambientFauna,
    treasureChest,
  };
}

/** Southeast rocky nook — chest nestled between boulders, not obvious. */
function placeRockyCove(w: WorldWriter, cx: number, cz: number): TreasureChestSpec {
  const hx = cx + 22;
  const hz = cz - 20;

  // Raise a small rocky pocket on the shore edge
  for (const [dx, dz] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [2, 0],
    [-2, 1],
    [1, -1],
  ] as Array<[number, number]>) {
    w.setBlock(hx + dx, 1, hz + dz, BLOCK_ROCK);
  }

  // Tall boulders forming a partial hide
  const boulders: Array<[number, number, number]> = [
    [hx - 1, 2, hz - 1],
    [hx - 1, 3, hz - 1],
    [hx + 2, 2, hz],
    [hx + 2, 3, hz],
    [hx + 2, 2, hz + 1],
    [hx, 2, hz + 2],
    [hx - 2, 2, hz + 1],
    [hx + 1, 2, hz - 2],
    [hx - 1, 2, hz + 1],
  ];
  for (const [bx, by, bz] of boulders) {
    w.setBlock(bx, by, bz, BLOCK_ROCK);
  }

  // Sand pocket under the chest so it sits naturally
  w.setBlock(hx, 1, hz, BLOCK_SAND);
  w.setBlock(hx, 2, hz, BLOCK_AIR);
  w.setBlock(hx, 3, hz, BLOCK_AIR);

  return {
    x: hx + 0.5,
    y: 2.01,
    z: hz + 0.5,
    rotationY: -0.6,
  };
}

function isLand(w: WorldWriter, x: number, z: number): boolean {
  const id = w.getBlock(x, 1, z);
  return id === BLOCK_GRASS || id === BLOCK_SAND || id === BLOCK_PATH || id === BLOCK_ROCK || id === BLOCK_MARBLE || id === BLOCK_WOOD;
}

function placeHills(w: WorldWriter, cx: number, cz: number): void {
  const hills: Array<[number, number, number]> = [
    [cx - 12, cz - 8, 5],
    [cx + 14, cz - 4, 4],
    [cx + 8, cz + 10, 4],
    [cx - 8, cz + 6, 3],
  ];
  for (const [hx, hz, r] of hills) {
    for (let z = hz - r; z <= hz + r; z++) {
      for (let x = hx - r; x <= hx + r; x++) {
        const dx = x - hx;
        const dz = z - hz;
        if (dx * dx + dz * dz > r * r) continue;
        if (!isLand(w, x, z) && w.getBlock(x, 1, z) !== BLOCK_WATER) continue;
        if (w.getBlock(x, 1, z) === BLOCK_WATER) continue;
        w.setBlock(x, 1, z, BLOCK_GRASS);
        if (dx * dx + dz * dz <= (r - 1) * (r - 1)) {
          w.setBlock(x, 2, z, BLOCK_GRASS);
        }
      }
    }
  }
}

function carveRiver(w: WorldWriter, cx: number, cz: number): void {
  // Meandering path from north-center toward south beach
  const points: Array<[number, number]> = [];
  for (let t = 0; t <= 40; t++) {
    const z = cz - 16 + t;
    const x = cx - 2 + Math.floor(Math.sin(t * 0.35) * 6 + Math.sin(t * 0.12) * 3);
    points.push([x, z]);
  }

  for (const [rx, rz] of points) {
    for (let dx = -1; dx <= 2; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const x = rx + dx;
        const z = rz + dz;
        if (x < 2 || x >= w.width - 2 || z < 2 || z >= w.depth - 2) continue;
        w.setBlock(x, 2, z, BLOCK_AIR);
        w.setBlock(x, 1, z, BLOCK_WATER);
        // Banks
        for (const [bx, bz] of [
          [x - 2, z],
          [x + 3, z],
          [x, z - 2],
          [x, z + 2],
        ] as Array<[number, number]>) {
          if (w.getBlock(bx, 1, bz) === BLOCK_GRASS) {
            w.setBlock(bx, 1, bz, BLOCK_SAND);
          }
        }
      }
    }
  }

  // Stone accents along banks
  for (let i = 0; i < points.length; i += 4) {
    const [rx, rz] = points[i];
    w.setBlock(rx - 2, 1, rz, BLOCK_ROCK);
    w.setBlock(rx + 3, 1, rz + 1, BLOCK_ROCK);
  }
}

function buildVilla(w: WorldWriter, ox: number, oz: number): void {
  const vw = 18;
  const vd = 14;
  const wallH = 4;

  // Raised marble platform
  for (let z = 0; z < vd; z++) {
    for (let x = 0; x < vw; x++) {
      w.setBlock(ox + x, 1, oz + z, BLOCK_MARBLE);
      w.setBlock(ox + x, 2, oz + z, BLOCK_PATH);
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
    }
  }

  // Wood columns + partial glass walls
  for (let y = 3; y <= 2 + wallH; y++) {
    for (let x = 0; x < vw; x++) {
      const isCorner = x === 0 || x === vw - 1;
      const isWindow = x % 3 === 1;
      if (isCorner) {
        w.setBlock(ox + x, y, oz, BLOCK_WOOD);
        w.setBlock(ox + x, y, oz + vd - 1, BLOCK_WOOD);
      } else if (isWindow && y >= 4 && y <= 5) {
        w.setBlock(ox + x, y, oz, BLOCK_GLASS);
        w.setBlock(ox + x, y, oz + vd - 1, BLOCK_GLASS);
      } else if (y === 3 || y === 2 + wallH) {
        w.setBlock(ox + x, y, oz, BLOCK_WOOD);
        w.setBlock(ox + x, y, oz + vd - 1, BLOCK_WOOD);
      }
    }
    for (let z = 0; z < vd; z++) {
      const isCorner = z === 0 || z === vd - 1;
      const isWindow = z % 3 === 1;
      if (isCorner) {
        w.setBlock(ox, y, oz + z, BLOCK_WOOD);
        w.setBlock(ox + vw - 1, y, oz + z, BLOCK_WOOD);
      } else if (isWindow && y >= 4 && y <= 5) {
        w.setBlock(ox, y, oz + z, BLOCK_GLASS);
        w.setBlock(ox + vw - 1, y, oz + z, BLOCK_GLASS);
      } else if (y === 3 || y === 2 + wallH) {
        w.setBlock(ox, y, oz + z, BLOCK_WOOD);
        w.setBlock(ox + vw - 1, y, oz + z, BLOCK_WOOD);
      }
    }
  }

  // Open south entrance
  for (let dx = 7; dx <= 10; dx++) {
    for (let y = 3; y <= 5; y++) {
      w.setBlock(ox + dx, y, oz + vd - 1, BLOCK_AIR);
    }
    w.setBlock(ox + dx, 2, oz + vd - 1, BLOCK_PATH);
  }

  // Interior gold trim — flush against north/south walls
  for (let x = 2; x < vw - 2; x++) {
    w.setBlock(ox + x, 3, oz + 1, BLOCK_GOLD);
    w.setBlock(ox + x, 3, oz + vd - 2, BLOCK_GOLD);
  }

  // Living-area carpet under sofa / lounge
  for (let z = 4; z <= 7; z++) {
    for (let x = 7; x <= 11; x++) {
      w.setBlock(ox + x, 2, oz + z, BLOCK_CARPET);
    }
  }

  // Ceiling light fixtures
  w.setBlock(ox + 5, 5, oz + 4, BLOCK_LIGHT);
  w.setBlock(ox + 12, 5, oz + 8, BLOCK_LIGHT);

  // Stepped roof
  const roofY = 3 + wallH;
  for (let layer = 0; layer < 3; layer++) {
    const inset = layer;
    const y = roofY + layer;
    for (let z = -1 + inset; z < vd + 1 - inset; z++) {
      for (let x = -1 + inset; x < vw + 1 - inset; x++) {
        w.setBlock(ox + x, y, oz + z, BLOCK_WOOD);
      }
    }
  }

  // Infinity pool on west terrace
  const poolX0 = ox - 1;
  const poolZ0 = oz + 3;
  for (let z = 0; z < 8; z++) {
    for (let x = 0; x < 5; x++) {
      const px = poolX0 - x;
      const pz = poolZ0 + z;
      if (x === 0 || x === 4 || z === 0 || z === 7) {
        w.setBlock(px, 1, pz, BLOCK_MARBLE);
        w.setBlock(px, 2, pz, BLOCK_MARBLE);
      } else {
        w.setBlock(px, 1, pz, BLOCK_ROCK);
        w.setBlock(px, 2, pz, BLOCK_WATER);
      }
    }
  }

  // Stairs down from south entrance
  for (let s = 0; s < 4; s++) {
    for (let dx = 7; dx <= 10; dx++) {
      w.setBlock(ox + dx, 2 - Math.min(s, 1), oz + vd + s, BLOCK_WOOD);
      if (s >= 2) w.setBlock(ox + dx, 1, oz + vd + s, BLOCK_PATH);
    }
  }
}

/** Short pier on the south beach — extends into open water for boat 1. */
function placeSouthDock(w: WorldWriter, cx: number, cz: number): void {
  const dockX = cx - 12;
  // Shore edge ~cz+28; pier runs south into ocean
  const dockZ0 = cz + 28;
  for (let dz = 0; dz < 4; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      w.setBlock(dockX + dx, 1, dockZ0 + dz, BLOCK_WOOD);
    }
  }
}

function placeVillaFurniture(villaX: number, villaZ: number): PropSpec[] {
  const y = 3.01;
  const props: PropSpec[] = [
    // Bedroom — north-west, clear of wall gold trim
    { kind: 'king-bed', x: villaX + 4.5, y, z: villaZ + 4.5, rotationY: 0 },
    // Living area — sofa facing east toward TV
    { kind: 'sofa', x: villaX + 8.5, y, z: villaZ + 6.5, rotationY: Math.PI / 2 },
    // Plasma TV against east wall, facing west
    { kind: 'plasma-tv', x: villaX + 15.5, y, z: villaZ + 6.5, rotationY: -Math.PI / 2 },
    // Dining table south-east (away from entrance corridor x=7–10)
    { kind: 'dining-table', x: villaX + 12.5, y, z: villaZ + 10.5, rotationY: 0 },
  ];

  // Four chairs around the dining table
  const tableX = villaX + 12.5;
  const tableZ = villaZ + 10.5;
  const chairs: Array<[number, number, number]> = [
    [tableX, tableZ - 1.0, Math.PI], // north of table, faces south
    [tableX, tableZ + 1.0, 0], // south of table, faces north
    [tableX - 1.1, tableZ, Math.PI / 2], // west, faces east
    [tableX + 1.1, tableZ, -Math.PI / 2], // east, faces west
  ];
  for (const [cx, cz, rot] of chairs) {
    props.push({ kind: 'dining-chair', x: cx, y, z: cz, rotationY: rot });
  }

  return props;
}

/** Local solid regions for buildBoat() — hull, bow, outrigger, booms, bench backs. */
const BOAT_COLLISION_PARTS: Array<{
  min: [number, number, number];
  max: [number, number, number];
}> = [
  { min: [-0.58, 0.05, -2.35], max: [0.58, 0.95, 2.65] },
  { min: [-0.45, 0.08, -3.75], max: [0.45, 0.78, -2.15] },
  { min: [-1.85, 0.02, -1.55], max: [-1.45, 0.48, 1.95] },
  { min: [-1.62, 0.32, -1.1], max: [-0.02, 0.54, 1.45] },
  { min: [-0.48, 0.58, -0.55], max: [0.48, 0.88, -0.25] },
  { min: [-0.48, 0.58, 0.72], max: [0.48, 0.88, 1.02] },
];

function localBoxToWorldAabb(
  x: number,
  y: number,
  z: number,
  rotationY: number,
  scale: number,
  localMin: [number, number, number],
  localMax: [number, number, number],
): CollisionBox {
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  const corners: Array<[number, number, number]> = [
    [localMin[0], localMin[1], localMin[2]],
    [localMax[0], localMin[1], localMin[2]],
    [localMin[0], localMax[1], localMin[2]],
    [localMax[0], localMax[1], localMin[2]],
    [localMin[0], localMin[1], localMax[2]],
    [localMax[0], localMin[1], localMax[2]],
    [localMin[0], localMax[1], localMax[2]],
    [localMax[0], localMax[1], localMax[2]],
  ];

  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const [lx, ly, lz] of corners) {
    const sx = lx * scale;
    const sy = ly * scale;
    const sz = lz * scale;
    const wx = x + sx * cos + sz * sin;
    const wz = z - sx * sin + sz * cos;
    const wy = y + sy;
    minX = Math.min(minX, wx);
    minY = Math.min(minY, wy);
    minZ = Math.min(minZ, wz);
    maxX = Math.max(maxX, wx);
    maxY = Math.max(maxY, wy);
    maxZ = Math.max(maxZ, wz);
  }

  return { minX, minY, minZ, maxX, maxY, maxZ };
}

function buildBoatCollisionBoxes(boat: PropSpec): CollisionBox[] {
  const scale = boat.scale ?? 1;
  return BOAT_COLLISION_PARTS.map(({ min, max }) =>
    localBoxToWorldAabb(boat.x, boat.y, boat.z, boat.rotationY ?? 0, scale, min, max),
  );
}

function placeBoats(cx: number, cz: number): PropSpec[] {
  // Water block at y=1 fills [1,2]; surface top = 2.0. Hull local bottom ~0.08.
  const waterY = 1.95;
  return [
    // South of pier — clearly outside island ellipse (open ocean)
    {
      kind: 'boat',
      x: cx - 12 + 0.5,
      y: waterY,
      z: cz + 33 + 0.5,
      rotationY: 0,
      scale: 1.35,
    },
    // East open water — past island edge
    {
      kind: 'boat',
      x: cx + 36 + 0.5,
      y: waterY,
      z: cz + 8 + 0.5,
      rotationY: -Math.PI / 2,
      scale: 1.25,
    },
  ];
}

function scatterHedges(w: WorldWriter, cx: number, cz: number): void {
  const hedgeSpots: Array<[number, number]> = [
    [cx - 20, cz],
    [cx - 22, cz + 4],
    [cx + 18, cz - 6],
    [cx + 20, cz + 2],
    [cx + 16, cz + 12],
    [cx - 14, cz + 14],
    [cx - 10, cz - 18],
    [cx + 6, cz - 20],
    [cx - 4, cz + 18],
    [cx + 10, cz + 16],
  ];
  for (const [hx, hz] of hedgeSpots) {
    for (let dx = 0; dx < 3; dx++) {
      for (let dz = 0; dz < 2; dz++) {
        if (!isLand(w, hx + dx, hz + dz)) continue;
        if (w.getBlock(hx + dx, 1, hz + dz) === BLOCK_PATH) continue;
        w.setBlock(hx + dx, 2, hz + dz, BLOCK_HEDGE);
        if ((dx + dz) % 2 === 0) w.setBlock(hx + dx, 3, hz + dz, BLOCK_HEDGE);
      }
    }
  }
}

/** Villa shell + terrace + infinity pool — no plants inside this zone. */
function isInVillaZone(x: number, z: number, villaX: number, villaZ: number): boolean {
  const vw = 18;
  const vd = 14;
  // Building, terrace ring, west pool, and a small clearance margin
  return (
    x >= villaX - 7 &&
    x <= villaX + vw + 3 &&
    z >= villaZ - 4 &&
    z <= villaZ + vd + 4
  );
}

function placeTropicalProps(
  cx: number,
  cz: number,
  villaX: number,
  villaZ: number,
): PropSpec[] {
  const props: PropSpec[] = [];

  const addProp = (
    kind: PropSpec['kind'],
    x: number,
    z: number,
    rotationY?: number,
    scale?: number,
  ): void => {
    if (isInVillaZone(x, z, villaX, villaZ)) return;
    props.push({
      kind,
      x: x + 0.5,
      y: 2,
      z: z + 0.5,
      rotationY,
      scale,
    });
  };

  const palms: Array<[number, number]> = [
    [cx - 24, cz + 6],
    [cx - 26, cz - 2],
    [cx - 22, cz - 10],
    [cx - 14, cz + 20],
    [cx - 8, cz + 24],
    [cx + 2, cz + 26],
    [cx + 10, cz + 24],
    [cx + 18, cz + 18],
    [cx + 24, cz + 8],
    [cx + 26, cz - 2],
    [cx + 22, cz - 12],
    [cx + 16, cz - 18],
    [cx + 6, cz - 24],
    [cx - 4, cz - 26],
    [cx - 12, cz - 22],
    [cx - 20, cz - 16],
    [cx + 12, cz + 8],
    [cx + 8, cz - 8],
    [cx + 14, cz + 2],
    [cx + 20, cz + 12],
    [cx - 24, cz + 12],
    // Garden just outside villa (south / east), not inside
    [villaX - 4, villaZ + 20],
    [villaX + 20, villaZ + 18],
    [villaX + 10, villaZ - 6],
    [villaX - 8, villaZ + 18],
    [villaX + 22, villaZ + 8],
    [villaX + 4, villaZ + 22],
    [villaX + 16, villaZ + 22],
    [cx + 4, cz + 18],
    [cx - 20, cz + 8],
    [cx + 22, cz + 4],
    [cx - 2, cz - 20],
    [cx + 16, cz - 6],
    [cx + 28, cz + 2],
    [cx - 28, cz + 4],
    [cx + 10, cz - 16],
    [cx - 8, cz + 18],
    [cx + 6, cz + 12],
    [cx - 18, cz - 8],
    [cx + 18, cz - 14],
    [cx - 22, cz + 18],
    [cx + 24, cz - 8],
    [cx - 26, cz - 8],
    [cx + 2, cz - 14],
    [cx + 12, cz + 16],
    [cx - 12, cz + 12],
    [cx + 8, cz - 20],
    [cx - 16, cz + 18],
    [cx + 20, cz - 20],
    [cx - 10, cz - 18],
  ];

  for (const [x, z] of palms) {
    addProp(
      'palm-tree',
      x,
      z,
      ((x * 7 + z * 3) % 360) * (Math.PI / 180),
      0.95 + ((x + z) % 5) * 0.05,
    );
  }

  const broadleaves: Array<[number, number]> = [
    [cx + 15, cz + 6],
    [cx - 17, cz + 9],
    [cx + 9, cz - 15],
    [cx - 11, cz - 17],
    [cx + 21, cz - 3],
    [cx - 23, cz + 2],
    [cx + 7, cz + 15],
    [cx - 5, cz + 17],
    [villaX + 10, villaZ + 24],
    [villaX - 6, villaZ + 22],
    [cx + 17, cz - 17],
    [cx - 15, cz - 11],
  ];
  for (const [x, z] of broadleaves) {
    addProp(
      'broadleaf-tree',
      x,
      z,
      ((x + z) % 7) * 0.35,
      0.9 + ((x * 3 + z) % 4) * 0.06,
    );
  }

  const bushes: Array<[number, number]> = [
    [cx - 15, cz + 5],
    [cx + 11, cz - 3],
    [cx + 5, cz + 11],
    [cx - 7, cz - 9],
    [cx + 17, cz + 5],
    [cx + 3, cz - 17],
    [cx - 11, cz + 15],
    [villaX + 2, villaZ + 20],
    [villaX + 14, villaZ + 20],
    [cx + 9, cz + 7],
    [cx - 5, cz + 13],
    [cx + 15, cz - 11],
    [cx - 17, cz + 11],
    [cx + 7, cz - 13],
    [cx - 9, cz - 15],
    [cx + 19, cz + 1],
    [cx - 21, cz + 7],
    [cx + 13, cz + 13],
    [cx - 3, cz + 19],
    [cx + 21, cz - 5],
    [villaX - 5, villaZ + 18],
    [villaX + 22, villaZ + 10],
    [cx + 1, cz + 15],
    [cx - 23, cz - 5],
    [cx + 23, cz + 7],
    [cx - 1, cz - 11],
    [cx + 11, cz + 19],
    [cx - 15, cz - 17],
    [cx + 17, cz - 15],
    [cx - 7, cz + 21],
    [cx + 5, cz - 21],
    [villaX + 8, villaZ - 6],
    [cx + 25, cz - 10],
  ];
  for (const [x, z] of bushes) {
    addProp('tropical-bush', x, z, ((x + z) % 8) * 0.4);
  }

  const bananas: Array<[number, number]> = [
    [cx - 12, cz + 8],
    [cx + 10, cz - 12],
    [cx + 6, cz + 6],
    [cx + 16, cz + 10],
    [cx - 4, cz - 16],
    [villaX + 6, villaZ + 20],
    [cx + 14, cz - 2],
    [cx - 8, cz + 10],
    [cx + 2, cz - 8],
    [cx - 20, cz - 12],
    [cx + 22, cz + 10],
    [villaX + 20, villaZ + 12],
  ];
  for (const [x, z] of bananas) {
    addProp('banana-plant', x, z, (x % 5) * 0.5);
  }

  const ferns: Array<[number, number]> = [
    [cx + 7, cz - 4],
    [cx + 3, cz + 9],
    [cx - 13, cz - 8],
    [cx + 15, cz + 4],
    [cx - 5, cz + 16],
    [cx + 9, cz - 14],
    [villaX + 3, villaZ + 20],
    [villaX + 12, villaZ + 20],
    [cx + 1, cz - 6],
    [cx - 11, cz + 10],
    [cx + 13, cz + 8],
    [cx - 3, cz - 10],
    [cx + 19, cz - 8],
    [cx - 19, cz + 14],
    [cx + 5, cz + 17],
    [cx + 11, cz + 14],
    [cx - 7, cz - 12],
    [villaX - 6, villaZ + 16],
  ];
  for (const [x, z] of ferns) {
    addProp('fern', x, z, (z % 6) * 0.6);
  }

  return props;
}

function isClearPasture(w: WorldWriter, x: number, z: number, clearH: number): boolean {
  if (!isLand(w, x, z)) return false;
  if (w.getBlock(x, 1, z) === BLOCK_PATH || w.getBlock(x, 1, z) === BLOCK_WATER) return false;
  // Flat grass only — skip hills (y=2 solid), hedges, villa
  for (let y = 2; y <= 1 + Math.ceil(clearH); y++) {
    if (w.getBlock(x, y, z) !== BLOCK_AIR) return false;
  }
  // Keep a small footprint clear for cow/lizard bodies
  for (const [dx, dz] of [
    [0, 0],
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ] as Array<[number, number]>) {
    if (!isLand(w, x + dx, z + dz)) return false;
    if (w.getBlock(x + dx, 2, z + dz) !== BLOCK_AIR) return false;
  }
  return true;
}

function placeFauna(w: WorldWriter, cx: number, cz: number): FaunaSpawnSpec[] {
  const fauna: FaunaSpawnSpec[] = [];

  // Open pasture rings — away from villa (NW), hills, and river center
  const cowCandidates: Array<[number, number]> = [
    [cx + 20, cz + 14],
    [cx + 22, cz + 8],
    [cx + 18, cz + 18],
    [cx - 22, cz + 16],
    [cx - 24, cz + 10],
    [cx + 16, cz - 22],
    [cx + 10, cz - 24],
    [cx - 20, cz - 18],
    [cx - 14, cz - 22],
    [cx + 24, cz - 12],
    [cx - 26, cz + 4],
    [cx + 26, cz + 2],
  ];
  let cowCount = 0;
  for (const [x, z] of cowCandidates) {
    if (!isClearPasture(w, x, z, 1.5)) continue;
    fauna.push({ type: 'inek', x: x + 0.5, y: 2.01, z: z + 0.5 });
    cowCount++;
    if (cowCount >= 10) break;
  }

  const lizardCandidates: Array<[number, number]> = [
    [cx + 18, cz + 12],
    [cx - 18, cz + 14],
    [cx + 12, cz - 20],
    [cx - 12, cz - 20],
    [cx + 22, cz - 8],
    [cx - 22, cz - 10],
    [cx + 8, cz + 20],
    [cx - 8, cz + 22],
    [cx + 14, cz + 16],
    [cx - 16, cz + 18],
    [cx + 6, cz - 18],
    [cx - 6, cz - 18],
    [cx + 20, cz + 4],
    [cx - 20, cz + 6],
    [cx + 10, cz + 18],
    [cx - 10, cz + 20],
    [cx + 24, cz + 10],
    [cx - 24, cz - 6],
  ];
  let lizardCount = 0;
  for (const [x, z] of lizardCandidates) {
    if (!isClearPasture(w, x, z, 0.5)) continue;
    fauna.push({ type: 'kertenkele', x: x + 0.5, y: 2.01, z: z + 0.5 });
    lizardCount++;
    if (lizardCount >= 18) break;
  }

  return fauna;
}
