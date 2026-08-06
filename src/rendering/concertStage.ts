import * as THREE from 'three';

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/** Wooden conductor podium with score. */
export function buildConductorPodium(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'conductor-podium';

  const wood = lambert(0x6a3a20);
  const dark = lambert(0x4a2810);
  const gold = lambert(0xd4af37);
  const paper = lambert(0xf5f5f0);

  const base = box(0.9, 0.12, 0.7, dark);
  base.position.set(0, 0.06, 0);
  g.add(base);

  const column = box(0.55, 0.95, 0.45, wood);
  column.position.set(0, 0.58, 0);
  g.add(column);

  const top = box(0.95, 0.08, 0.75, wood);
  top.position.set(0, 1.12, 0);
  g.add(top);

  const trim = box(1.0, 0.04, 0.8, gold);
  trim.position.set(0, 1.08, 0);
  g.add(trim);

  const score = box(0.42, 0.28, 0.02, paper);
  score.position.set(0, 1.28, 0.02);
  score.rotation.x = -0.2;
  g.add(score);

  return g;
}

/** Tripod stage spotlight aimed toward the hall. */
export function buildStageSpotlight(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'stage-spotlight';

  const metal = lambert(0x303038);
  const gold = lambert(0xd4af37);

  for (const side of [-1, 1]) {
    const leg = box(0.06, 1.35, 0.06, metal);
    leg.position.set(side * 0.28, 0.68, side * 0.12);
    leg.rotation.z = side * 0.22;
    leg.rotation.x = -0.12;
    g.add(leg);
  }

  const mast = box(0.08, 1.5, 0.08, metal);
  mast.position.set(0, 0.75, 0);
  g.add(mast);

  const head = box(0.42, 0.32, 0.5, metal);
  head.position.set(0, 1.45, 0.08);
  head.rotation.x = 0.55;
  g.add(head);

  const lens = box(0.3, 0.18, 0.06, lambert(0xfff2c0));
  lens.position.set(0, 1.32, 0.28);
  lens.rotation.x = 0.55;
  g.add(lens);

  const ring = box(0.44, 0.04, 0.52, gold);
  ring.position.set(0, 1.52, 0.06);
  ring.rotation.x = 0.55;
  g.add(ring);

  return g;
}

/** Low footlights along the downstage edge. */
export function buildStageFootlights(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'stage-footlights';

  const gold = lambert(0xd4af37);
  const glow = lambert(0xffe8a8);

  const rail = box(8.5, 0.1, 0.35, gold);
  rail.position.set(0, 0.05, 0);
  g.add(rail);

  for (let i = -4; i <= 4; i++) {
    const lamp = box(0.16, 0.14, 0.16, glow);
    lamp.position.set(i * 0.95, 0.14, 0);
    g.add(lamp);
    const hood = box(0.2, 0.06, 0.22, gold);
    hood.position.set(i * 0.95, 0.22, -0.04);
    g.add(hood);
  }

  return g;
}

/** Velvet side drape panel for the stage wings. */
export function buildStageSideDrape(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'stage-side-drape';

  const curtain = lambert(0x6a1220);
  const gold = lambert(0xd4af37);

  const panel = box(0.18, 3.2, 1.4, curtain);
  panel.position.set(0, 1.6, 0);
  g.add(panel);

  const tie = box(0.24, 0.5, 0.28, curtain);
  tie.position.set(0.08, 2.55, 0);
  g.add(tie);

  const pole = box(0.08, 3.4, 0.08, gold);
  pole.position.set(-0.12, 1.7, 0);
  g.add(pole);

  const finial = box(0.14, 0.14, 0.14, gold);
  finial.position.set(-0.12, 3.45, 0);
  g.add(finial);

  return g;
}
