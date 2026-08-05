import * as THREE from 'three';
import type { EnemyStats } from '../../data/enemies';

function makeMat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

/** Low green voxel lizard with a long scurry tail. */
export function buildKertenkele(stats: EnemyStats) {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const skin = makeMat(stats.color);
  const belly = makeMat(stats.accentColor);
  const dark = makeMat(0x1a2a10);
  materials.push(skin, belly, dark);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.45), skin);
  body.position.y = 0.14;
  group.add(body);

  const under = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.35), belly);
  under.position.set(0, 0.08, 0.02);
  group.add(under);

  for (const [lx, lz] of [
    [0.12, 0.12],
    [-0.12, 0.12],
    [0.12, -0.12],
    [-0.12, -0.12],
  ] as Array<[number, number]>) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.06), skin);
    leg.position.set(lx, 0.05, lz);
    group.add(leg);
  }

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.16, 0.28);
  group.add(headGroup);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.2), skin);
  headGroup.add(head);

  const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.12), belly);
  jaw.position.set(0, -0.04, 0.08);
  headGroup.add(jaw);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.03), dark);
  eyeL.position.set(-0.06, 0.04, 0.08);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.03), dark);
  eyeR.position.set(0.06, 0.04, 0.08);
  headGroup.add(eyeR);

  const crest = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.2), makeMat(0x3a6f2a));
  crest.position.set(0, 0.1, -0.05);
  headGroup.add(crest);
  materials.push(crest.material as THREE.MeshLambertMaterial);

  const armL = new THREE.Group();
  armL.position.set(-0.14, 0.12, 0.08);
  const armLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.12), skin);
  armL.add(armLMesh);
  group.add(armL);

  const armR = new THREE.Group();
  armR.position.set(0.14, 0.12, 0.08);
  const armRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.12), skin);
  armR.add(armRMesh);
  group.add(armR);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.4), skin);
  tail.position.set(0, 0.12, -0.38);
  tail.rotation.x = 0.15;
  group.add(tail);

  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.15), belly);
  tip.position.set(0, 0, -0.25);
  tail.add(tip);

  return {
    root: group,
    materials,
    headGroup,
    armGroups: [armL, armR],
    tail,
  };
}
