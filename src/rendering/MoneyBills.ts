import * as THREE from 'three';

const C = {
  green: 0x2d8a2d,
  greenMid: 0x3cb043,
  greenDark: 0x1a6b1a,
  greenLight: 0x5ecf5e,
  ink: 0x0d3d0d,
  band: 0xf5f0d8,
};

/** Bill footprint — longer than the original wad for a proper bundle look. */
const BILL_W = 0.42;
const BILL_D = 0.16;
const BILL_H = 0.015;

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

function createBillFaceLabel(): THREE.Mesh {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#3cb043';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(13, 61, 13, 0.35)';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 4;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0d3d0d';
    ctx.font = 'bold 56px "Segoe UI", "Arial", sans-serif';
    ctx.fillText('100', cx - 108, cy);

    ctx.fillStyle = '#d32f2f';
    ctx.font = 'bold 52px "Segoe UI", "Arial", sans-serif';
    ctx.fillText('♥', cx - 18, cy + 2);

    ctx.fillStyle = '#0d3d0d';
    ctx.font = 'bold 46px "Segoe UI", "Arial", sans-serif';
    ctx.fillText('Love Dirhem', cx + 88, cy);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.colorSpace = THREE.SRGBColorSpace;

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(BILL_W * 0.92, BILL_D * 0.88),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );
  // PlaneGeometry defaults to XY (normal +Z); rotate flat onto the bill stack (normal +Y).
  label.position.set(0.018, 0.104, 0.01);
  label.rotation.set(-Math.PI / 2 + 0.12, 0.15, -0.05);
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

  // Stack of overlapping bills (fan slightly) — elongated notes
  const bills: Array<[number, number, number, number, THREE.MeshLambertMaterial]> = [
    [0, -0.02, 0.02, 0.02, darkM],
    [0.012, 0, 0, -0.04, greenM],
    [-0.018, 0.018, -0.01, 0.05, midM],
    [0.024, 0.035, 0.015, -0.06, greenM],
    [-0.012, 0.05, 0.005, 0.03, lightM],
    [0.006, 0.065, -0.02, -0.02, midM],
    [-0.024, 0.08, 0.01, 0.07, greenM],
    [0.018, 0.095, 0, -0.05, darkM],
  ];

  for (const [bx, by, bz, rz, m] of bills) {
    vox(g, BILL_W, BILL_H, BILL_D, m, bx, by, bz, 0.12, 0.15, rz);
  }

  // Paper band around the wad
  vox(g, BILL_W + 0.04, 0.04, 0.055, bandM, 0, 0.04, 0.01, 0.1, 0.1, 0);

  // Simple denomination bars / ink marks on top bill
  vox(g, 0.1, 0.01, 0.045, inkM, -0.08, 0.105, 0.01, 0.12, 0.1, -0.04);
  vox(g, 0.06, 0.01, 0.035, inkM, 0.09, 0.105, -0.01, 0.12, 0.1, -0.04);
  vox(g, 0.14, 0.008, 0.022, lightM, 0, 0.108, 0.02, 0.12, 0.1, -0.04);

  // Loose corner flap
  vox(g, 0.12, 0.012, 0.09, midM, 0.17, 0.03, 0.04, 0.2, 0.4, 0.35);

  g.add(createBillFaceLabel());

  return g;
}
