import * as THREE from 'three';
import { buildEnemyMesh } from '../entities/enemyMeshes';
import { ENEMY_STATS, type EnemyType } from '../data/enemies';
import type { HallDecorations } from '../game/worldGen/types';

const MARBLE_LIGHT = 0xf0e8dc;
const MARBLE_MID = 0xd8d0c4;
const MARBLE_DARK = 0xb8b0a4;

/**
 * Canvas-backed wedding portrait with ornate frame. Loads public/couple.jpg
 * when available; falls back to a stylized voxel couple illustration.
 */
export function createCouplePortrait(
  names: string,
  widthWorld = 6,
  heightWorld = 4,
  imageUrl?: string,
): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawPortraitFrame(ctx, canvas.width, canvas.height);
    drawStylizedCouple(ctx, canvas.width, canvas.height);
    drawPortraitNames(ctx, canvas.width, canvas.height, names);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(widthWorld, heightWorld),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true }),
  );
  mesh.name = 'couple-portrait';

  if (imageUrl) {
    const loader = new THREE.TextureLoader();
    loader.load(
      imageUrl,
      (photoTex) => {
        const photoCanvas = document.createElement('canvas');
        photoCanvas.width = canvas.width;
        photoCanvas.height = canvas.height;
        const photoCtx = photoCanvas.getContext('2d');
        if (!photoCtx) return;

        drawPortraitFrame(photoCtx, photoCanvas.width, photoCanvas.height);
        const inset = 56;
        photoCtx.save();
        photoCtx.beginPath();
        photoCtx.rect(inset, inset, photoCanvas.width - inset * 2, photoCanvas.height - inset * 2 - 80);
        photoCtx.clip();
        photoCtx.drawImage(
          photoTex.image as CanvasImageSource,
          inset,
          inset,
          photoCanvas.width - inset * 2,
          photoCanvas.height - inset * 2 - 80,
        );
        photoCtx.restore();
        drawPortraitNames(photoCtx, photoCanvas.width, photoCanvas.height, names);

        texture.image = photoCanvas;
        texture.needsUpdate = true;
        photoTex.dispose();
      },
      undefined,
      () => {
        /* keep procedural fallback */
      },
    );
  }

  return mesh;
}

function drawPortraitFrame(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#2a1840');
  grad.addColorStop(0.45, '#4a2868');
  grad.addColorStop(1, '#1a0c28');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, w - 36, h - 36);
  ctx.strokeStyle = '#f5d76e';
  ctx.lineWidth = 4;
  ctx.strokeRect(32, 32, w - 64, h - 64);

  const innerGrad = ctx.createRadialGradient(w / 2, h * 0.42, 40, w / 2, h * 0.42, w * 0.55);
  innerGrad.addColorStop(0, '#ffe8f0');
  innerGrad.addColorStop(0.6, '#f0d0e8');
  innerGrad.addColorStop(1, '#c8a8d0');
  ctx.fillStyle = innerGrad;
  ctx.fillRect(48, 48, w - 96, h - 160);
}

function drawStylizedCouple(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  const floorY = h - 200;

  function voxelRect(x: number, y: number, rw: number, rh: number, color: string): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, rw, rh);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, rw, rh);
  }

  const brideX = cx - 130;
  voxelRect(brideX - 28, floorY - 180, 56, 90, '#ffffff');
  voxelRect(brideX - 22, floorY - 260, 44, 80, '#fff5f8');
  voxelRect(brideX - 30, floorY - 290, 60, 30, '#ffffff');
  voxelRect(brideX - 18, floorY - 340, 36, 50, '#f5d0c8');
  voxelRect(brideX - 28, floorY - 360, 56, 22, '#e8c8d8');
  voxelRect(brideX - 8, floorY - 375, 16, 16, '#2a1020');

  const groomX = cx + 130;
  voxelRect(groomX - 26, floorY - 175, 52, 95, '#1a2840');
  voxelRect(groomX - 22, floorY - 250, 44, 75, '#243050');
  voxelRect(groomX - 30, floorY - 275, 60, 25, '#1a2840');
  voxelRect(groomX - 16, floorY - 325, 32, 48, '#e8c8a8');
  voxelRect(groomX - 20, floorY - 345, 40, 20, '#1a1020');
  voxelRect(groomX - 6, floorY - 358, 12, 12, '#101020');

  voxelRect(cx - 18, floorY - 200, 36, 20, '#f5d0c8');

  ctx.fillStyle = '#ff6fa8';
  ctx.font = '48px serif';
  ctx.textAlign = 'center';
  ctx.fillText('♥', cx, floorY - 310);
}

function drawPortraitNames(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  names: string,
): void {
  ctx.fillStyle = '#ffd97a';
  ctx.font = 'bold 52px "Segoe UI", "Georgia", serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  ctx.fillText(names, w / 2, h - 72);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#e8d0a0';
  ctx.font = 'italic 28px "Segoe UI", serif';
  ctx.fillText('03.08.2026', w / 2, h - 28);
}

export function buildCharacterStatue(type: EnemyType): THREE.Group {
  const stats = ENEMY_STATS[type];
  const { root } = buildEnemyMesh(type, stats);
  const statue = root.clone(true);

  statue.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const mat = child.material;
    if (!(mat instanceof THREE.MeshLambertMaterial)) return;
    const marble = mat.clone();
    marble.emissive.setHex(0x000000);
    marble.emissiveIntensity = 0;
    const src = mat.color;
    const lum = src.r * 0.299 + src.g * 0.587 + src.b * 0.114;
    if (lum > 0.55) marble.color.setHex(MARBLE_LIGHT);
    else if (lum > 0.3) marble.color.setHex(MARBLE_MID);
    else marble.color.setHex(MARBLE_DARK);
    child.material = marble;
  });

  return statue;
}

export function buildHallDecorations(decorations: HallDecorations): THREE.Group {
  const group = new THREE.Group();
  group.name = 'hall-decorations';

  if (decorations.portrait) {
    const p = decorations.portrait;
    const portrait = createCouplePortrait(
      p.names,
      p.width,
      p.height,
      `${import.meta.env.BASE_URL}couple.jpg`,
    );
    portrait.position.set(p.x, p.y, p.z);
    portrait.rotation.y = p.rotationY;
    group.add(portrait);
  }

  for (const spec of decorations.statues) {
    const statue = buildCharacterStatue(spec.type);
    statue.position.set(spec.x, spec.y, spec.z);
    statue.rotation.y = spec.rotationY;
    if (spec.scale) statue.scale.setScalar(spec.scale);
    group.add(statue);
  }

  return group;
}
