import * as THREE from 'three';
import { ENEMY_STATS, type EnemyStats, type EnemyType } from '../data/enemies';
import type { World } from '../game/World';
import { buildEnemyMesh } from './enemyMeshes';

let __enemyId = 0;

export type EnemyUpdateEvents = {
  onFlash?: (enemy: Enemy) => void;
  onBossPhase?: (enemy: Enemy, phase: 2 | 3) => void;
  onShootFireball?: (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    anxietyHit: number,
  ) => void;
};

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
  private flashCooldown = 1.5;
  private flashActive = 0;
  private flashTriggered = false;
  private retreatTimer = 0;
  private readonly bossPhasesTriggered = new Set<2 | 3>();
  private readonly bossPhasesPending = new Set<2 | 3>();
  private fireballCooldown = 1.5 + Math.random();
  private throwAnim = 0;
  private shootWindup = 0;
  private pendingFireball = false;
  private bossFireCooldown = 2.5;
  speedMultiplier = 1;
  contactAnxietyMultiplier = 1;
  combatFrozen = false;
  private rageAnim = -1;
  private rageLevel = 0;
  private readonly baseMaterialState: Array<{
    color: THREE.Color;
    emissive: THREE.Color;
    emissiveIntensity: number;
  }> = [];

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
    for (const mat of this.materials) {
      this.baseMaterialState.push({
        color: mat.color.clone(),
        emissive: mat.emissive.clone(),
        emissiveIntensity: mat.emissiveIntensity,
      });
    }
  }

  startRageTransition(level: 1 | 2): void {
    if (!this.stats.isBoss) return;
    this.rageAnim = 0;
    this.rageLevel = level;
  }

  private applyRageColors(t: number): void {
    const gold = new THREE.Color(0xf5c542);
    const hotRed = new THREE.Color(0xff2818);
    const darkRed = new THREE.Color(0x5a0808);
    const baseBrown = new THREE.Color(0x6b4f0a);
    const mix = this.rageLevel >= 2 ? Math.min(1, t * 1.15) : t;

    for (let i = 0; i < this.materials.length; i++) {
      const mat = this.materials[i];
      const base = this.baseMaterialState[i];
      if (!base) continue;
      const isGlow = base.emissiveIntensity > 0.5;
      if (isGlow) {
        mat.color.copy(gold).lerp(hotRed, mix);
        mat.emissive.copy(base.emissive).lerp(new THREE.Color(0xff4020), mix);
        mat.emissiveIntensity = base.emissiveIntensity + mix * (this.rageLevel >= 2 ? 1.1 : 0.7);
      } else {
        mat.color.copy(baseBrown).lerp(darkRed, mix * 0.85);
        mat.emissive.copy(base.emissive).lerp(new THREE.Color(0x440000), mix * 0.6);
        mat.emissiveIntensity = base.emissiveIntensity + mix * 0.35;
      }
    }

    const pulse = 1 + Math.sin(this.time * 14) * 0.06 * mix;
    this.root.scale.setScalar(pulse);
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
    if (this.stats.isBoss) {
      const ratio = this.hp / this.stats.hp;
      if (ratio <= 0.6 && !this.bossPhasesTriggered.has(2)) {
        this.bossPhasesTriggered.add(2);
        this.bossPhasesPending.add(2);
        this.speedMultiplier = 1.35;
      }
      if (ratio <= 0.3 && !this.bossPhasesTriggered.has(3)) {
        this.bossPhasesTriggered.add(3);
        this.bossPhasesPending.add(3);
        this.speedMultiplier = 1.8;
        this.contactAnxietyMultiplier = 1.55;
      }
    }
    return false;
  }

  get bossRagePhase(): 0 | 2 | 3 {
    if (this.bossPhasesTriggered.has(3)) return 3;
    if (this.bossPhasesTriggered.has(2)) return 2;
    return 0;
  }

  consumeBossPhases(events?: EnemyUpdateEvents): void {
    for (const phase of this.bossPhasesPending) {
      if (phase === 2 || phase === 3) events?.onBossPhase?.(this, phase);
    }
    this.bossPhasesPending.clear();
  }

  private shootFireball(
    target: THREE.Vector3,
    events: EnemyUpdateEvents | undefined,
    speed: number,
    anxietyHit: number,
  ): void {
    if (!events?.onShootFireball) return;
    const origin = this.position.clone();
    origin.y += this.stats.height * 0.55;
    const dir = new THREE.Vector3(
      target.x - origin.x,
      target.y + 0.9 - origin.y,
      target.z - origin.z,
    );
    events.onShootFireball(origin, dir, speed, anxietyHit);
    this.throwAnim = 0.45;
  }

  applyHitWithEvents(damage: number, events?: EnemyUpdateEvents): boolean {
    const killed = this.applyHit(damage);
    this.consumeBossPhases(events);
    return killed;
  }

  update(dt: number, target: THREE.Vector3, events?: EnemyUpdateEvents): void {
    this.time += dt;

    if (this.combatFrozen) {
      if (this.stats.isBoss && this.rageAnim >= 0 && this.rageAnim < 1) {
        this.rageAnim = Math.min(1, this.rageAnim + dt * 0.9);
        this.applyRageColors(this.rageAnim);
      } else if (this.stats.isBoss && this.rageAnim >= 1) {
        this.applyRageColors(1);
      }
      if (!this.dying) {
        this.applyTypeAnimation(dt);
      }
      if (this.dying) this.tickDeath(dt);
      return;
    }

    if (this.dying) {
      this.tickDeath(dt);
      return;
    }

    if (this.stats.isBoss && this.rageAnim >= 0) {
      if (this.rageAnim < 1) {
        this.rageAnim = Math.min(1, this.rageAnim + dt * 0.35);
      }
      this.applyRageColors(this.rageAnim);
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

      let speed = this.stats.speed * this.speedMultiplier;
      let moveDir = toTarget;

      if (this.stats.behavior === 'stalker') {
        this.pauseTimer -= dt;
        if (this.pauseTimer <= 0) {
          this.pauseTimer = distXZ < 6 ? -1.2 : 1.5 + Math.random() * 1.2;
        }
        if (this.pauseTimer > 0) speed *= 0.15;
      } else if (this.stats.behavior === 'dasher') {
        this.dashCooldown -= dt;
        this.dashRemaining -= dt;
        this.fireballCooldown -= dt;
        this.throwAnim = Math.max(0, this.throwAnim - dt);

        if (this.shootWindup > 0) {
          this.shootWindup -= dt;
          speed = 0;
          if (this.shootWindup <= 0 && this.pendingFireball) {
            this.pendingFireball = false;
            this.shootFireball(target, events, 6.5, 9);
          }
        } else if (
          this.fireballCooldown <= 0 &&
          distXZ >= 5 &&
          distXZ <= 20 &&
          events?.onShootFireball
        ) {
          this.fireballCooldown = 3.2 + Math.random() * 1.2;
          this.shootWindup = 0.35;
          this.pendingFireball = true;
          speed = 0;
        }

        if (this.dashCooldown <= 0 && distXZ < 10) {
          this.dashRemaining = 0.4;
          this.dashCooldown = 2.5 + Math.random();
        }
        if (this.dashRemaining > 0) speed *= 1.75;
      } else if (this.stats.behavior === 'flasher') {
        this.flashCooldown -= dt;
        this.flashActive -= dt;
        this.retreatTimer -= dt;

        if (this.flashActive > 0) {
          speed = 0;
          if (!this.flashTriggered) {
            this.flashTriggered = true;
            events?.onFlash?.(this);
          }
        } else {
          this.flashTriggered = false;
          if (this.retreatTimer > 0) {
            moveDir = toTarget.clone().multiplyScalar(-1);
            speed *= 1.2;
          } else if (distXZ >= 6 && distXZ <= 11 && this.flashCooldown <= 0) {
            this.flashActive = 0.35;
            this.flashCooldown = 4.5 + Math.random() * 1.5;
            speed = 0;
          } else if (distXZ < 5) {
            moveDir = toTarget.clone().multiplyScalar(-1);
            this.retreatTimer = 1.2;
            speed *= 1.1;
          } else if (distXZ > 12) {
            speed *= 1.1;
          } else {
            speed *= 0.35;
          }
        }
      }

      const step = speed * dt;
      const move = Math.min(step, distXZ);
      this.tryMove(moveDir.x * move, 0, moveDir.z * move);
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

    if (this.stats.isBoss && this.stats.behavior === 'floater') {
      const rage = this.bossRagePhase;
      if (rage >= 2) {
        this.bossFireCooldown -= dt;
        this.throwAnim = Math.max(0, this.throwAnim - dt);
        if (this.bossFireCooldown <= 0 && distXZ >= 4 && distXZ <= 28) {
          this.bossFireCooldown = rage >= 3 ? 1.6 : 2.6;
          this.shootFireball(
            target,
            events,
            rage >= 3 ? 9 : 7.5,
            rage >= 3 ? 14 : 10,
          );
        }
      }
    }

    this.applyTypeAnimation(dt);
  }

  private tickDeath(dt: number): void {
    this.deathTimer -= dt;
    const t = Math.max(0, this.deathTimer / 0.35);
    this.root.scale.setScalar(t);
    for (const mat of this.materials) {
      mat.transparent = true;
      mat.opacity = t;
    }
    if (this.deathTimer <= 0) this.dead = true;
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
        if (this.armGroups) {
          const throwT = this.throwAnim > 0 ? 1 - this.throwAnim / 0.45 : 0;
          const swing = throwT > 0
            ? Math.sin(throwT * Math.PI) * -1.7
            : Math.sin(t * 4) * 0.3 - 0.15;
          for (const arm of this.armGroups) {
            arm.rotation.x = swing;
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
          const throwT = this.throwAnim > 0 ? 1 - this.throwAnim / 0.45 : 0;
          for (let i = 0; i < this.armGroups.length; i++) {
            if (throwT > 0) {
              this.armGroups[i].rotation.x = Math.sin(throwT * Math.PI) * -1.4;
              this.armGroups[i].rotation.z = Math.sin(t * 2 + i) * 0.15;
            } else {
              this.armGroups[i].rotation.x = 0;
              this.armGroups[i].rotation.z = Math.sin(t * 2 + i) * 0.3;
            }
          }
        }
        baseBob = 0;
        break;
      }
      case 'flasher': {
        if (this.jitterMeshes) {
          const flashPulse = this.flashActive > 0 ? 1 : 0;
          for (const m of this.jitterMeshes) {
            m.scale.setScalar(1 + flashPulse * 0.35);
          }
        }
        if (this.headGroup) this.headGroup.rotation.y = Math.sin(t * 5) * 0.12;
        baseBob = Math.sin(t * 4 + this.bobPhase) * 0.03;
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
