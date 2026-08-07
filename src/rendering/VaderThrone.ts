import * as THREE from 'three';

function lambert(color: number, opts: THREE.MeshLambertMaterialParameters = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/** Obsidian throne behind Darth Vader — tall backrest, faint red glow. */
export function buildVaderThrone(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'vader-throne';

  const stone = lambert(0x14181e);
  const dark = lambert(0x0a0c10);
  const metal = lambert(0x2a3038);
  const red = new THREE.MeshLambertMaterial({
    color: 0x4a1010,
    emissive: 0xaa1010,
    emissiveIntensity: 0.45,
  });

  // Base plinth
  const base = box(2.2, 0.35, 1.8, stone);
  base.position.y = 0.18;
  g.add(base);

  const step = box(1.8, 0.2, 1.4, dark);
  step.position.y = 0.42;
  g.add(step);

  // Seat
  const seat = box(1.35, 0.28, 1.1, stone);
  seat.position.set(0, 0.7, 0.05);
  g.add(seat);

  // Tall backrest
  const back = box(1.5, 2.4, 0.28, dark);
  back.position.set(0, 1.85, 0.55);
  g.add(back);

  // Spire / crown
  const spire = box(0.9, 0.55, 0.22, metal);
  spire.position.set(0, 3.2, 0.55);
  g.add(spire);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 6), red);
  tip.position.set(0, 3.65, 0.55);
  g.add(tip);

  // Armrests
  for (const side of [-1, 1]) {
    const arm = box(0.22, 0.55, 1.0, stone);
    arm.position.set(side * 0.7, 1.05, 0);
    g.add(arm);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), red);
    knob.position.set(side * 0.7, 1.35, -0.4);
    g.add(knob);
  }

  // Vertical red slits in backrest
  for (const sx of [-0.35, 0, 0.35]) {
    const slit = box(0.08, 1.6, 0.06, red);
    slit.position.set(sx, 1.9, 0.42);
    g.add(slit);
  }

  return g;
}
