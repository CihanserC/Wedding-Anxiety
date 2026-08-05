import * as THREE from 'three';

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/**
 * Wooden brown chest packed with gold — lid slightly ajar so the treasure shows.
 */
export function buildTreasureChest(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'treasure-chest';

  const wood = lambert(0x6b3e1f);
  const woodDark = lambert(0x4a2810);
  const iron = lambert(0x3a3a40);
  const gold = lambert(0xf5c542);
  const goldBright = lambert(0xffe066);

  const body = box(0.72, 0.38, 0.48, wood);
  body.position.y = 0.22;
  g.add(body);

  const trimFront = box(0.74, 0.06, 0.06, iron);
  trimFront.position.set(0, 0.12, 0.24);
  g.add(trimFront);
  const trimBack = box(0.74, 0.06, 0.06, iron);
  trimBack.position.set(0, 0.12, -0.24);
  g.add(trimBack);

  // Gold pile filling the chest
  const goldPile = new THREE.Group();
  goldPile.position.set(0, 0.38, 0);
  g.add(goldPile);

  const nuggets: Array<[number, number, number, number]> = [
    [0, 0.08, 0, 0.28],
    [-0.16, 0.06, 0.08, 0.14],
    [0.15, 0.07, -0.06, 0.16],
    [-0.08, 0.12, -0.1, 0.12],
    [0.1, 0.14, 0.1, 0.13],
    [0, 0.18, 0.02, 0.15],
    [-0.12, 0.1, 0.12, 0.1],
    [0.18, 0.09, 0.05, 0.11],
  ];
  for (let i = 0; i < nuggets.length; i++) {
    const [nx, ny, nz, s] = nuggets[i];
    const nugget = box(s, s * 0.7, s * 0.85, i % 2 === 0 ? gold : goldBright);
    nugget.position.set(nx, ny, nz);
    nugget.rotation.y = i * 0.4;
    goldPile.add(nugget);
  }

  // Lid hinged open toward the back
  const lid = new THREE.Group();
  lid.position.set(0, 0.4, -0.2);
  lid.rotation.x = -0.85;
  g.add(lid);

  const lidTop = box(0.74, 0.08, 0.5, woodDark);
  lidTop.position.set(0, 0.04, 0.22);
  lid.add(lidTop);

  const lidBand = box(0.76, 0.05, 0.08, iron);
  lidBand.position.set(0, 0.04, 0.42);
  lid.add(lidBand);

  const latch = box(0.1, 0.12, 0.06, iron);
  latch.position.set(0, 0.28, 0.26);
  g.add(latch);

  return g;
}
