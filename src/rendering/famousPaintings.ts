import * as THREE from 'three';
import type { FamousPaintingId } from '../game/worldGen/types';

const PAINTING_META: Record<
  FamousPaintingId,
  { title: string; artist: string; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }
> = {
  'mona-lisa': {
    title: 'Mona Lisa',
    artist: 'Leonardo da Vinci',
    draw: drawMonaLisa,
  },
  'starry-night': {
    title: 'The Starry Night',
    artist: 'Vincent van Gogh',
    draw: drawStarryNight,
  },
  'girl-pearl': {
    title: 'Girl with a Pearl Earring',
    artist: 'Johannes Vermeer',
    draw: drawGirlPearl,
  },
  'great-wave': {
    title: 'The Great Wave',
    artist: 'Hokusai',
    draw: drawGreatWave,
  },
  'birth-of-venus': {
    title: 'The Birth of Venus',
    artist: 'Botticelli',
    draw: drawBirthOfVenus,
  },
  'the-scream': {
    title: 'The Scream',
    artist: 'Edvard Munch',
    draw: drawTheScream,
  },
};

/** Ornate gold-framed museum painting for concert-hall walls. */
export function buildWallPainting(
  id: FamousPaintingId,
  widthWorld = 2.6,
  heightWorld = 3.4,
): THREE.Group {
  const meta = PAINTING_META[id];
  const group = new THREE.Group();
  group.name = `wall-painting-${id}`;

  const canvasW = 256;
  const canvasH = 320;
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawMuseumFrame(ctx, canvasW, canvasH);
    const inset = 28;
    const artW = canvasW - inset * 2;
    const artH = canvasH - inset * 2 - 36;
    ctx.save();
    ctx.beginPath();
    ctx.rect(inset, inset, artW, artH);
    ctx.clip();
    meta.draw(ctx, artW, artH);
    ctx.restore();
    drawPlaque(ctx, canvasW, canvasH, meta.title, meta.artist);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(widthWorld, heightWorld),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  );
  plane.name = 'painting-canvas';
  group.add(plane);

  // Subtle gold frame depth (voxel-style lip)
  const frameMat = new THREE.MeshLambertMaterial({ color: 0xc9a227 });
  const lip = new THREE.Mesh(new THREE.BoxGeometry(widthWorld + 0.14, heightWorld + 0.14, 0.08), frameMat);
  lip.position.z = -0.05;
  group.add(lip);

  return group;
}

function drawMuseumFrame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#3d2810');
  grad.addColorStop(0.5, '#6a4a18');
  grad.addColorStop(1, '#2a1808');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#f0d060';
  ctx.lineWidth = 5;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.strokeStyle = '#8a6020';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, w - 36, h - 36);
}

function drawPlaque(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  title: string,
  artist: string,
): void {
  const py = h - 26;
  ctx.fillStyle = 'rgba(20, 12, 8, 0.72)';
  ctx.fillRect(24, py - 14, w - 48, 22);
  ctx.fillStyle = '#f0e0c0';
  ctx.font = 'bold 11px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, w / 2, py - 5);
  ctx.fillStyle = '#c8b890';
  ctx.font = '9px Georgia, serif';
  ctx.fillText(artist, w / 2, py + 6);
}

type GridRow = string;

function paintGrid(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  cell: number,
  grid: GridRow[],
  palette: Record<string, string>,
): void {
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y];
    for (let x = 0; x < row.length; x++) {
      const key = row[x];
      if (key === '.' || !palette[key]) continue;
      ctx.fillStyle = palette[key];
      ctx.fillRect(ox + x * cell, oy + y * cell, cell, cell);
    }
  }
}

function drawMonaLisa(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#4a5a38';
  ctx.fillRect(0, 0, w, h);
  const cell = Math.floor(Math.min(w, h) / 22);
  const grid: GridRow[] = [
    '......................',
    '....bbbbbbbbbbbb......',
    '...bbbbbbbbbbbbbb.....',
    '..bbbbssssssssbbbb....',
    '..bbbssssssssssbbb....',
    '..bbsshhhhhhssssbb....',
    '..bbshheeeehhssssb....',
    '..bbshheeeehhssssb....',
    '..bbshheooehhssssb....',
    '..bbshheeeehhssssb....',
    '..bbshheeeehhssssb....',
    '..bbsshhhhhhssssbb....',
    '..bbbssssssssssbbb....',
    '...bbbddddddddbbb.....',
    '....bbbddddddbbb......',
    '.....bbbbbbbbbb.......',
    '......bbbbbbbb........',
    '.......bbbbbb.........',
    '........bbbb..........',
    '.........bb...........',
    '......................',
    '......................',
  ];
  const ox = Math.floor((w - grid[0].length * cell) / 2);
  const oy = Math.floor((h - grid.length * cell) / 2) - cell;
  paintGrid(ctx, ox, oy, cell, grid, {
    b: '#3a2818',
    s: '#d8c0a0',
    h: '#5a3828',
    e: '#1a1008',
    o: '#c89088',
    d: '#1a2430',
  });
}

function drawStarryNight(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cell = Math.floor(Math.min(w, h) / 20);
  const grid: GridRow[] = [
    'yyyyyyyyyyyyyyyyyyyy',
    'ybbbyyyybyyyybyyyyyy',
    'ybybbyyybyyybyyyyyyy',
    'yybyyyyybyyyyyyyyyyy',
    'yyyyyccyyyyyyyyyyyyy',
    'yyyyyccyyyyyyyyyyyyy',
    'gggggggggggggggggggg',
    'ggggddgggggggggggggg',
    'gggddddggggggggggggg',
    'ggddddddgggggggggggg',
    'gddddddddggggggggggg',
    'gddddddddggggggggggg',
    'ggddddddgggggggggggg',
    'gggddddggggggggggggg',
    'ggggddgggggggggggggg',
    'gggggggggggggggggggg',
    'gggggggggggggggggggg',
    'gggggggggggggggggggg',
    'gggggggggggggggggggg',
    'gggggggggggggggggggg',
  ];
  ctx.fillStyle = '#1a2848';
  ctx.fillRect(0, 0, w, h);
  const ox = Math.floor((w - grid[0].length * cell) / 2);
  const oy = Math.floor((h - grid.length * cell) / 2);
  paintGrid(ctx, ox, oy, cell, grid, {
    y: '#f0e040',
    b: '#2848a8',
    c: '#f8f0c0',
    g: '#183858',
    d: '#0a1830',
  });
}

function drawGirlPearl(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, w, h);
  const cell = Math.floor(Math.min(w, h) / 20);
  const grid: GridRow[] = [
    '....................',
    '......yyyyyy........',
    '.....yyyyyyyy.......',
    '....yyyyssssyy......',
    '...yyyyssssssyy.....',
    '...yyyssssssssy.....',
    '...yysshhhhsssy.....',
    '...yyshheeehssy.....',
    '...yyshheoehssy.....',
    '...yysshhhhsssy.....',
    '....yyyssssssyy.....',
    '.....yyyyyyyyy......',
    '......yyyyyy........',
    '.......pppp.........',
    '........ww..........',
    '.....................',
    '.....................',
    '.....................',
    '.....................',
    '.....................',
  ];
  const ox = Math.floor((w - grid[0].length * cell) / 2);
  const oy = Math.floor((h - grid.length * cell) / 2);
  paintGrid(ctx, ox, oy, cell, grid, {
    y: '#1a5090',
    s: '#e8d0b0',
    h: '#4a2818',
    e: '#101008',
    o: '#ffffff',
    p: '#f0f0f0',
    w: '#c8a040',
  });
}

function drawGreatWave(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#f0e8d8';
  ctx.fillRect(0, 0, w, h);
  const cell = Math.floor(Math.min(w, h) / 18);
  const grid: GridRow[] = [
    'ffffffffffffffffff',
    'ffffffffffffffffff',
    'ffffwwwwwwwwffffff',
    'fffwwwwwwwwwwfffff',
    'ffwwbbbbbbbbwwffff',
    'fwwbbbbbbbbbbwwfff',
    'fwwbbbbbbbbbbwwfff',
    'ffwbbbbbbbbbbwffff',
    'fffwbbbbbbbbwfffff',
    'ffffwbbbbbbwffffff',
    'fffffwbbbbwfffffff',
    'ffffffwbbwffffffff',
    'fffffffwwfffffffff',
    'ffffffffffffffffff',
    'ffffffffffffffffff',
    'ffffffffffffffffff',
    'ffffffffffffffffff',
    'ffffffffffffffffff',
  ];
  const ox = Math.floor((w - grid[0].length * cell) / 2);
  const oy = Math.floor((h - grid.length * cell) / 2);
  paintGrid(ctx, ox, oy, cell, grid, {
    f: '#f0e8d8',
    w: '#f8f8f8',
    b: '#184878',
  });
  // Mount Fuji hint
  ctx.fillStyle = '#c8c0b0';
  ctx.beginPath();
  ctx.moveTo(w * 0.72, h * 0.35);
  ctx.lineTo(w * 0.8, h * 0.22);
  ctx.lineTo(w * 0.88, h * 0.35);
  ctx.closePath();
  ctx.fill();
}

function drawBirthOfVenus(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cell = Math.floor(Math.min(w, h) / 20);
  const grid: GridRow[] = [
    'ssssssssssssssssssss',
    'ssssssssssssssssssss',
    'ssssppppppppssssssss',
    'sssppppppppppsssssss',
    'ssspppsssspppsssssss',
    'sssppssssssppsssssss',
    'sssppsshhssppsssssss',
    'sssppsshhssppsssssss',
    'ssspppsssspppsssssss',
    'sssspppppppppsssssss',
    'ssssspppppppssssssss',
    'ssssssssssssssssssss',
    'cccccccccccccccccccc',
    'cccccccccccccccccccc',
    'cccccccccccccccccccc',
    'cccccccccccccccccccc',
    'cccccccccccccccccccc',
    'cccccccccccccccccccc',
    'cccccccccccccccccccc',
    'cccccccccccccccccccc',
  ];
  const ox = Math.floor((w - grid[0].length * cell) / 2);
  const oy = Math.floor((h - grid.length * cell) / 2);
  paintGrid(ctx, ox, oy, cell, grid, {
    s: '#88c8e8',
    p: '#f0d8c8',
    h: '#c89078',
    c: '#4088b8',
  });
}

function drawTheScream(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cell = Math.floor(Math.min(w, h) / 20);
  const grid: GridRow[] = [
    'oooooooooooooooooooo',
    'oooooooooooooooooooo',
    'ooorrrrrrrrrrroooooo',
    'ooorrrrrrrrrrroooooo',
    'ooorrrsssssssrrroooo',
    'ooorrsyyyyyysrrooooo',
    'ooorrsyoooyysrrooooo',
    'ooorrsyoooyysrrooooo',
    'ooorrsyyyyyysrrooooo',
    'ooorrrsssssssrrroooo',
    'ooorrrrrrrrrrrrooooo',
    'ooobbbbbbbbbbboooooo',
    'ooobbbbbbbbbbboooooo',
    'ooobbbbbbbbbbboooooo',
    'oooooooooooooooooooo',
    'oooooooooooooooooooo',
    'oooooooooooooooooooo',
    'oooooooooooooooooooo',
    'oooooooooooooooooooo',
    'oooooooooooooooooooo',
  ];
  const ox = Math.floor((w - grid[0].length * cell) / 2);
  const oy = Math.floor((h - grid.length * cell) / 2);
  paintGrid(ctx, ox, oy, cell, grid, {
    o: '#f0a040',
    r: '#e87830',
    s: '#f0e8c0',
    y: '#f8d040',
    b: '#283848',
  });
}
