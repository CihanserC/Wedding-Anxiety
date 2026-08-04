import * as THREE from 'three';

/** Palette derived from the reference photo: champagne gown, beaded bodice, warm hair. */
const C = {
  skin: 0xf0d0c0,
  skinShadow: 0xe0b8a8,
  skinHighlight: 0xf8e0d4,
  hair: 0xa07850,
  hairDark: 0x7a5838,
  hairLight: 0xc8a078,
  hairHighlight: 0xd8b890,
  eye: 0x2a1810,
  eyeWhite: 0xf8f4f0,
  brow: 0x6a4830,
  lip: 0xd89098,
  blush: 0xf0b0a8,
  dressBase: 0xe0d0b8,
  dressLight: 0xf0e8d8,
  dressDeep: 0xd0c0a0,
  dressShadow: 0xc0b090,
  tulle: 0xe8dcc8,
  tulleLight: 0xf5efe0,
  sequin: 0xd8e0e8,
  sequinBright: 0xf0f4f8,
  sequinGold: 0xe8d8a8,
  gold: 0xd4a820,
  goldLight: 0xf0d060,
  bouquetPink: 0xf0a0b0,
  bouquetWhite: 0xfff8f8,
  bouquetYellow: 0xf0e080,
  bouquetGreen: 0x508040,
  bouquetGreenDark: 0x386028,
  ribbon: 0xfff8f8,
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

/** Scatter tiny sequin blocks across a bodice region. */
function addSequins(
  parent: THREE.Object3D,
  cx: number,
  cy: number,
  cz: number,
  halfW: number,
  halfH: number,
  count: number,
  materials: THREE.MeshLambertMaterial[],
): void {
  for (let i = 0; i < count; i++) {
    const sx = cx + (Math.random() - 0.5) * halfW * 2;
    const sy = cy + (Math.random() - 0.5) * halfH * 2;
    const sz = cz + (Math.random() - 0.5) * 0.04;
    const s = 0.035 + Math.random() * 0.025;
    const m = materials[i % materials.length];
    vox(parent, s, s, 0.02, m, sx, sy, sz);
  }
}

/**
 * Detailed voxel bride inspired by the wedding portrait: champagne beaded gown,
 * tulle skirt, half-up wavy hair, bouquet with ribbons.
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
  const dressM = mat(C.dressBase);
  const dressLightM = mat(C.dressLight);
  const dressDeepM = mat(C.dressDeep);
  const dressShadowM = mat(C.dressShadow);
  const tulleM = mat(C.tulle);
  const tulleLightM = mat(C.tulleLight);
  const sequinM = mat(C.sequin);
  const sequinBrightM = mat(C.sequinBright);
  const sequinGoldM = mat(C.sequinGold);
  const goldM = mat(C.gold);
  const goldLightM = mat(C.goldLight);
  const eyeM = mat(C.eye);
  const eyeWhiteM = mat(C.eyeWhite);
  const browM = mat(C.brow);
  const lipM = mat(C.lip);
  const blushM = mat(C.blush);
  const sequinMats = [sequinM, sequinBrightM, sequinGoldM];

  // ── Skirt layers (tulle A-line, floor-length — narrow at waist, flares to hem) ──
  const skirtBaseY = 0.02;
  const skirtLayers: Array<{ y: number; w: number; d: number; h: number; mat: THREE.MeshLambertMaterial }> = [
    { y: skirtBaseY + 1.08, w: 0.42, d: 0.36, h: 0.24, mat: tulleLightM },
    { y: skirtBaseY + 0.86, w: 0.52, d: 0.44, h: 0.22, mat: dressLightM },
    { y: skirtBaseY + 0.66, w: 0.64, d: 0.54, h: 0.2, mat: tulleM },
    { y: skirtBaseY + 0.48, w: 0.78, d: 0.66, h: 0.18, mat: tulleLightM },
    { y: skirtBaseY + 0.32, w: 0.92, d: 0.78, h: 0.16, mat: tulleM },
    { y: skirtBaseY + 0.18, w: 1.06, d: 0.9, h: 0.14, mat: dressM },
    { y: skirtBaseY + 0.06, w: 1.18, d: 1.0, h: 0.12, mat: dressDeepM },
  ];
  for (const layer of skirtLayers) {
    vox(model, layer.w, layer.h, layer.d, layer.mat, 0, layer.y, 0);
  }

  // Skirt train / pooling hem at front and sides
  vox(model, 1.28, 0.08, 0.5, tulleLightM, 0, skirtBaseY + 0.04, 0.38);
  vox(model, 0.35, 0.06, 0.7, tulleM, -0.58, skirtBaseY + 0.04, 0.1);
  vox(model, 0.35, 0.06, 0.7, tulleM, 0.58, skirtBaseY + 0.04, 0.1);
  vox(model, 0.9, 0.05, 0.28, dressShadowM, 0, skirtBaseY + 0.02, -0.42);

  // Inner petticoat hint
  vox(model, 0.55, 0.5, 0.48, dressShadowM, 0, skirtBaseY + 0.3, 0);

  // ── Bodice (strapless sweetheart, beaded) ──────────────────────────────
  const bodiceY = skirtBaseY + 1.22;
  const bodiceGroup = new THREE.Group();
  bodiceGroup.position.y = bodiceY;
  model.add(bodiceGroup);

  // Main torso block
  vox(bodiceGroup, 0.36, 0.38, 0.28, dressM, 0, 0.19, 0);
  // Sweetheart dip at top center
  vox(bodiceGroup, 0.14, 0.08, 0.26, dressDeepM, 0, 0.42, 0.01);
  // Side bust curves
  vox(bodiceGroup, 0.1, 0.22, 0.26, dressLightM, -0.2, 0.28, 0);
  vox(bodiceGroup, 0.1, 0.22, 0.26, dressLightM, 0.2, 0.28, 0);
  // Waist cinch
  vox(bodiceGroup, 0.32, 0.1, 0.26, dressDeepM, 0, 0.02, 0);

  // Beaded texture across bodice
  addSequins(bodiceGroup, 0, 0.22, 0.15, 0.16, 0.18, 48, sequinMats);
  addSequins(bodiceGroup, -0.18, 0.28, 0.14, 0.05, 0.1, 12, sequinMats);
  addSequins(bodiceGroup, 0.18, 0.28, 0.14, 0.05, 0.1, 12, sequinMats);

  // Peplum fan ruffle on left hip (viewer's right)
  const peplumX = 0.22;
  for (let i = 0; i < 5; i++) {
    const angle = -0.15 + i * 0.12;
    const fan = vox(
      bodiceGroup,
      0.14,
      0.06,
      0.18,
      i % 2 === 0 ? dressLightM : sequinGoldM,
      peplumX + i * 0.04,
      0.06,
      0.06,
      0,
      angle,
      0,
    );
    fan.position.y += i * 0.02;
  }
  vox(bodiceGroup, 0.2, 0.08, 0.14, sequinBrightM, peplumX + 0.08, 0.12, 0.12, 0, -0.2, 0);
  vox(bodiceGroup, 0.16, 0.06, 0.12, dressLightM, peplumX + 0.14, 0.18, 0.14, 0, -0.35, 0);

  // Subtle peplum on right side (smaller)
  vox(bodiceGroup, 0.12, 0.06, 0.14, tulleM, -0.2, 0.08, 0.04, 0, 0.15, 0);
  vox(bodiceGroup, 0.1, 0.05, 0.12, dressLightM, -0.22, 0.12, 0.06, 0, 0.25, 0);

  // ── Neck & shoulders ───────────────────────────────────────────────────
  const neckY = bodiceY + 0.42;
  vox(model, 0.1, 0.12, 0.1, skinM, 0, neckY + 0.06, 0);
  vox(model, 0.12, 0.04, 0.12, skinShadowM, 0, neckY, 0);

  // Collarbone hints
  vox(model, 0.22, 0.03, 0.08, skinHiM, 0, neckY + 0.02, 0.04);

  // Gold necklace with pendant
  vox(model, 0.16, 0.015, 0.015, goldM, 0, neckY + 0.06, 0.055, 0.15, 0, 0);
  vox(model, 0.04, 0.04, 0.02, goldLightM, 0, neckY + 0.02, 0.06);

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
  vox(headGroup, 0.03, 0.035, 0.025, eyeM, -0.06, 0.14, 0.12);
  vox(headGroup, 0.03, 0.035, 0.025, eyeM, 0.06, 0.14, 0.12);
  // Eyelid / lash line
  vox(headGroup, 0.055, 0.012, 0.015, browM, -0.06, 0.165, 0.115);
  vox(headGroup, 0.055, 0.012, 0.015, browM, 0.06, 0.165, 0.115);

  // Eyebrows (arched)
  vox(headGroup, 0.06, 0.012, 0.015, browM, -0.06, 0.19, 0.1, 0, 0, 0.08);
  vox(headGroup, 0.06, 0.012, 0.015, browM, 0.06, 0.19, 0.1, 0, 0, -0.08);

  // Nose
  vox(headGroup, 0.03, 0.05, 0.03, skinShadowM, 0, 0.1, 0.11);

  // Lips
  vox(headGroup, 0.06, 0.02, 0.02, lipM, 0, 0.04, 0.115);
  vox(headGroup, 0.05, 0.015, 0.015, lipM, 0, 0.045, 0.12);

  // Cheek blush
  vox(headGroup, 0.04, 0.03, 0.01, blushM, -0.09, 0.1, 0.1);
  vox(headGroup, 0.04, 0.03, 0.01, blushM, 0.09, 0.1, 0.1);

  // ── Hair (half-up, wavy, light brown) ──────────────────────────────────
  // Back volume
  vox(headGroup, 0.26, 0.3, 0.18, hairM, 0, 0.14, -0.08);
  vox(headGroup, 0.22, 0.22, 0.14, hairDarkM, 0, 0.1, -0.12);
  // Half-up section (pulled back top)
  vox(headGroup, 0.2, 0.1, 0.16, hairLightM, 0, 0.3, -0.04);
  vox(headGroup, 0.14, 0.08, 0.12, hairHiM, 0, 0.34, 0);
  // Side waves framing face
  vox(headGroup, 0.08, 0.2, 0.1, hairM, -0.14, 0.08, 0.02, 0, 0, 0.12);
  vox(headGroup, 0.08, 0.2, 0.1, hairM, 0.14, 0.08, 0.02, 0, 0, -0.12);
  vox(headGroup, 0.06, 0.16, 0.08, hairLightM, -0.15, -0.02, 0.04, 0, 0.1, 0.15);
  vox(headGroup, 0.06, 0.16, 0.08, hairLightM, 0.15, -0.02, 0.04, 0, -0.1, -0.15);
  // Shoulder-length fall
  vox(headGroup, 0.1, 0.28, 0.08, hairDarkM, -0.16, -0.06, -0.02, 0, 0.15, 0.1);
  vox(headGroup, 0.1, 0.28, 0.08, hairDarkM, 0.16, -0.06, -0.02, 0, -0.15, -0.1);
  // Center part line
  vox(headGroup, 0.02, 0.2, 0.02, hairDarkM, 0, 0.22, 0.06);
  // Loose strands
  vox(headGroup, 0.04, 0.1, 0.04, hairHiM, -0.1, 0.2, 0.1, 0, 0, 0.2);
  vox(headGroup, 0.04, 0.1, 0.04, hairHiM, 0.1, 0.2, 0.1, 0, 0, -0.2);

  // ── Arms ───────────────────────────────────────────────────────────────
  const shoulderY = bodiceY + 0.36;

  // Right arm (relaxed at side, slightly bent; linked-pose hint)
  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.24, shoulderY, 0.02);
  armRGroup.rotation.z = -0.12;
  model.add(armRGroup);
  vox(armRGroup, 0.1, 0.28, 0.1, skinM, 0, -0.14, 0);
  vox(armRGroup, 0.09, 0.08, 0.09, skinShadowM, 0, 0.02, 0);
  vox(armRGroup, 0.08, 0.24, 0.08, skinM, 0.04, -0.38, 0.04, 0, 0, -0.35);
  vox(armRGroup, 0.08, 0.1, 0.06, skinHiM, 0.08, -0.52, 0.06);
  // Ring on right hand
  vox(armRGroup, 0.025, 0.025, 0.025, goldM, 0.1, -0.5, 0.08);

  // Left arm (holding bouquet)
  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.24, shoulderY, 0.02);
  armLGroup.rotation.z = 0.18;
  model.add(armLGroup);
  vox(armLGroup, 0.1, 0.26, 0.1, skinM, 0, -0.13, 0);
  vox(armLGroup, 0.09, 0.08, 0.09, skinShadowM, 0, 0.02, 0);
  vox(armLGroup, 0.08, 0.22, 0.08, skinM, -0.02, -0.34, 0.08, 0, 0, 0.4);
  vox(armLGroup, 0.08, 0.1, 0.06, skinHiM, -0.04, -0.46, 0.14);

  // ── Bouquet ────────────────────────────────────────────────────────────
  const bouquetGroup = new THREE.Group();
  bouquetGroup.position.set(-0.3, bodiceY - 0.08, 0.22);
  bouquetGroup.rotation.set(0.1, 0.3, 0.15);
  model.add(bouquetGroup);

  // Flower cluster
  const flowerOffsets: Array<[number, number, number, number, THREE.MeshLambertMaterial]> = [
    [0, 0.06, 0, 0.08, mat(C.bouquetWhite)],
    [-0.05, 0.04, 0.03, 0.07, mat(C.bouquetPink)],
    [0.05, 0.05, -0.02, 0.07, mat(C.bouquetPink)],
    [-0.03, 0.08, -0.03, 0.06, mat(C.bouquetWhite)],
    [0.04, 0.07, 0.04, 0.06, mat(C.bouquetYellow)],
    [-0.06, 0.02, -0.02, 0.05, mat(C.bouquetPink)],
    [0.02, 0.03, 0.05, 0.05, mat(C.bouquetWhite)],
    [0, 0.1, 0.02, 0.055, mat(C.bouquetPink)],
  ];
  for (const [fx, fy, fz, size, fm] of flowerOffsets) {
    vox(bouquetGroup, size, size * 0.8, size, fm, fx, fy, fz);
    // Petal ring
    vox(bouquetGroup, size * 1.2, size * 0.3, size * 1.2, fm, fx, fy - size * 0.3, fz);
  }

  // Greenery
  vox(bouquetGroup, 0.12, 0.04, 0.06, mat(C.bouquetGreen), -0.08, 0, 0, 0, 0, 0.4);
  vox(bouquetGroup, 0.1, 0.04, 0.05, mat(C.bouquetGreenDark), 0.07, -0.02, -0.04, 0, 0, -0.3);
  vox(bouquetGroup, 0.08, 0.03, 0.04, mat(C.bouquetGreen), 0, -0.04, 0.06, 0.2, 0, 0);
  vox(bouquetGroup, 0.06, 0.03, 0.08, mat(C.bouquetGreen), -0.04, 0.02, -0.06, 0, 0.5, 0);

  // Stem wrap
  vox(bouquetGroup, 0.06, 0.08, 0.06, mat(C.bouquetGreenDark), 0, -0.06, 0);

  // Flowing white ribbons
  const ribbonM = mat(C.ribbon);
  vox(bouquetGroup, 0.025, 0.35, 0.015, ribbonM, 0.04, -0.22, 0.06, 0.1, 0, 0.15);
  vox(bouquetGroup, 0.02, 0.4, 0.012, ribbonM, -0.03, -0.25, 0.04, 0.05, 0, -0.1);
  vox(bouquetGroup, 0.018, 0.3, 0.01, ribbonM, 0.06, -0.18, -0.02, -0.08, 0, 0.25);

  // ── Strapless edge shimmer along neckline ──────────────────────────────
  for (let i = -3; i <= 3; i++) {
    const nx = i * 0.045;
    const ny = bodiceY + 0.38 + Math.abs(i) * 0.015;
    vox(model, 0.03, 0.03, 0.02, i % 2 === 0 ? sequinBrightM : sequinGoldM, nx, ny, 0.14);
  }

  fitHumanScale(model, 1.72);

  const root = new THREE.Group();
  root.name = 'bride-character';
  root.add(model);
  return root;
}

/** Side-profile thickness multiplier — keeps front width, adds body depth. */
const BODY_DEPTH_SCALE = 1.45;

/** Scale model to human height with feet resting on y = 0. */
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
