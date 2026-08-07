import * as THREE from 'three';

function lambert(color: number, opts: THREE.MeshLambertMaterialParameters = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

/** Peaceful green alien with big eyes. */
export function buildAlienPeaceful(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'alien-peaceful';
  const skin = lambert(0x6ecf7a);
  const belly = lambert(0xb8f0c0);
  const eye = lambert(0x101820);
  const glow = lambert(0xa0ffe0, { emissive: 0x40c0a0, emissiveIntensity: 0.3 });

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.55, 0.3), skin);
  body.position.y = 0.7;
  g.add(body);
  const tummy = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.12), belly);
  tummy.position.set(0, 0.65, 0.14);
  g.add(tummy);

  for (const x of [-0.12, 0.12]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), skin);
    leg.position.set(x, 0.2, 0);
    g.add(leg);
  }

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.4, 0.36), skin);
  head.position.y = 1.2;
  g.add(head);
  for (const x of [-0.1, 0.1]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.05), eye);
    e.position.set(x, 1.25, 0.18);
    g.add(e);
  }
  const antenna = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.06), glow);
  antenna.position.y = 1.5;
  g.add(antenna);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), glow);
  tip.position.y = 1.65;
  g.add(tip);

  for (const x of [-0.28, 0.28]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.4, 0.09), skin);
    arm.position.set(x, 0.85, 0);
    g.add(arm);
  }
  return g;
}

/** Darth Vader — black armor, red lenses, cape silhouette. */
export function buildDarthVader(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'darth-vader';
  const black = lambert(0x121418);
  const dark = lambert(0x2a2e35);
  const red = lambert(0xff2020, { emissive: 0xaa0000, emissiveIntensity: 0.7 });
  const chrome = lambert(0x8a9098);

  const cape = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.3, 0.12), black);
  cape.position.set(0, 0.9, -0.22);
  g.add(cape);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.35), dark);
  torso.position.y = 1.05;
  g.add(torso);

  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.28, 0.08), chrome);
  chest.position.set(0, 1.15, 0.2);
  g.add(chest);

  for (const x of [-0.14, 0.14]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.65, 0.18), black);
    leg.position.set(x, 0.32, 0);
    g.add(leg);
  }

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.48, 0.42), black);
  helmet.position.y = 1.75;
  g.add(helmet);
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.1), dark);
  mask.position.set(0, 1.65, 0.22);
  g.add(mask);
  for (const x of [-0.09, 0.09]) {
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.04), red);
    lens.position.set(x, 1.78, 0.24);
    g.add(lens);
  }

  for (const x of [-0.38, 0.38]) {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.7, 0.14), black);
    arm.position.set(x, 1.0, 0);
    g.add(arm);
  }

  const saber = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.06, 0.9),
    new THREE.MeshBasicMaterial({ color: 0xff2020 }),
  );
  saber.position.set(0.42, 0.7, 0.35);
  saber.rotation.x = -0.4;
  g.add(saber);

  return g;
}

/** Master Yoda — small green sage with layered robe, expressive face, gnarled cane. */
export function buildMasterYoda(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'master-yoda';
  const green = lambert(0x6aaa48);
  const greenDeep = lambert(0x4a8030);
  const robe = lambert(0x8a6a40);
  const robeDeep = lambert(0x6a4e2e);
  const cream = lambert(0xd8c8a0);
  const leather = lambert(0x5a4030);
  const eye = lambert(0x1a2010);
  const white = lambert(0xe8e8d8);

  // Feet
  for (const x of [-0.1, 0.1]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.16), greenDeep);
    foot.position.set(x, 0.03, 0.02);
    g.add(foot);
  }

  // Short legs under robe hem
  for (const x of [-0.1, 0.1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.18, 0.1), green);
    leg.position.set(x, 0.14, 0);
    g.add(leg);
  }

  // Layered robe body
  const robeLower = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.34), robeDeep);
  robeLower.position.y = 0.34;
  g.add(robeLower);
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 0.32), robe);
  body.position.y = 0.52;
  g.add(body);

  // Hood / collar rim
  const collar = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.08, 0.36), robeDeep);
  collar.position.y = 0.68;
  g.add(collar);

  // Belt + buckle
  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.34), cream);
  belt.position.y = 0.4;
  g.add(belt);
  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.06), leather);
  buckle.position.set(0, 0.4, 0.18);
  g.add(buckle);

  // Arms in sleeves
  for (const x of [-0.26, 0.26]) {
    const sleeve = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), robe);
    sleeve.position.set(x, 0.5, 0.02);
    g.add(sleeve);
    const hand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), green);
    hand.position.set(x, 0.34, 0.04);
    g.add(hand);
  }

  // Head
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.3, 0.32), green);
  head.position.y = 0.86;
  g.add(head);

  // Brow ridges / wrinkles
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.08), greenDeep);
  brow.position.set(0, 0.96, 0.14);
  g.add(brow);
  for (const x of [-0.1, 0.1]) {
    const crease = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.04), greenDeep);
    crease.position.set(x, 0.9, 0.16);
    g.add(crease);
  }

  // Nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.08), greenDeep);
  nose.position.set(0, 0.84, 0.18);
  g.add(nose);

  // Mouth
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.03, 0.04), greenDeep);
  mouth.position.set(0, 0.76, 0.17);
  g.add(mouth);

  // Eyes with sclera
  for (const x of [-0.09, 0.09]) {
    const sclera = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.07, 0.04), white);
    sclera.position.set(x, 0.88, 0.17);
    g.add(sclera);
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.03), eye);
    pupil.position.set(x, 0.88, 0.19);
    g.add(pupil);
  }

  // Large pointed ears
  for (const [x, rot] of [
    [-0.3, 0.55],
    [0.3, -0.55],
  ] as Array<[number, number]>) {
    const earBase = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.1, 0.1), green);
    earBase.position.set(x * 0.85, 0.88, 0);
    earBase.rotation.z = rot;
    g.add(earBase);
    const earTip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.07), greenDeep);
    earTip.position.set(x * 1.15, 0.9, -0.02);
    earTip.rotation.z = rot;
    g.add(earTip);
  }

  // Sparse white hair tufts
  for (const x of [-0.1, 0.1]) {
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.08), white);
    hair.position.set(x, 1.04, -0.02);
    g.add(hair);
  }

  // Gnarled cane in right hand
  const stick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.72, 0.05), cream);
  stick.position.set(0.32, 0.38, 0.12);
  stick.rotation.z = -0.28;
  g.add(stick);
  const knot = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.07), leather);
  knot.position.set(0.38, 0.62, 0.1);
  g.add(knot);
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, 0.06), leather);
  tip.position.set(0.24, 0.06, 0.14);
  g.add(tip);

  return g;
}
