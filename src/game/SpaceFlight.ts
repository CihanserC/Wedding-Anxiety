import * as THREE from 'three';
import { PLANETS, type PlanetDefinition } from '../data/planets';
import { createSpaceFighter, type SpaceFighterHandle } from '../rendering/SpaceFighter';
import { buildSpacePlanet } from '../rendering/SpacePlanet';

const LAND_DISTANCE = 48;
const MAX_SPEED = 70;
const MAX_BOOST = 120;
const ACCEL = 48;
const DRAG = 0.55;
const TURN_RATE = 1.35;
const BANK_MAX = 0.55;
const BANK_LERP = 5;
const PITCH_MIN = -0.85;
const PITCH_MAX = 0.85;
const VERTICAL_THRUST = 38;
const STAR_COUNT = 2800;

export interface SpaceFlightCallbacks {
  onNearPlanet: (planet: PlanetDefinition | null) => void;
}

/**
 * Star-field flight with inertial starfighter controls.
 * Owns its own Three.js group; camera is driven externally via syncCamera.
 */
export class SpaceFlight {
  readonly group = new THREE.Group();
  private readonly ship = new THREE.Group();
  private fighter: SpaceFighterHandle | null = null;
  private readonly planets = new Map<string, THREE.Object3D>();
  private stars: THREE.Points | null = null;
  private yaw = 0;
  private pitch = 0;
  private roll = 0;
  private throttle = 0;
  private readonly velocity = new THREE.Vector3();
  private nearestPlanet: PlanetDefinition | null = null;
  private readonly tmpForward = new THREE.Vector3();
  private readonly tmpRight = new THREE.Vector3();
  private readonly tmpUp = new THREE.Vector3();
  private active = false;

  constructor(private readonly callbacks: SpaceFlightCallbacks) {
    this.group.name = 'space-flight';
    this.buildStars();
    this.buildShip();
    this.buildPlanets();
    this.group.visible = false;
  }

  private buildStars(): void {
    const positions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 400 + Math.random() * 900;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.6,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.9,
    });
    this.stars = new THREE.Points(geo, mat);
    this.group.add(this.stars);
  }

  private buildShip(): void {
    this.fighter = createSpaceFighter();
    this.ship.add(this.fighter.root);
    this.ship.position.set(0, 0, 0);
    this.group.add(this.ship);
  }

  private buildPlanets(): void {
    for (const planet of PLANETS) {
      const mesh = buildSpacePlanet(planet);
      mesh.position.set(planet.spacePosition.x, planet.spacePosition.y, planet.spacePosition.z);
      this.group.add(mesh);
      this.planets.set(planet.id, mesh);
    }

    const ambient = new THREE.AmbientLight(0x8899bb, 0.55);
    const sun = new THREE.DirectionalLight(0xffe8c0, 0.9);
    sun.position.set(80, 120, 60);
    this.group.add(ambient, sun);
  }

  enter(): void {
    this.active = true;
    this.group.visible = true;
    this.ship.position.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;
    this.throttle = 0;
    this.velocity.set(0, 0, 0);
    this.nearestPlanet = null;
    this.fighter?.setEngineIntensity(0.2);
    this.callbacks.onNearPlanet(null);
  }

  exit(): void {
    this.active = false;
    this.group.visible = false;
    this.nearestPlanet = null;
    this.velocity.set(0, 0, 0);
    this.callbacks.onNearPlanet(null);
  }

  isActive(): boolean {
    return this.active;
  }

  getShipPosition(): THREE.Vector3 {
    return this.ship.position.clone();
  }

  getNearestPlanet(): PlanetDefinition | null {
    return this.nearestPlanet;
  }

  /** Place ship near a planet (used when returning from surface). */
  warpNearPlanet(planetId: string): void {
    const planet = PLANETS.find((p) => p.id === planetId);
    if (!planet) return;
    const p = planet.spacePosition;
    this.ship.position.set(p.x + 60, p.y + 20, p.z + 60);
    this.yaw = Math.atan2(-(p.x - this.ship.position.x), -(p.z - this.ship.position.z));
    this.pitch = 0;
    this.roll = 0;
    this.velocity.set(0, 0, 0);
    this.throttle = 0;
  }

  update(
    dt: number,
    input: {
      forward: boolean;
      back: boolean;
      left: boolean;
      right: boolean;
      boost: boolean;
      up: boolean;
      down: boolean;
      mouseDx: number;
      mouseDy: number;
      sens: number;
    },
  ): void {
    if (!this.active) return;

    this.yaw -= input.mouseDx * input.sens;
    this.pitch -= input.mouseDy * input.sens;
    this.pitch = Math.max(PITCH_MIN, Math.min(PITCH_MAX, this.pitch));

    // A/D = yaw turn + bank (no lateral strafe)
    if (input.left) this.yaw += TURN_RATE * dt;
    if (input.right) this.yaw -= TURN_RATE * dt;

    const targetBank =
      (input.left ? BANK_MAX : 0) + (input.right ? -BANK_MAX : 0) + input.mouseDx * input.sens * 18;
    const clampedBank = Math.max(-BANK_MAX, Math.min(BANK_MAX, targetBank));
    this.roll += (clampedBank - this.roll) * Math.min(1, BANK_LERP * dt);

    // Throttle coast
    let throttleInput = 0;
    if (input.forward) throttleInput += 1;
    if (input.back) throttleInput -= 0.55;
    const maxSpeed = input.boost ? MAX_BOOST : MAX_SPEED;
    const targetThrottle = throttleInput * maxSpeed;
    this.throttle += (targetThrottle - this.throttle) * Math.min(1, ACCEL * 0.04 * dt * 60);

    this.tmpForward.set(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    this.tmpRight.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.tmpUp.crossVectors(this.tmpRight, this.tmpForward).normalize();

    // Accelerate along look direction
    this.velocity.addScaledVector(this.tmpForward, this.throttle * ACCEL * 0.02 * dt * 60);

    // Vertical thrusters
    if (input.up) this.velocity.y += VERTICAL_THRUST * dt;
    if (input.down) this.velocity.y -= VERTICAL_THRUST * dt;

    // Space drag — coast, don't stop instantly
    const dragFactor = Math.max(0, 1 - DRAG * dt);
    this.velocity.multiplyScalar(dragFactor);

    // Soft speed cap
    const speed = this.velocity.length();
    const hardCap = maxSpeed * 1.15;
    if (speed > hardCap) this.velocity.multiplyScalar(hardCap / speed);

    this.ship.position.addScaledVector(this.velocity, dt);

    this.ship.rotation.order = 'YXZ';
    this.ship.rotation.y = this.yaw;
    this.ship.rotation.x = this.pitch;
    this.ship.rotation.z = this.roll;

    const enginePower = Math.min(
      1,
      Math.abs(this.throttle) / MAX_SPEED + (input.boost ? 0.35 : 0) + speed / (MAX_BOOST * 2),
    );
    this.fighter?.setEngineIntensity(enginePower);

    if (this.stars) {
      this.stars.rotation.y += dt * 0.004;
    }

    for (const mesh of this.planets.values()) {
      const spin = (mesh.userData.spinSpeed as number | undefined) ?? 0.08;
      const body = mesh.userData.spinBody as THREE.Object3D | undefined;
      if (body) body.rotation.y += dt * spin;
      else mesh.rotation.y += dt * spin;
    }

    this.updateNearestPlanet();
  }

  private updateNearestPlanet(): void {
    let best: PlanetDefinition | null = null;
    let bestDist = Infinity;
    for (const planet of PLANETS) {
      const mesh = this.planets.get(planet.id);
      if (!mesh) continue;
      const d = this.ship.position.distanceTo(mesh.position);
      if (d < bestDist) {
        bestDist = d;
        best = planet;
      }
    }
    const near = best && bestDist < LAND_DISTANCE ? best : null;
    if (near?.id !== this.nearestPlanet?.id) {
      this.nearestPlanet = near;
      this.callbacks.onNearPlanet(near);
    } else {
      this.nearestPlanet = near;
    }
  }

  /** Sync FPS camera to ship cockpit / chase. */
  syncCamera(camera: THREE.PerspectiveCamera, chase: boolean): void {
    if (!this.active) return;
    this.tmpForward.set(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    this.tmpRight.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    this.tmpUp.crossVectors(this.tmpRight, this.tmpForward).normalize();

    if (chase) {
      const behind = this.tmpForward.clone().multiplyScalar(-14);
      behind.addScaledVector(this.tmpUp, 3.8);
      // Slight bank-follow for cinematic chase
      behind.addScaledVector(this.tmpRight, this.roll * 2.5);
      camera.position.copy(this.ship.position).add(behind);
      const look = this.ship.position.clone().add(this.tmpForward.clone().multiplyScalar(16));
      look.addScaledVector(this.tmpUp, 0.4);
      camera.lookAt(look);
    } else {
      // Cockpit: just ahead of canopy
      camera.position.copy(this.ship.position);
      camera.position.addScaledVector(this.tmpForward, -0.2);
      camera.position.addScaledVector(this.tmpUp, 0.45);
      const look = this.ship.position.clone().add(this.tmpForward.clone().multiplyScalar(24));
      camera.lookAt(look);
    }
    this.ship.visible = chase;
  }

  dispose(): void {
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }
}
