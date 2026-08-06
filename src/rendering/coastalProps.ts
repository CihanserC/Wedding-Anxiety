import * as THREE from 'three';

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/**
 * Coastal picnic spot: checkered blanket, wooden table, basket, and sunset snacks.
 */
export function buildCoastalPicnic(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'coastal-picnic';

  const red = lambert(0xc94a3a);
  const white = lambert(0xf5f0e6);
  const wood = lambert(0x7a5230);
  const woodDark = lambert(0x5a3a1e);
  const wicker = lambert(0xc8a060);
  const green = lambert(0x4a8f3a);
  const glass = lambert(0xb8e0c8);

  // Checkered blanket on the ground
  const blanketY = 0.04;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      const tile = box(0.38, 0.06, 0.38, (row + col) % 2 === 0 ? red : white);
      tile.position.set(col * 0.38 - 0.76, blanketY, row * 0.38 - 0.57);
      g.add(tile);
    }
  }

  // Blanket fringe
  for (let i = 0; i < 5; i++) {
    const fringe = box(0.08, 0.04, 0.08, white);
    fringe.position.set(i * 0.38 - 0.76, blanketY - 0.02, -0.76);
    g.add(fringe);
    const fringe2 = fringe.clone();
    fringe2.position.z = 0.76;
    g.add(fringe2);
  }

  // Low wooden picnic table
  for (const [lx, lz] of [
    [-0.42, -0.28],
    [0.42, -0.28],
    [-0.42, 0.28],
    [0.42, 0.28],
  ] as Array<[number, number]>) {
    const leg = box(0.08, 0.42, 0.08, woodDark);
    leg.position.set(lx, 0.25, lz);
    g.add(leg);
  }
  const tabletop = box(1.05, 0.06, 0.72, wood);
  tabletop.position.set(0, 0.48, 0);
  g.add(tabletop);

  // Bench on one side
  const benchTop = box(0.95, 0.06, 0.28, wood);
  benchTop.position.set(0, 0.28, -0.62);
  g.add(benchTop);
  for (const lx of [-0.38, 0.38]) {
    const benchLeg = box(0.08, 0.24, 0.08, woodDark);
    benchLeg.position.set(lx, 0.14, -0.62);
    g.add(benchLeg);
  }

  // Wicker picnic basket
  const basket = box(0.28, 0.22, 0.2, wicker);
  basket.position.set(-0.55, 0.55, 0.15);
  g.add(basket);
  const basketLid = box(0.3, 0.06, 0.22, lambert(0xb89050));
  basketLid.position.set(-0.55, 0.7, 0.15);
  basketLid.rotation.z = -0.25;
  g.add(basketLid);
  const handle = box(0.14, 0.04, 0.04, woodDark);
  handle.position.set(-0.55, 0.78, 0.15);
  g.add(handle);

  // Cheese wedge & bread on table
  const cheese = box(0.18, 0.08, 0.18, lambert(0xf5d76e));
  cheese.position.set(0.1, 0.56, -0.05);
  cheese.rotation.y = 0.4;
  g.add(cheese);
  const bread = box(0.22, 0.1, 0.14, lambert(0xd4a85a));
  bread.position.set(-0.15, 0.56, 0.08);
  g.add(bread);

  // Wine bottle
  const bottle = box(0.1, 0.32, 0.1, lambert(0x2a4a2a));
  bottle.position.set(0.35, 0.66, 0.12);
  g.add(bottle);
  const bottleNeck = box(0.06, 0.12, 0.06, lambert(0x1a301a));
  bottleNeck.position.set(0.35, 0.88, 0.12);
  g.add(bottleNeck);

  // Glass
  const wineGlass = box(0.08, 0.14, 0.08, glass);
  wineGlass.position.set(0.2, 0.58, 0.2);
  g.add(wineGlass);

  // Small wildflower pot on table corner
  const pot = box(0.14, 0.1, 0.14, lambert(0x8a5a3a));
  pot.position.set(-0.35, 0.56, -0.2);
  g.add(pot);
  const blooms = box(0.16, 0.12, 0.16, green);
  blooms.position.set(-0.35, 0.7, -0.2);
  g.add(blooms);
  const bloomDot = box(0.06, 0.06, 0.06, lambert(0xffc860));
  bloomDot.position.set(-0.3, 0.78, -0.15);
  g.add(bloomDot);

  return g;
}

/** Tall coastal pine with layered branches and a slight wind lean. */
export function buildCoastalPine(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'coastal-pine';
  g.rotation.z = 0.06;

  const bark = lambert(0x4a3420);
  const barkDark = lambert(0x2e2014);
  const needle = lambert(0x2d6a38);
  const needleDark = lambert(0x1e4a28);

  let y = 0.2;
  for (let i = 0; i < 8; i++) {
    const seg = box(0.2 - i * 0.012, 0.45, 0.2 - i * 0.012, i % 2 === 0 ? bark : barkDark);
    seg.position.set(Math.sin(i * 0.12) * 0.06, y, 0);
    g.add(seg);
    y += 0.4;
  }

  const tiers: Array<{ y: number; w: number; d: number; mat: THREE.MeshLambertMaterial }> = [
    { y: 2.8, w: 1.6, d: 1.4, mat: needleDark },
    { y: 3.5, w: 1.3, d: 1.15, mat: needle },
    { y: 4.1, w: 1.0, d: 0.9, mat: needleDark },
    { y: 4.6, w: 0.65, d: 0.55, mat: needle },
  ];
  for (const tier of tiers) {
    const layer = box(tier.w, 0.35, tier.d, tier.mat);
    layer.position.set(0.08, tier.y, 0);
    g.add(layer);
  }

  const tip = box(0.15, 0.3, 0.15, needle);
  tip.position.set(0.1, 5.0, 0);
  g.add(tip);

  return g;
}

/** Wind-swept coastal broadleaf tree with a bent trunk and wide canopy. */
export function buildCoastalTree(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'coastal-tree';

  const bark = lambert(0x5c3a22);
  const barkDark = lambert(0x3a2414);
  const leaf = lambert(0x3a9a48);
  const leafMid = lambert(0x4ab058);
  const leafDark = lambert(0x2a7038);

  // Bent trunk
  for (let i = 0; i < 5; i++) {
    const seg = box(0.28 - i * 0.02, 0.5, 0.28 - i * 0.02, i % 2 === 0 ? bark : barkDark);
    seg.position.set(i * 0.12, 0.3 + i * 0.48, -i * 0.08);
    seg.rotation.z = 0.08;
    g.add(seg);
  }

  const crownBase = 2.6;
  const crownX = 0.5;
  const crownZ = -0.35;

  const layers: Array<{ y: number; w: number; d: number; mat: THREE.MeshLambertMaterial }> = [
    { y: crownBase, w: 2.2, d: 1.9, mat: leafDark },
    { y: crownBase + 0.4, w: 1.8, d: 1.6, mat: leaf },
    { y: crownBase + 0.75, w: 1.3, d: 1.15, mat: leafMid },
  ];
  for (const layer of layers) {
    const canopy = box(layer.w, 0.3, layer.d, layer.mat);
    canopy.position.set(crownX, layer.y, crownZ);
    g.add(canopy);
  }

  // Wind-swept branch plates
  const blades: Array<[number, number, number, number]> = [
    [1.1, 0.15, 0.1, 0.2],
    [-0.7, 0.2, -0.2, 1.8],
    [0.3, 0.9, 0.05, 2.6],
    [-0.2, -0.8, 0.15, 3.8],
  ];
  for (const [ox, oz, lift, rot] of blades) {
    const blade = box(0.75, 0.08, 0.5, leafMid);
    blade.position.set(crownX + ox, crownBase + 0.15 + lift, crownZ + oz);
    blade.rotation.y = rot;
    blade.rotation.x = -0.4;
    g.add(blade);
  }

  return g;
}
