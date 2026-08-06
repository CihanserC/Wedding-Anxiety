import * as THREE from 'three';
import type { EnemyStats } from '../../data/enemies';

function makeMat(color: number, opts: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

/**
 * Voxel grandmother photographer — pink cardigan, burgundy dress,
 * silver hair, thick glasses, bulky camera with flash lens.
 */
export function buildFotografFlasoru(stats: EnemyStats) {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const dressMat = makeMat(stats.color);
  const cardiganMat = makeMat(0xe05090);
  const skinMat = makeMat(0xe8c4a8);
  const hairMat = makeMat(0xc8c0b8);
  const darkMat = makeMat(0x1a1a1e);
  const flashMat = makeMat(stats.accentColor, { emissive: 0xffffcc, emissiveIntensity: 0.85 });
  const cameraMat = makeMat(0x2a2a32);
  const smileMat = makeMat(0xc05060);
  materials.push(dressMat, cardiganMat, skinMat, hairMat, darkMat, flashMat, cameraMat, smileMat);

  // Burgundy dress skirt
  const skirt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.55, 0.38), dressMat);
  skirt.position.y = 0.42;
  group.add(skirt);

  // Pink cardigan torso
  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.55, 0.34), cardiganMat);
  torso.position.y = 0.95;
  group.add(torso);

  // Cardigan lapels / trim
  for (const side of [-1, 1]) {
    const lapel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.06), makeMat(0xd04080));
    lapel.position.set(side * 0.14, 0.96, 0.16);
    group.add(lapel);
    materials.push(lapel.material as THREE.MeshLambertMaterial);
  }

  // Legs under skirt
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.14), makeMat(0x3a2030));
    leg.position.set(side * 0.14, 0.12, 0);
    group.add(leg);
    materials.push(leg.material as THREE.MeshLambertMaterial);
  }

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.42, 0.02);
  group.add(headGroup);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.38), skinMat);
  headGroup.add(head);

  // Short silver hair
  const hairTop = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.14, 0.42), hairMat);
  hairTop.position.y = 0.26;
  headGroup.add(hairTop);

  const hairBack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.12), hairMat);
  hairBack.position.set(0, 0.08, -0.18);
  headGroup.add(hairBack);

  for (const side of [-1, 1]) {
    const sideHair = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.28, 0.28), hairMat);
    sideHair.position.set(side * 0.24, 0.06, 0);
    headGroup.add(sideHair);
  }

  // Thick black glasses
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.04), darkMat);
  bridge.position.set(0, 0.06, 0.2);
  headGroup.add(bridge);

  for (const side of [-1, 1]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.05), darkMat);
    frame.position.set(side * 0.12, 0.06, 0.2);
    headGroup.add(frame);
    const lens = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.02), makeMat(0x88aacc, { transparent: true, opacity: 0.35 }));
    lens.position.set(side * 0.12, 0.06, 0.23);
    headGroup.add(lens);
    materials.push(lens.material as THREE.MeshLambertMaterial);
  }

  // Happy ^ eyes and smile
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.02), darkMat);
    eye.position.set(side * 0.1, 0.05, 0.2);
    headGroup.add(eye);
  }

  const smile = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.03), smileMat);
  smile.position.set(0, -0.1, 0.2);
  headGroup.add(smile);

  // Camera held at chest with both hands
  const cameraRig = new THREE.Group();
  cameraRig.position.set(0, 1.05, 0.28);
  group.add(cameraRig);

  const cameraBody = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.26, 0.28), cameraMat);
  cameraRig.add(cameraBody);

  const lensBarrel = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.16), darkMat);
  lensBarrel.position.set(0, 0, 0.2);
  cameraRig.add(lensBarrel);

  const flashLens = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.1), flashMat);
  flashLens.position.set(0.14, 0.14, 0.12);
  flashLens.name = 'flash-lens';
  cameraRig.add(flashLens);

  // Arms reaching toward camera
  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.32, 1.18, 0.05);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), cardiganMat);
  armL.position.set(0.05, -0.12, 0.12);
  armL.rotation.x = -0.85;
  armL.rotation.z = 0.35;
  armLGroup.add(armL);
  const handL = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.12), skinMat);
  handL.position.set(0.12, -0.28, 0.28);
  armLGroup.add(handL);
  group.add(armLGroup);

  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.32, 1.18, 0.05);
  const armR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.38, 0.12), cardiganMat);
  armR.position.set(-0.05, -0.12, 0.12);
  armR.rotation.x = -0.85;
  armR.rotation.z = -0.35;
  armRGroup.add(armR);
  const handR = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.12), skinMat);
  handR.position.set(-0.12, -0.28, 0.28);
  armRGroup.add(handR);
  group.add(armRGroup);

  return {
    root: group,
    materials,
    headGroup,
    armGroups: [armLGroup, armRGroup],
    jitterMeshes: [flashLens],
  };
}
