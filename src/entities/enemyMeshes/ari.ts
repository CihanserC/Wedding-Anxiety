import * as THREE from 'three';
import type { EnemyStats } from '../../data/enemies';

function makeMat(color: number, opts: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

/** Tiny flying bee — yellow/black stripes, translucent wings. */
export function buildAri(stats: EnemyStats) {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const yellow = makeMat(stats.color, { emissive: 0xffaa00, emissiveIntensity: 0.15 });
  const black = makeMat(stats.accentColor);
  const wingMat = makeMat(0xe8f4ff, { transparent: true, opacity: 0.55 });
  materials.push(yellow, black, wingMat);

  const floatBody = new THREE.Group();
  floatBody.name = 'bee-body';
  group.add(floatBody);

  // Striped abdomen
  const abdomen = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.16), yellow);
  abdomen.position.set(0, 0.08, -0.02);
  floatBody.add(abdomen);

  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.04), black);
  stripe.position.set(0, 0.08, 0.02);
  floatBody.add(stripe);

  const stripe2 = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.11, 0.03), black);
  stripe2.position.set(0, 0.08, -0.08);
  floatBody.add(stripe2);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.09, 0.1);
  floatBody.add(headGroup);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.09), black);
  headGroup.add(head);

  const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), yellow);
  eyeL.position.set(-0.03, 0.02, 0.05);
  headGroup.add(eyeL);
  const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), yellow);
  eyeR.position.set(0.03, 0.02, 0.05);
  headGroup.add(eyeR);

  // Antennae
  const antL = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.06, 0.015), black);
  antL.position.set(-0.03, 0.07, 0.02);
  antL.rotation.z = 0.3;
  headGroup.add(antL);
  const antR = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.06, 0.015), black);
  antR.position.set(0.03, 0.07, 0.02);
  antR.rotation.z = -0.3;
  headGroup.add(antR);

  // Wings as arm groups for flap animation
  const wingL = new THREE.Group();
  wingL.position.set(-0.06, 0.12, 0);
  const wingLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.1), wingMat);
  wingLMesh.position.x = -0.06;
  wingL.add(wingLMesh);
  floatBody.add(wingL);

  const wingR = new THREE.Group();
  wingR.position.set(0.06, 0.12, 0);
  const wingRMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.1), wingMat);
  wingRMesh.position.x = 0.06;
  wingR.add(wingRMesh);
  floatBody.add(wingR);

  // Tiny stinger
  const stinger = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.03, 0.05), black);
  stinger.position.set(0, 0.08, -0.12);
  floatBody.add(stinger);

  return {
    root: group,
    materials,
    headGroup,
    armGroups: [wingL, wingR],
    floatBody,
  };
}
