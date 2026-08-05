import * as THREE from 'three';

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/** Tall curved palm with long fan fronds. */
export function buildPalmTree(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'palm-tree';

  const trunkMat = lambert(0x8b6b3a);
  const trunkDark = lambert(0x6a4e2a);
  const leafMat = lambert(0x2f8f3a);
  const leafDark = lambert(0x1f6a28);

  let y = 0.15;
  for (let i = 0; i < 10; i++) {
    const seg = box(0.24 - i * 0.01, 0.48, 0.24 - i * 0.01, i % 2 === 0 ? trunkMat : trunkDark);
    seg.position.set(Math.sin(i * 0.16) * 0.1, y, 0);
    seg.rotation.z = 0.07;
    g.add(seg);
    y += 0.42;
  }

  const crownY = y + 0.15;
  const frondAngles = [0, 0.52, 1.05, 1.57, 2.1, 2.62, 3.14, 3.67, 4.19, 4.71, 5.24, 5.76];
  for (const a of frondAngles) {
    const frond = box(0.14, 0.09, 1.65, a % 1.2 < 0.7 ? leafMat : leafDark);
    frond.position.set(Math.sin(a) * 0.55, crownY - 0.2, Math.cos(a) * 0.55);
    frond.rotation.y = a;
    frond.rotation.x = 0.5;
    g.add(frond);
  }

  // Second inner ring of shorter fronds
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05 + 0.3;
    const frond = box(0.12, 0.07, 1.15, leafDark);
    frond.position.set(Math.sin(a) * 0.3, crownY + 0.05, Math.cos(a) * 0.3);
    frond.rotation.y = a;
    frond.rotation.x = 0.25;
    g.add(frond);
  }

  const nut = box(0.2, 0.18, 0.2, lambert(0x6b4423));
  nut.position.set(0.14, crownY - 0.3, 0.1);
  g.add(nut);

  return g;
}

/**
 * Broadleaf tropical tree — thick trunk and wide canopy plates
 * (breadfruit / ficus vibe).
 */
export function buildBroadleafTree(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'broadleaf-tree';

  const bark = lambert(0x5c3a1e);
  const barkDark = lambert(0x3d2612);
  const leaf = lambert(0x2d8a38);
  const leafMid = lambert(0x3a9e45);
  const leafDark = lambert(0x1e6a28);

  // Trunk
  for (let i = 0; i < 5; i++) {
    const seg = box(0.32 - i * 0.02, 0.55, 0.32 - i * 0.02, i % 2 === 0 ? bark : barkDark);
    seg.position.y = 0.3 + i * 0.5;
    g.add(seg);
  }

  const crownBase = 2.7;

  // Wide layered canopy
  const layers: Array<{ y: number; w: number; d: number; mat: THREE.MeshLambertMaterial }> = [
    { y: crownBase, w: 2.4, d: 2.2, mat: leafDark },
    { y: crownBase + 0.35, w: 2.0, d: 1.9, mat: leaf },
    { y: crownBase + 0.7, w: 1.5, d: 1.4, mat: leafMid },
    { y: crownBase + 1.0, w: 0.9, d: 0.85, mat: leaf },
  ];
  for (const layer of layers) {
    const canopy = box(layer.w, 0.32, layer.d, layer.mat);
    canopy.position.y = layer.y;
    g.add(canopy);
  }

  // Broad individual leaves sticking out
  const blades: Array<[number, number, number, number]> = [
    [0.9, 0.15, 0.2, 0],
    [-0.85, 0.1, -0.25, 1.1],
    [0.2, 0.9, 0.15, 2.0],
    [-0.15, -0.95, 0.2, 3.2],
    [0.7, -0.55, 0.25, 4.0],
    [-0.65, 0.6, 0.2, 5.0],
  ];
  for (const [ox, oz, lift, rot] of blades) {
    const blade = box(0.85, 0.08, 0.55, leafMid);
    blade.position.set(ox, crownBase + 0.2 + lift, oz);
    blade.rotation.y = rot;
    blade.rotation.x = -0.35;
    blade.rotation.z = ox > 0 ? 0.2 : -0.2;
    g.add(blade);
  }

  return g;
}

/** Low rounded tropical bush — cream blooms, no pink. */
export function buildTropicalBush(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'tropical-bush';

  const green = lambert(0x2d7a35);
  const dark = lambert(0x1e5a24);
  const bloom = lambert(0xfff2c8);

  const base = box(0.7, 0.45, 0.65, green);
  base.position.y = 0.25;
  g.add(base);

  const top = box(0.5, 0.35, 0.48, dark);
  top.position.set(0.05, 0.5, -0.05);
  g.add(top);

  const side = box(0.35, 0.3, 0.35, green);
  side.position.set(-0.25, 0.35, 0.15);
  g.add(side);

  for (const [fx, fy, fz] of [
    [0.2, 0.55, 0.15],
    [-0.15, 0.6, -0.1],
    [0.05, 0.7, 0.05],
  ] as Array<[number, number, number]>) {
    const flower = box(0.1, 0.1, 0.1, bloom);
    flower.position.set(fx, fy, fz);
    g.add(flower);
  }

  return g;
}

/** Banana plant with long upright leaves. */
export function buildBananaPlant(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'banana-plant';

  const stem = lambert(0x5a8f3a);
  const leaf = lambert(0x3a9e40);
  const leafDark = lambert(0x2a7a30);

  const trunk = box(0.22, 1.15, 0.22, stem);
  trunk.position.y = 0.55;
  g.add(trunk);

  const leafSpecs: Array<[number, number, number, number]> = [
    [0.55, 0.15, 0, 1.15],
    [-0.5, 0.2, 0.8, 1.1],
    [0.1, 0.55, 1.8, 1.25],
    [-0.2, -0.45, 2.6, 1.05],
    [0.4, -0.1, 3.4, 0.95],
    [-0.35, 0.35, 4.2, 1.0],
  ];
  for (const [ox, oz, rot, len] of leafSpecs) {
    const blade = box(0.42, 0.07, len, Math.abs(ox) > 0.3 ? leaf : leafDark);
    blade.position.set(ox * 0.5, 1.05 + Math.abs(oz) * 0.1, oz * 0.3);
    blade.rotation.y = rot;
    blade.rotation.x = -0.35;
    g.add(blade);
  }

  const bunch = box(0.18, 0.22, 0.14, lambert(0xe8c84a));
  bunch.position.set(0.15, 0.85, 0.12);
  g.add(bunch);

  return g;
}

/** Small ground fern. */
export function buildFern(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'fern';

  const green = lambert(0x3d8f45);
  const dark = lambert(0x2a6a30);

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const frond = box(0.08, 0.04, 0.45, i % 2 === 0 ? green : dark);
    frond.position.set(Math.sin(a) * 0.12, 0.12, Math.cos(a) * 0.12);
    frond.rotation.y = a;
    frond.rotation.x = 0.65;
    g.add(frond);
  }

  const center = box(0.1, 0.2, 0.1, dark);
  center.position.y = 0.12;
  g.add(center);

  return g;
}
