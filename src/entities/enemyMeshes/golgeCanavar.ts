import * as THREE from 'three';
import type { EnemyStats } from '../../data/enemies';

function makeMat(color: number, opts: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

/** Floating shadow wraith — dark voxel body, glowing orange face, no legs. */
export function buildGolgeCanavar(stats: EnemyStats) {
  const group = new THREE.Group();
  const materials: THREE.MeshLambertMaterial[] = [];

  const bodyMat = makeMat(stats.color, { emissive: 0x0a0612, emissiveIntensity: 0.25 });
  const faceMat = makeMat(stats.accentColor, {
    emissive: stats.accentColor,
    emissiveIntensity: 1.4,
  });
  const emberMat = makeMat(0xff6040, { emissive: 0xff4020, emissiveIntensity: 0.9 });
  const mistMat = makeMat(0x4a2860, {
    emissive: 0x2a1040,
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.45,
  });
  materials.push(bodyMat, faceMat, emberMat, mistMat);

  const floatBody = new THREE.Group();

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.85, 0.48), bodyMat);
  torso.position.y = 1.15;
  floatBody.add(torso);

  const mid = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.4), bodyMat);
  mid.position.y = 0.72;
  floatBody.add(mid);

  // Trailing lower cubes (no legs)
  const trailSizes = [0.38, 0.28, 0.2, 0.14];
  for (let i = 0; i < trailSizes.length; i++) {
    const s = trailSizes[i];
    const chunk = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), bodyMat);
    chunk.position.set(
      (i % 2 === 0 ? -0.06 : 0.08) * i,
      0.42 - i * 0.18,
      (i % 2 === 0 ? 0.04 : -0.05) * i,
    );
    floatBody.add(chunk);
  }

  // Purple mist near ground
  for (let i = 0; i < 3; i++) {
    const mist = new THREE.Mesh(new THREE.BoxGeometry(0.35 + i * 0.1, 0.12, 0.3 + i * 0.08), mistMat);
    mist.position.set((i - 1) * 0.15, 0.08 + i * 0.04, (i % 2) * 0.08);
    floatBody.add(mist);
  }

  // Internal glow cubes
  const emberSpecs = [
    { x: -0.12, y: 1.0, z: 0.1, s: 0.1 },
    { x: 0.18, y: 0.85, z: -0.05, s: 0.08 },
    { x: 0.05, y: 0.55, z: 0.08, s: 0.09 },
    { x: -0.08, y: 0.35, z: -0.06, s: 0.07 },
  ];
  for (const e of emberSpecs) {
    const ember = new THREE.Mesh(new THREE.BoxGeometry(e.s, e.s, e.s), emberMat);
    ember.position.set(e.x, e.y, e.z);
    floatBody.add(ember);
  }

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.85, 0);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.55, 0.52), bodyMat);
  headGroup.add(head);

  // Angry slanted eyes
  const eyeGeo = new THREE.BoxGeometry(0.12, 0.07, 0.04);
  const eyeL = new THREE.Mesh(eyeGeo, faceMat);
  eyeL.position.set(-0.14, 0.1, 0.27);
  eyeL.rotation.z = 0.35;
  const eyeR = new THREE.Mesh(eyeGeo, faceMat);
  eyeR.position.set(0.14, 0.1, 0.27);
  eyeR.rotation.z = -0.35;
  headGroup.add(eyeL, eyeR);

  // Jagged toothy grin
  const toothGeo = new THREE.BoxGeometry(0.07, 0.08, 0.04);
  const toothYs = [-0.08, -0.14, -0.08, -0.15, -0.09];
  for (let i = 0; i < toothYs.length; i++) {
    const tooth = new THREE.Mesh(toothGeo, faceMat);
    tooth.position.set(-0.16 + i * 0.08, toothYs[i], 0.27);
    headGroup.add(tooth);
  }
  floatBody.add(headGroup);

  // Raised threatening arms
  const armLGroup = new THREE.Group();
  armLGroup.position.set(-0.48, 1.45, 0);
  armLGroup.rotation.z = 0.45;
  armLGroup.rotation.x = -0.5;
  const upperL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.22), bodyMat);
  upperL.position.y = -0.2;
  armLGroup.add(upperL);
  const fistL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), bodyMat);
  fistL.position.y = -0.55;
  armLGroup.add(fistL);
  floatBody.add(armLGroup);

  const armRGroup = new THREE.Group();
  armRGroup.position.set(0.48, 1.45, 0);
  armRGroup.rotation.z = -0.45;
  armRGroup.rotation.x = -0.5;
  const upperR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.55, 0.22), bodyMat);
  upperR.position.y = -0.2;
  armRGroup.add(upperR);
  const fistR = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), bodyMat);
  fistR.position.y = -0.55;
  armRGroup.add(fistR);
  floatBody.add(armRGroup);

  // Detached floating voxels
  const jitterMeshes: THREE.Object3D[] = [];
  const flakeSpecs = [
    { x: -0.55, y: 1.3, z: 0.2, s: 0.1 },
    { x: 0.6, y: 1.1, z: -0.15, s: 0.08 },
    { x: -0.35, y: 0.6, z: -0.25, s: 0.09 },
    { x: 0.4, y: 0.45, z: 0.22, s: 0.07 },
    { x: 0.1, y: 0.2, z: -0.3, s: 0.11 },
    { x: -0.2, y: 1.6, z: -0.35, s: 0.08 },
  ];
  for (const f of flakeSpecs) {
    const flake = new THREE.Mesh(new THREE.BoxGeometry(f.s, f.s, f.s), bodyMat);
    flake.position.set(f.x, f.y, f.z);
    flake.userData.basePos = flake.position.clone();
    floatBody.add(flake);
    jitterMeshes.push(flake);
  }

  group.add(floatBody);

  return {
    root: group,
    materials,
    headGroup,
    armGroups: [armLGroup, armRGroup],
    jitterMeshes,
    floatBody,
  };
}
