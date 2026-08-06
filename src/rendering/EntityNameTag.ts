import * as THREE from 'three';

const NAME_COLOR = '#ff1a1a';
const NAME_STROKE = '#330000';

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize = 46,
  minSize = 26,
): number {
  let size = startSize;
  while (size >= minSize) {
    ctx.font = `bold ${size}px "Segoe UI", "Arial", sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) return size;
    size -= 2;
  }
  return minSize;
}

/** Red billboard name label above combat enemies. */
export function createNameTag(label: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const pad = 24;
    const fontSize = fitFontSize(ctx, label, canvas.width - pad * 2);
    ctx.font = `bold ${fontSize}px "Segoe UI", "Arial", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(4, Math.round(fontSize * 0.14));
    ctx.strokeStyle = NAME_STROKE;
    ctx.strokeText(label, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = NAME_COLOR;
    ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  const aspect = canvas.width / canvas.height;
  const height = 0.38;
  sprite.scale.set(height * aspect, height, 1);
  sprite.name = 'enemy-name-tag';
  return sprite;
}

function disposeSpriteResources(sprite: THREE.Sprite): void {
  const mat = sprite.material;
  if (mat.map) mat.map.dispose();
  mat.dispose();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [text];
}

/** Soft speech bubble for Meraklı Teyze taunts. */
export function createSpeechBubble(text: string): THREE.Sprite {
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      transparent: true,
      depthTest: true,
      depthWrite: false,
    }),
  );
  sprite.name = 'enemy-speech-bubble';
  updateSpeechBubble(sprite, text);
  return sprite;
}

export function updateSpeechBubble(sprite: THREE.Sprite, text: string): void {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 220;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 36px "Segoe UI", "Arial", sans-serif';
    const lines = wrapLines(ctx, text, canvas.width - 72);
    const lineH = 44;
    const padX = 28;
    const padY = 22;
    const textH = lines.length * lineH;
    const boxH = textH + padY * 2;
    const maxLineW = Math.max(...lines.map((l) => ctx.measureText(l).width), 80);
    const boxW = Math.min(canvas.width - 24, maxLineW + padX * 2);
    const boxX = (canvas.width - boxW) / 2;
    const boxY = 16;
    const tipW = 18;
    const tipH = 16;

    ctx.fillStyle = 'rgba(255, 248, 240, 0.94)';
    ctx.strokeStyle = 'rgba(40, 20, 30, 0.55)';
    ctx.lineWidth = 3;
    roundRect(ctx, boxX, boxY, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    // Speech tip pointing down
    const tipX = canvas.width / 2;
    const tipTop = boxY + boxH;
    ctx.beginPath();
    ctx.moveTo(tipX - tipW / 2, tipTop);
    ctx.lineTo(tipX, tipTop + tipH);
    ctx.lineTo(tipX + tipW / 2, tipTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2a1520';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const startY = boxY + padY + lineH / 2;
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, startY + i * lineH);
    });
  }

  const oldMap = sprite.material.map;
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  sprite.material.map = texture;
  sprite.material.needsUpdate = true;
  if (oldMap) oldMap.dispose();

  const aspect = canvas.width / canvas.height;
  const height = 0.85;
  sprite.scale.set(height * aspect, height, 1);
}

export function disposeNameTag(sprite: THREE.Sprite): void {
  disposeSpriteResources(sprite);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
