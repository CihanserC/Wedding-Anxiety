import * as THREE from 'three';

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

const STEM = lambert(0x3d6b32);
const LEAF = lambert(0x4a8f42);

function addStem(g: THREE.Group, height = 0.35): void {
  const stem = box(0.06, height, 0.06, STEM);
  stem.position.y = height * 0.5;
  g.add(stem);
}

function addLeaf(g: THREE.Group, x: number, y: number, z: number, rotZ: number): void {
  const leaf = box(0.14, 0.05, 0.22, LEAF);
  leaf.position.set(x, y, z);
  leaf.rotation.z = rotZ;
  g.add(leaf);
}

/** Layered pink rose with stem and leaves. */
function buildRose(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'garden-rose';

  addStem(g, 0.38);
  addLeaf(g, 0.1, 0.12, 0.05, -0.35);
  addLeaf(g, -0.08, 0.18, -0.04, 0.4);

  const pink = lambert(0xff6b9d);
  const deep = lambert(0xe84a7a);
  const light = lambert(0xffb7c5);
  const crown = 0.42;

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), deep);
  core.position.y = crown;
  g.add(core);

  for (let i = 0; i < 6; i++) {
    const petal = box(0.12, 0.06, 0.16, i % 2 === 0 ? pink : light);
    const a = (i / 6) * Math.PI * 2;
    petal.position.set(Math.sin(a) * 0.1, crown + 0.04, Math.cos(a) * 0.1);
    petal.rotation.y = a;
    petal.rotation.x = 0.35;
    g.add(petal);
  }

  for (let i = 0; i < 5; i++) {
    const petal = box(0.14, 0.05, 0.18, i % 2 === 0 ? light : pink);
    const a = (i / 5) * Math.PI * 2 + 0.4;
    petal.position.set(Math.sin(a) * 0.14, crown + 0.1, Math.cos(a) * 0.14);
    petal.rotation.y = a;
    petal.rotation.x = 0.55;
    g.add(petal);
  }

  return g;
}

/** Cup-shaped tulip in wedding pastels. */
function buildTulip(seed: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'garden-tulip';

  addStem(g, 0.42);
  addLeaf(g, 0.12, 0.14, 0.02, -0.5);
  addLeaf(g, -0.1, 0.2, -0.06, 0.45);

  const cupColors = [0xff8fab, 0xffd166, 0xe8a0ff, 0xffb7c5];
  const cup = lambert(cupColors[seed % cupColors.length]);
  const cupY = 0.46;

  for (let i = 0; i < 4; i++) {
    const petal = box(0.1, 0.22, 0.14, cup);
    const a = (i / 4) * Math.PI * 2;
    petal.position.set(Math.sin(a) * 0.08, cupY, Math.cos(a) * 0.08);
    petal.rotation.y = a;
    petal.rotation.x = 0.25;
    g.add(petal);
  }

  const inner = box(0.08, 0.1, 0.08, lambert(0xfff5e8));
  inner.position.y = cupY + 0.08;
  g.add(inner);

  return g;
}

/** White daisy with golden center. */
function buildDaisy(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'garden-daisy';

  addStem(g, 0.32);
  addLeaf(g, 0.09, 0.1, 0.04, -0.3);

  const crown = 0.36;
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), lambert(0xffd166));
  center.position.y = crown;
  g.add(center);

  const white = lambert(0xfff8f0);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const petal = box(0.2, 0.04, 0.08, white);
    petal.position.set(Math.sin(a) * 0.16, crown, Math.cos(a) * 0.16);
    petal.rotation.y = a;
    g.add(petal);
  }

  return g;
}

/** Purple lavender spike cluster. */
function buildLavender(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'garden-lavender';

  addStem(g, 0.5);

  const purple = lambert(0x9b6bcc);
  const light = lambert(0xc9a0ff);
  let y = 0.38;
  for (let i = 0; i < 5; i++) {
    const spike = box(0.06, 0.1, 0.06, i % 2 === 0 ? purple : light);
    spike.position.set((i % 2) * 0.04 - 0.02, y, (i % 3) * 0.03);
    g.add(spike);
    y += 0.08;
  }

  return g;
}

/** Fluffy peony bloom — soft layered spheres. */
function buildPeony(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'garden-peony';

  addStem(g, 0.34);
  addLeaf(g, 0.11, 0.12, 0.06, -0.35);
  addLeaf(g, -0.09, 0.16, -0.05, 0.38);

  const crown = 0.4;
  const colors = [lambert(0xffb7c5), lambert(0xff8fab), lambert(0xfff0f5)];
  const offsets: Array<[number, number, number, number]> = [
    [0, 0, 0, 0.11],
    [0.08, 0.04, 0.05, 0.09],
    [-0.07, 0.06, -0.04, 0.08],
    [0.05, 0.08, -0.07, 0.07],
    [-0.06, 0.02, 0.08, 0.08],
    [0.02, 0.1, 0.02, 0.07],
  ];
  for (let i = 0; i < offsets.length; i++) {
    const [ox, oy, oz, r] = offsets[i];
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(r, 7, 7), colors[i % colors.length]);
    bloom.position.set(ox, crown + oy, oz);
    g.add(bloom);
  }

  return g;
}

/** Pick a garden flower variant by seed (deterministic). */
export function buildGardenFlower(seed: number): THREE.Group {
  switch (seed % 5) {
    case 0:
      return buildRose();
    case 1:
      return buildTulip(seed);
    case 2:
      return buildDaisy();
    case 3:
      return buildLavender();
    default:
      return buildPeony();
  }
}
