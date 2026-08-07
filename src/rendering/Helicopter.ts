import * as THREE from 'three';

function lambert(color: number, opts?: THREE.MeshLambertMaterialParameters): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

export const HELI_MAIN_ROTOR = 'heli-main-rotor';
export const HELI_TAIL_ROTOR = 'heli-tail-rotor';
/** Parts that fill the FPS cockpit view — toggled while flying first-person. */
export const HELI_CABIN_HIDE = 'heli-cabin-hide';

export interface HelicopterHandle {
  root: THREE.Group;
  /** Call each frame with 0–1 rotor intensity. */
  setRotorSpeed: (speed: number) => void;
}

function markCabinHide(obj: THREE.Object3D): void {
  obj.name = HELI_CABIN_HIDE;
}

/**
 * Procedural luxury helicopter — dark gold fuselage, glass canopy, spinning rotors.
 * Nose toward -Z. Skids sit near y=0 so pad spawn y≈3.01 looks grounded.
 */
export function createHelicopter(): HelicopterHandle {
  const root = new THREE.Group();
  root.name = 'helicopter';

  const gold = lambert(0xc9a227);
  const goldDeep = lambert(0x8a7018);
  const dark = lambert(0x1a1c22);
  const panel = lambert(0x2c3038);
  const chrome = lambert(0xb8bcc4);
  const glass = lambert(0x88c8e8, { transparent: true, opacity: 0.55 });
  const lightMat = lambert(0xfff0c0, { emissive: 0xffe080, emissiveIntensity: 0.4 });
  const rotorMat = lambert(0x22262e);

  // Fuselage body
  const body = box(1.35, 0.85, 3.4, gold);
  markCabinHide(body);
  body.position.set(0, 0.95, 0.15);
  root.add(body);

  const belly = box(1.2, 0.28, 2.8, goldDeep);
  markCabinHide(belly);
  belly.position.set(0, 0.48, 0.2);
  root.add(belly);

  // Nose taper
  const nose = box(1.05, 0.62, 1.1, gold);
  markCabinHide(nose);
  nose.position.set(0, 0.92, -1.55);
  root.add(nose);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2), glass);
  markCabinHide(canopy);
  canopy.scale.set(1.05, 0.85, 1.35);
  canopy.position.set(0, 1.15, -0.85);
  root.add(canopy);

  const canopyFrame = box(1.15, 0.08, 1.4, dark);
  markCabinHide(canopyFrame);
  canopyFrame.position.set(0, 1.28, -0.75);
  root.add(canopyFrame);

  // Side doors / windows
  for (const side of [-1, 1]) {
    const door = box(0.06, 0.55, 1.1, panel);
    markCabinHide(door);
    door.position.set(side * 0.68, 0.95, 0.15);
    root.add(door);

    const window = box(0.05, 0.28, 0.55, glass);
    markCabinHide(window);
    window.position.set(side * 0.71, 1.05, 0.1);
    root.add(window);

    const stripe = box(0.05, 0.08, 2.6, dark);
    markCabinHide(stripe);
    stripe.position.set(side * 0.62, 0.72, 0.1);
    root.add(stripe);
  }

  // Tail boom
  const boom = box(0.28, 0.28, 2.6, gold);
  boom.position.set(0, 1.15, 2.55);
  root.add(boom);

  const boomFin = box(0.08, 0.85, 0.55, goldDeep);
  boomFin.position.set(0, 1.45, 3.65);
  root.add(boomFin);

  const horizStab = box(1.1, 0.06, 0.35, panel);
  horizStab.position.set(0, 1.15, 3.45);
  root.add(horizStab);

  // Landing skids
  for (const side of [-1, 1]) {
    const skid = box(0.1, 0.08, 3.2, chrome);
    skid.position.set(side * 0.72, 0.08, 0.1);
    root.add(skid);

    const strutF = box(0.08, 0.55, 0.08, chrome);
    strutF.position.set(side * 0.72, 0.35, -0.85);
    root.add(strutF);

    const strutR = box(0.08, 0.55, 0.08, chrome);
    strutR.position.set(side * 0.72, 0.35, 0.95);
    root.add(strutR);
  }

  // Lights
  const noseLight = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.12), lightMat);
  noseLight.position.set(0, 0.72, -2.1);
  root.add(noseLight);

  // Mast + main rotor
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.55, 8), dark);
  markCabinHide(mast);
  mast.position.set(0, 1.65, 0.05);
  root.add(mast);

  const mainRotor = new THREE.Group();
  mainRotor.name = HELI_MAIN_ROTOR;
  mainRotor.position.set(0, 1.95, 0.05);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.12, 10), chrome);
  mainRotor.add(hub);
  for (let i = 0; i < 4; i++) {
    const blade = box(0.22, 0.04, 4.6, rotorMat);
    blade.rotation.y = (i * Math.PI) / 2;
    blade.position.y = 0.02;
    mainRotor.add(blade);
  }
  root.add(mainRotor);

  // Tail rotor
  const tailRotor = new THREE.Group();
  tailRotor.name = HELI_TAIL_ROTOR;
  tailRotor.position.set(0.22, 1.55, 3.7);
  const tailHub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8), chrome);
  tailHub.rotation.z = Math.PI / 2;
  tailRotor.add(tailHub);
  for (let i = 0; i < 3; i++) {
    const blade = box(0.1, 0.9, 0.04, rotorMat);
    blade.rotation.x = (i * Math.PI * 2) / 3;
    blade.position.x = 0.06;
    tailRotor.add(blade);
  }
  root.add(tailRotor);

  let mainAngle = 0;
  let tailAngle = 0;

  const setRotorSpeed = (speed: number): void => {
    const s = Math.max(0, Math.min(1, speed));
    if (s <= 0.001) return; // parked — blades stay still
    const mainRate = 0.08 + s * 1.92;
    const tailRate = 0.12 + s * 2.7;
    mainAngle += mainRate;
    tailAngle += tailRate;
    mainRotor.rotation.y = mainAngle;
    tailRotor.rotation.x = tailAngle;
  };

  root.userData.heliHandle = { root, setRotorSpeed } satisfies HelicopterHandle;
  return { root, setRotorSpeed };
}
