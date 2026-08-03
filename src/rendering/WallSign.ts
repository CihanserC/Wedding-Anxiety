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
