import * as THREE from 'three';
import type { EnemyStats } from '../../data/enemies';

function makeMat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

/** Voxel monkey — brown body, pale face, long curling tail. */
export function buildMaymun(stats: EnemyStats) {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const fur = makeMat(stats.color);
  const face = makeMat(stats.accentColor);
  const dark = makeMat(0x3a2410);
  materials.push(fur, face, dark);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.45, 0.32), fur);
  body.position.y = 0.55;
  group.add(body);

  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.12), face);
  belly.position.set(0, 0.5, 0.14);
  group.add(belly);

  for (const [lx, lz] of [
    [0.12, 0.1],
    [-0.12, 0.1],
    [0.12, -0.1],
    [-0.12, -0.1],
  ] as Array<[number, number]>) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.1), fur);
    leg.position.set(lx, 0.16, lz);
    group.add(leg);
  }

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.9, 0.05);
  group.add(headGroup);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.3, 0.3), fur);
  headGroup.add(head);

  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.14), face);
  muzzle.position.set(0, -0.04, 0.16);
  headGroup.add(muzzle);

  const earL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.06), fur);
  earL.position.set(-0.18, 0.12, 0);
  headGroup.add(earL);
  const earR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.06), fur);
  earR.position.set(0.18, 0.12, 0);
  headGroup.add(earR);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), dark);
  eyeL.position.set(-0.08, 0.06, 0.16);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.04), dark);
  eyeR.position.set(0.08, 0.06, 0.16);
  headGroup.add(eyeR);

  const armL = new THREE.Group();
  armL.position.set(-0.26, 0.7, 0);
  const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), fur);
  armLMesh.position.y = -0.15;
  armL.add(armLMesh);
  group.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.26, 0.7, 0);
  const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), fur);
  armRMesh.position.y = -0.15;
  armR.add(armRMesh);
  group.add(armR);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.45), fur);
  tail.position.set(0, 0.55, -0.28);
  tail.rotation.x = -0.5;
  group.add(tail);

  return {
    root: group,
    materials,
    headGroup,
    armGroups: [armL, armR],
    tail,
  };
}
