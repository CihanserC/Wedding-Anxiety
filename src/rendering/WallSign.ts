import * as THREE from 'three';

/**
 * Canvas-backed banner plane placed on an interior wall. The texture is
 * generated once at construction time; caller positions/rotates the mesh.
 */
export function createWallSign(text: string, widthWorld = 6, heightWorld = 1.5): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#1a0f2b');
    grad.addColorStop(1, '#0f0820');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#f5c542';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    ctx.fillStyle = '#ffd97a';
    ctx.font = 'bold 130px "Segoe UI", "Georgia", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(255, 200, 80, 0.6)';
    ctx.shadowBlur = 24;
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 6);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffe9a8';
    ctx.font = 'italic 34px "Segoe UI", serif';
    ctx.fillText('Sonsuza kadar', canvas.width / 2, canvas.height - 42);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
  });
  const geometry = new THREE.PlaneGeometry(widthWorld, heightWorld);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'wall-sign';
  return mesh;
}

/**
 * Yellow neon-style banner with glow and an attached PointLight.
 * Returns a Group so the light moves with the sign.
 */
export function createNeonWallSign(
  text: string,
  widthWorld = 10,
  heightWorld = 1.8,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'neon-wall-sign';

  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Soft dark backing so the glow reads against marble walls
    const pad = 20;
    ctx.fillStyle = 'rgba(12, 8, 20, 0.55)';
    ctx.fillRect(pad, pad, canvas.width - pad * 2, canvas.height - pad * 2);

    ctx.strokeStyle = 'rgba(255, 220, 80, 0.35)';
    ctx.lineWidth = 4;
    ctx.strokeRect(pad + 8, pad + 8, canvas.width - (pad + 8) * 2, canvas.height - (pad + 8) * 2);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 14;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    drawNeonBannerLine(ctx, text, cx, cy, canvas.width);

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 236, 160, 0.85)';
    ctx.font = 'italic 34px "Segoe UI", serif';
    ctx.fillText('Sonsuza kadar', cx, canvas.height - 52);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(widthWorld, heightWorld),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    }),
  );
  mesh.name = 'neon-wall-sign-plane';
  group.add(mesh);

  const light = new THREE.PointLight(0xffe566, 1.2, 8, 1.6);
  light.position.set(0, 0, 0.6);
  group.add(light);

  return group;
}

/** Draw neon banner text centered; heart segment rendered in red on top. */
function drawNeonBannerLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  canvasWidth: number,
): void {
  let fontSize = 108;
  const maxW = canvasWidth - 140;
  ctx.font = `bold ${fontSize}px "Segoe UI", "Georgia", serif`;
  while (ctx.measureText(text).width > maxW && fontSize > 56) {
    fontSize -= 4;
    ctx.font = `bold ${fontSize}px "Segoe UI", "Georgia", serif`;
  }

  drawNeonGlowText(ctx, text, cx, cy, '#FFE566', '#FFF6A8');

  const heartMatch = text.match(/❤️?/u);
  if (!heartMatch || heartMatch.index === undefined) return;

  const before = text.slice(0, heartMatch.index);
  const heart = heartMatch[0];
  const fullW = ctx.measureText(text).width;
  const beforeW = ctx.measureText(before).width;
  const heartW = ctx.measureText(heart).width;
  const heartCx = cx - fullW / 2 + beforeW + heartW / 2;
  drawNeonGlowText(ctx, heart, heartCx, cy, '#ff2244', '#ff5577');
}

function drawNeonGlowText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  outerColor: string,
  innerColor: string,
): void {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor =
    outerColor === '#ff2244' ? 'rgba(255, 60, 80, 0.95)' : 'rgba(255, 230, 80, 0.95)';
  ctx.shadowBlur = 42;
  ctx.fillStyle = outerColor;
  ctx.fillText(text, cx, cy);

  ctx.shadowBlur = 16;
  ctx.shadowColor =
    outerColor === '#ff2244' ? 'rgba(255, 120, 140, 0.9)' : 'rgba(255, 255, 200, 0.9)';
  ctx.fillStyle = innerColor;
  ctx.fillText(text, cx, cy);

  ctx.shadowBlur = 0;
}
