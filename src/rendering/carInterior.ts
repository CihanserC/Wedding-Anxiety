import * as THREE from 'three';

function lambert(color: number, opts?: THREE.MeshLambertMaterialParameters): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/**
 * First-person cabin viewmodel — steering wheel, dash, and a gold hood lip
 * at the bottom of the frame (classic FPS driving look).
 */
export function buildCarInteriorViewmodel(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'car-interior';

  const gold = lambert(0xffd700);
  const goldDeep = lambert(0xd4a017);
  const black = lambert(0x1a1a1e);
  const leather = lambert(0x2a2a30);
  const chrome = lambert(0xc8c8d0);
  const screen = lambert(0x1a3040, { emissive: 0x204060, emissiveIntensity: 0.4 });

  // Hood lip — sits low in the FOV so the real chassis hood reads with it
  const hood = box(1.6, 0.08, 0.85, gold);
  hood.position.set(0, -0.72, -1.15);
  hood.rotation.x = 0.12;
  g.add(hood);

  const hoodTip = box(1.35, 0.05, 0.28, goldDeep);
  hoodTip.position.set(0, -0.68, -1.55);
  hoodTip.rotation.x = 0.18;
  g.add(hoodTip);

  // Dashboard
  const dash = box(1.45, 0.14, 0.5, leather);
  dash.position.set(0, -0.48, -0.62);
  g.add(dash);

  const dashFace = box(1.4, 0.2, 0.07, black);
  dashFace.position.set(0, -0.36, -0.4);
  g.add(dashFace);

  // Instrument cluster
  const cluster = box(0.42, 0.16, 0.05, screen);
  cluster.position.set(0, -0.3, -0.38);
  g.add(cluster);

  const goldTrim = box(0.46, 0.02, 0.02, gold);
  goldTrim.position.set(0, -0.2, -0.37);
  g.add(goldTrim);

  // Turbo gauge — glows orange when Shift is held
  const turboGauge = box(0.14, 0.06, 0.03, lambert(0x2a1810));
  turboGauge.name = 'turbo-gauge-bg';
  turboGauge.position.set(0.22, -0.32, -0.37);
  g.add(turboGauge);

  const turboFill = box(0.1, 0.04, 0.02, lambert(0xff6600, { emissive: 0xff4400, emissiveIntensity: 0.2 }));
  turboFill.name = 'turbo-gauge-fill';
  turboFill.position.set(0.22, -0.32, -0.355);
  g.add(turboFill);

  const turboLabel = box(0.08, 0.02, 0.01, gold);
  turboLabel.position.set(0.22, -0.26, -0.36);
  g.add(turboLabel);

  // Steering column
  const column = box(0.07, 0.07, 0.32, chrome);
  column.position.set(0, -0.42, -0.48);
  column.rotation.x = 0.42;
  g.add(column);

  // Steering wheel — prominent in center-lower view
  const wheel = new THREE.Group();
  wheel.name = 'steering-wheel';
  wheel.position.set(0, -0.22, -0.32);
  wheel.rotation.x = 0.35;

  const rimSegs = 16;
  const rimR = 0.26;
  for (let i = 0; i < rimSegs; i++) {
    const a = (i / rimSegs) * Math.PI * 2;
    const seg = box(0.08, 0.04, 0.04, black);
    seg.position.set(Math.cos(a) * rimR, Math.sin(a) * rimR, 0);
    seg.rotation.z = a;
    wheel.add(seg);
  }

  const hub = box(0.11, 0.11, 0.045, goldDeep);
  wheel.add(hub);

  for (const angle of [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5]) {
    const spoke = box(0.2, 0.035, 0.03, chrome);
    spoke.position.set(Math.cos(angle) * 0.11, Math.sin(angle) * 0.11, 0);
    spoke.rotation.z = angle;
    wheel.add(spoke);
  }

  const centerGold = box(0.055, 0.055, 0.03, gold);
  centerGold.position.set(0, 0, 0.025);
  wheel.add(centerGold);

  g.add(wheel);

  // Light A-pillars
  for (const side of [-1, 1]) {
    const pillar = box(0.035, 0.5, 0.035, black);
    pillar.position.set(side * 0.78, -0.08, -0.9);
    pillar.rotation.z = side * 0.14;
    pillar.rotation.x = -0.12;
    g.add(pillar);
  }

  // Door sills
  for (const side of [-1, 1]) {
    const door = box(0.07, 0.16, 0.65, leather);
    door.position.set(side * 0.62, -0.58, -0.5);
    g.add(door);
  }

  return g;
}
