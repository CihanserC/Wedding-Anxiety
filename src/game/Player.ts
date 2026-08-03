import * as THREE from 'three';
import type { InputManager } from '../input/InputManager';
import type { World } from './World';
import { PlayerRig } from '../entities/PlayerRig';

const PLAYER_RADIUS = 0.35;
const PLAYER_HEIGHT = 1.75;
const EYE_HEIGHT = 1.55;
const WALK_SPEED = 4.5;
const SPRINT_SPEED = 7.5;
const JUMP_SPEED = 7.5;
const GRAVITY = 22;
const MOUSE_SENSITIVITY = 0.0022;
const MAX_PITCH = Math.PI / 2 - 0.05;

export class Player {
  readonly camera: THREE.PerspectiveCamera;
  readonly position: THREE.Vector3;
  readonly rig: PlayerRig;
  private velocity = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private onGround = false;
  private world: World;
  private readonly input: InputManager;

  constructor(world: World, input: InputManager, aspect: number) {
    this.world = world;
    this.input = input;
    this.camera = new THREE.PerspectiveCamera(75, aspect, 0.05, 450);
    const spawn = world.playerSpawn();
    this.position = new THREE.Vector3(spawn.x, spawn.y, spawn.z);
    this.yaw = world.spawnFacing;
    this.camera.rotation.order = 'YXZ';
    this.rig = new PlayerRig();
    this.rig.attachTo(this.camera);
    this.syncCamera();
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  setWorld(world: World): void {
    this.world = world;
  }

  respawn(): void {
    const spawn = this.world.playerSpawn();
    this.position.set(spawn.x, spawn.y, spawn.z);
    this.velocity.set(0, 0, 0);
    this.yaw = this.world.spawnFacing;
    this.pitch = 0;
    this.syncCamera();
  }

  getForwardXZ(): THREE.Vector3 {
    return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }

  getRightXZ(): THREE.Vector3 {
    return new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
  }

  getAimDirection(): THREE.Vector3 {
    const dir = new THREE.Vector3(0, 0, -1);
    dir.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
    return dir.normalize();
  }

  getEyePosition(): THREE.Vector3 {
    return new THREE.Vector3(this.position.x, this.position.y + EYE_HEIGHT, this.position.z);
  }

  update(dt: number, active: boolean): void {
    if (active) {
      const { dx, dy } = this.input.consumeMouseDelta();
      this.yaw -= dx * MOUSE_SENSITIVITY;
      this.pitch -= dy * MOUSE_SENSITIVITY;
      if (this.pitch > MAX_PITCH) this.pitch = MAX_PITCH;
      if (this.pitch < -MAX_PITCH) this.pitch = -MAX_PITCH;
    }

    const forward = this.getForwardXZ();
    const right = this.getRightXZ();
    const wish = new THREE.Vector3();
    if (active) {
      if (this.input.isDown('forward')) wish.add(forward);
      if (this.input.isDown('back')) wish.sub(forward);
      if (this.input.isDown('right')) wish.add(right);
      if (this.input.isDown('left')) wish.sub(right);
    }
    if (wish.lengthSq() > 0) wish.normalize();

    const speed = active && this.input.isDown('sprint') ? SPRINT_SPEED : WALK_SPEED;
    this.velocity.x = wish.x * speed;
    this.velocity.z = wish.z * speed;

    if (active && this.input.isDown('jump') && this.onGround) {
      this.velocity.y = JUMP_SPEED;
      this.onGround = false;
    }

    this.velocity.y -= GRAVITY * dt;
    if (this.velocity.y < -35) this.velocity.y = -35;

    this.moveWithCollisions(dt);
    this.syncCamera();

    const moving = wish.lengthSq() > 0.001 && this.onGround;
    this.rig.update(dt, moving);
  }

  private moveWithCollisions(dt: number): void {
    const step = new THREE.Vector3(
      this.velocity.x * dt,
      this.velocity.y * dt,
      this.velocity.z * dt,
    );
    this.moveAxis('x', step.x);
    this.moveAxis('z', step.z);
    this.onGround = false;
    this.moveAxis('y', step.y);
  }

  private moveAxis(axis: 'x' | 'y' | 'z', delta: number): void {
    if (delta === 0) return;
    const original = this.position[axis];
    this.position[axis] = original + delta;
    if (this.collides()) {
      // Auto step-up ~1 block so spiral lighthouse stairs are climbable
      if (axis !== 'y') {
        const footY = this.position.y;
        this.position.y = footY + 1.05;
        if (!this.collides()) {
          return;
        }
        this.position.y = footY;
      }
      this.position[axis] = original;
      if (axis === 'y') {
        if (delta < 0) this.onGround = true;
        this.velocity.y = 0;
      } else {
        this.velocity[axis] = 0;
      }
    }
  }

  private collides(): boolean {
    const min = new THREE.Vector3(
      this.position.x - PLAYER_RADIUS,
      this.position.y,
      this.position.z - PLAYER_RADIUS,
    );
    const max = new THREE.Vector3(
      this.position.x + PLAYER_RADIUS,
      this.position.y + PLAYER_HEIGHT,
      this.position.z + PLAYER_RADIUS,
    );
    return this.world.boxCollides(min, max);
  }

  private syncCamera(): void {
    const eye = this.getEyePosition();
    this.camera.position.copy(eye);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
