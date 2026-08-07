import * as THREE from 'three';

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/** Classic saucer — shared by Dubai landing pad and space flight. */
export function createUfoShip(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'ufo';

  const hull = lambert(0xb8c0cc);
  const dark = lambert(0x3a4250);
  const rim = lambert(0x8a94a4);
  const glow = new THREE.MeshBasicMaterial({
    color: 0x66ffe0,
    transparent: true,
    opacity: 0.85,
  });
  const domeGlass = new THREE.MeshLambertMaterial({
    color: 0xa8e8ff,
    transparent: true,
    opacity: 0.55,
  });

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.45, 28), hull);
  disc.position.y = 1.35;
  g.add(disc);

  const underside = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 0.35, 24), dark);
  underside.position.y = 1.05;
  g.add(underside);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.08, 8, 36), rim);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.35;
  g.add(ring);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1.05, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2),
    domeGlass,
  );
  dome.position.y = 1.55;
  g.add(dome);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), glow);
  cockpit.position.y = 1.85;
  g.add(cockpit);

  const lightColors = [0x66ffe0, 0xff66aa, 0xffe066, 0x66aaff];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: lightColors[i % lightColors.length] }),
    );
    light.position.set(Math.cos(angle) * 2.35, 1.2, Math.sin(angle) * 2.35);
    g.add(light);
  }

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + 0.4;
    const leg = box(0.1, 0.7, 0.1, dark);
    leg.position.set(Math.cos(angle) * 1.5, 0.45, Math.sin(angle) * 1.5);
    leg.rotation.z = Math.cos(angle) * 0.25;
    leg.rotation.x = -Math.sin(angle) * 0.25;
    g.add(leg);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 10), rim);
    pad.position.set(Math.cos(angle) * 1.65, 0.08, Math.sin(angle) * 1.65);
    g.add(pad);
  }

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 1.4, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x66ffe0,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  beam.position.y = 0.35;
  beam.rotation.x = Math.PI;
  g.add(beam);

  return g;
}
