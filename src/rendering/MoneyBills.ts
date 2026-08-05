import * as THREE from 'three';

const C = {
  green: 0x2a7a32,
  greenMid: 0x3a9a42,
  greenDark: 0x1e5c24,
  greenLight: 0x4cb85a,
  ink: 0x0a2e0a,
  band: 0xf2e8c8,
  bandShadow: 0xd4c49a,
  gold: 0xd4af37,
  goldLight: 0xf0d060,
  goldDark: 0xa08020,
};

/** Standard banknote footprint — wide and thin. */
const BILL_W = 0.38;
const BILL_D = 0.17;
const BILL_H = 0.006;
const STACK_COUNT = 18;

function mat(color: number, opts?: THREE.MeshLambertMaterialParameters): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function vox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x = 0,
  y = 0,
  z = 0,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}

function createBillFaceLabel(stackTopY: number): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 336;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#4cb85a');
    grad.addColorStop(0.5, '#3a9a42');
    grad.addColorStop(1, '#2a7a32');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Ornate border
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, canvas.width - 28, canvas.height - 28);
    ctx.strokeStyle = 'rgba(13, 61, 13, 0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Corner ornaments
    ctx.fillStyle = 'rgba(212, 175, 55, 0.7)';
    ctx.font = 'bold 28px "Segoe UI", "Arial", sans-serif';
    ctx.fillText('♦', 52, 52);
    ctx.fillText('♦', canvas.width - 52, 52);
    ctx.fillText('♦', 52, canvas.height - 52);
    ctx.fillText('♦', canvas.width - 52, canvas.height - 52);

    // Denomination
    ctx.fillStyle = '#0a2e0a';
    ctx.font = 'bold 108px "Segoe UI", "Arial", sans-serif';
    ctx.fillText('100', cx, cy - 8);

    ctx.fillStyle = '#d4af37';
    ctx.font = 'bold 32px "Segoe UI", "Arial", sans-serif';
    ctx.fillText('LOVE DIRHEM', cx, cy + 52);

    ctx.fillStyle = 'rgba(10, 46, 10, 0.65)';
    ctx.font = '600 22px "Segoe UI", "Arial", sans-serif';
    ctx.fillText('Dubai · Lüks Seri', cx, cy + 86);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(BILL_W * 0.94, BILL_D * 0.9),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  label.position.set(0, stackTopY + BILL_H * 0.6, 0.002);
  label.rotation.x = -Math.PI / 2;
  label.renderOrder = 2;
  label.name = 'money-bill-label';
  return label;
}

/**
 * First-person wad of green cash — held instead of a weapon on Dubai.
 */
export function buildMoneyBills(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'money-bills';

  const greenM = mat(C.green);
  const midM = mat(C.greenMid);
  const darkM = mat(C.greenDark);
  const lightM = mat(C.greenLight);
  const inkM = mat(C.ink);
  const bandM = mat(C.band);
  const bandShadowM = mat(C.bandShadow);
  const goldM = mat(C.gold);
  const goldLightM = mat(C.goldLight);
  const goldDarkM = mat(C.goldDark);

  const stack = new THREE.Group();
  stack.name = 'money-stack';
  g.add(stack);

  const billMats = [greenM, midM, darkM, lightM, midM, greenM];
  const stackHeight = STACK_COUNT * BILL_H;

  // Neat aligned stack — tiny jitter only for paper depth
  for (let i = 0; i < STACK_COUNT; i++) {
    const y = i * BILL_H;
    const jx = ((i * 7) % 5 - 2) * 0.0006;
    const jz = ((i * 11) % 5 - 2) * 0.0006;
    const m = billMats[i % billMats.length];
    vox(stack, BILL_W, BILL_H, BILL_D, m, jx, y, jz);
  }

  const bandY = stackHeight * 0.48;

  // Paper band wrapping the bundle
  vox(stack, BILL_W + 0.028, 0.032, BILL_D + 0.018, bandShadowM, 0, bandY, 0);
  vox(stack, BILL_W + 0.02, 0.026, BILL_D + 0.012, bandM, 0, bandY + 0.004, 0.001);

  // Gold strip on band (Dubai luxury accent)
  vox(stack, BILL_W * 0.55, 0.012, BILL_D + 0.022, goldM, 0, bandY + 0.006, 0);
  vox(stack, 0.04, 0.04, 0.04, goldLightM, 0, bandY + 0.006, BILL_D * 0.52);
  vox(stack, 0.035, 0.035, 0.035, goldDarkM, 0, bandY + 0.006, BILL_D * 0.52 + 0.002);

  // Side edge ink strips (visible thickness)
  for (const side of [-1, 1]) {
    vox(stack, 0.012, stackHeight * 0.92, BILL_D * 0.88, inkM, side * (BILL_W * 0.5 + 0.004), stackHeight * 0.46, 0);
  }

  // Top bill — slightly larger, clean face
  const topY = stackHeight;
  vox(stack, BILL_W + 0.004, BILL_H, BILL_D + 0.004, lightM, 0, topY, 0);

  stack.add(createBillFaceLabel(topY));

  // Hand-grip shadow at bottom
  vox(stack, BILL_W * 0.7, 0.01, BILL_D * 0.55, darkM, 0, -0.002, 0.02);

  // Tilt whole wad toward camera (matches celebration bouquet style)
  g.rotation.set(-0.28, 0.42, 0.1);

  return g;
}
