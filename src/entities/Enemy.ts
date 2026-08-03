import * as THREE from 'three';
import { ENEMY_STATS, type EnemyStats, type EnemyType } from '../data/enemies';
import type { World } from '../game/World';

let __enemyId = 0;

/**
 * Blocky voxel-look enemy: head + body + eyes assembled from simple boxes,
 * tinted per enemy type. AI simply walks toward the player on the XZ plane
 * while gravity pins it to the floor.
 */
export class Enemy {
  readonly id: number;
  readonly stats: EnemyStats;
  readonly root: THREE.Group;
  readonly position: THREE.Vector3;
  hp: number;
  dead = false;
  contactAccumulator = 0;
  private vy = 0;
  private readonly world: World;
  private readonly bobPhase = Math.random() * Math.PI * 2;
  private time = 0;
  private hitFlashRemaining = 0;
  private readonly materials: THREE.MeshLambertMaterial[] = [];

  constructor(world: World, type: EnemyType, position: THREE.Vector3) {
    this.id = ++__enemyId;
    this.stats = ENEMY_STATS[type];
    this.hp = this.stats.hp;
    this.position = position.clone();
    this.world = world;
    this.root = this.buildMesh();
    this.root.position.copy(this.position);
  }

  private buildMesh(): THREE.Group {
    const stats = this.stats;
    const group = new THREE.Group();
    const scale = stats.isBoss ? 1.6 : 1;

    const bodyMat = new THREE.MeshLambertMaterial({ color: stats.color });
    const accentMat = new THREE.MeshLambertMaterial({ color: stats.accentColor });
    const eyeMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
    this.materials.push(bodyMat, accentMat, eyeMat);

    const bodyH = 0.9 * scale;
    const bodyW = 0.7 * scale;
    const body = new THREE.Mesh(new THREE.BoxGeometry(bodyW, bodyH, bodyW), bodyMat);
    body.position.y = bodyH * 0.5;
    group.add(body);

    const headSize = 0.55 * scale;
    const head = new THREE.Mesh(new THREE.BoxGeometry(headSize, headSize, headSize), accentMat);
    head.position.y = bodyH + headSize * 0.5;
    group.add(head);

    const eyeGeo = new THREE.BoxGeometry(0.08 * scale, 0.08 * scale, 0.05 * scale);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.13 * scale, bodyH + headSize * 0.65, headSize * 0.5);
    eyeR.position.set(0.13 * scale, bodyH + headSize * 0.65, headSize * 0.5);
    group.add(eyeL, eyeR);

    if (stats.isBoss) {
      const crown = new THREE.Mesh(
        new THREE.BoxGeometry(headSize * 1.2, 0.2 * scale, headSize * 1.2),
        new THREE.MeshLambertMaterial({ color: 0xffd54a }),
      );
      crown.position.y = bodyH + headSize + 0.15 * scale;
      group.add(crown);
      this.materials.push(crown.material as THREE.MeshLambertMaterial);

      const aura = new THREE.Mesh(
        new THREE.BoxGeometry(bodyW * 2.2, 0.1, bodyW * 2.2),
        new THREE.MeshBasicMaterial({
          color: 0x7a4bd6,
          transparent: true,
          opacity: 0.35,
        }),
      );
      aura.position.y = 0.05;
      group.add(aura);
    }

    return group;
  }

  applyHit(damage: number): boolean {
    this.hp -= damage;
    this.hitFlashRemaining = 0.15;
    for (const mat of this.materials) {
      mat.emissive = new THREE.Color(0xff6060);
      mat.emissiveIntensity = 1;
    }
    if (this.hp <= 0) {
      this.dead = true;
      return true;
    }
    return false;
  }

  update(dt: number, target: THREE.Vector3): void {
    this.time += dt;

    if (this.hitFlashRemaining > 0) {
      this.hitFlashRemaining -= dt;
      if (this.hitFlashRemaining <= 0) {
        for (const mat of this.materials) {
          mat.emissive = new THREE.Color(0x000000);
          mat.emissiveIntensity = 0;
        }
      }
    }

    const toTarget = new THREE.Vector3(
      target.x - this.position.x,
      0,
      target.z - this.position.z,
    );
    const distXZ = toTarget.length();
    if (distXZ > 0.001) {
      toTarget.divideScalar(distXZ);
      const step = this.stats.speed * dt;
      const move = Math.min(step, distXZ);
      this.tryMove(toTarget.x * move, 0, toTarget.z * move);
    }

    this.vy -= 22 * dt;
    if (this.vy < -30) this.vy = -30;
    const groundedBefore = this.isGrounded();
    if (groundedBefore && this.vy < 0) this.vy = 0;
    this.tryMove(0, this.vy * dt, 0);

    this.contactAccumulator = Math.max(0, this.contactAccumulator - dt);

    if (distXZ > 0.001) {
      const facing = Math.atan2(toTarget.x, toTarget.z);
      this.root.rotation.y = facing;
    }
    const bob = Math.sin(this.time * 6 + this.bobPhase) * 0.05;
    this.root.position.set(this.position.x, this.position.y + bob, this.position.z);
  }

  private tryMove(dx: number, dy: number, dz: number): void {
    const attempt = (axis: 'x' | 'y' | 'z', delta: number) => {
      if (delta === 0) return;
      const original = this.position[axis];
      this.position[axis] = original + delta;
      if (this.collides()) {
        this.position[axis] = original;
        if (axis === 'y') this.vy = 0;
      }
    };
    attempt('x', dx);
    attempt('z', dz);
    attempt('y', dy);
  }

  private isGrounded(): boolean {
    const min = new THREE.Vector3(
      this.position.x - this.stats.radius,
      this.position.y - 0.05,
      this.position.z - this.stats.radius,
    );
    const max = new THREE.Vector3(
      this.position.x + this.stats.radius,
      this.position.y,
      this.position.z + this.stats.radius,
    );
    return this.world.boxCollides(min, max);
  }

  private collides(): boolean {
    const min = new THREE.Vector3(
      this.position.x - this.stats.radius,
      this.position.y,
      this.position.z - this.stats.radius,
    );
    const max = new THREE.Vector3(
      this.position.x + this.stats.radius,
      this.position.y + this.stats.height,
      this.position.z + this.stats.radius,
    );
    return this.world.boxCollides(min, max);
  }

  /** AABB used for both raycast hits and player contact. */
  getBox(): THREE.Box3 {
    return new THREE.Box3(
      new THREE.Vector3(
        this.position.x - this.stats.radius,
        this.position.y,
        this.position.z - this.stats.radius,
      ),
      new THREE.Vector3(
        this.position.x + this.stats.radius,
        this.position.y + this.stats.height,
        this.position.z + this.stats.radius,
      ),
    );
  }

  dispose(): void {
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
    for (const mat of this.materials) mat.dispose();
  }
}
