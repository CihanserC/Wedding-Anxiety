import * as THREE from 'three';

const C = {
  wrap: 0xf8ece4,
  wrapShadow: 0xe8d8cc,
  pink: 0xff8fab,
  pinkDeep: 0xff6b9d,
  white: 0xfff8f8,
  cream: 0xfff0d8,
  lavender: 0xc9a0ff,
  yellow: 0xffd166,
  green: 0x5a9e5a,
  greenDark: 0x3d6b3d,
  ribbon: 0xfff5f8,
  ribbonPink: 0xffb7c5,
};

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

function rose(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  size: number,
  petalMat: THREE.MeshLambertMaterial,
  centerMat: THREE.MeshLambertMaterial,
): void {
  vox(parent, size, size * 0.35, size, petalMat, x, y, z);
  vox(parent, size * 1.15, size * 0.22, size * 1.15, petalMat, x, y - size * 0.2, z);
  vox(parent, size * 0.55, size * 0.35, size * 0.55, centerMat, x, y + size * 0.08, z);
}

/**
 * First-person celebration bouquet — lush roses, peonies, eucalyptus, satin ribbons.
 */
export function buildCelebrationBouquet(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'celebration-bouquet';

  const wrapM = mat(C.wrap);
  const wrapShadowM = mat(C.wrapShadow);
  const pinkM = mat(C.pink);
  const pinkDeepM = mat(C.pinkDeep);
  const whiteM = mat(C.white);
  const creamM = mat(C.cream);
  const lavenderM = mat(C.lavender);
  const yellowM = mat(C.yellow);
  const greenM = mat(C.green);
  const greenDarkM = mat(C.greenDark);
  const ribbonM = mat(C.ribbon);
  const ribbonPinkM = mat(C.ribbonPink);

  const bloomLift = 0.1;

  // Longer kraft paper wrap / stem
  vox(g, 0.24, 0.16, 0.2, wrapShadowM, 0, -0.28, 0.02, 0.15, 0, 0);
  vox(g, 0.22, 0.14, 0.18, wrapM, 0, -0.18, 0.02, 0.1, 0, 0);
  vox(g, 0.2, 0.12, 0.16, wrapM, 0, -0.1, 0.02, 0.06, 0, 0);
  vox(g, 0.18, 0.1, 0.14, wrapM, 0, -0.02, 0.03, 0.04, 0, 0);

  vox(g, 0.09, 0.22, 0.09, greenDarkM, 0, -0.12, 0.02);
  vox(g, 0.07, 0.16, 0.07, greenDarkM, 0.02, -0.2, 0.04, 0.05, 0, 0);

  // Eucalyptus leaves (fan outward)
  for (const [lx, lz, ry] of [
    [-0.16, 0.08, 0.5],
    [0.16, 0.06, -0.45],
    [-0.12, -0.1, 0.35],
    [0.14, -0.08, -0.25],
    [0, 0.12, 0.02],
    [-0.18, -0.04, 0.35],
    [0.15, 0.1, -0.4],
  ] as Array<[number, number, number]>) {
    vox(g, 0.15, 0.05, 0.09, greenM, lx, 0.04 + bloomLift, lz, 0.1, ry, 0);
    vox(g, 0.11, 0.04, 0.07, greenDarkM, lx * 1.1, 0.08 + bloomLift, lz * 1.1, 0.15, ry, 0);
  }

  // Central roses (larger cluster)
  rose(g, 0, 0.14 + bloomLift, 0, 0.13, pinkDeepM, creamM);
  rose(g, -0.11, 0.12 + bloomLift, 0.05, 0.1, pinkM, whiteM);
  rose(g, 0.11, 0.11 + bloomLift, -0.04, 0.095, pinkM, creamM);
  rose(g, -0.07, 0.18 + bloomLift, -0.07, 0.085, whiteM, creamM);
  rose(g, 0.08, 0.17 + bloomLift, 0.08, 0.09, pinkDeepM, whiteM);
  rose(g, -0.13, 0.1 + bloomLift, -0.04, 0.08, pinkM, creamM);
  rose(g, 0.12, 0.15 + bloomLift, 0.02, 0.085, lavenderM, whiteM);

  // Peony puffs (more, higher)
  for (const [px, py, pz, ps, pm] of [
    [-0.14, 0.08 + bloomLift, -0.03, 0.08, whiteM],
    [0.15, 0.09 + bloomLift, 0.03, 0.075, creamM],
    [0, 0.24 + bloomLift, 0.06, 0.07, lavenderM],
    [-0.05, 0.2 + bloomLift, 0.1, 0.065, pinkM],
    [0.09, 0.19 + bloomLift, -0.08, 0.06, whiteM],
    [-0.1, 0.16 + bloomLift, 0.08, 0.055, pinkDeepM],
    [0.06, 0.22 + bloomLift, -0.04, 0.055, creamM],
    [-0.08, 0.22 + bloomLift, -0.1, 0.05, whiteM],
  ] as Array<[number, number, number, number, THREE.MeshLambertMaterial]>) {
    vox(g, ps, ps * 0.7, ps, pm, px, py, pz);
    vox(g, ps * 1.25, ps * 0.28, ps * 1.25, pm, px, py - ps * 0.28, pz);
  }

  // Baby's breath accents (denser)
  const breathM = mat(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.18 });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const r = 0.1 + (i % 4) * 0.045;
    vox(
      g,
      0.04,
      0.04,
      0.04,
      breathM,
      Math.cos(a) * r,
      0.1 + bloomLift + (i % 5) * 0.035,
      Math.sin(a) * r * 0.75,
    );
  }

  // Yellow accent buds
  vox(g, 0.07, 0.14 + bloomLift, 0.11, yellowM, -0.16, 0.06, -0.05);
  vox(g, 0.06, 0.06, 0.06, yellowM, 0.17, 0.1 + bloomLift, 0.07);
  vox(g, 0.05, 0.05, 0.05, yellowM, -0.1, 0.2 + bloomLift, 0.12);

  // Satin ribbon bow
  vox(g, 0.15, 0.05, 0.04, ribbonPinkM, 0, -0.06, 0.1, 0, 0, 0);
  vox(g, 0.05, 0.13, 0.03, ribbonPinkM, -0.07, -0.06, 0.1, 0, 0.3, 0);
  vox(g, 0.05, 0.13, 0.03, ribbonPinkM, 0.07, -0.06, 0.1, 0, -0.3, 0);
  vox(g, 0.04, 0.04, 0.04, ribbonPinkM, 0, -0.06, 0.12);

  // Longer flowing ribbons
  vox(g, 0.028, 0.5, 0.016, ribbonM, 0.05, -0.38, 0.08, 0.12, 0, 0.2);
  vox(g, 0.022, 0.46, 0.013, ribbonM, -0.04, -0.36, 0.06, 0.08, 0, -0.15);
  vox(g, 0.02, 0.42, 0.012, ribbonM, 0.07, -0.34, 0.02, -0.06, 0, 0.28);
  vox(g, 0.018, 0.38, 0.01, ribbonM, -0.06, -0.32, -0.02, 0.05, 0, -0.2);

  g.position.set(0.3, -0.42, -0.48);
  g.rotation.set(-0.22, 0.35, 0.08);
  g.scale.setScalar(1.1);

  return g;
}
