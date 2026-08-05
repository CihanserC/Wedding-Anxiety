import * as THREE from 'three';

function mat(color: number, opts: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function vox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
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

function fitHumanScale(model: THREE.Group, targetHeight: number): void {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = targetHeight / Math.max(size.y, 0.001);
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);
  const grounded = new THREE.Box3().setFromObject(model);
  model.position.y -= grounded.min.y;
}

/** Friendly local in white kandura + ghutra. */
export function buildArabManCharacter(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'arab-man-character';
  const model = new THREE.Group();
  model.name = 'arab-man-model';
  root.add(model);

  const skin = mat(0xd4a878);
  const skinShadow = mat(0xc09060);
  const white = mat(0xf5f2ea);
  const whiteShadow = mat(0xe0dcd0);
  const ghutra = mat(0xf8f8f8);
  const agal = mat(0x1a1a1a);
  const eye = mat(0x1a1208);
  const sandal = mat(0x5a3a20);

  // Feet / sandals
  vox(model, 0.14, 0.06, 0.26, sandal, -0.12, 0.03, 0.04);
  vox(model, 0.14, 0.06, 0.26, sandal, 0.12, 0.03, 0.04);

  // Legs under thobe
  vox(model, 0.16, 0.55, 0.16, whiteShadow, -0.12, 0.35, 0);
  vox(model, 0.16, 0.55, 0.16, whiteShadow, 0.12, 0.35, 0);

  // Thobe / kandura
  vox(model, 0.55, 0.95, 0.32, white, 0, 0.95, 0);
  vox(model, 0.5, 0.2, 0.28, whiteShadow, 0, 0.55, 0.02);
  vox(model, 0.48, 0.15, 0.08, whiteShadow, 0, 1.35, 0.14);

  // Arms
  vox(model, 0.14, 0.55, 0.14, white, -0.38, 1.05, 0.02, 0, 0, 0.15);
  vox(model, 0.14, 0.55, 0.14, white, 0.38, 1.05, 0.02, 0, 0, -0.15);
  vox(model, 0.12, 0.12, 0.12, skin, -0.4, 0.72, 0.06);
  vox(model, 0.12, 0.12, 0.12, skin, 0.4, 0.72, 0.06);

  // Neck + head
  vox(model, 0.16, 0.12, 0.14, skinShadow, 0, 1.5, 0);
  vox(model, 0.28, 0.32, 0.26, skin, 0, 1.72, 0.02);
  vox(model, 0.06, 0.05, 0.04, eye, -0.07, 1.75, 0.14);
  vox(model, 0.06, 0.05, 0.04, eye, 0.07, 1.75, 0.14);
  vox(model, 0.1, 0.04, 0.06, skinShadow, 0, 1.62, 0.14);

  // Ghutra + agal
  vox(model, 0.36, 0.12, 0.34, ghutra, 0, 1.92, 0);
  vox(model, 0.4, 0.08, 0.08, agal, 0, 1.98, 0);
  vox(model, 0.18, 0.35, 0.08, ghutra, -0.22, 1.7, -0.02, 0, 0.2, 0.25);
  vox(model, 0.18, 0.35, 0.08, ghutra, 0.22, 1.7, -0.02, 0, -0.2, -0.25);

  fitHumanScale(model, 1.76);
  return root;
}

/** Friendly local woman in black abaya + hijab with gold trim. */
export function buildArabWomanCharacter(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'arab-woman-character';
  const model = new THREE.Group();
  model.name = 'arab-woman-model';
  root.add(model);

  const skin = mat(0xd8b090);
  const skinShadow = mat(0xc49878);
  const abaya = mat(0x1a1a22);
  const abayaSoft = mat(0x2a2a35);
  const hijab = mat(0x14141c);
  const gold = mat(0xd4af37);
  const eye = mat(0x1a1208);
  const shoe = mat(0x0c0c10);

  vox(model, 0.12, 0.06, 0.22, shoe, -0.1, 0.03, 0.02);
  vox(model, 0.12, 0.06, 0.22, shoe, 0.1, 0.03, 0.02);

  vox(model, 0.14, 0.5, 0.14, abayaSoft, -0.1, 0.32, 0);
  vox(model, 0.14, 0.5, 0.14, abayaSoft, 0.1, 0.32, 0);

  // Abaya
  vox(model, 0.52, 1.0, 0.34, abaya, 0, 0.9, 0);
  vox(model, 0.55, 0.08, 0.36, gold, 0, 1.35, 0.02);
  vox(model, 0.48, 0.12, 0.08, abayaSoft, 0, 0.55, 0.16);

  // Arms
  vox(model, 0.13, 0.5, 0.13, abaya, -0.36, 1.0, 0.02, 0, 0, 0.12);
  vox(model, 0.13, 0.5, 0.13, abaya, 0.36, 1.0, 0.02, 0, 0, -0.12);
  vox(model, 0.1, 0.1, 0.1, skin, -0.38, 0.7, 0.05);
  vox(model, 0.1, 0.1, 0.1, skin, 0.38, 0.7, 0.05);

  // Face peek
  vox(model, 0.22, 0.24, 0.18, skin, 0, 1.68, 0.08);
  vox(model, 0.05, 0.04, 0.03, eye, -0.05, 1.7, 0.17);
  vox(model, 0.05, 0.04, 0.03, eye, 0.05, 1.7, 0.17);
  vox(model, 0.08, 0.03, 0.04, skinShadow, 0, 1.58, 0.16);

  // Hijab
  vox(model, 0.38, 0.35, 0.32, hijab, 0, 1.78, 0);
  vox(model, 0.42, 0.12, 0.34, hijab, 0, 1.95, -0.02);
  vox(model, 0.2, 0.4, 0.1, hijab, -0.2, 1.65, -0.05, 0, 0.15, 0.2);
  vox(model, 0.2, 0.4, 0.1, hijab, 0.2, 1.65, -0.05, 0, -0.15, -0.2);
  vox(model, 0.3, 0.04, 0.04, gold, 0, 1.55, 0.14);

  fitHumanScale(model, 1.68);
  return root;
}
