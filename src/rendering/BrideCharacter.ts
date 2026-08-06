import * as THREE from 'three';

/** Palette: white gown, colorful floral embroidery, warm auburn braid, gold jewelry. */
const C = {
  skin: 0xf0d0c0,
  skinShadow: 0xe0b8a8,
  skinHighlight: 0xf8e0d4,
  hair: 0xa07850,
  hairDark: 0x7a5838,
  hairLight: 0xc8a078,
  hairHighlight: 0xd8b890,
  eye: 0x3a2818,
  eyeWhite: 0xf8f4f0,
  brow: 0x6a4830,
  lip: 0xd89098,
  blush: 0xf0b0a8,
  dressWhite: 0xf8f4f0,
  dressLight: 0xffffff,
  dressShadow: 0xe8e0d8,
  dressDeep: 0xd8d0c8,
  pearl: 0xf0ece8,
  pearlShadow: 0xd8d4d0,
  tiara: 0xe8e0d0,
  tiaraSparkle: 0xffffff,
  gold: 0xd4a820,
  goldLight: 0xf0d060,
  veil: 0xf5f0f8,
  veilLight: 0xffffff,
  flowerPink: 0xf08090,
  flowerPinkDeep: 0xe06078,
  flowerBlue: 0x7090d8,
  flowerYellow: 0xf0d060,
  flowerOrange: 0xf0a050,
  flowerWhite: 0xfff8f8,
  flowerGreen: 0x508040,
  flowerGreenDark: 0x386028,
  ribbonPink: 0xffb7c5,
  ribbonBlue: 0xb0c8f0,
  shoe: 0xf8f4f0,
  shoeShadow: 0xe0dcd8,
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

/** Scatter small floral embroidery voxels across a dress region. */
function addFloralEmbroidery(
  parent: THREE.Object3D,
  cx: number,
  cy: number,
  cz: number,
  halfW: number,
  halfH: number,
  count: number,
  colors: number[],
): void {
  for (let i = 0; i < count; i++) {
    const sx = cx + (Math.random() - 0.5) * halfW * 2;
    const sy = cy + (Math.random() - 0.5) * halfH * 2;
    const sz = cz + (Math.random() - 0.5) * 0.03;
    const s = 0.03 + Math.random() * 0.025;
    const color = colors[i % colors.length];
    vox(parent, s, s, 0.02, mat(color), sx, sy, sz);
  }
}

function rose(
  parent: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  size: number,
  petalColor: number,
  centerColor: number,
): void {
  const petalM = mat(petalColor);
  const centerM = mat(centerColor);
  vox(parent, size, size * 0.35, size, petalM, x, y, z);
  vox(parent, size * 1.15, size * 0.22, size * 1.15, petalM, x, y - size * 0.2, z);
  vox(parent, size * 0.55, size * 0.35, size * 0.55, centerM, x, y + size * 0.08, z);
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
 * Detailed voxel bride: white gown with colorful floral embroidery, off-shoulder
 * pearl straps, tiered high-low skirt with train, tiara, braided hair, veil, bouquet.
 */
export function buildBrideCharacter(): THREE.Group {
  const model = new THREE.Group();
  model.name = 'bride-model';

  const skinM = mat(C.skin);
  const skinShadowM = mat(C.skinShadow);
  const skinHiM = mat(C.skinHighlight);
  const hairM = mat(C.hair);
  const hairDarkM = mat(C.hairDark);
  const hairLightM = mat(C.hairLight);
  const hairHiM = mat(C.hairHighlight);
  const dressM = mat(C.dressWhite);
  const dressLightM = mat(C.dressLight);
  const dressShadowM = mat(C.dressShadow);
  const dressDeepM = mat(C.dressDeep);
  const pearlM = mat(C.pearl);
  const pearlShadowM = mat(C.pearlShadow);
  const tiaraM = mat(C.tiara);
  const tiaraSparkleM = mat(C.tiaraSparkle);
  const goldM = mat(C.gold);
  const goldLightM = mat(C.goldLight);
  const veilM = mat(C.veil, { transparent: true, opacity: 0.72 });
  const veilLightM = mat(C.veilLight, { transparent: true, opacity: 0.55 });
  const eyeM = mat(C.eye);
  const eyeWhiteM = mat(C.eyeWhite);
  const browM = mat(C.brow);
  const lipM = mat(C.lip);
  const blushM = mat(C.blush);
  const shoeM = mat(C.shoe);
  const shoeShadowM = mat(C.shoeShadow);
  const floralColors = [
    C.flowerPink,
    C.flowerPinkDeep,
    C.flowerBlue,
    C.flowerYellow,
    C.flowerGreen,
    C.flowerWhite,
  ];

  // ── Shoes (visible through high-low front hem) ─────────────────────────
  vox(model, 0.1, 0.1, 0.22, shoeShadowM, -0.1, 0.05, 0.14);
  vox(model, 0.1, 0.1, 0.22, shoeShadowM, 0.1, 0.05, 0.14);
  vox(model, 0.08, 0.06, 0.08, shoeM, -0.1, 0.1, 0.22);
  vox(model, 0.08, 0.06, 0.08, shoeM, 0.1, 0.1, 0.22);
  // Floral toe accents
  vox(model, 0.04, 0.03, 0.02, mat(C.flowerPink), -0.1, 0.08, 0.28);
  vox(model, 0.04, 0.03, 0.02, mat(C.flowerPink), 0.1, 0.08, 0.28);

  // ── Tiered high-low skirt (shorter front, long train back) ─────────────
  const skirtBaseY = 0.02;

  // Back train layers (long, cascading)
  const trainLayers: Array<{ y: number; w: number; d: number; h: number; z: number; mat: THREE.MeshLambertMaterial }> = [
    { y: skirtBaseY + 0.04, w: 1.1, d: 0.12, h: 0.08, z: -0.55, mat: dressShadowM },
    { y: skirtBaseY + 0.12, w: 0.95, d: 0.14, h: 0.1, z: -0.48, mat: dressM },
    { y: skirtBaseY + 0.22, w: 0.82, d: 0.16, h: 0.12, z: -0.4, mat: dressLightM },
    { y: skirtBaseY + 0.34, w: 0.7, d: 0.18, h: 0.14, z: -0.32, mat: dressM },
    { y: skirtBaseY + 0.48, w: 0.58, d: 0.2, h: 0.16, z: -0.24, mat: dressShadowM },
  ];
  for (const layer of trainLayers) {
    vox(model, layer.w, layer.h, layer.d, layer.mat, 0, layer.y, layer.z);
  }

  // Tiered front/side skirt layers (high-low — shorter in front)
  const skirtLayers: Array<{ y: number; w: number; d: number; h: number; mat: THREE.MeshLambertMaterial }> = [
    { y: skirtBaseY + 0.62, w: 0.38, d: 0.32, h: 0.2, mat: dressLightM },
    { y: skirtBaseY + 0.48, w: 0.52, d: 0.42, h: 0.18, mat: dressM },
    { y: skirtBaseY + 0.36, w: 0.66, d: 0.52, h: 0.16, mat: dressLightM },
    { y: skirtBaseY + 0.26, w: 0.8, d: 0.62, h: 0.14, mat: dressM },
    { y: skirtBaseY + 0.16, w: 0.92, d: 0.72, h: 0.12, mat: dressShadowM },
    { y: skirtBaseY + 0.08, w: 1.02, d: 0.82, h: 0.1, mat: dressDeepM },
  ];
  for (const layer of skirtLayers) {
    vox(model, layer.w, layer.h, layer.d, layer.mat, 0, layer.y, 0.06);
  }

  // Tier edge ruffles
  for (let tier = 0; tier < 4; tier++) {
    const ty = skirtBaseY + 0.2 + tier * 0.14;
    const tw = 0.7 + tier * 0.1;
    for (let i = -4; i <= 4; i++) {
      vox(model, 0.06, 0.04, 0.06, tier % 2 === 0 ? dressLightM : dressM, i * (tw * 0.11), ty, 0.28 + tier * 0.04);
    }
  }

  // Floral embroidery along skirt tiers
  addFloralEmbroidery(model, 0, skirtBaseY + 0.55, 0.2, 0.18, 0.08, 16, floralColors);
  addFloralEmbroidery(model, 0, skirtBaseY + 0.38, 0.22, 0.28, 0.1, 22, floralColors);
  addFloralEmbroidery(model, 0, skirtBaseY + 0.22, 0.24, 0.38, 0.1, 28, floralColors);
  addFloralEmbroidery(model, 0, skirtBaseY + 0.1, -0.35, 0.42, 0.06, 20, floralColors);

  // Side train drapes
  vox(model, 0.3, 0.06, 0.55, dressShadowM, -0.62, skirtBaseY + 0.06, -0.15);
  vox(model, 0.3, 0.06, 0.55, dressShadowM, 0.62, skirtBaseY + 0.06, -0.15);

  // ── Bodice (off-shoulder sweetheart) ───────────────────────────────────
  const bodiceY = skirtBaseY + 0.82;
  const bodiceGroup = new THREE.Group();
  bodiceGroup.position.y = bodiceY;
  model.add(bodiceGroup);

  vox(bodiceGroup, 0.36, 0.36, 0.28, dressM, 0, 0.18, 0);
  vox(bodiceGroup, 0.14, 0.08, 0.26, dressDeepM, 0, 0.4, 0.01);
  vox(bodiceGroup, 0.1, 0.2, 0.26, dressLightM, -0.2, 0.26, 0);
  vox(bodiceGroup, 0.1, 0.2, 0.26, dressLightM, 0.2, 0.26, 0);
  vox(bodiceGroup, 0.32, 0.1, 0.26, dressShadowM, 0, 0.02, 0);

  // Floral embroidery on bodice
  addFloralEmbroidery(bodiceGroup, 0, 0.2, 0.15, 0.15, 0.16, 32, floralColors);
  addFloralEmbroidery(bodiceGroup, -0.16, 0.28, 0.14, 0.06, 0.1, 10, floralColors);
  addFloralEmbroidery(bodiceGroup, 0.16, 0.28, 0.14, 0.06, 0.1, 10, floralColors);

  // Off-shoulder pearl strap drapes
  for (let i = -4; i <= 4; i++) {
    const sx = i * 0.04;
    const sy = 0.38 + Math.abs(i) * 0.012;
    vox(bodiceGroup, 0.025, 0.025, 0.02, i % 2 === 0 ? pearlM : pearlShadowM, sx - 0.22, sy, 0.13);
    vox(bodiceGroup, 0.025, 0.025, 0.02, i % 2 === 0 ? pearlShadowM : pearlM, sx + 0.22, sy, 0.13);
  }

  // ── Neck & shoulders ───────────────────────────────────────────────────
  const neckY = bodiceY + 0.4;
  vox(model, 0.1, 0.12, 0.1, skinM, 0, neckY + 0.06, 0);
  vox(model, 0.12, 0.04, 0.12, skinShadowM, 0, neckY, 0);
  vox(model, 0.22, 0.03, 0.08, skinHiM, 0, neckY + 0.02, 0.04);

  // Necklace with pendant
  vox(model, 0.16, 0.015, 0.015, goldM, 0, neckY + 0.06, 0.055, 0.15, 0, 0);
  vox(model, 0.05, 0.05, 0.025, goldLightM, 0, neckY + 0.01, 0.065);

  // Drop earrings
  vox(model, 0.02, 0.06, 0.015, goldM, -0.12, neckY + 0.14, 0.02);
  vox(model, 0.025, 0.025, 0.02, goldLightM, -0.12, neckY + 0.1, 0.02);
  vox(model, 0.02, 0.06, 0.015, goldM, 0.12, neckY + 0.14, 0.02);
  vox(model, 0.025, 0.025, 0.02, goldLightM, 0.12, neckY + 0.1, 0.02);

  // ── Head ───────────────────────────────────────────────────────────────
  const headGroup = new THREE.Group();
  headGroup.position.set(0, neckY + 0.12, 0);
  model.add(headGroup);

  vox(headGroup, 0.22, 0.26, 0.22, skinM, 0, 0.13, 0);
  vox(headGroup, 0.2, 0.08, 0.2, skinShadowM, 0, 0.28, -0.02);
  vox(headGroup, 0.18, 0.06, 0.04, skinHiM, 0, 0.1, 0.12);

  // Eyes
  vox(headGroup, 0.05, 0.04, 0.02, eyeWhiteM, -0.06, 0.14, 0.11);
  vox(headGroup, 0.05, 0.04, 0.02, eyeWhiteM, 0.06, 0.14, 0.11);
  vox(headGroup, 0.035, 0.035, 0.025, eyeM, -0.06, 0.14, 0.12);
  vox(headGroup, 0.035, 0.035, 0.025, eyeM, 0.06, 0.14, 0.12);
  vox(headGroup, 0.055, 0.012, 0.015, browM, -0.06, 0.165, 0.115);
  vox(headGroup, 0.055, 0.012, 0.015, browM, 0.06, 0.165, 0.115);
  vox(headGroup, 0.06, 0.012, 0.015, browM, -0.06, 0.19, 0.1, 0, 0, 0.08);
  vox(headGroup, 0.06, 0.012, 0.015, browM, 0.06, 0.19, 0.1, 0, 0, -0.08);
  vox(headGroup, 0.03, 0.05, 0.03, skinShadowM, 0, 0.1, 0.11);
  vox(headGroup, 0.06, 0.02, 0.02, lipM, 0, 0.04, 0.115);
  vox(headGroup, 0.04, 0.03, 0.01, blushM, -0.09, 0.1, 0.1);
  vox(headGroup, 0.04, 0.03, 0.01, blushM, 0.09, 0.1, 0.1);

  // ── Hair (side braid over right shoulder) ────────────────────────────
  vox(headGroup, 0.26, 0.28, 0.18, hairM, 0, 0.14, -0.08);
  vox(headGroup, 0.22, 0.2, 0.14, hairDarkM, 0, 0.1, -0.12);
  vox(headGroup, 0.2, 0.1, 0.16, hairLightM, 0, 0.3, -0.04);
  vox(headGroup, 0.08, 0.18, 0.1, hairM, -0.14, 0.06, 0.02, 0, 0, 0.12);
  vox(headGroup, 0.06, 0.14, 0.08, hairLightM, -0.15, -0.02, 0.04, 0, 0.1, 0.15);
  vox(headGroup, 0.02, 0.2, 0.02, hairDarkM, 0, 0.22, 0.06);

  // Braid over right shoulder (viewer's left)
  const braidGroup = new THREE.Group();
  braidGroup.position.set(-0.14, 0.02, 0.06);
  headGroup.add(braidGroup);
  for (let i = 0; i < 8; i++) {
    const by = -0.04 - i * 0.05;
    const bx = Math.sin(i * 0.6) * 0.02;
    const bm = i % 3 === 0 ? hairLightM : i % 3 === 1 ? hairM : hairDarkM;
    vox(braidGroup, 0.06, 0.04, 0.06, bm, bx, by, 0);
  }
  vox(braidGroup, 0.04, 0.05, 0.04, hairHiM, 0, -0.44, 0);

  // Small flowers tucked in hair
  vox(headGroup, 0.04, 0.04, 0.03, mat(C.flowerPink), -0.08, 0.3, 0.04);
  vox(headGroup, 0.03, 0.03, 0.02, mat(C.flowerWhite), -0.1, 0.28, 0.06);
  vox(headGroup, 0.03, 0.03, 0.02, mat(C.flowerBlue), 0.08, 0.3, 0.02);

  // Tiara
  for (let i = -3; i <= 3; i++) {
    const tx = i * 0.035;
    const th = 0.04 + Math.abs(i) * 0.008;
    vox(headGroup, 0.025, th, 0.02, i % 2 === 0 ? tiaraSparkleM : tiaraM, tx, 0.32, 0.06);
  }
  vox(headGroup, 0.14, 0.03, 0.02, tiaraM, 0, 0.33, 0.07);

  // ── Veil (trailing behind, mesh-like translucent voxels) ───────────────
  const veilGroup = new THREE.Group();
  veilGroup.position.set(0, neckY + 0.22, -0.06);
  model.add(veilGroup);

  for (let row = 0; row < 12; row++) {
    const vy = -row * 0.12;
    const vw = 0.5 + row * 0.04;
    const vd = 0.02 + (row % 2) * 0.01;
    const vm = row % 3 === 0 ? veilLightM : veilM;
    vox(veilGroup, vw, 0.04, vd, vm, 0, vy, -0.08 - row * 0.06);
    if (row % 2 === 0) {
      vox(veilGroup, 0.03, 0.03, 0.015, mat(C.flowerPink), -vw * 0.3, vy, -0.08 - row * 0.06);
      vox(veilGroup, 0.025, 0.025, 0.012, mat(C.flowerBlue), vw * 0.25, vy - 0.02, -0.08 - row * 0.06);
    }
  }

  // ── Arms ───────────────────────────────────────────────────────────────
  const shoulderY = bodiceY + 0.34;

  // Right arm (relaxed at side)
  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.24, shoulderY, 0.02);
  armRGroup.rotation.z = -0.12;
  model.add(armRGroup);
  vox(armRGroup, 0.1, 0.28, 0.1, skinM, 0, -0.14, 0);
  vox(armRGroup, 0.09, 0.08, 0.09, skinShadowM, 0, 0.02, 0);
  vox(armRGroup, 0.08, 0.24, 0.08, skinM, 0.04, -0.38, 0.04, 0, 0, -0.35);
  vox(armRGroup, 0.08, 0.1, 0.06, skinHiM, 0.08, -0.52, 0.06);
  vox(armRGroup, 0.025, 0.025, 0.025, goldM, 0.1, -0.5, 0.08);
  // Bracelets
  vox(armRGroup, 0.09, 0.02, 0.09, goldM, 0.04, -0.36, 0.04);
  vox(armRGroup, 0.085, 0.015, 0.085, goldLightM, 0.04, -0.34, 0.04);

  // Left arm (holding bouquet, front-facing)
  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.24, shoulderY, 0.02);
  armLGroup.rotation.z = 0.18;
  model.add(armLGroup);
  vox(armLGroup, 0.1, 0.26, 0.1, skinM, 0, -0.13, 0);
  vox(armLGroup, 0.09, 0.08, 0.09, skinShadowM, 0, 0.02, 0);
  vox(armLGroup, 0.08, 0.22, 0.08, skinM, -0.02, -0.34, 0.08, 0, 0, 0.4);
  vox(armLGroup, 0.08, 0.1, 0.06, skinHiM, -0.04, -0.46, 0.14);
  vox(armLGroup, 0.09, 0.02, 0.09, goldM, -0.02, -0.34, 0.08);
  vox(armLGroup, 0.085, 0.015, 0.085, goldLightM, -0.02, -0.32, 0.08);

  // ── Bouquet (white lily center, roses, wildflowers, ribbons) ───────────
  const bouquetGroup = new THREE.Group();
  bouquetGroup.position.set(-0.28, bodiceY - 0.06, 0.24);
  bouquetGroup.rotation.set(0.08, 0.15, 0.12);
  model.add(bouquetGroup);

  // Central white lily
  vox(bouquetGroup, 0.1, 0.14, 0.08, mat(C.flowerWhite), 0, 0.1, 0);
  vox(bouquetGroup, 0.06, 0.08, 0.04, mat(C.flowerYellow), 0, 0.12, 0.02);
  vox(bouquetGroup, 0.12, 0.04, 0.1, mat(C.flowerWhite), 0, 0.06, 0, 0.3, 0, 0);
  vox(bouquetGroup, 0.12, 0.04, 0.1, mat(C.flowerWhite), 0, 0.06, 0, -0.3, 0, 0);

  rose(bouquetGroup, -0.07, 0.08, 0.04, 0.08, C.flowerPink, C.flowerWhite);
  rose(bouquetGroup, 0.07, 0.07, -0.02, 0.075, C.flowerPinkDeep, C.flowerWhite);
  rose(bouquetGroup, -0.04, 0.12, -0.04, 0.07, C.flowerPink, C.flowerYellow);
  rose(bouquetGroup, 0.05, 0.11, 0.05, 0.065, C.flowerPinkDeep, C.flowerWhite);

  // Yellow / orange accent blossoms
  vox(bouquetGroup, 0.06, 0.06, 0.06, mat(C.flowerYellow), -0.1, 0.04, -0.02);
  vox(bouquetGroup, 0.055, 0.055, 0.055, mat(C.flowerOrange), 0.1, 0.05, 0.02);
  vox(bouquetGroup, 0.05, 0.05, 0.05, mat(C.flowerYellow), 0, 0.15, 0.04);

  // Blue wildflower sprigs
  vox(bouquetGroup, 0.04, 0.05, 0.03, mat(C.flowerBlue), -0.08, 0.14, 0.06);
  vox(bouquetGroup, 0.035, 0.04, 0.025, mat(C.flowerBlue), 0.09, 0.13, -0.04);
  vox(bouquetGroup, 0.03, 0.035, 0.02, mat(C.flowerBlue), -0.05, 0.16, -0.06);

  // Greenery
  vox(bouquetGroup, 0.14, 0.04, 0.07, mat(C.flowerGreen), -0.1, 0, 0, 0, 0, 0.4);
  vox(bouquetGroup, 0.12, 0.04, 0.06, mat(C.flowerGreenDark), 0.09, -0.02, -0.04, 0, 0, -0.3);
  vox(bouquetGroup, 0.08, 0.03, 0.05, mat(C.flowerGreen), 0, -0.04, 0.06, 0.2, 0, 0);
  vox(bouquetGroup, 0.06, 0.03, 0.08, mat(C.flowerGreen), -0.05, 0.02, -0.07, 0, 0.5, 0);

  vox(bouquetGroup, 0.06, 0.08, 0.06, mat(C.flowerGreenDark), 0, -0.06, 0);

  // Pink and blue ribbons
  vox(bouquetGroup, 0.025, 0.38, 0.015, mat(C.ribbonPink), 0.04, -0.24, 0.06, 0.1, 0, 0.15);
  vox(bouquetGroup, 0.02, 0.42, 0.012, mat(C.ribbonBlue), -0.03, -0.26, 0.04, 0.05, 0, -0.1);
  vox(bouquetGroup, 0.018, 0.32, 0.01, mat(C.ribbonPink), 0.06, -0.2, -0.02, -0.08, 0, 0.25);

  fitHumanScale(model, 1.72);

  const root = new THREE.Group();
  root.name = 'bride-character';
  root.add(model);
  return root;
}
