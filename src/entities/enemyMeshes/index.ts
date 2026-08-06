import * as THREE from 'three';
import type { EnemyStats, EnemyType } from '../../data/enemies';
import { buildAri } from './ari';
import { buildFotografFlasoru } from './flasoru';
import { buildInek } from './inek';
import { buildKertenkele } from './kertenkele';
import { buildMaymun } from './maymun';

export interface EnemyMeshResult {
  root: THREE.Group;
  materials: THREE.MeshLambertMaterial[];
  headGroup?: THREE.Group;
  armGroups?: THREE.Group[];
  jitterMeshes?: THREE.Object3D[];
  floatBody?: THREE.Object3D;
  tail?: THREE.Object3D;
}

/**
 * Type-specific enemy mesh builder. Each type gets a distinct scary silhouette
 * built from voxel-style boxes so it fits the world aesthetic.
 */
export function buildEnemyMesh(type: EnemyType, stats: EnemyStats): EnemyMeshResult {
  switch (type) {
    case 'merakli-teyze':
      return buildMerakliTeyze(stats);
    case 'mukemmeliyetci-kuzen':
      return buildMukemmeliyetciKuzen(stats);
    case 'zaman-canavari':
      return buildZamanCanavari(stats);
    case 'fotograf-flasoru':
      return buildFotografFlasoru(stats);
    case 'beklenti-golgesi':
      return buildBeklentiGolgesi(stats);
    case 'maymun':
      return buildMaymun(stats);
    case 'inek':
      return buildInek(stats);
    case 'kertenkele':
      return buildKertenkele(stats);
    case 'ari':
      return buildAri(stats);
  }
}

function makeMat(color: number, opts: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

/** Hunched old woman with dangling long arms and huge black eyes. */
function buildMerakliTeyze(stats: EnemyStats): EnemyMeshResult {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const robeMat = makeMat(stats.color);
  const skinMat = makeMat(stats.accentColor);
  const eyeMat = makeMat(0x0a0010);
  const mouthMat = makeMat(0x4b0020);
  materials.push(robeMat, skinMat, eyeMat, mouthMat);

  const bodyH = 0.9;
  const bodyW = 0.75;
  const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyW * 0.7), robeMat);
  body.position.y = bodyH * 0.5;
  body.rotation.x = 0.25;
  group.add(body);

  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(bodyW * 1.2, 0.2, bodyW * 0.7), robeMat);
  shoulders.position.set(0, bodyH + 0.05, 0.05);
  group.add(shoulders);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, bodyH + 0.25, 0.15);
  const headSize = 0.5;
  const head = new THREE.Mesh(new THREE.BoxGeometry(headSize, headSize * 1.1, headSize), skinMat);
  headGroup.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(headSize * 1.05, 0.15, headSize * 1.05), makeMat(0x2a2030));
  hair.position.y = headSize * 0.55;
  headGroup.add(hair);
  materials.push(hair.material as THREE.MeshLambertMaterial);

  const eyeSize = 0.14;
  const eyeGeo = new THREE.BoxGeometry(eyeSize, eyeSize, 0.05);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.12, 0.08, headSize * 0.5);
  eyeR.position.set(0.12, 0.08, headSize * 0.5);
  headGroup.add(eyeL, eyeR);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.05), mouthMat);
  mouth.position.set(0, -0.15, headSize * 0.5);
  headGroup.add(mouth);

  group.add(headGroup);

  const armMat = robeMat;
  const armGeo = new THREE.BoxGeometry(0.12, 0.9, 0.12);
  const armL = new THREE.Mesh(armGeo, armMat);
  const armR = new THREE.Mesh(armGeo, armMat);
  armL.position.set(-bodyW * 0.55, bodyH * 0.4, 0.05);
  armR.position.set(bodyW * 0.55, bodyH * 0.4, 0.05);
  const armLGroup = new THREE.Group();
  const armRGroup = new THREE.Group();
  armLGroup.position.set(-bodyW * 0.55, bodyH + 0.05, 0.05);
  armRGroup.position.set(bodyW * 0.55, bodyH + 0.05, 0.05);
  armL.position.set(0, -0.45, 0);
  armR.position.set(0, -0.45, 0);
  armLGroup.add(armL);
  armRGroup.add(armR);
  group.add(armLGroup, armRGroup);

  const handMat = skinMat;
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), handMat);
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), handMat);
  handL.position.set(0, -0.95, 0);
  handR.position.set(0, -0.95, 0);
  armLGroup.add(handL);
  armRGroup.add(handR);

  return { root: group, materials, headGroup, armGroups: [armLGroup, armRGroup] };
}

/** Wedding-planner critic cousin: sharp dark suit, red judgment eyes, clipboard. */
function buildMukemmeliyetciKuzen(stats: EnemyStats): EnemyMeshResult {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const suitMat = makeMat(stats.color);
  const shirtMat = makeMat(0xd8dce8);
  const tieMat = makeMat(stats.accentColor);
  const skinMat = makeMat(0xc4a882);
  const eyeMat = makeMat(0xff2040, { emissive: 0xff1028, emissiveIntensity: 0.85 });
  const clipboardMat = makeMat(0xf2f2f0);
  const markMat = makeMat(0xc01020);
  materials.push(suitMat, shirtMat, tieMat, skinMat, eyeMat, clipboardMat, markMat);

  const legH = 0.55;
  const legGeo = new THREE.BoxGeometry(0.2, legH, 0.2);
  const legL = new THREE.Mesh(legGeo, suitMat);
  const legR = new THREE.Mesh(legGeo, suitMat);
  legL.position.set(-0.16, legH * 0.5, 0);
  legR.position.set(0.16, legH * 0.5, 0);
  group.add(legL, legR);

  const torsoH = 0.95;
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, torsoH, 0.38), suitMat);
  torso.position.y = legH + torsoH * 0.5;
  group.add(torso);

  // Broad, sharp shoulders
  const shoulders = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.36), suitMat);
  shoulders.position.y = legH + torsoH;
  group.add(shoulders);

  // Shirt collar strip
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.22, 0.06), shirtMat);
  collar.position.set(0, legH + torsoH - 0.05, 0.2);
  group.add(collar);

  // Dark red tie
  const tie = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.04), tieMat);
  tie.position.set(0, legH + torsoH - 0.32, 0.21);
  group.add(tie);

  // Left arm — pointing finger pose
  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.48, legH + torsoH - 0.05, 0.05);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.8, 0.13), suitMat);
  armL.position.y = -0.4;
  armLGroup.add(armL);
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skinMat);
  handL.position.set(0, -0.85, 0);
  armLGroup.add(handL);
  const finger = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.22), skinMat);
  finger.position.set(0, -0.85, 0.16);
  armLGroup.add(finger);
  group.add(armLGroup);

  // Right arm — clipboard
  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.48, legH + torsoH - 0.05, 0.05);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.8, 0.13), suitMat);
  armR.position.y = -0.4;
  armRGroup.add(armR);
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skinMat);
  handR.position.set(0, -0.85, 0);
  armRGroup.add(handR);

  const clipboard = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.36, 0.04), clipboardMat);
  clipboard.position.set(0.08, -0.9, 0.14);
  clipboard.rotation.x = -0.35;
  armRGroup.add(clipboard);
  const clipTop = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.06), makeMat(0x3a3a42));
  clipTop.position.set(0.08, -0.72, 0.16);
  clipTop.rotation.x = -0.35;
  armRGroup.add(clipTop);
  materials.push(clipTop.material as THREE.MeshLambertMaterial);

  // Red X mark on clipboard
  const x1 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.02), markMat);
  x1.position.set(0.08, -0.9, 0.17);
  x1.rotation.set(-0.35, 0, 0.7);
  armRGroup.add(x1);
  const x2 = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.02), markMat);
  x2.position.set(0.08, -0.9, 0.17);
  x2.rotation.set(-0.35, 0, -0.7);
  armRGroup.add(x2);

  group.add(armRGroup);

  // Narrow long-jaw head with a single pair of red judgment eyes
  const headGroup = new THREE.Group();
  headGroup.position.set(0, legH + torsoH + 0.38, 0);
  const headW = 0.42;
  const headH = 0.55;
  const headD = 0.4;
  const head = new THREE.Mesh(new THREE.BoxGeometry(headW, headH, headD), skinMat);
  headGroup.add(head);

  const hair = new THREE.Mesh(new THREE.BoxGeometry(headW * 1.05, 0.12, headD * 1.05), makeMat(0x1a1a22));
  hair.position.y = headH * 0.5;
  headGroup.add(hair);
  materials.push(hair.material as THREE.MeshLambertMaterial);

  const eyeSize = 0.1;
  const eyeGeo = new THREE.BoxGeometry(eyeSize, eyeSize * 0.7, 0.04);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.1, 0.06, headD * 0.5);
  eyeR.position.set(0.1, 0.06, headD * 0.5);
  headGroup.add(eyeL, eyeR);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.03), makeMat(0x3a2030));
  mouth.position.set(0, -0.16, headD * 0.5);
  headGroup.add(mouth);
  materials.push(mouth.material as THREE.MeshLambertMaterial);

  group.add(headGroup);

  return { root: group, materials, headGroup, armGroups: [armLGroup, armRGroup] };
}

/** Skeletal fast enemy with a clock-face head and glowing orange eyes. */
function buildZamanCanavari(stats: EnemyStats): EnemyMeshResult {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const boneMat = makeMat(stats.color);
  const clockMat = makeMat(stats.accentColor, { emissive: 0xff5010, emissiveIntensity: 0.5 });
  const eyeMat = makeMat(0xffee00, { emissive: 0xff6600, emissiveIntensity: 1.2 });
  materials.push(boneMat, clockMat, eyeMat);

  const spineH = 0.75;
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.18, spineH, 0.18), boneMat);
  spine.position.y = spineH * 0.5;
  group.add(spine);

  const ribGeo = new THREE.BoxGeometry(0.55, 0.08, 0.25);
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(ribGeo, boneMat);
    rib.position.y = 0.25 + i * 0.18;
    group.add(rib);
  }

  const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.15, 0.25), boneMat);
  pelvis.position.y = 0.08;
  group.add(pelvis);

  const legGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
  const legL = new THREE.Mesh(legGeo, boneMat);
  const legR = new THREE.Mesh(legGeo, boneMat);
  legL.position.set(-0.12, -0.25, 0);
  legR.position.set(0.12, -0.25, 0);
  group.add(legL, legR);

  const armGeo = new THREE.BoxGeometry(0.08, 0.7, 0.08);
  const armLGroup = new THREE.Group();
  const armRGroup = new THREE.Group();
  armLGroup.position.set(-0.35, spineH * 0.55, 0);
  armRGroup.position.set(0.35, spineH * 0.55, 0);
  const armL = new THREE.Mesh(armGeo, boneMat);
  const armR = new THREE.Mesh(armGeo, boneMat);
  armL.position.y = -0.35;
  armR.position.y = -0.35;
  armL.rotation.z = 0.25;
  armR.rotation.z = -0.25;
  armLGroup.add(armL);
  armRGroup.add(armR);
  group.add(armLGroup, armRGroup);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, spineH + 0.25, 0);
  const headSize = 0.5;
  const head = new THREE.Mesh(new THREE.BoxGeometry(headSize, headSize, headSize * 0.6), clockMat);
  headGroup.add(head);

  const dialMat = makeMat(0xfff5c8);
  const dial = new THREE.Mesh(new THREE.BoxGeometry(headSize * 0.75, headSize * 0.75, 0.03), dialMat);
  dial.position.z = headSize * 0.32;
  headGroup.add(dial);
  materials.push(dialMat);

  const handMat = makeMat(0x101010);
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.16, 0.02), handMat);
  hourHand.position.z = headSize * 0.34;
  hourHand.position.y = 0.05;
  headGroup.add(hourHand);
  const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.02), handMat);
  minuteHand.position.z = headSize * 0.34;
  minuteHand.rotation.z = 1.2;
  headGroup.add(minuteHand);
  materials.push(handMat);

  const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.03);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.15, 0.18, headSize * 0.34);
  eyeR.position.set(0.15, 0.18, headSize * 0.34);
  headGroup.add(eyeL, eyeR);

  group.add(headGroup);

  return { root: group, materials, headGroup, armGroups: [armLGroup, armRGroup], jitterMeshes: [headGroup] };
}

/** Boss: floating golden shadow with multiple reaching arms and warm aura. */
function buildBeklentiGolgesi(stats: EnemyStats): EnemyMeshResult {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const shadowMat = makeMat(stats.color, { emissive: 0x3a2800, emissiveIntensity: 0.45 });
  const glowMat = makeMat(stats.accentColor, { emissive: 0xd4a020, emissiveIntensity: 0.85 });
  const eyeMat = makeMat(0xffffff, { emissive: 0xfff0a0, emissiveIntensity: 1.5 });
  materials.push(shadowMat, glowMat, eyeMat);

  const floatBody = new THREE.Group();

  const coreSize = 1.4;
  const core = new THREE.Mesh(new THREE.BoxGeometry(coreSize, coreSize * 1.4, coreSize * 0.8), shadowMat);
  core.position.y = coreSize * 0.9;
  floatBody.add(core);

  const shroudGeo = new THREE.BoxGeometry(coreSize * 1.4, 0.25, coreSize * 1.1);
  for (let i = 0; i < 5; i++) {
    const shroud = new THREE.Mesh(shroudGeo, shadowMat);
    shroud.position.y = coreSize * 0.25 + i * 0.22;
    shroud.rotation.y = i * 0.15;
    floatBody.add(shroud);
  }

  const armGroups: THREE.Group[] = [];
  const armCount = 6;
  for (let i = 0; i < armCount; i++) {
    const angle = (i / armCount) * Math.PI * 2;
    const armGroup = new THREE.Group();
    armGroup.position.set(Math.cos(angle) * 0.8, coreSize * 1.1, Math.sin(angle) * 0.8);
    armGroup.rotation.y = -angle;
    const seg1 = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.9, 0.16), shadowMat);
    seg1.position.set(0, -0.45, 0);
    seg1.rotation.x = -0.3;
    armGroup.add(seg1);
    const seg2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.14), shadowMat);
    seg2.position.set(0, -1.15, 0.25);
    seg2.rotation.x = -0.6;
    armGroup.add(seg2);
    const claw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.22), glowMat);
    claw.position.set(0, -1.5, 0.55);
    armGroup.add(claw);
    floatBody.add(armGroup);
    armGroups.push(armGroup);
  }

  const headSize = 0.7;
  const head = new THREE.Mesh(new THREE.BoxGeometry(headSize, headSize, headSize * 0.7), shadowMat);
  head.position.y = coreSize * 1.85;
  floatBody.add(head);

  const eyeGeo = new THREE.BoxGeometry(0.14, 0.14, 0.06);
  const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
  const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
  eyeL.position.set(-0.18, coreSize * 1.9, headSize * 0.36);
  eyeR.position.set(0.18, coreSize * 1.9, headSize * 0.36);
  floatBody.add(eyeL, eyeR);

  const crown = new THREE.Mesh(new THREE.BoxGeometry(headSize * 1.2, 0.22, headSize * 1.2), glowMat);
  crown.position.y = coreSize * 2.25;
  floatBody.add(crown);

  group.add(floatBody);

  const auraMat = new THREE.MeshBasicMaterial({ color: stats.accentColor, transparent: true, opacity: 0.35 });
  const aura = new THREE.Mesh(new THREE.BoxGeometry(coreSize * 2.2, 0.1, coreSize * 2.2), auraMat);
  aura.position.y = 0.05;
  group.add(aura);

  const aura2 = new THREE.Mesh(new THREE.BoxGeometry(coreSize * 1.5, 0.1, coreSize * 1.5), auraMat.clone());
  aura2.position.y = 0.12;
  group.add(aura2);

  return { root: group, materials, armGroups, floatBody };
}

