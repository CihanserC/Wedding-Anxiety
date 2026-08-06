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

function addFormalTorso(model: THREE.Group, yBase: number, bowtie = false): void {
  const black = mat(0x141418);
  const white = mat(0xf2f0ec);
  const skin = mat(0xe0c0a0);

  vox(model, 0.48, 0.55, 0.28, black, 0, yBase + 0.95, 0);
  vox(model, 0.42, 0.18, 0.24, white, 0, yBase + 0.72, 0.02);
  if (bowtie) {
    vox(model, 0.12, 0.06, 0.04, mat(0xf0f0f0), 0, yBase + 1.18, 0.12);
  } else {
    vox(model, 0.08, 0.22, 0.04, mat(0xf0f0f0), 0, yBase + 1.05, 0.12);
  }
  vox(model, 0.14, 0.1, 0.14, skin, 0, yBase + 1.28, 0);
  vox(model, 0.24, 0.26, 0.22, skin, 0, yBase + 1.48, 0.02);
  vox(model, 0.05, 0.04, 0.03, mat(0x1a1008), -0.07, yBase + 1.5, 0.12);
  vox(model, 0.05, 0.04, 0.03, mat(0x1a1008), 0.07, yBase + 1.5, 0.12);
}

/** Conductor in tails, baton raised toward the audience. */
export function buildConductorCharacter(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'conductor-character';
  const model = new THREE.Group();
  model.name = 'conductor-model';
  root.add(model);

  const black = mat(0x121218);
  const skin = mat(0xe0c0a0);
  const shoe = mat(0x1a1010);

  vox(model, 0.14, 0.08, 0.28, shoe, -0.1, 0.04, 0.04);
  vox(model, 0.14, 0.08, 0.28, shoe, 0.1, 0.04, 0.04);
  vox(model, 0.15, 0.72, 0.15, black, -0.1, 0.42, 0);
  vox(model, 0.15, 0.72, 0.15, black, 0.1, 0.42, 0);
  vox(model, 0.5, 1.05, 0.3, black, 0, 0.95, 0);
  vox(model, 0.46, 0.35, 0.28, black, 0, 1.45, -0.02);
  addFormalTorso(model, 0, true);

  vox(model, 0.12, 0.48, 0.12, black, -0.34, 1.05, 0, 0, 0, 0.35);
  vox(model, 0.12, 0.48, 0.12, black, 0.34, 1.05, 0, 0, 0, -0.35);
  vox(model, 0.1, 0.1, 0.1, skin, -0.38, 1.42, 0.08, -0.8, 0, 0.5);
  vox(model, 0.1, 0.1, 0.1, skin, 0.38, 1.42, 0.08, -1.1, 0, -0.4);
  vox(model, 0.02, 0.28, 0.02, mat(0xd4af37), 0.42, 1.72, 0.02, -1.0, 0, -0.2);

  fitHumanScale(model, 1.78);
  return root;
}

/** Pianist seated at the keyboard, hands forward. */
export function buildPianistCharacter(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'pianist-character';
  const model = new THREE.Group();
  model.name = 'pianist-model';
  root.add(model);

  const black = mat(0x141418);
  const skin = mat(0xe0c0a0);
  const shoe = mat(0x1a1010);

  vox(model, 0.14, 0.08, 0.28, shoe, -0.1, 0.04, 0.18);
  vox(model, 0.14, 0.08, 0.28, shoe, 0.1, 0.04, 0.18);
  vox(model, 0.16, 0.42, 0.16, black, -0.1, 0.28, 0.02, 1.1, 0, 0);
  vox(model, 0.16, 0.42, 0.16, black, 0.1, 0.28, 0.02, 1.1, 0, 0);
  vox(model, 0.46, 0.42, 0.28, black, 0, 0.52, 0);
  vox(model, 0.42, 0.48, 0.26, black, 0, 0.92, -0.02);
  addFormalTorso(model, 0);

  vox(model, 0.12, 0.38, 0.12, black, -0.32, 0.88, 0.18, 0.9, 0, 0.55);
  vox(model, 0.12, 0.38, 0.12, black, 0.32, 0.88, 0.18, 0.9, 0, -0.55);
  vox(model, 0.1, 0.1, 0.1, skin, -0.34, 0.78, 0.42, 0.4, 0, 0.2);
  vox(model, 0.1, 0.1, 0.1, skin, 0.34, 0.78, 0.42, 0.4, 0, -0.2);

  fitHumanScale(model, 1.45);
  return root;
}

/** Cellist seated with instrument between the knees. */
export function buildCellistCharacter(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'cellist-character';
  const model = new THREE.Group();
  model.name = 'cellist-model';
  root.add(model);

  const black = mat(0x141418);
  const wood = mat(0x8a4520);
  const dark = mat(0x3a2010);
  const skin = mat(0xe0c0a0);
  const shoe = mat(0x1a1010);

  vox(model, 0.14, 0.08, 0.28, shoe, -0.1, 0.04, 0.12);
  vox(model, 0.14, 0.08, 0.28, shoe, 0.1, 0.04, 0.12);
  vox(model, 0.16, 0.42, 0.16, black, -0.1, 0.28, 0, 1.0, 0, 0);
  vox(model, 0.16, 0.42, 0.16, black, 0.1, 0.28, 0, 1.0, 0, 0);
  vox(model, 0.44, 0.4, 0.26, black, 0, 0.5, 0);
  addFormalTorso(model, 0);

  const cello = new THREE.Group();
  cello.rotation.x = -0.22;
  cello.position.set(0.02, 0.35, 0.18);
  model.add(cello);
  vox(cello, 0.5, 0.62, 0.2, wood, 0, 0.55, 0);
  vox(cello, 0.38, 0.42, 0.18, wood, 0, 1.02, 0);
  vox(cello, 0.07, 0.62, 0.07, dark, 0, 1.42, -0.02);
  vox(cello, 0.1, 0.14, 0.1, dark, 0, 1.78, -0.02);

  vox(model, 0.12, 0.34, 0.12, black, -0.3, 0.9, 0.12, 0.5, 0, 0.35);
  vox(model, 0.12, 0.34, 0.12, black, 0.3, 0.9, 0.12, 0.5, 0, -0.35);
  vox(model, 0.1, 0.1, 0.1, skin, -0.32, 0.82, 0.28, 0.3, 0, 0.15);
  vox(model, 0.1, 0.1, 0.1, skin, 0.32, 0.82, 0.28, 0.3, 0, -0.15);
  vox(model, 0.02, 0.42, 0.02, mat(0xd8d0c8), 0.34, 1.02, 0.2, 0.2, 0, -0.1);

  fitHumanScale(model, 1.5);
  return root;
}

/** Violinist standing with instrument raised. */
export function buildViolinistCharacter(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'violinist-character';
  const model = new THREE.Group();
  model.name = 'violinist-model';
  root.add(model);

  const black = mat(0x141418);
  const gown = mat(0x1a1020);
  const skin = mat(0xe8c8b0);
  const wood = mat(0xa05028);
  const shoe = mat(0x1a1010);

  vox(model, 0.13, 0.08, 0.26, shoe, -0.1, 0.04, 0.04);
  vox(model, 0.13, 0.08, 0.26, shoe, 0.1, 0.04, 0.04);
  vox(model, 0.15, 0.78, 0.15, black, -0.1, 0.45, 0);
  vox(model, 0.15, 0.78, 0.15, black, 0.1, 0.45, 0);
  vox(model, 0.44, 1.0, 0.28, gown, 0, 0.95, 0);
  vox(model, 0.14, 0.1, 0.14, skin, 0, 1.28, 0);
  vox(model, 0.22, 0.24, 0.2, skin, 0, 1.46, 0.02);
  vox(model, 0.05, 0.04, 0.03, mat(0x1a1008), -0.06, 1.48, 0.1);
  vox(model, 0.05, 0.04, 0.03, mat(0x1a1008), 0.06, 1.48, 0.1);
  vox(model, 0.26, 0.08, 0.24, mat(0x1a0818), 0, 1.62, -0.02);

  vox(model, 0.12, 0.46, 0.12, gown, -0.32, 1.02, 0, 0, 0, 0.25);
  vox(model, 0.12, 0.46, 0.12, gown, 0.32, 1.02, 0, 0, 0, -0.25);
  vox(model, 0.1, 0.1, 0.1, skin, -0.34, 0.78, 0.04);
  vox(model, 0.1, 0.1, 0.1, skin, 0.34, 1.18, 0.08, -0.6, 0, -0.35);

  const violin = new THREE.Group();
  violin.position.set(-0.06, 1.52, 0.08);
  violin.rotation.set(0.2, 0.15, -0.35);
  model.add(violin);
  vox(violin, 0.16, 0.06, 0.22, wood, 0, 0, 0);
  vox(violin, 0.04, 0.04, 0.28, mat(0x2a1808), 0, 0.02, -0.2);
  vox(violin, 0.02, 0.34, 0.02, mat(0xd8d0c8), 0.18, 0.02, 0.04, 0, 0, 0.8);

  fitHumanScale(model, 1.68);
  return root;
}
