import * as THREE from 'three';
import { ENEMY_STATS, type EnemyStats, type EnemyType } from '../data/enemies';
import type { World } from '../game/World';
import { buildEnemyMesh } from './enemyMeshes';

let __enemyId = 0;

/**
 * Voxel-style enemy. Silhouette and animation are type-specific (built via
 * enemyMeshes factory); AI is chase-based with light behavior variations
 * per stats.behavior (stalker pauses, dasher bursts, floater bobs high).
 */
export class Enemy {
  readonly id: number;
  readonly stats: EnemyStats;
  readonly root: THREE.Group;
  readonly position: THREE.Vector3;
  hp: number;
  dead = false;
  dying = false;
  private deathTimer = 0;
  contactAccumulator = 0;
  private vy = 0;
  private readonly world: World;
  private readonly bobPhase = Math.random() * Math.PI * 2;
  private time = 0;
  private hitFlashRemaining = 0;
  private readonly materials: THREE.MeshLambertMaterial[] = [];
  private readonly headGroup?: THREE.Group;
  private readonly armGroups?: THREE.Group[];
  private readonly jitterMeshes?: THREE.Object3D[];
  private readonly floatBody?: THREE.Object3D;
  private dashCooldown = 0;
  private dashRemaining = 0;
  private pauseTimer = 0;

  constructor(world: World, type: EnemyType, position: THREE.Vector3) {
    this.id = ++__enemyId;
    this.stats = ENEMY_STATS[type];
    this.hp = this.stats.hp;
    this.position = position.clone();
    this.world = world;
    const mesh = buildEnemyMesh(type, this.stats);
    this.root = mesh.root;
    this.materials = mesh.materials;
    this.headGroup = mesh.headGroup;
    this.armGroups = mesh.armGroups;
    this.jitterMeshes = mesh.jitterMeshes;
    this.floatBody = mesh.floatBody;
    this.root.position.copy(this.position);
  }

  applyHit(damage: number): boolean {
    if (this.dying) return false;
    this.hp -= damage;
    this.hitFlashRemaining = 0.15;
    for (const mat of this.materials) {
      mat.emissive = new THREE.Color(0xff6060);
      mat.emissiveIntensity = 1;
    }
    if (this.hp <= 0) {
      this.dying = true;
      this.deathTimer = 0.35;
      return true;
    }
    return false;
  }

  update(dt: number, target: THREE.Vector3): void {
    this.time += dt;

    if (this.dying) {
      this.deathTimer -= dt;
      const t = Math.max(0, this.deathTimer / 0.35);
      this.root.scale.setScalar(t);
      for (const mat of this.materials) {
        mat.transparent = true;
        mat.opacity = t;
      }
      if (this.deathTimer <= 0) this.dead = true;
      return;
    }

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

      let speed = this.stats.speed;
      if (this.stats.behavior === 'stalker') {
        this.pauseTimer -= dt;
        if (this.pauseTimer <= 0) {
          this.pauseTimer = distXZ < 6 ? -1.2 : 1.5 + Math.random() * 1.2;
        }
        if (this.pauseTimer > 0) speed *= 0.15;
      } else if (this.stats.behavior === 'dasher') {
        this.dashCooldown -= dt;
        this.dashRemaining -= dt;
        if (this.dashCooldown <= 0 && distXZ < 10) {
          this.dashRemaining = 0.4;
          this.dashCooldown = 2.5 + Math.random();
        }
        if (this.dashRemaining > 0) speed *= 2.4;
      }

      const step = speed * dt;
      const move = Math.min(step, distXZ);
      this.tryMove(toTarget.x * move, 0, toTarget.z * move);
    }

    if (this.stats.behavior === 'floater') {
      this.vy = 0;
    } else {
      this.vy -= 22 * dt;
      if (this.vy < -30) this.vy = -30;
      const groundedBefore = this.isGrounded();
      if (groundedBefore && this.vy < 0) this.vy = 0;
      this.tryMove(0, this.vy * dt, 0);
    }

    this.contactAccumulator = Math.max(0, this.contactAccumulator - dt);

    if (distXZ > 0.001) {
      const facing = Math.atan2(toTarget.x, toTarget.z);
      this.root.rotation.y = facing;
    }

    this.applyTypeAnimation(dt);
  }

  private applyTypeAnimation(_dt: number): void {
    const t = this.time;
    let baseBob = Math.sin(t * 6 + this.bobPhase) * 0.05;

    switch (this.stats.behavior) {
      case 'chase': {
        if (this.headGroup) {
          this.headGroup.rotation.z = Math.sin(t * 3) * 0.15;
          this.headGroup.rotation.x = 0.15 + Math.sin(t * 4) * 0.05;
        }
        if (this.armGroups) {
          this.armGroups[0].rotation.x = Math.sin(t * 4) * 0.4 - 0.1;
          this.armGroups[1].rotation.x = Math.sin(t * 4 + Math.PI) * 0.4 - 0.1;
        }
        break;
      }
      case 'stalker': {
        if (this.headGroup) {
          this.headGroup.rotation.z = Math.sin(t * 1.5) * 0.08;
          this.headGroup.position.y = 1.85 + Math.sin(t * 2) * 0.03;
        }
        baseBob = Math.sin(t * 2 + this.bobPhase) * 0.02;
        break;
      }
      case 'dasher': {
        const jitterAmt = this.dashRemaining > 0 ? 0.08 : 0.03;
        if (this.jitterMeshes) {
          for (const m of this.jitterMeshes) {
            m.position.x = (Math.random() - 0.5) * jitterAmt;
          }
        }
        baseBob = Math.sin(t * 10 + this.bobPhase) * 0.06;
        break;
      }
      case 'floater': {
        if (this.floatBody) {
          this.floatBody.position.y = Math.sin(t * 1.5) * 0.25 + 0.3;
          this.floatBody.rotation.y = t * 0.5;
        }
        if (this.armGroups) {
          for (let i = 0; i < this.armGroups.length; i++) {
            this.armGroups[i].rotation.z = Math.sin(t * 2 + i) * 0.3;
          }
        }
        baseBob = 0;
        break;
      }
    }

    this.root.position.set(this.position.x, this.position.y + baseBob, this.position.z);
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
