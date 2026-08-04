import * as THREE from 'three';

const C = {
  skin: 0xe8c8a8,
  skinShadow: 0xd8b898,
  skinHighlight: 0xf5dcc8,
  hair: 0x2a1810,
  hairLight: 0x3a2820,
  eye: 0x1a1008,
  eyeWhite: 0xf8f4f0,
  brow: 0x1a1008,
  lip: 0xc89088,
  suit: 0x1a2438,
  suitDark: 0x121a28,
  suitLight: 0x243048,
  shirt: 0xf5f5f5,
  shirtShadow: 0xe8e8e8,
  tie: 0xe8d8a8,
  tieShadow: 0xd0c090,
  gold: 0xd4a820,
  shoe: 0x4a3020,
  shoeDark: 0x3a2418,
  glass: 0x1a1a1a,
  glassLens: 0xc8d8e8,
  boutonnierePink: 0xe08090,
  boutonniereWhite: 0xfff8f8,
  boutonniereGreen: 0x508040,
  pocketSquare: 0xe8d8a8,
} as const;

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

/** Side-profile thickness multiplier — keeps front width, adds body depth. */
const BODY_DEPTH_SCALE = 1.45;

function fitHumanScale(model: THREE.Group, targetHeight: number): void {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const scale = targetHeight / size.y;
  model.scale.set(scale, scale, scale * BODY_DEPTH_SCALE);
  model.updateMatrixWorld(true);
  const grounded = new THREE.Box3().setFromObject(model);
  model.position.y -= grounded.min.y;
}

/**
 * Detailed voxel groom: navy suit, champagne tie, glasses, boutonniere,
 * hand-in-pocket pose beside the bride.
 */
export function buildGroomCharacter(): THREE.Group {
  const model = new THREE.Group();
  model.name = 'groom-model';

  const skinM = mat(C.skin);
  const skinShadowM = mat(C.skinShadow);
  const skinHiM = mat(C.skinHighlight);
  const hairM = mat(C.hair);
  const hairLightM = mat(C.hairLight);
  const suitM = mat(C.suit);
  const suitDarkM = mat(C.suitDark);
  const suitLightM = mat(C.suitLight);
  const shirtM = mat(C.shirt);
  const shirtShadowM = mat(C.shirtShadow);
  const tieM = mat(C.tie);
  const tieShadowM = mat(C.tieShadow);
  const shoeM = mat(C.shoe);
  const shoeDarkM = mat(C.shoeDark);
  const eyeM = mat(C.eye);
  const eyeWhiteM = mat(C.eyeWhite);
  const browM = mat(C.brow);
  const lipM = mat(C.lip);
  const glassM = mat(C.glass);
  const lensM = mat(C.glassLens, { transparent: true, opacity: 0.55 });

  // ── Shoes ──────────────────────────────────────────────────────────────
  vox(model, 0.14, 0.08, 0.28, shoeDarkM, -0.1, 0.04, 0.04);
  vox(model, 0.14, 0.08, 0.28, shoeDarkM, 0.1, 0.04, 0.04);
  vox(model, 0.12, 0.04, 0.08, shoeM, -0.1, 0.08, -0.08);
  vox(model, 0.12, 0.04, 0.08, shoeM, 0.1, 0.08, -0.08);

  // ── Trousers (slim fit) ────────────────────────────────────────────────
  const legH = 0.82;
  vox(model, 0.2, legH, 0.22, suitDarkM, -0.11, legH * 0.5, 0);
  vox(model, 0.2, legH, 0.22, suitDarkM, 0.11, legH * 0.5, 0);
  vox(model, 0.18, 0.12, 0.2, suitM, -0.11, legH + 0.04, 0);
  vox(model, 0.18, 0.12, 0.2, suitM, 0.11, legH + 0.04, 0);
  // Crease lines
  vox(model, 0.02, legH * 0.9, 0.02, suitLightM, -0.11, legH * 0.48, 0.1);
  vox(model, 0.02, legH * 0.9, 0.02, suitLightM, 0.11, legH * 0.48, 0.1);

  // ── Torso / jacket ─────────────────────────────────────────────────────
  const torsoY = legH + 0.1;
  const torsoH = 0.52;
  vox(model, 0.44, torsoH, 0.3, suitM, 0, torsoY + torsoH * 0.5, 0);
  vox(model, 0.42, torsoH * 0.95, 0.08, suitDarkM, 0, torsoY + torsoH * 0.5, 0.14);
  // Lapels
  vox(model, 0.08, 0.28, 0.06, suitDarkM, -0.14, torsoY + torsoH * 0.72, 0.12, 0, 0, 0.22);
  vox(model, 0.08, 0.28, 0.06, suitDarkM, 0.14, torsoY + torsoH * 0.72, 0.12, 0, 0, -0.22);
  // White shirt front
  vox(model, 0.14, torsoH * 0.75, 0.04, shirtM, 0, torsoY + torsoH * 0.55, 0.14);
  vox(model, 0.1, 0.06, 0.04, shirtShadowM, 0, torsoY + torsoH * 0.92, 0.14);
  // Shirt collar
  vox(model, 0.18, 0.05, 0.06, shirtM, 0, torsoY + torsoH + 0.01, 0.1);
  vox(model, 0.06, 0.04, 0.04, shirtShadowM, -0.08, torsoY + torsoH + 0.02, 0.1, 0, 0, 0.25);
  vox(model, 0.06, 0.04, 0.04, shirtShadowM, 0.08, torsoY + torsoH + 0.02, 0.1, 0, 0, -0.25);

  // Champagne tie
  vox(model, 0.06, 0.14, 0.03, tieM, 0, torsoY + torsoH * 0.78, 0.15);
  vox(model, 0.1, 0.08, 0.03, tieShadowM, 0, torsoY + torsoH * 0.62, 0.15);
  vox(model, 0.08, 0.12, 0.03, tieM, 0, torsoY + torsoH * 0.48, 0.14, 0, 0, 0.05);

  // Left breast pocket + pocket square (viewer's right / groom's left)
  vox(model, 0.1, 0.08, 0.04, suitDarkM, -0.16, torsoY + torsoH * 0.78, 0.1);
  vox(model, 0.08, 0.05, 0.02, mat(C.pocketSquare), -0.16, torsoY + torsoH * 0.84, 0.12);

  // Boutonniere on left lapel
  vox(model, 0.04, 0.04, 0.03, mat(C.boutonnierePink), -0.18, torsoY + torsoH * 0.82, 0.14);
  vox(model, 0.03, 0.03, 0.02, mat(C.boutonniereWhite), -0.17, torsoY + torsoH * 0.86, 0.14);
  vox(model, 0.05, 0.03, 0.02, mat(C.boutonniereGreen), -0.19, torsoY + torsoH * 0.8, 0.13);
  vox(model, 0.03, 0.06, 0.02, mat(C.boutonniereGreen), -0.2, torsoY + torsoH * 0.76, 0.12);

  // Jacket buttons
  for (let i = 0; i < 2; i++) {
    vox(model, 0.03, 0.03, 0.02, suitLightM, 0, torsoY + torsoH * (0.35 + i * 0.22), 0.16);
  }

  // ── Shoulders ──────────────────────────────────────────────────────────
  vox(model, 0.5, 0.12, 0.32, suitM, 0, torsoY + torsoH + 0.02, 0);

  // ── Neck ───────────────────────────────────────────────────────────────
  const neckY = torsoY + torsoH + 0.06;
  vox(model, 0.1, 0.1, 0.1, skinM, 0, neckY + 0.05, 0);

  // ── Head ───────────────────────────────────────────────────────────────
  const headGroup = new THREE.Group();
  headGroup.position.set(0, neckY + 0.2, 0);
  model.add(headGroup);

  vox(headGroup, 0.22, 0.28, 0.22, skinM, 0, 0.14, 0);
  vox(headGroup, 0.2, 0.1, 0.2, skinShadowM, 0, 0.3, -0.02);
  vox(headGroup, 0.18, 0.06, 0.04, skinHiM, 0, 0.1, 0.12);

  // Eyes
  vox(headGroup, 0.05, 0.035, 0.02, eyeWhiteM, -0.06, 0.15, 0.11);
  vox(headGroup, 0.05, 0.035, 0.02, eyeWhiteM, 0.06, 0.15, 0.11);
  vox(headGroup, 0.03, 0.03, 0.025, eyeM, -0.06, 0.15, 0.12);
  vox(headGroup, 0.03, 0.03, 0.025, eyeM, 0.06, 0.15, 0.12);
  vox(headGroup, 0.055, 0.01, 0.015, browM, -0.06, 0.175, 0.115);
  vox(headGroup, 0.055, 0.01, 0.015, browM, 0.06, 0.175, 0.115);

  // Glasses (thin rectangular frames)
  vox(headGroup, 0.11, 0.012, 0.015, glassM, -0.06, 0.15, 0.125);
  vox(headGroup, 0.11, 0.012, 0.015, glassM, 0.06, 0.15, 0.125);
  vox(headGroup, 0.08, 0.08, 0.012, lensM, -0.06, 0.15, 0.122);
  vox(headGroup, 0.08, 0.08, 0.012, lensM, 0.06, 0.15, 0.122);
  vox(headGroup, 0.04, 0.01, 0.01, glassM, 0, 0.15, 0.125);
  vox(headGroup, 0.02, 0.01, 0.04, glassM, -0.12, 0.15, 0.1);
  vox(headGroup, 0.02, 0.01, 0.04, glassM, 0.12, 0.15, 0.1);

  // Nose & lips
  vox(headGroup, 0.03, 0.05, 0.03, skinShadowM, 0, 0.1, 0.11);
  vox(headGroup, 0.06, 0.02, 0.02, lipM, 0, 0.04, 0.115);

  // ── Hair (short dark, swept up) ────────────────────────────────────────
  vox(headGroup, 0.24, 0.12, 0.2, hairM, 0, 0.3, -0.02);
  vox(headGroup, 0.22, 0.08, 0.18, hairLightM, 0, 0.34, 0.02);
  vox(headGroup, 0.2, 0.06, 0.16, hairM, 0, 0.28, -0.08);
  vox(headGroup, 0.08, 0.06, 0.1, hairLightM, -0.1, 0.28, 0.04, 0, 0, 0.15);
  vox(headGroup, 0.08, 0.06, 0.1, hairLightM, 0.1, 0.28, 0.04, 0, 0, -0.15);
  vox(headGroup, 0.06, 0.04, 0.08, hairM, 0, 0.32, 0.08);

  // ── Arms ───────────────────────────────────────────────────────────────
  const shoulderY = torsoY + torsoH;

  // Left arm (toward bride, slightly bent forward)
  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.28, shoulderY, 0.02);
  armLGroup.rotation.z = 0.2;
  armLGroup.rotation.x = -0.08;
  model.add(armLGroup);
  vox(armLGroup, 0.11, 0.3, 0.11, suitM, 0, -0.15, 0);
  vox(armLGroup, 0.1, 0.08, 0.1, suitDarkM, 0, 0.02, 0);
  vox(armLGroup, 0.09, 0.24, 0.09, suitM, -0.02, -0.36, 0.06, 0, 0, 0.25);
  vox(armLGroup, 0.08, 0.1, 0.06, skinHiM, -0.04, -0.5, 0.1);

  // Right arm (hand in pocket)
  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.28, shoulderY, 0.02);
  armRGroup.rotation.z = -0.08;
  model.add(armRGroup);
  vox(armRGroup, 0.11, 0.3, 0.11, suitM, 0, -0.15, 0);
  vox(armRGroup, 0.1, 0.08, 0.1, suitDarkM, 0, 0.02, 0);
  vox(armRGroup, 0.09, 0.22, 0.09, suitM, 0.02, -0.34, 0.02, 0, 0, -0.15);
  // Hand tucked in pocket
  vox(armRGroup, 0.08, 0.08, 0.06, skinM, 0.06, -0.38, 0.08, 0, 0, -0.2);
  vox(model, 0.12, 0.1, 0.08, suitDarkM, 0.26, torsoY + torsoH * 0.35, 0.06);

  fitHumanScale(model, 1.78);

  const root = new THREE.Group();
  root.name = 'groom-character';
  root.add(model);
  return root;
}
