import * as THREE from 'three';

function lambert(color: number, opts: THREE.MeshLambertMaterialParameters = {}) {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

export interface SpaceFighterHandle {
  root: THREE.Group;
  /** Call each frame with 0–1 boost/throttle intensity to drive engine glow. */
  setEngineIntensity: (intensity: number) => void;
}

/**
 * Procedural starfighter — pointed hull, X-wings, engine glow.
 * Used in space flight and on the Dubai landing pad.
 */
export function createSpaceFighter(): SpaceFighterHandle {
  const root = new THREE.Group();
  root.name = 'space-fighter';

  const hull = lambert(0x8a94a4);
  const dark = lambert(0x2a3038);
  const accent = lambert(0x4a90c8);
  const panel = lambert(0x6a7480);
  const glassMat = new THREE.MeshLambertMaterial({
    color: 0x88d8ff,
    transparent: true,
    opacity: 0.55,
    emissive: 0x226688,
    emissiveIntensity: 0.25,
  });

  const engineMats: THREE.MeshBasicMaterial[] = [];

  // Main fuselage (nose toward -Z)
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 3.4), hull);
  body.position.set(0, 0, 0.1);
  root.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.38, 1.1, 8), hull);
  nose.rotation.x = -Math.PI / 2;
  nose.position.set(0, 0, -2.0);
  root.add(nose);

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    glassMat,
  );
  canopy.scale.set(1.1, 0.7, 1.4);
  canopy.position.set(0, 0.35, -0.55);
  root.add(canopy);

  const canopyFrame = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 1.2), dark);
  canopyFrame.position.set(0, 0.28, -0.5);
  root.add(canopyFrame);

  for (const side of [-1, 1]) {
    const intake = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 1.6), panel);
    intake.position.set(side * 0.65, -0.05, 0.2);
    root.add(intake);

    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 2.2), accent);
    stripe.position.set(side * 0.5, 0.2, 0);
    root.add(stripe);
  }

  for (const [sx, sy] of [
    [-1, 1],
    [1, 1],
    [-1, -1],
    [1, -1],
  ] as Array<[number, number]>) {
    const wing = new THREE.Group();
    wing.position.set(sx * 0.45, sy * 0.15, 0.35);
    wing.rotation.z = sx * sy * 0.35;
    wing.rotation.y = sx * -0.08;

    const wingPlate = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.85), hull);
    wingPlate.position.x = sx * 1.1;
    wing.add(wingPlate);

    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.25), dark);
    tip.position.set(sx * 2.25, 0, -0.1);
    wing.add(tip);

    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9, 6), dark);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(sx * 2.15, 0, -0.55);
    wing.add(cannon);

    root.add(wing);
  }

  for (const side of [-1, 1]) {
    const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 1.1, 10), dark);
    nacelle.rotation.x = Math.PI / 2;
    nacelle.position.set(side * 0.45, -0.05, 1.85);
    root.add(nacelle);

    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x44ccff,
      transparent: true,
      opacity: 0.75,
    });
    engineMats.push(glowMat);

    const nozzle = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 10), glowMat);
    nozzle.position.set(side * 0.45, -0.05, 2.45);
    root.add(nozzle);

    const trailMat = new THREE.MeshBasicMaterial({
      color: 0x66e0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    engineMats.push(trailMat);
    const trail = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.9, 8, 1, true), trailMat);
    trail.rotation.x = Math.PI / 2;
    trail.position.set(side * 0.45, -0.05, 2.95);
    root.add(trail);
  }

  const centerGlow = new THREE.MeshBasicMaterial({
    color: 0x88eeff,
    transparent: true,
    opacity: 0.55,
  });
  engineMats.push(centerGlow);
  const centerEng = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 10), centerGlow);
  centerEng.position.set(0, -0.12, 2.2);
  root.add(centerEng);

  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 6), dark);
  antenna.position.set(0.15, 0.55, -0.2);
  root.add(antenna);
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), accent);
  tip.position.set(0.15, 0.9, -0.2);
  root.add(tip);

  const belly = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 1.8), panel);
  belly.position.set(0, -0.32, 0.2);
  root.add(belly);

  const setEngineIntensity = (intensity: number): void => {
    const t = Math.max(0, Math.min(1, intensity));
    for (const mat of engineMats) {
      mat.opacity = 0.25 + t * 0.75;
      mat.color.setHex(t > 0.65 ? 0xffaa66 : 0x44ccff);
    }
  };

  setEngineIntensity(0.2);

  return { root, setEngineIntensity };
}
