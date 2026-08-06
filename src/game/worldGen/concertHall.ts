import * as THREE from 'three';
import {
  BLOCK_CARPET,
  BLOCK_CURTAIN,
  BLOCK_GOLD,
  BLOCK_MARBLE,
  BLOCK_SEAT,
  BLOCK_STONE,
  BLOCK_WOOD,
} from '../../data/blocks';
import type { FamousPaintingId, GeneratorResult, PropSpec, WorldWriter } from './types';

/**
 * Classical concert hall: marble floor, red curtain backdrop, elevated stage,
 * gold columns lining the sides, chandelier cluster overhead, and rows of
 * theater seats facing the stage.
 */
export function generateConcertHall(w: WorldWriter): GeneratorResult {
  const W = w.width;
  const D = w.depth;

  for (let z = 0; z < D; z++) {
    for (let x = 0; x < W; x++) {
      w.setBlock(x, 0, z, BLOCK_MARBLE);
    }
  }

  const wallHeight = 8;
  for (let y = 1; y <= wallHeight; y++) {
    for (let x = 1; x < W - 1; x++) {
      w.setBlock(x, y, 1, BLOCK_MARBLE);
      w.setBlock(x, y, D - 2, BLOCK_MARBLE);
    }
    for (let z = 1; z < D - 1; z++) {
      w.setBlock(1, y, z, BLOCK_MARBLE);
      w.setBlock(W - 2, y, z, BLOCK_MARBLE);
    }
  }

  // Ceiling with a gold trim strip along the center aisle line
  const ceilingY = wallHeight + 1;
  for (let z = 1; z < D - 1; z++) {
    for (let x = 1; x < W - 1; x++) {
      w.setBlock(x, ceilingY, z, BLOCK_MARBLE);
    }
  }
  for (let z = 4; z < D - 4; z += 6) {
    for (let x = 4; x < W - 4; x += 6) {
      w.setBlock(x, ceilingY, z, BLOCK_GOLD);
    }
  }

  const stageBackZ = D - 4;
  const stageFrontZ = D - 10;
  for (let z = stageFrontZ; z <= stageBackZ; z++) {
    for (let x = 3; x < W - 3; x++) {
      w.setBlock(x, 1, z, BLOCK_WOOD);
    }
  }
  for (let z = stageFrontZ; z <= stageBackZ; z++) {
    for (let x = 3; x < W - 3; x++) {
      w.setBlock(x, 2, z, BLOCK_WOOD);
    }
  }

  // Downstage gold lip and rear platform trim
  for (let x = 4; x < W - 4; x++) {
    w.setBlock(x, 3, stageFrontZ, BLOCK_GOLD);
  }
  for (let x = 5; x < W - 5; x++) {
    w.setBlock(x, 3, stageBackZ, BLOCK_GOLD);
  }
  for (let z = stageFrontZ + 1; z < stageBackZ; z++) {
    w.setBlock(3, 3, z, BLOCK_GOLD);
    w.setBlock(W - 4, 3, z, BLOCK_GOLD);
  }

  const curtainZ = stageBackZ + 1;
  for (let y = 1; y <= wallHeight; y++) {
    for (let x = 3; x < W - 3; x++) {
      w.setBlock(x, y, curtainZ, BLOCK_CURTAIN);
    }
  }
  for (let y = wallHeight - 2; y <= wallHeight; y++) {
    for (let x = 3; x < W - 3; x += 2) {
      w.setBlock(x, y, curtainZ - 1, BLOCK_CURTAIN);
    }
  }

  const columnX = [4, 6, W - 7, W - 5];
  const columnZs: number[] = [];
  for (let z = 4; z < stageFrontZ - 2; z += 6) columnZs.push(z);
  for (const cx of columnX) {
    for (const cz of columnZs) {
      for (let y = 1; y <= wallHeight - 1; y++) {
        w.setBlock(cx, y, cz, BLOCK_MARBLE);
      }
      w.setBlock(cx, wallHeight, cz, BLOCK_GOLD);
      w.setBlock(cx, 1, cz, BLOCK_GOLD);
    }
  }

  const centerX = Math.floor(W / 2);
  const chandelierZ = Math.floor((stageFrontZ + 4) / 2);
  const chandelierY = wallHeight - 1;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) > 3) continue;
      w.setBlock(centerX + dx, chandelierY, chandelierZ + dz, BLOCK_GOLD);
    }
  }
  w.setBlock(centerX, chandelierY - 1, chandelierZ, BLOCK_GOLD);
  w.setBlock(centerX, chandelierY + 1, chandelierZ, BLOCK_GOLD);

  const aisleHalf = 2;
  const audienceStart = 5;
  const audienceEnd = stageFrontZ - 3;
  for (let z = audienceStart; z < audienceEnd; z++) {
    for (let dx = -aisleHalf; dx < aisleHalf; dx++) {
      w.setBlock(centerX + dx, 0, z, BLOCK_CARPET);
    }
  }

  // Low seat rows for collision; detailed meshes are added as theaterSeats props.
  const seatRowGap = 2;
  const theaterSeats: Array<{ x: number; z: number }> = [];
  for (let z = audienceStart; z < audienceEnd; z += seatRowGap) {
    for (let x = 6; x < W - 6; x++) {
      if (Math.abs(x - centerX) < aisleHalf) continue;
      w.setBlock(x, 1, z, BLOCK_SEAT);
      theaterSeats.push({ x, z });
    }
  }

  for (let y = 1; y <= 3; y++) {
    for (let dx = -aisleHalf; dx < aisleHalf; dx++) {
      w.setBlock(centerX + dx, y, 1, BLOCK_CURTAIN);
    }
  }
  for (let dx = -aisleHalf; dx < aisleHalf; dx++) {
    w.setBlock(centerX + dx, 4, 1, BLOCK_GOLD);
  }

  addConcertStageSteps(w, centerX, stageFrontZ, aisleHalf);

  const spawn = new THREE.Vector3(centerX + 0.5, 1.01, 3.5);
  const stageTopY = 3;
  const stageMidZ = stageFrontZ + 3;
  const pianoX = centerX + 6;
  const pianoZ = stageMidZ;
  const faceAudience = Math.PI;
  const facePiano = Math.PI + 0.5;

  return {
    playerSpawn: spawn,
    playerFacing: Math.PI,
    enemySpawnRegion: {
      minX: 4,
      maxX: W - 5,
      minZ: 5,
      maxZ: audienceEnd,
    },
    npcs: [
      {
        type: 'conductor',
        x: centerX + 0.5,
        y: stageTopY + 1.18,
        z: stageFrontZ + 1.3,
        rotationY: faceAudience,
      },
      {
        type: 'pianist',
        x: pianoX - 0.5,
        y: stageTopY + 0.56,
        z: pianoZ - 1.2,
        rotationY: facePiano,
        pose: 'sitting',
      },
      {
        type: 'cellist',
        x: centerX - 4.5,
        y: stageTopY + 0.01,
        z: stageMidZ - 0.2,
        rotationY: faceAudience,
        pose: 'sitting',
      },
      {
        type: 'cellist',
        x: centerX - 7.5,
        y: stageTopY + 0.01,
        z: stageMidZ + 0.6,
        rotationY: faceAudience + 0.15,
        pose: 'sitting',
      },
      {
        type: 'violinist',
        x: centerX + 2.5,
        y: stageTopY + 0.01,
        z: stageMidZ + 0.8,
        rotationY: faceAudience,
      },
      {
        type: 'violinist',
        x: centerX - 1.5,
        y: stageTopY + 0.01,
        z: stageMidZ + 0.2,
        rotationY: faceAudience - 0.12,
      },
    ],
    props: [
      { kind: 'grand-piano', x: pianoX, y: stageTopY, z: pianoZ, rotationY: facePiano },
      { kind: 'conductor-podium', x: centerX + 0.5, y: stageTopY, z: stageFrontZ + 1.3, rotationY: faceAudience },
      { kind: 'stage-footlights', x: centerX + 0.5, y: stageTopY, z: stageFrontZ + 0.35, rotationY: faceAudience },
      { kind: 'stage-spotlight', x: 7.5, y: stageTopY, z: stageMidZ + 0.5, rotationY: faceAudience + 0.35 },
      { kind: 'stage-spotlight', x: W - 8.5, y: stageTopY, z: stageMidZ + 0.5, rotationY: faceAudience - 0.35 },
      { kind: 'stage-side-drape', x: 5, y: stageTopY, z: stageMidZ + 1.2, rotationY: faceAudience + Math.PI / 2 },
      { kind: 'stage-side-drape', x: W - 6, y: stageTopY, z: stageMidZ + 1.2, rotationY: faceAudience - Math.PI / 2 },
      { kind: 'music-stand', x: centerX - 2.5, y: stageTopY, z: stageMidZ - 1.5, rotationY: faceAudience },
      { kind: 'music-stand', x: centerX + 1.5, y: stageTopY, z: stageMidZ - 1.5, rotationY: faceAudience },
      { kind: 'music-stand', x: centerX - 5.5, y: stageTopY, z: stageMidZ - 1, rotationY: faceAudience + 0.15 },
      { kind: 'music-stand', x: centerX + 4.5, y: stageTopY, z: stageMidZ + 0.2, rotationY: faceAudience },
      ...buildConcertWallPaintings(W),
    ],
    interactables: [{ kind: 'piano', x: pianoX, y: stageTopY, z: pianoZ, radius: 3.2 }],
    theaterSeats,
  };
}

/** Center-aisle steps from the stage lip down toward the audience carpet. */
function addConcertStageSteps(
  w: WorldWriter,
  centerX: number,
  stageFrontZ: number,
  aisleHalf: number,
): void {
  const steps: Array<{ z: number; treadY: number }> = [
    { z: stageFrontZ - 3, treadY: 0 },
    { z: stageFrontZ - 2, treadY: 1 },
    { z: stageFrontZ - 1, treadY: 2 },
  ];

  for (const { z, treadY } of steps) {
    for (let dx = -aisleHalf; dx < aisleHalf; dx++) {
      const x = centerX + dx;
      for (let y = 0; y < treadY; y++) {
        w.setBlock(x, y, z, BLOCK_STONE);
      }
      w.setBlock(x, treadY, z, BLOCK_CARPET);
    }

    // Marble cheek walls with dark wood cap — contrasts with red treads
    for (const sideDx of [-aisleHalf, aisleHalf]) {
      const sideX = centerX + sideDx;
      for (let y = 0; y < treadY; y++) {
        w.setBlock(sideX, y, z, BLOCK_MARBLE);
      }
      w.setBlock(sideX, treadY, z, BLOCK_WOOD);
    }
  }
}

/** Famous-art reproductions in gold frames along the side and entrance walls. */
function buildConcertWallPaintings(W: number): PropSpec[] {
  const paintings: FamousPaintingId[] = [
    'mona-lisa',
    'starry-night',
    'girl-pearl',
    'great-wave',
    'birth-of-venus',
    'the-scream',
  ];
  const y = 4.8;
  const westX = 1.62;
  const eastX = W - 1.62;
  const westZ = [11, 21, 31];
  const eastZ = [16, 26, 36];
  const props: PropSpec[] = [];

  for (let i = 0; i < westZ.length; i++) {
    props.push({
      kind: 'wall-painting',
      paintingId: paintings[i % paintings.length],
      x: westX,
      y,
      z: westZ[i],
      rotationY: Math.PI / 2,
    });
  }
  for (let i = 0; i < eastZ.length; i++) {
    props.push({
      kind: 'wall-painting',
      paintingId: paintings[(i + 3) % paintings.length],
      x: eastX,
      y,
      z: eastZ[i],
      rotationY: -Math.PI / 2,
    });
  }

  props.push({
    kind: 'wall-painting',
    paintingId: 'birth-of-venus',
    x: 10,
    y,
    z: 1.62,
    rotationY: 0,
  });
  props.push({
    kind: 'wall-painting',
    paintingId: 'the-scream',
    x: W - 10,
    y,
    z: 1.62,
    rotationY: 0,
  });

  return props;
}
