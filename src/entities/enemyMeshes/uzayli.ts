import * as THREE from 'three';
import type { EnemyStats } from '../../data/enemies';

function makeMat(color: number, opts: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

/** Hostile alien — elongated head, glowing eyes, lanky limbs. */
export function buildUzayliDusmanca(stats: EnemyStats) {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const skin = makeMat(stats.color);
  const accent = makeMat(stats.accentColor, { emissive: stats.accentColor, emissiveIntensity: 0.5 });
  materials.push(skin, accent);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.7, 0.32), skin);
  body.position.y = 0.85;
  group.add(body);

  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), skin);
  legL.position.set(-0.12, 0.25, 0);
  const legR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.12), skin);
  legR.position.set(0.12, 0.25, 0);
  group.add(legL, legR);

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.45, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.55, 0.35), skin);
  headGroup.add(head);
  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.05), accent);
  eyeL.position.set(-0.1, 0.08, 0.18);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.05), accent);
  eyeR.position.set(0.1, 0.08, 0.18);
  headGroup.add(eyeL, eyeR);
  group.add(headGroup);

  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.3, 1.15, 0);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.1), skin);
  armL.position.y = -0.3;
  armLGroup.add(armL);
  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.3, 1.15, 0);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.65, 0.1), skin);
  armR.position.y = -0.3;
  armRGroup.add(armR);
  group.add(armLGroup, armRGroup);

  return { root: group, materials, headGroup, armGroups: [armLGroup, armRGroup] };
}
