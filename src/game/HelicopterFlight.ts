import * as THREE from 'three';
import type { World } from './World';

const MAX_HORIZONTAL = 30;
const MAX_HORIZONTAL_GROUND = 8;
const ACCEL = 32;
const ACCEL_GROUND = 14;
const DRAG_AIR = 0.75;
const DRAG_GROUND = 2.4;
const TURN_RATE_FAST = 1.15;
const TURN_RATE_SLOW = 2.2;
const BANK_MAX = 0.42;
const BANK_LERP = 5;
const VERTICAL_THRUST = 26;
const DESCEND_THRUST = 30;
const GRAVITY = 11;
const HOVER_LIFT = 10.2;
const MAX_ALTITUDE = 52;
const HALF_W = 1.1;
const HALF_L = 2.4;
const BODY_HEIGHT = 1.9;
const GROUND_CLEARANCE = 0.08;
/** Max AGL to allow player exit (≈ one heli height). */
export const HELI_EXIT_MAX_AGL = 3.5;
const SETTLE_DESCENT = 4.5;

export interface HeliFlightInput {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

/**
 * Atmospheric helicopter physics over the voxel world (GTA-style).
 * Space = climb, Shift = descend; WASD = forward/back + yaw.
 */
export class HelicopterFlight {
  x = 0;
  y = 3.01;
  z = 0;
  yaw = 0;
  roll = 0;
  private speed = 0;
  private velY = 0;
  private grounded = true;
  private settling = false;
  private cachedGroundY = 3.01;

  reset(x: number, y: number, z: number, yaw: number): void {
    this.x = x;
    this.y = y;
    this.z = z;
    this.yaw = yaw;
    this.roll = 0;
    this.speed = 0;
    this.velY = 0;
    this.grounded = true;
    this.settling = false;
    this.cachedGroundY = y;
  }

  getSpeed(): number {
    return this.speed;
  }

  isGrounded(): boolean {
    return this.grounded;
  }

  isSettling(): boolean {
    return this.settling;
  }

  getAltitudeAboveGround(world: World): number {
    this.cachedGroundY = this.averageGroundY(world);
    return Math.max(0, this.y - this.cachedGroundY);
  }

  canExit(world: World): boolean {
    return this.getAltitudeAboveGround(world) <= HELI_EXIT_MAX_AGL;
  }

  /** After player exits while slightly airborne — soft land the empty heli. */
  beginSettleAfterExit(): void {
    if (this.grounded) {
      this.settling = false;
      this.speed = 0;
      this.velY = 0;
      return;
    }
    this.settling = true;
    this.speed *= 0.35;
    if (this.velY > 0) this.velY = 0;
  }

  cancelSettle(): void {
    this.settling = false;
  }

  /** Rotor intensity 0–1 for mesh animation. */
  getRotorIntensity(): number {
    if (this.settling) return 0.35;
    if (!this.grounded) return 0.85 + Math.min(0.15, Math.abs(this.speed) / MAX_HORIZONTAL);
    if (Math.abs(this.speed) > 0.2 || Math.abs(this.velY) > 0.2) return 0.55;
    return 0.12;
  }

  update(dt: number, input: HeliFlightInput, world: World, active: boolean): void {
    if (this.settling) {
      this.updateSettle(dt, world);
      return;
    }

    const maxHoriz = this.grounded ? MAX_HORIZONTAL_GROUND : MAX_HORIZONTAL;
    const accel = this.grounded ? ACCEL_GROUND : ACCEL;
    const drag = this.grounded ? DRAG_GROUND : DRAG_AIR;
    const speedRatio = Math.min(1, Math.abs(this.speed) / MAX_HORIZONTAL);
    const turnRate = TURN_RATE_SLOW + (TURN_RATE_FAST - TURN_RATE_SLOW) * speedRatio;

    if (active) {
      if (input.left) this.yaw += turnRate * dt;
      if (input.right) this.yaw -= turnRate * dt;

      const bankScale = 0.35 + 0.65 * speedRatio;
      const targetBank =
        ((input.left ? BANK_MAX : 0) + (input.right ? -BANK_MAX : 0)) * bankScale;
      this.roll += (targetBank - this.roll) * Math.min(1, BANK_LERP * dt);

      let throttle = 0;
      if (input.forward) throttle += 1;
      if (input.back) throttle -= 0.65;

      if (throttle !== 0) {
        this.speed += throttle * accel * dt;
      } else {
        this.speed *= Math.max(0, 1 - drag * dt);
      }
      if (this.speed > maxHoriz) this.speed = maxHoriz;
      if (this.speed < -maxHoriz * 0.45) this.speed = -maxHoriz * 0.45;

      if (input.up) {
        this.velY += VERTICAL_THRUST * dt;
        this.grounded = false;
      } else if (input.down) {
        this.velY -= DESCEND_THRUST * dt;
      } else if (!this.grounded) {
        // Near-hover: slight sink when no vertical input
        this.velY += (HOVER_LIFT - GRAVITY) * dt;
        this.velY *= Math.max(0, 1 - 1.2 * dt);
      } else if (!input.up) {
        this.velY = 0;
      }
    } else {
      this.speed *= Math.max(0, 1 - drag * dt);
      if (!this.grounded) this.velY -= GRAVITY * 0.55 * dt;
      this.roll += (0 - this.roll) * Math.min(1, BANK_LERP * dt);
    }

    this.velY = Math.max(-26, Math.min(22, this.velY));

    const moveX = -Math.sin(this.yaw) * this.speed * dt;
    const moveZ = -Math.cos(this.yaw) * this.speed * dt;
    this.moveHorizontal(moveX, moveZ, world);

    this.y += this.velY * dt;
    this.clampToGroundAndCeiling(world);
    this.clampMapBounds(world);
  }

  /** Empty-heli soft land after player exit. */
  updateSettle(dt: number, world: World): void {
    if (!this.settling) return;

    this.speed *= Math.max(0, 1 - 3.5 * dt);
    if (Math.abs(this.speed) < 0.15) this.speed = 0;
    this.roll += (0 - this.roll) * Math.min(1, BANK_LERP * dt);

    this.velY = -SETTLE_DESCENT;
    const moveX = -Math.sin(this.yaw) * this.speed * dt;
    const moveZ = -Math.cos(this.yaw) * this.speed * dt;
    this.moveHorizontal(moveX, moveZ, world);

    this.y += this.velY * dt;
    this.clampToGroundAndCeiling(world);
    this.clampMapBounds(world);

    if (this.grounded) {
      this.settling = false;
      this.speed = 0;
      this.velY = 0;
    }
  }

  private sampleGroundY(world: World, x: number, z: number): number {
    const fx = Math.floor(x);
    const fz = Math.floor(z);
    for (let y = world.height - 1; y >= 0; y--) {
      if (world.isSolidAt(fx, y, fz)) return y + 1 + GROUND_CLEARANCE;
    }
    return GROUND_CLEARANCE;
  }

  private averageGroundY(world: World): number {
    const cos = Math.cos(this.yaw);
    const sin = Math.sin(this.yaw);
    const samples: Array<[number, number]> = [
      [0, 0],
      [-HALF_W * 0.5, -HALF_L * 0.45],
      [HALF_W * 0.5, -HALF_L * 0.45],
      [-HALF_W * 0.5, HALF_L * 0.45],
      [HALF_W * 0.5, HALF_L * 0.45],
    ];
    let sum = 0;
    let count = 0;
    for (const [lx, lz] of samples) {
      const wx = this.x + lx * cos + lz * sin;
      const wz = this.z - lx * sin + lz * cos;
      sum += this.sampleGroundY(world, wx, wz);
      count++;
    }
    return count > 0 ? sum / count : this.y;
  }

  private clampToGroundAndCeiling(world: World): void {
    const groundY = this.averageGroundY(world);
    this.cachedGroundY = groundY;
    if (this.y <= groundY + 0.05) {
      this.y = groundY;
      if (this.velY < 0) this.velY = 0;
      this.grounded = true;
      if (Math.abs(this.speed) < 0.35) this.speed = 0;
    } else {
      this.grounded = false;
    }

    const ceiling = groundY + MAX_ALTITUDE;
    if (this.y > ceiling) {
      this.y = ceiling;
      if (this.velY > 0) this.velY = 0;
    }
  }

  private clampMapBounds(world: World): void {
    const b = world.bounds();
    const pad = 2.5;
    if (this.x < b.minX + pad) this.x = b.minX + pad;
    if (this.x > b.maxX - pad) this.x = b.maxX - pad;
    if (this.z < b.minZ + pad) this.z = b.minZ + pad;
    if (this.z > b.maxZ - pad) this.z = b.maxZ - pad;
  }

  /**
   * Above the voxel column, World.getBlock returns STONE for OOB Y —
   * skip / clip collision so high-altitude flight still moves.
   */
  private bodyCollides(world: World): boolean {
    const bodyMinY = this.y + 0.2;
    if (bodyMinY >= world.height) return false;

    const bodyMaxY = Math.min(this.y + BODY_HEIGHT, world.height - 1e-3);
    if (bodyMaxY <= bodyMinY) return false;

    return world.vehicleBodyCollides(
      this.x - HALF_W,
      this.x + HALF_W,
      this.z - HALF_L,
      this.z + HALF_L,
      bodyMinY,
      bodyMaxY,
    );
  }

  private moveHorizontal(deltaX: number, deltaZ: number, world: World): void {
    if (deltaX !== 0) {
      const ox = this.x;
      this.x = ox + deltaX;
      if (this.bodyCollides(world)) {
        this.x = ox;
        // Kill only the sideways component of scalar speed softly
        this.speed *= 0.72;
      }
    }
    if (deltaZ !== 0) {
      const oz = this.z;
      this.z = oz + deltaZ;
      if (this.bodyCollides(world)) {
        this.z = oz;
        this.speed *= 0.72;
      }
    }
  }

  applyMeshTransform(mesh: THREE.Object3D): void {
    mesh.position.set(this.x, this.y, this.z);
    mesh.rotation.order = 'YXZ';
    mesh.rotation.y = this.yaw;
    mesh.rotation.x = 0;
    mesh.rotation.z = this.roll;
  }

  syncChaseCamera(
    camera: THREE.PerspectiveCamera,
    chasePos: THREE.Vector3,
    chaseLook: THREE.Vector3,
    chaseIdeal: THREE.Vector3,
    initialized: { value: boolean },
    dt: number,
  ): void {
    const speedBlend = Math.min(1, Math.abs(this.speed) / MAX_HORIZONTAL);
    const dist = 11 + speedBlend * 3.5;
    const height = 5.2 + speedBlend * 1.2;
    const lookAhead = 5 + speedBlend * 4;

    chaseIdeal.set(
      this.x + Math.sin(this.yaw) * dist + Math.cos(this.yaw) * this.roll * 2.2,
      this.y + height,
      this.z + Math.cos(this.yaw) * dist - Math.sin(this.yaw) * this.roll * 2.2,
    );
    if (!initialized.value) {
      chasePos.copy(chaseIdeal);
      initialized.value = true;
    } else {
      const t = 1 - Math.exp(-7 * dt);
      chasePos.lerp(chaseIdeal, t);
    }
    chaseLook.set(
      this.x - Math.sin(this.yaw) * lookAhead,
      this.y + 1.0 + speedBlend * 0.4,
      this.z - Math.cos(this.yaw) * lookAhead,
    );
    camera.position.copy(chasePos);
    camera.lookAt(chaseLook);
  }
}
