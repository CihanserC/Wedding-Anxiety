import * as THREE from 'three';

function lambert(color: number, opts?: THREE.MeshLambertMaterialParameters): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/** Parts that block the camera in first-person — toggled while driving. */
export const LAMBORGHINI_CABIN_HIDE = 'lambo-cabin-hide';

/**
 * Voxel Lamborghini-style supercar — low wedge body, gold paint, black glass.
 * ~4.5 blocks long to match other vehicle props.
 */
export function buildLamborghini(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'lamborghini';

  const gold = lambert(0xffd700);
  const goldDeep = lambert(0xd4a017);
  const black = lambert(0x1a1a1e);
  const glass = lambert(0x101820, { transparent: true, opacity: 0.75 });
  const chrome = lambert(0xc8c8d0);
  const tire = lambert(0x0c0c10);
  const lightMat = lambert(0xfff0c0, { emissive: 0xffe080, emissiveIntensity: 0.45 });
  const rearLight = lambert(0xff2020, { emissive: 0xff1010, emissiveIntensity: 0.55 });

  // Main wedge body (long along Z, nose toward -Z) — stays visible in FPS
  const chassis = box(1.85, 0.28, 4.2, gold);
  chassis.name = 'lambo-chassis';
  chassis.position.set(0, 0.42, 0);
  g.add(chassis);

  const lower = box(1.75, 0.18, 4.0, goldDeep);
  lower.position.set(0, 0.22, 0.05);
  g.add(lower);

  // Cabin / roof scoop
  const cabin = box(1.55, 0.32, 1.7, gold);
  cabin.name = LAMBORGHINI_CABIN_HIDE;
  cabin.position.set(0, 0.68, 0.15);
  g.add(cabin);

  // Sloped windshield
  const windshield = box(1.4, 0.28, 0.9, glass);
  windshield.name = LAMBORGHINI_CABIN_HIDE;
  windshield.position.set(0, 0.72, -0.75);
  windshield.rotation.x = -0.45;
  g.add(windshield);

  // Side windows
  for (const side of [-1, 1]) {
    const win = box(0.06, 0.22, 1.2, glass);
    win.name = LAMBORGHINI_CABIN_HIDE;
    win.position.set(side * 0.82, 0.7, 0.1);
    g.add(win);
  }

  // Rear glass / engine cover
  const rearGlass = box(1.35, 0.12, 0.7, glass);
  rearGlass.name = LAMBORGHINI_CABIN_HIDE;
  rearGlass.position.set(0, 0.78, 1.05);
  rearGlass.rotation.x = 0.25;
  g.add(rearGlass);

  // Front splitter
  const splitter = box(1.9, 0.06, 0.45, black);
  splitter.position.set(0, 0.18, -2.05);
  g.add(splitter);

  // Nose tip
  const nose = box(1.5, 0.16, 0.5, gold);
  nose.position.set(0, 0.32, -1.95);
  g.add(nose);

  // Headlights
  for (const side of [-1, 1]) {
    const hl = box(0.28, 0.1, 0.12, lightMat);
    hl.position.set(side * 0.55, 0.38, -2.12);
    g.add(hl);
  }

  // Rear diffuser + lights
  const diffuser = box(1.7, 0.14, 0.35, black);
  diffuser.position.set(0, 0.2, 2.05);
  g.add(diffuser);

  for (const side of [-1, 1]) {
    const rl = box(0.4, 0.08, 0.08, rearLight);
    rl.name = 'lambo-tail-light';
    rl.position.set(side * 0.55, 0.48, 2.12);
    g.add(rl);
  }

  // Rear wing
  const wing = box(1.7, 0.06, 0.35, black);
  wing.name = LAMBORGHINI_CABIN_HIDE;
  wing.userData.lamboWing = true;
  wing.position.set(0, 0.95, 1.55);
  g.add(wing);
  for (const side of [-1, 1]) {
    const strut = box(0.06, 0.22, 0.08, chrome);
    strut.name = LAMBORGHINI_CABIN_HIDE;
    strut.position.set(side * 0.55, 0.82, 1.55);
    g.add(strut);
  }

  // Side scoops
  for (const side of [-1, 1]) {
    const scoop = box(0.12, 0.22, 0.7, black);
    scoop.position.set(side * 0.95, 0.48, 0.35);
    g.add(scoop);
  }

  // Wheels — wider rears
  const wheels: Array<[number, number, number, number]> = [
    [-0.95, 0.28, -1.25, 0.55],
    [0.95, 0.28, -1.25, 0.55],
    [-1.0, 0.3, 1.35, 0.65],
    [1.0, 0.3, 1.35, 0.65],
  ];
  for (const [wx, wy, wz, size] of wheels) {
    const rim = box(size * 0.35, size, size, tire);
    rim.position.set(wx, wy, wz);
    g.add(rim);
    const hub = box(size * 0.18, size * 0.55, size * 0.55, chrome);
    hub.position.set(wx, wy, wz);
    g.add(hub);
  }

  // Exhaust tips
  for (const side of [-1, 1]) {
    const ex = box(0.12, 0.1, 0.18, chrome);
    ex.name = 'lambo-exhaust';
    ex.position.set(side * 0.35, 0.22, 2.2);
    g.add(ex);
  }

  return g;
}
