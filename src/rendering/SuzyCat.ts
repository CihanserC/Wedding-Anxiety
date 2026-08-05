import * as THREE from 'three';

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/** Minik turuncu kedi — gelinin yanında, Suzy Çıtçıt. */
export function buildSuzyCat(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'suzy-cat';

  const orange = lambert(0xf5a623);
  const orangeDark = lambert(0xe07820);
  const eyeGreen = lambert(0x5ec45a);
  const nosePink = lambert(0xff8a9a);

  const body = box(0.34, 0.16, 0.26, orange);
  body.position.set(0, 0.1, 0);
  g.add(body);

  const stripe = box(0.2, 0.12, 0.08, orangeDark);
  stripe.position.set(-0.04, 0.12, -0.04);
  g.add(stripe);

  for (const [lx, lz] of [
    [0.1, 0.08],
    [0.1, -0.08],
    [-0.1, 0.08],
    [-0.1, -0.08],
  ] as Array<[number, number]>) {
    const leg = box(0.07, 0.1, 0.07, orange);
    leg.position.set(lx, 0.05, lz);
    g.add(leg);
  }

  const headGroup = new THREE.Group();
  headGroup.position.set(0.12, 0.16, 0.14);
  g.add(headGroup);

  const head = box(0.2, 0.18, 0.18, orange);
  headGroup.add(head);

  const cheekL = box(0.06, 0.06, 0.04, orangeDark);
  cheekL.position.set(-0.1, -0.02, 0.06);
  headGroup.add(cheekL);
  const cheekR = box(0.06, 0.06, 0.04, orangeDark);
  cheekR.position.set(0.1, -0.02, 0.06);
  headGroup.add(cheekR);

  const earL = box(0.06, 0.08, 0.04, orange);
  earL.position.set(-0.1, 0.12, 0);
  earL.rotation.z = 0.15;
  headGroup.add(earL);
  const earR = box(0.06, 0.08, 0.04, orange);
  earR.position.set(0.1, 0.12, 0);
  earR.rotation.z = -0.15;
  headGroup.add(earR);

  const nose = box(0.04, 0.03, 0.03, nosePink);
  nose.position.set(0, -0.02, 0.1);
  headGroup.add(nose);

  const eyeL = box(0.035, 0.035, 0.02, eyeGreen);
  eyeL.position.set(-0.05, 0.03, 0.1);
  headGroup.add(eyeL);
  const eyeR = box(0.035, 0.035, 0.02, eyeGreen);
  eyeR.position.set(0.05, 0.03, 0.1);
  headGroup.add(eyeR);

  const tail = box(0.06, 0.06, 0.22, orangeDark);
  tail.position.set(-0.16, 0.14, -0.1);
  tail.rotation.x = -0.35;
  tail.rotation.z = 0.2;
  g.add(tail);

  g.userData.tail = tail;
  return g;
}

export function updateSuzyCatIdle(group: THREE.Object3D, time: number): void {
  const tail = group.userData.tail as THREE.Mesh | undefined;
  if (tail) tail.rotation.z = 0.2 + Math.sin(time * 2.8) * 0.12;
}
