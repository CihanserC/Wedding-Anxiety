import * as THREE from 'three';
import type { EnemyStats } from '../../data/enemies';

function makeMat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

/** Voxel cow — cream body with brown patches, horns, swaying tail. */
export function buildInek(stats: EnemyStats) {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const hide = makeMat(stats.color);
  const patch = makeMat(stats.accentColor);
  const pink = makeMat(0xf0a0a8);
  const dark = makeMat(0x1a1208);
  materials.push(hide, patch, pink, dark);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 1.1), hide);
  body.position.set(0, 0.75, 0);
  group.add(body);

  const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.35), patch);
  spot1.position.set(0.22, 0.85, 0.15);
  group.add(spot1);
  const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.28, 0.3), patch);
  spot2.position.set(-0.2, 0.7, -0.25);
  group.add(spot2);

  for (const [lx, lz] of [
    [0.22, 0.35],
    [-0.22, 0.35],
    [0.22, -0.35],
    [-0.22, -0.35],
  ] as Array<[number, number]>) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), hide);
    leg.position.set(lx, 0.28, lz);
    group.add(leg);
    const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.16), dark);
    hoof.position.set(lx, 0.04, lz);
    group.add(hoof);
  }

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.95, 0.65);
  group.add(headGroup);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.4), hide);
  headGroup.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.2), pink);
  snout.position.set(0, -0.08, 0.24);
  headGroup.add(snout);

  const hornL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.06), makeMat(0xe8e0d0));
  hornL.position.set(-0.16, 0.22, 0);
  hornL.rotation.z = 0.25;
  headGroup.add(hornL);
  materials.push(hornL.material as THREE.MeshLambertMaterial);

  const hornR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.18, 0.06), makeMat(0xe8e0d0));
  hornR.position.set(0.16, 0.22, 0);
  hornR.rotation.z = -0.25;
  headGroup.add(hornR);
  materials.push(hornR.material as THREE.MeshLambertMaterial);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.04), dark);
  eyeL.position.set(-0.1, 0.06, 0.2);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.04), dark);
  eyeR.position.set(0.1, 0.06, 0.2);
  headGroup.add(eyeR);

  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.06), patch);
  earL.position.set(-0.22, 0.08, 0);
  headGroup.add(earL);
  const earR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.06), patch);
  earR.position.set(0.22, 0.08, 0);
  headGroup.add(earR);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.4), patch);
  tail.position.set(0, 0.85, -0.65);
  tail.rotation.x = 0.4;
  group.add(tail);

  const tuft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), dark);
  tuft.position.set(0, 0, -0.22);
  tail.add(tuft);

  return { root: group, materials, headGroup, tail };
}
