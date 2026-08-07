import * as THREE from 'three';

function lambert(color: number, opts: THREE.MeshLambertMaterialParameters = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/**
 * Darth Vader's TIE Advanced x1 — decorative park mesh for the lava planet.
 * Central ball cockpit, bent hexagonal solar wings (reference silhouette).
 */
export function createTieAdvanced(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'tie-advanced';

  const hull = lambert(0xa8b0b8);
  const dark = lambert(0x1a1e24);
  const panel = lambert(0x2a3038);
  const wingFace = lambert(0x12161c);
  const rim = lambert(0x6a727c);
  const redGlow = new THREE.MeshBasicMaterial({ color: 0xff2020 });
  const glass = new THREE.MeshLambertMaterial({
    color: 0x1a1010,
    emissive: 0x330808,
    emissiveIntensity: 0.35,
  });

  // Central spherical cockpit
  const pod = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 16), hull);
  pod.position.y = 1.1;
  g.add(pod);

  const podBand = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.06, 8, 28), rim);
  podBand.rotation.x = Math.PI / 2;
  podBand.position.y = 1.1;
  g.add(podBand);

  // Front viewport with lattice spokes
  const viewport = new THREE.Mesh(new THREE.CircleGeometry(0.42, 20), glass);
  viewport.position.set(0, 1.15, -0.78);
  g.add(viewport);

  for (let i = 0; i < 6; i++) {
    const spoke = box(0.04, 0.78, 0.02, dark);
    spoke.position.set(0, 1.15, -0.8);
    spoke.rotation.z = (i / 6) * Math.PI;
    g.add(spoke);
  }

  const viewportRing = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.035, 6, 24), rim);
  viewportRing.position.set(0, 1.15, -0.79);
  g.add(viewportRing);

  // Red sensors under the viewport
  for (const sx of [-0.22, 0.22]) {
    const sensor = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), redGlow);
    sensor.position.set(sx, 0.78, -0.72);
    g.add(sensor);
  }

  // Rear thruster dish
  const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.25, 14), dark);
  thruster.rotation.x = Math.PI / 2;
  thruster.position.set(0, 1.05, 0.78);
  g.add(thruster);
  const thrusterGlow = new THREE.Mesh(
    new THREE.CircleGeometry(0.28, 12),
    new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.55 }),
  );
  thrusterGlow.position.set(0, 1.05, 0.92);
  g.add(thrusterGlow);

  // Side pylons + bent hexagonal wings
  for (const side of [-1, 1] as const) {
    const pylon = box(1.35, 0.28, 0.38, panel);
    pylon.position.set(side * 1.35, 1.1, 0);
    g.add(pylon);

    const wing = buildBentWing(wingFace, dark, rim);
    wing.position.set(side * 2.35, 1.1, 0);
    wing.scale.x = side;
    g.add(wing);
  }

  // Landing skids
  for (const side of [-1, 1]) {
    const skid = box(0.12, 0.55, 0.12, dark);
    skid.position.set(side * 0.45, 0.35, 0.15);
    skid.rotation.z = side * 0.2;
    g.add(skid);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.16, 0.06, 8), rim);
    pad.position.set(side * 0.55, 0.05, 0.15);
    g.add(pad);
  }

  return g;
}

function buildBentWing(
  face: THREE.Material,
  dark: THREE.Material,
  rim: THREE.Material,
): THREE.Group {
  const wing = new THREE.Group();

  // Main solar panel (tall hex-ish silhouette via stacked boxes)
  const main = box(0.12, 2.6, 1.55, face);
  wing.add(main);

  // Bent top / bottom flanges (inward fold)
  const topFlange = box(0.1, 0.55, 1.35, face);
  topFlange.position.set(-0.25, 1.45, 0);
  topFlange.rotation.z = 0.55;
  wing.add(topFlange);

  const botFlange = box(0.1, 0.55, 1.35, face);
  botFlange.position.set(-0.25, -1.45, 0);
  botFlange.rotation.z = -0.55;
  wing.add(botFlange);

  // Vertical solar ridges
  for (let i = -3; i <= 3; i++) {
    const ridge = box(0.04, 2.4, 0.06, dark);
    ridge.position.set(0.08, 0, i * 0.2);
    wing.add(ridge);
  }

  // Outer frame edges
  const edgeTop = box(0.08, 0.08, 1.6, rim);
  edgeTop.position.set(0.02, 1.28, 0);
  wing.add(edgeTop);
  const edgeBot = box(0.08, 0.08, 1.6, rim);
  edgeBot.position.set(0.02, -1.28, 0);
  wing.add(edgeBot);

  return wing;
}
