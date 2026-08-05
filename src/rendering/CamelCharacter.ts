import * as THREE from 'three';

function mat(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function vox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  parent.add(mesh);
  return mesh;
}

/**
 * Friendly voxel dromedary — sandy coat, single hump, long neck.
 */
export function buildCamelCharacter(): THREE.Group {
  const root = new THREE.Group();
  root.name = 'camel-character';

  const model = new THREE.Group();
  model.name = 'camel-model';
  root.add(model);

  const coat = mat(0xc4a06a);
  const coatDark = mat(0xa07848);
  const coatLight = mat(0xd8b888);
  const dark = mat(0x2a1c10);
  const saddle = mat(0x8b3a2a);
  const gold = mat(0xd4af37);

  // Body
  vox(model, 0.85, 0.7, 1.5, coat, 0, 1.05, 0);
  vox(model, 0.7, 0.35, 1.2, coatDark, 0, 0.75, 0.05);

  // Hump
  vox(model, 0.55, 0.55, 0.65, coatLight, 0, 1.65, -0.05);
  vox(model, 0.4, 0.25, 0.45, coat, 0, 1.95, -0.05);

  // Decorative saddle blanket
  vox(model, 0.7, 0.08, 0.7, saddle, 0, 1.42, 0.05);
  vox(model, 0.15, 0.12, 0.5, gold, 0.38, 1.35, 0.05);
  vox(model, 0.15, 0.12, 0.5, gold, -0.38, 1.35, 0.05);

  // Neck
  vox(model, 0.32, 0.7, 0.35, coat, 0, 1.35, 0.85, -0.35, 0, 0);
  vox(model, 0.28, 0.45, 0.3, coatDark, 0, 1.7, 1.1, -0.5, 0, 0);

  // Head
  const head = new THREE.Group();
  head.position.set(0, 1.95, 1.35);
  model.add(head);
  vox(head, 0.32, 0.28, 0.4, coat, 0, 0, 0);
  vox(head, 0.22, 0.16, 0.28, coatLight, 0, -0.05, 0.28);
  vox(head, 0.06, 0.06, 0.05, dark, -0.1, 0.05, 0.18);
  vox(head, 0.06, 0.06, 0.05, dark, 0.1, 0.05, 0.18);
  vox(head, 0.08, 0.14, 0.06, coatDark, -0.18, 0.12, -0.05, 0, 0, 0.3);
  vox(head, 0.08, 0.14, 0.06, coatDark, 0.18, 0.12, -0.05, 0, 0, -0.3);

  // Legs
  for (const [lx, lz] of [
    [0.28, 0.5],
    [-0.28, 0.5],
    [0.28, -0.5],
    [-0.28, -0.5],
  ] as Array<[number, number]>) {
    vox(model, 0.16, 0.7, 0.16, coat, lx, 0.38, lz);
    vox(model, 0.18, 0.1, 0.2, dark, lx, 0.05, lz);
  }

  // Tail
  vox(model, 0.08, 0.08, 0.45, coatDark, 0, 1.15, -0.9, 0.3, 0, 0);
  vox(model, 0.12, 0.14, 0.12, dark, 0, 1.0, -1.1);

  return root;
}
