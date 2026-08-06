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

const SKIN_TONES = [0xe8c8a8, 0xd4a878, 0xf0d0c0, 0xc89060] as const;
const HAIR_TONES = [0x2a1810, 0x4a3020, 0x6a4830, 0x1a1008, 0x8a6050] as const;
const SUIT_TONES = [0x1a2438, 0x2a2030, 0x1a2818, 0x282828] as const;
const DRESS_TONES = [0xc45a78, 0x5a6ab0, 0xd8b090, 0x6a8a78, 0x8a5a90, 0xd07060] as const;

export type GuestVariant = number;

/** Formal male wedding guest in a dark suit. */
export function buildGuestManCharacter(variant = 0): THREE.Group {
  const root = new THREE.Group();
  root.name = 'guest-man-character';
  const model = new THREE.Group();
  model.name = 'guest-man-model';
  root.add(model);

  const skin = mat(SKIN_TONES[variant % SKIN_TONES.length]);
  const skinShadow = mat(0xc09060);
  const hair = mat(HAIR_TONES[variant % HAIR_TONES.length]);
  const suit = mat(SUIT_TONES[variant % SUIT_TONES.length]);
  const suitDark = mat(0x121820);
  const shirt = mat(0xf5f5f5);
  const tie = mat(variant % 2 === 0 ? 0xb03040 : 0xd4a820);
  const shoe = mat(0x2a1a10);
  const eye = mat(0x1a1008);

  vox(model, 0.13, 0.07, 0.24, shoe, -0.1, 0.035, 0.03);
  vox(model, 0.13, 0.07, 0.24, shoe, 0.1, 0.035, 0.03);

  vox(model, 0.14, 0.55, 0.14, suitDark, -0.1, 0.35, 0);
  vox(model, 0.14, 0.55, 0.14, suitDark, 0.1, 0.35, 0);

  vox(model, 0.48, 0.7, 0.28, suit, 0, 0.9, 0);
  vox(model, 0.42, 0.22, 0.24, shirt, 0, 0.95, 0.02);
  vox(model, 0.07, 0.28, 0.04, tie, 0, 0.92, 0.14);

  vox(model, 0.12, 0.5, 0.12, suit, -0.34, 0.95, 0.02, 0, 0, 0.12);
  vox(model, 0.12, 0.5, 0.12, suit, 0.34, 0.95, 0.02, 0, 0, -0.12);
  vox(model, 0.1, 0.1, 0.1, skin, -0.36, 0.66, 0.05);
  vox(model, 0.1, 0.1, 0.1, skin, 0.36, 0.66, 0.05);

  vox(model, 0.14, 0.1, 0.12, skinShadow, 0, 1.32, 0);
  vox(model, 0.26, 0.28, 0.24, skin, 0, 1.52, 0.02);
  vox(model, 0.05, 0.04, 0.03, eye, -0.06, 1.54, 0.13);
  vox(model, 0.05, 0.04, 0.03, eye, 0.06, 1.54, 0.13);
  vox(model, 0.28, 0.12, 0.26, hair, 0, 1.68, -0.01);
  vox(model, 0.22, 0.1, 0.1, hair, 0, 1.58, -0.12);

  fitHumanScale(model, 1.68);
  return root;
}

/** Formal female wedding guest in a colored evening dress. */
export function buildGuestWomanCharacter(variant = 0): THREE.Group {
  const root = new THREE.Group();
  root.name = 'guest-woman-character';
  const model = new THREE.Group();
  model.name = 'guest-woman-model';
  root.add(model);

  const skin = mat(SKIN_TONES[(variant + 1) % SKIN_TONES.length]);
  const skinShadow = mat(0xc89070);
  const hair = mat(HAIR_TONES[(variant + 2) % HAIR_TONES.length]);
  const dress = mat(DRESS_TONES[variant % DRESS_TONES.length]);
  const dressDark = mat(0x4a3040);
  const shoe = mat(0x3a2018);
  const eye = mat(0x1a1008);
  const jewelry = mat(0xd4a820);

  vox(model, 0.12, 0.06, 0.22, shoe, -0.09, 0.03, 0.02);
  vox(model, 0.12, 0.06, 0.22, shoe, 0.09, 0.03, 0.02);

  vox(model, 0.13, 0.45, 0.13, dressDark, -0.09, 0.3, 0);
  vox(model, 0.13, 0.45, 0.13, dressDark, 0.09, 0.3, 0);

  vox(model, 0.52, 0.55, 0.32, dress, 0, 0.7, 0);
  vox(model, 0.42, 0.55, 0.26, dress, 0, 1.05, 0);
  vox(model, 0.36, 0.12, 0.22, dressDark, 0, 1.28, 0.02);

  vox(model, 0.11, 0.45, 0.11, skin, -0.3, 1.0, 0.02, 0, 0, 0.18);
  vox(model, 0.11, 0.45, 0.11, skin, 0.3, 1.0, 0.02, 0, 0, -0.18);
  vox(model, 0.09, 0.09, 0.09, skin, -0.32, 0.74, 0.05);
  vox(model, 0.09, 0.09, 0.09, skin, 0.32, 0.74, 0.05);

  vox(model, 0.12, 0.09, 0.11, skinShadow, 0, 1.38, 0);
  vox(model, 0.24, 0.26, 0.22, skin, 0, 1.56, 0.02);
  vox(model, 0.045, 0.035, 0.03, eye, -0.055, 1.58, 0.12);
  vox(model, 0.045, 0.035, 0.03, eye, 0.055, 1.58, 0.12);
  vox(model, 0.08, 0.04, 0.04, jewelry, 0, 1.42, 0.1);

  vox(model, 0.28, 0.14, 0.26, hair, 0, 1.72, 0);
  vox(model, 0.18, 0.22, 0.12, hair, 0, 1.55, -0.12);
  vox(model, 0.1, 0.18, 0.1, hair, -0.14, 1.5, -0.02);
  vox(model, 0.1, 0.18, 0.1, hair, 0.14, 1.5, -0.02);

  fitHumanScale(model, 1.62);
  return root;
}
