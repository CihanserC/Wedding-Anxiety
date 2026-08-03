import * as THREE from 'three';
import type { PropSpec } from '../game/worldGen/types';

/**
 * Non-voxel decorative props placed by map generators: stage instruments
 * for the concert hall and the giant sunset sun for the lighthouse map.
 */
export function buildProps(specs: PropSpec[]): THREE.Group {
  const group = new THREE.Group();
  group.name = 'map-props';
  for (const spec of specs) {
    const mesh = buildProp(spec.kind);
    mesh.position.set(spec.x, spec.y, spec.z);
    if (spec.rotationY) mesh.rotation.y = spec.rotationY;
    if (spec.scale) mesh.scale.setScalar(spec.scale);
    group.add(mesh);
  }
  return group;
}

function buildProp(kind: PropSpec['kind']): THREE.Group {
  switch (kind) {
    case 'grand-piano':
      return buildGrandPiano();
    case 'cello':
      return buildCello();
    case 'violin':
      return buildViolin();
    case 'music-stand':
      return buildMusicStand();
    case 'sun':
      return buildSun();
    case 'cat':
      return buildCat();
  }
}

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function buildGrandPiano(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'grand-piano';
  const black = lambert(0x141418);
  const white = lambert(0xf5f0e8);

  const body = box(2.4, 0.45, 1.6, black);
  body.position.set(0, 1.0, 0);
  g.add(body);

  // Curved tail approximated with a narrower rear section
  const tail = box(1.5, 0.45, 0.9, black);
  tail.position.set(0.3, 1.0, 1.1);
  g.add(tail);

  // Open lid propped at an angle
  const lid = box(2.3, 0.06, 1.7, black);
  lid.position.set(0, 1.55, 0.45);
  lid.rotation.x = -0.55;
  g.add(lid);
  const lidStick = box(0.06, 0.7, 0.06, black);
  lidStick.position.set(0.9, 1.4, 0.7);
  lidStick.rotation.x = -0.3;
  g.add(lidStick);

  // Keyboard
  const keys = box(1.6, 0.08, 0.35, white);
  keys.position.set(0, 1.18, -0.85);
  g.add(keys);
  const keyLip = box(1.7, 0.12, 0.1, black);
  keyLip.position.set(0, 1.12, -1.02);
  g.add(keyLip);

  // Legs
  for (const [lx, lz] of [
    [-1.0, -0.6],
    [1.0, -0.6],
    [0.2, 1.3],
  ] as Array<[number, number]>) {
    const leg = box(0.14, 0.8, 0.14, black);
    leg.position.set(lx, 0.4, lz);
    g.add(leg);
  }

  // Bench
  const bench = box(1.1, 0.1, 0.45, black);
  bench.position.set(0, 0.55, -1.6);
  g.add(bench);
  for (const [lx, lz] of [
    [-0.45, -1.75],
    [0.45, -1.75],
    [-0.45, -1.45],
    [0.45, -1.45],
  ] as Array<[number, number]>) {
    const leg = box(0.08, 0.5, 0.08, black);
    leg.position.set(lx, 0.25, lz);
    g.add(leg);
  }

  return g;
}

function buildCello(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'cello';
  const wood = lambert(0x8a4520);
  const dark = lambert(0x3a2010);

  const lean = new THREE.Group();
  lean.rotation.x = -0.18;
  g.add(lean);

  const lower = box(0.72, 0.85, 0.28, wood);
  lower.position.set(0, 0.75, 0);
  lean.add(lower);

  const upper = box(0.52, 0.55, 0.26, wood);
  upper.position.set(0, 1.35, 0);
  lean.add(upper);

  const neck = box(0.09, 0.85, 0.09, dark);
  neck.position.set(0, 1.95, -0.02);
  lean.add(neck);

  const scroll = box(0.14, 0.2, 0.14, dark);
  scroll.position.set(0, 2.42, -0.02);
  lean.add(scroll);

  const fingerboard = box(0.12, 0.9, 0.05, dark);
  fingerboard.position.set(0, 1.6, 0.15);
  lean.add(fingerboard);

  const endpin = box(0.04, 0.35, 0.04, dark);
  endpin.position.set(0, 0.18, 0.05);
  g.add(endpin);

  return g;
}

function buildViolin(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'violin';
  const wood = lambert(0xa05028);
  const dark = lambert(0x2a1808);

  const body = box(0.38, 0.12, 0.55, wood);
  body.position.set(0, 0.85, 0);
  body.rotation.x = 1.2;
  g.add(body);

  const neck = box(0.06, 0.06, 0.55, dark);
  neck.position.set(0, 0.95, -0.4);
  neck.rotation.x = 1.15;
  g.add(neck);

  const scroll = box(0.1, 0.1, 0.1, dark);
  scroll.position.set(0, 1.15, -0.72);
  g.add(scroll);

  // Resting on a chair-like stand
  const stand = box(0.08, 0.7, 0.08, dark);
  stand.position.set(0, 0.35, 0.1);
  g.add(stand);
  const rest = box(0.45, 0.06, 0.25, dark);
  rest.position.set(0, 0.72, 0.05);
  g.add(rest);

  return g;
}

function buildMusicStand(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'music-stand';
  const metal = lambert(0x40404a);
  const sheet = lambert(0xf5f5f0);

  const pole = box(0.05, 1.1, 0.05, metal);
  pole.position.set(0, 0.55, 0);
  g.add(pole);

  const base = box(0.5, 0.05, 0.5, metal);
  base.position.set(0, 0.03, 0);
  g.add(base);

  const desk = box(0.6, 0.45, 0.03, metal);
  desk.position.set(0, 1.25, 0.05);
  desk.rotation.x = -0.35;
  g.add(desk);

  const paper = box(0.45, 0.32, 0.01, sheet);
  paper.position.set(0, 1.27, 0.03);
  paper.rotation.x = -0.35;
  g.add(paper);

  return g;
}

export interface CatAnimRefs {
  headGroup: THREE.Group;
  tail: THREE.Mesh;
}

export function getCatAnimRefs(group: THREE.Object3D): CatAnimRefs | null {
  const headGroup = group.userData.headGroup as THREE.Group | undefined;
  const tail = group.userData.tail as THREE.Mesh | undefined;
  if (!headGroup || !tail) return null;
  return { headGroup, tail };
}

export function updateEatingCat(group: THREE.Object3D, time: number): void {
  const refs = getCatAnimRefs(group);
  if (!refs) return;
  refs.headGroup.rotation.x = 0.55 + Math.sin(time * 4) * 0.06;
  refs.tail.rotation.x = -0.4 + Math.sin(time * 2.5) * 0.08;
}

function buildCat(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'eating-cat';
  const black = lambert(0x1a1a1a);
  const white = lambert(0xf2f2f2);
  const pink = lambert(0xffb0b8);
  const bowlMat = lambert(0x7a4020);
  const foodMat = lambert(0xc87830);

  const body = box(0.52, 0.24, 0.38, white);
  body.position.set(0, 0.16, 0);
  g.add(body);

  const backPatch = box(0.28, 0.22, 0.14, black);
  backPatch.position.set(-0.08, 0.2, -0.06);
  g.add(backPatch);

  const legFL = box(0.1, 0.14, 0.1, white);
  legFL.position.set(0.14, 0.07, 0.12);
  g.add(legFL);
  const legFR = box(0.1, 0.14, 0.1, white);
  legFR.position.set(0.14, 0.07, -0.12);
  g.add(legFR);
  const legBL = box(0.1, 0.14, 0.1, black);
  legBL.position.set(-0.16, 0.07, 0.12);
  g.add(legBL);
  const legBR = box(0.1, 0.14, 0.1, black);
  legBR.position.set(-0.16, 0.07, -0.12);
  g.add(legBR);

  const headGroup = new THREE.Group();
  headGroup.position.set(0.18, 0.26, 0.24);
  headGroup.rotation.x = 0.55;
  g.add(headGroup);

  const head = box(0.3, 0.26, 0.28, white);
  headGroup.add(head);

  const facePatch = box(0.14, 0.14, 0.06, black);
  facePatch.position.set(0.06, 0.04, 0.12);
  headGroup.add(facePatch);

  const earL = box(0.09, 0.11, 0.05, black);
  earL.position.set(-0.12, 0.2, 0);
  headGroup.add(earL);
  const earR = box(0.09, 0.11, 0.05, black);
  earR.position.set(0.12, 0.2, 0);
  headGroup.add(earR);

  const nose = box(0.05, 0.04, 0.04, pink);
  nose.position.set(0, -0.1, 0.15);
  headGroup.add(nose);

  const tail = box(0.09, 0.07, 0.38, black);
  tail.position.set(-0.3, 0.22, -0.16);
  tail.rotation.x = -0.4;
  g.add(tail);

  const bowl = box(0.38, 0.1, 0.38, bowlMat);
  bowl.position.set(0.38, 0.05, 0.38);
  g.add(bowl);

  const food = box(0.24, 0.09, 0.24, foodMat);
  food.position.set(0.38, 0.13, 0.38);
  g.add(food);

  for (let i = 0; i < 4; i++) {
    const crumb = box(0.05, 0.04, 0.05, foodMat);
    crumb.position.set(0.28 + i * 0.05, 0.16, 0.32 + (i % 2) * 0.08);
    g.add(crumb);
  }

  g.userData.headGroup = headGroup;
  g.userData.tail = tail;
  return g;
}

function buildSun(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'sunset-sun';

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(22, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xff5a08, fog: false }),
  );
  g.add(core);

  const mid = new THREE.Mesh(
    new THREE.SphereGeometry(30, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff8530,
      transparent: true,
      opacity: 0.5,
      fog: false,
      depthWrite: false,
    }),
  );
  g.add(mid);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffb050,
      transparent: true,
      opacity: 0.28,
      fog: false,
      depthWrite: false,
    }),
  );
  g.add(halo);

  const outerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(55, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0xffd090,
      transparent: true,
      opacity: 0.12,
      fog: false,
      depthWrite: false,
    }),
  );
  g.add(outerGlow);

  return g;
}
