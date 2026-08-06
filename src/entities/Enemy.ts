import * as THREE from 'three';
import { ENEMY_STATS, type EnemyStats, type EnemyType } from '../data/enemies';
import type { World } from '../game/World';
import {
  createNameTag,
  createSpeechBubble,
  disposeNameTag,
  updateSpeechBubble,
} from '../rendering/EntityNameTag';
import { buildEnemyMesh } from './enemyMeshes';

let __enemyId = 0;

export type EnemyUpdateEvents = {
  onFlash?: (enemy: Enemy) => void;
  onBossPhase?: (enemy: Enemy, phase: 2 | 3) => void;
  onBossDeathEffect?: (position: THREE.Vector3, kind: 'fire' | 'dust') => void;
  onShootFireball?: (
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    anxietyHit: number,
    color?: number,
  ) => void;
};

/**
 * Voxel-style enemy. Silhouette and animation are type-specific (built via
 * enemyMeshes factory); AI is chase-based with light behavior variations
 * per stats.behavior (stalker pauses, critic lunges/critiques, dasher bursts, floater bobs high).
 */
export class Enemy {
  readonly id: number;
  readonly stats: EnemyStats;
  readonly root: THREE.Group;
  readonly position: THREE.Vector3;
  hp: number;
  dead = false;
  dying = false;
  /** Ambient wildlife — not counted for wave clear. */
  ambient = false;
  /** Red name label above combat enemies (null for ambient fauna). */
  nameTag: THREE.Sprite | null = null;
  speechBubble: THREE.Sprite | null = null;
  speechBubbleTimer = 0;
  growlCooldown = 2 + Math.random() * 4;
  tauntCooldown = 5 + Math.random() * 5;
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
  private readonly tail?: THREE.Object3D;
  private dashCooldown = 0;
  private dashRemaining = 0;
  private pauseTimer = 0;
  private critiqueCooldown = 2 + Math.random() * 2;
  private critiqueWindup = 0;
  private pendingCritique = false;
  private lungeCooldown = 1.5 + Math.random();
  private lungeWindup = 0;
  private lungeRemaining = 0;
  private flashCooldown = 1.5;
  private flashActive = 0;
  private flashTriggered = false;
  private retreatTimer = 0;
  private wanderDir = new THREE.Vector3(1, 0, 0);
  private wanderTimer = 1 + Math.random() * 2;
  private jumpCooldown = 0.5 + Math.random();
  private hopTimer = 2 + Math.random() * 4;
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
  private deathStartY = 0;
  private bossDeathFireSpawned = false;
  private bossDeathDustSpawned = false;
  private deathEvents?: EnemyUpdateEvents;
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
    this.tail = mesh.tail;
    this.root.position.copy(this.position);
    const angle = Math.random() * Math.PI * 2;
    this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
    for (const mat of this.materials) {
      this.baseMaterialState.push({
        color: mat.color.clone(),
        emissive: mat.emissive.clone(),
        emissiveIntensity: mat.emissiveIntensity,
      });
    }
  }

  /** Attach red name tag — call after spawn when enemy is a combat unit. */
  enableCombatPresentation(): void {
    if (this.nameTag || this.ambient) return;
    this.nameTag = createNameTag(this.stats.displayName);
    const tagLift = this.stats.type === 'mukemmeliyetci-kuzen' ? 0.38 : 0.12;
    this.nameTag.position.set(0, this.stats.height + tagLift, 0);
    this.root.add(this.nameTag);
  }

  showTaunt(text: string, duration = 3.5): void {
    if (this.ambient || this.dead || this.dying) return;
    if (this.speechBubble) {
      updateSpeechBubble(this.speechBubble, text);
      this.speechBubble.visible = true;
    } else {
      this.speechBubble = createSpeechBubble(text);
      this.root.add(this.speechBubble);
    }
    const bubbleLift = this.stats.type === 'mukemmeliyetci-kuzen' ? 0.88 : 0.62;
    this.speechBubble.position.set(0, this.stats.height + bubbleLift, 0);
    this.speechBubbleTimer = duration;
  }

  clearSpeechBubble(): void {
    if (!this.speechBubble) return;
    this.root.remove(this.speechBubble);
    disposeNameTag(this.speechBubble);
    this.speechBubble = null;
    this.speechBubbleTimer = 0;
  }

  startRageTransition(level: 1 | 2): void {
    if (!this.stats.isBoss) return;
    this.rageAnim = 0;
    this.rageLevel = level;
  }

  private applyRageColors(t: number): void {
    const baseBrown = new THREE.Color(0x6b4f0a);
    const gold = new THREE.Color(0xf5c542);
    const mix = Math.min(1, t);

    if (this.rageLevel === 1) {
      // Phase 2 — kızdı: purple rage
      const purple = new THREE.Color(0x9b4de0);
      const darkPurple = new THREE.Color(0x4a1578);
      const purpleGlow = new THREE.Color(0xbb66ff);

      for (let i = 0; i < this.materials.length; i++) {
        const mat = this.materials[i];
        const base = this.baseMaterialState[i];
        if (!base) continue;
        const isGlow = base.emissiveIntensity > 0.5;
        if (isGlow) {
          mat.color.copy(gold).lerp(purple, mix);
          mat.emissive.copy(base.emissive).lerp(purpleGlow, mix);
          mat.emissiveIntensity = base.emissiveIntensity + mix * 0.95;
        } else {
          mat.color.copy(baseBrown).lerp(darkPurple, mix * 0.92);
          mat.emissive.copy(base.emissive).lerp(new THREE.Color(0x6622aa), mix * 0.55);
          mat.emissiveIntensity = base.emissiveIntensity + mix * 0.35;
        }
      }

      const pulse = 1 + Math.sin(this.time * 9) * 0.05 * mix;
      this.root.scale.setScalar(pulse);
      return;
    }

    if (this.rageLevel >= 2) {
      // Phase 3 — öfkelendi: kıpkırmızı, orange↔red every 1s
      const orange = new THREE.Color(0xff7700);
      const brightRed = new THREE.Color(0xff0800);
      const darkRed = new THREE.Color(0x7a0606);
      const cycleT = 0.5 - 0.5 * Math.cos(this.time * Math.PI * 2);
      const hotColor = orange.clone().lerp(brightRed, cycleT);
      const emissiveHot = orange.clone().lerp(new THREE.Color(0xff1a00), cycleT);

      for (let i = 0; i < this.materials.length; i++) {
        const mat = this.materials[i];
        const base = this.baseMaterialState[i];
        if (!base) continue;
        const isGlow = base.emissiveIntensity > 0.5;
        if (isGlow) {
          mat.color.copy(gold).lerp(hotColor, mix);
          mat.emissive.copy(base.emissive).lerp(emissiveHot, mix);
          mat.emissiveIntensity = base.emissiveIntensity + mix * (1.0 + cycleT * 0.6);
        } else {
          mat.color.copy(baseBrown).lerp(darkRed, mix * 0.9);
          mat.emissive.copy(base.emissive).lerp(emissiveHot, mix * 0.55);
          mat.emissiveIntensity = base.emissiveIntensity + mix * 0.45;
        }
      }

      const pulse = 1 + Math.sin(this.time * 16) * 0.07;
      this.root.scale.setScalar(pulse);
    }
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
      this.deathTimer = this.stats.isBoss ? 2.8 : 0.35;
      if (this.stats.isBoss) {
        this.deathStartY = this.position.y;
        this.bossDeathFireSpawned = false;
        this.bossDeathDustSpawned = false;
      }
      return true;
    }
    if (this.stats.isBoss) {
      const ratio = this.hp / this.stats.hp;
      if (ratio <= 0.6 && !this.bossPhasesTriggered.has(2)) {
        this.bossPhasesTriggered.add(2);
        this.bossPhasesPending.add(2);
        this.speedMultiplier = 1.25;
      }
      if (ratio <= 0.3 && !this.bossPhasesTriggered.has(3)) {
        this.bossPhasesTriggered.add(3);
        this.bossPhasesPending.add(3);
        this.speedMultiplier = 1.42;
        this.contactAnxietyMultiplier = 1.28;
      }
    }
    return false;
  }

  forceKill(): void {
    if (this.dying || this.dead) return;
    this.hp = 0;
    this.dying = true;
    this.deathTimer = 0.35;
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
    options?: { color?: number; spreadCount?: number; spreadDegrees?: number },
  ): void {
    if (!events?.onShootFireball) return;
    const origin = this.position.clone();
    origin.y += this.stats.height * 0.55;
    const baseDir = new THREE.Vector3(
      target.x - origin.x,
      target.y + 0.9 - origin.y,
      target.z - origin.z,
    );
    if (baseDir.lengthSq() < 0.0001) return;
    baseDir.normalize();

    const count = options?.spreadCount ?? 1;
    const spread = options?.spreadDegrees ?? 30;
    const color = options?.color;

    if (count <= 1) {
      events.onShootFireball(origin, baseDir.clone(), speed, anxietyHit, color);
    } else {
      const half = (count - 1) / 2;
      for (let i = 0; i < count; i++) {
        const offsetDeg = (i - half) * spread;
        const dir = this.rotateDirectionHorizontal(baseDir, offsetDeg);
        events.onShootFireball(origin, dir, speed, anxietyHit, color);
      }
    }

    this.throwAnim = 0.45;
  }

  private rotateDirectionHorizontal(dir: THREE.Vector3, degrees: number): THREE.Vector3 {
    const angle = (degrees * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = dir.x * cos - dir.z * sin;
    const z = dir.x * sin + dir.z * cos;
    return new THREE.Vector3(x, dir.y, z).normalize();
  }

  applyHitWithEvents(damage: number, events?: EnemyUpdateEvents): boolean {
    const killed = this.applyHit(damage);
    this.consumeBossPhases(events);
    return killed;
  }

  update(dt: number, target: THREE.Vector3, events?: EnemyUpdateEvents): void {
    this.time += dt;
    this.deathEvents = events;
    this.tickSpeechBubble(dt);

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
        if (this.stats.isBoss && this.rageAnim >= 0) {
          this.applyRageColors(Math.min(1, this.rageAnim));
        } else {
          for (const mat of this.materials) {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      }
    }

    const toTarget = new THREE.Vector3(
      target.x - this.position.x,
      0,
      target.z - this.position.z,
    );
    const distXZ = toTarget.length();

    let blockedHoriz = false;
    let moveDirX = 0;
    let moveDirZ = 0;

    if (this.stats.behavior === 'wander') {
      this.wanderTimer -= dt;
      if (this.wanderTimer <= 0) {
        this.wanderTimer = 3 + Math.random() * 3;
        const angle = Math.random() * Math.PI * 2;
        this.wanderDir.set(Math.cos(angle), 0, Math.sin(angle));
      }
      const speed = this.stats.speed * this.speedMultiplier;
      moveDirX = this.wanderDir.x;
      moveDirZ = this.wanderDir.z;
      const beforeX = this.position.x;
      const beforeZ = this.position.z;
      this.tryMove(moveDirX * speed * dt, 0, moveDirZ * speed * dt);
      blockedHoriz =
        Math.abs(this.position.x - beforeX) < 1e-4 &&
        Math.abs(this.position.z - beforeZ) < 1e-4;
      if (blockedHoriz) this.wanderTimer = 0;
      this.root.rotation.y = Math.atan2(this.wanderDir.x, this.wanderDir.z);
    } else if (distXZ > 0.001) {
      toTarget.divideScalar(distXZ);

      let speed = this.stats.speed * this.speedMultiplier;
      let moveDir = toTarget;

      if (this.stats.isBoss && this.bossRagePhase >= 3 && distXZ < 3.8) {
        speed *= 0.35;
      }

      if (this.stats.behavior === 'stalker') {
        this.pauseTimer -= dt;
        if (this.pauseTimer <= 0) {
          this.pauseTimer = distXZ < 6 ? -1.2 : 1.5 + Math.random() * 1.2;
        }
        if (this.pauseTimer > 0) speed *= 0.15;
      } else if (this.stats.behavior === 'critic') {
        this.critiqueCooldown -= dt;
        this.lungeCooldown -= dt;
        this.lungeRemaining -= dt;
        this.throwAnim = Math.max(0, this.throwAnim - dt);

        if (this.critiqueWindup > 0) {
          this.critiqueWindup -= dt;
          speed = 0;
          if (this.critiqueWindup <= 0 && this.pendingCritique) {
            this.pendingCritique = false;
            this.throwAnim = 0.45;
            this.shootFireball(target, events, 5.5, 5, { color: 0xc8e8ff });
          }
        } else if (this.lungeWindup > 0) {
          this.lungeWindup -= dt;
          speed = 0;
          if (this.lungeWindup <= 0) {
            this.lungeRemaining = 0.35;
          }
        } else if (
          this.lungeCooldown <= 0 &&
          distXZ < 7 &&
          this.critiqueWindup <= 0
        ) {
          this.lungeCooldown = 3.2;
          this.lungeWindup = 0.35;
          speed = 0;
        } else if (
          this.critiqueCooldown <= 0 &&
          distXZ >= 8 &&
          distXZ <= 14 &&
          events?.onShootFireball
        ) {
          this.critiqueCooldown = 5.5;
          this.critiqueWindup = 0.45;
          this.pendingCritique = true;
          speed = 0;
        }

        if (this.lungeRemaining > 0) speed *= 1.55;
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

      moveDirX = moveDir.x;
      moveDirZ = moveDir.z;
      const step = speed * dt;
      const move = Math.min(step, distXZ);
      const beforeX = this.position.x;
      const beforeZ = this.position.z;
      this.tryMove(moveDirX * move, 0, moveDirZ * move);
      blockedHoriz =
        move > 1e-4 &&
        Math.abs(this.position.x - beforeX) < 1e-4 &&
        Math.abs(this.position.z - beforeZ) < 1e-4;
    }

    if (this.stats.behavior === 'floater') {
      this.vy = 0;
    } else {
      this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
      const groundedBefore = this.isGrounded();
      if (groundedBefore && this.canHop()) {
        this.tryHop(dt, blockedHoriz, target, distXZ);
      }

      this.vy -= 22 * dt;
      if (this.vy < -30) this.vy = -30;
      if (groundedBefore && this.vy < 0) this.vy = 0;
      this.tryMove(0, this.vy * dt, 0);

      // Air control: keep pushing over low obstacles while jumping
      if (!this.isGrounded() && this.canHop() && (moveDirX !== 0 || moveDirZ !== 0)) {
        const airSpeed = this.stats.speed * this.speedMultiplier * 0.85 * dt;
        this.tryMove(moveDirX * airSpeed, 0, moveDirZ * airSpeed);
      }
    }

    this.contactAccumulator = Math.max(0, this.contactAccumulator - dt);

    if (this.stats.behavior !== 'wander' && distXZ > 0.001) {
      const facing = Math.atan2(toTarget.x, toTarget.z);
      this.root.rotation.y = facing;
    }

    if (this.stats.isBoss && this.stats.behavior === 'floater') {
      const rage = this.bossRagePhase;
      if (rage >= 2) {
        this.bossFireCooldown -= dt;
        this.throwAnim = Math.max(0, this.throwAnim - dt);
        if (this.bossFireCooldown <= 0 && distXZ >= 4 && distXZ <= 28) {
          this.bossFireCooldown = rage >= 3 ? 2.4 : 2.6;
          if (rage >= 3) {
            this.shootFireball(target, events, 7.2, 11, {
              color: 0xff1200,
              spreadCount: 3,
              spreadDegrees: 30,
            });
          } else {
            this.shootFireball(target, events, 7.5, 10, { color: 0x9b4de0 });
          }
        }
      }
    }

    this.applyTypeAnimation(dt);
  }

  private tickDeath(dt: number): void {
    if (this.stats.isBoss) {
      this.tickBossDeath(dt);
      return;
    }

    this.deathTimer -= dt;
    const t = Math.max(0, this.deathTimer / 0.35);
    this.root.scale.setScalar(t);
    for (const mat of this.materials) {
      mat.transparent = true;
      mat.opacity = t;
    }
    if (this.deathTimer <= 0) this.dead = true;
  }

  private tickBossDeath(dt: number): void {
    const total = 2.8;
    this.deathTimer -= dt;
    const elapsed = total - this.deathTimer;
    const fallEnd = 0.85;
    const fireEnd = 1.75;

    if (elapsed < fallEnd) {
      const t = elapsed / fallEnd;
      this.root.rotation.x = t * (Math.PI / 2.2);
      this.position.y = this.deathStartY - t * (this.stats.height * 0.45);
      this.root.position.copy(this.position);
    } else if (elapsed < fireEnd) {
      this.root.rotation.x = Math.PI / 2.2;
      this.position.y = this.deathStartY - this.stats.height * 0.45;
      this.root.position.copy(this.position);
      if (!this.bossDeathFireSpawned) {
        this.bossDeathFireSpawned = true;
        this.deathEvents?.onBossDeathEffect?.(this.getDeathEffectPosition(), 'fire');
      }
      const fireT = (elapsed - fallEnd) / (fireEnd - fallEnd);
      for (const mat of this.materials) {
        mat.transparent = false;
        mat.opacity = 1;
        mat.emissive.setRGB(1, 0.25 + fireT * 0.35, 0);
        mat.emissiveIntensity = 0.55 + Math.sin(elapsed * 14) * 0.35;
      }
    } else {
      if (!this.bossDeathDustSpawned) {
        this.bossDeathDustSpawned = true;
        this.deathEvents?.onBossDeathEffect?.(this.getDeathEffectPosition(), 'dust');
      }
      const dustT = Math.min(1, (elapsed - fireEnd) / (total - fireEnd));
      this.root.scale.setScalar(1 - dustT * 0.25);
      for (const mat of this.materials) {
        mat.transparent = true;
        mat.opacity = 1 - dustT;
        mat.emissive.setRGB(0.35, 0.35, 0.35);
        mat.emissiveIntensity = 0.1;
      }
    }

    if (this.deathTimer <= 0) this.dead = true;
  }

  private getDeathEffectPosition(): THREE.Vector3 {
    return new THREE.Vector3(
      this.position.x,
      this.position.y + this.stats.height * 0.25,
      this.position.z,
    );
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
      case 'critic': {
        if (this.headGroup) {
          this.headGroup.rotation.z = 0.12 + Math.sin(t * 2.2) * 0.06;
          this.headGroup.rotation.x = -0.08 + Math.sin(t * 1.8) * 0.04;
        }
        if (this.armGroups) {
          const throwT = this.throwAnim > 0 ? 1 - this.throwAnim / 0.45 : 0;
          const windup = this.critiqueWindup > 0 || this.lungeWindup > 0;
          const lunging = this.lungeRemaining > 0;
          // Right arm = clipboard: windup reach, then throw swing
          if (this.armGroups[1]) {
            if (throwT > 0) {
              this.armGroups[1].rotation.x = Math.sin(throwT * Math.PI) * -1.6;
            } else if (windup) {
              this.armGroups[1].rotation.x = -1.1;
            } else if (lunging) {
              this.armGroups[1].rotation.x = Math.sin(t * 14) * 0.55 - 0.35;
            } else {
              this.armGroups[1].rotation.x = Math.sin(t * 5) * 0.25 - 0.15;
            }
          }
          // Left arm = pointing finger
          if (this.armGroups[0]) {
            this.armGroups[0].rotation.x = lunging
              ? Math.sin(t * 14 + Math.PI) * 0.5 - 0.2
              : -0.55 + Math.sin(t * 3) * 0.08;
            this.armGroups[0].rotation.z = 0.35;
          }
        }
        baseBob = Math.sin(t * 8 + this.bobPhase) * 0.055;
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
      case 'wander': {
        if (this.tail) {
          this.tail.rotation.z = Math.sin(t * 3 + this.bobPhase) * 0.35;
          this.tail.rotation.x = -0.2 + Math.sin(t * 2.2) * 0.1;
        }
        if (this.headGroup) {
          this.headGroup.rotation.y = Math.sin(t * 1.8) * 0.12;
        }
        if (this.armGroups) {
          this.armGroups[0].rotation.x = Math.sin(t * 5) * 0.25;
          if (this.armGroups[1]) this.armGroups[1].rotation.x = Math.sin(t * 5 + Math.PI) * 0.25;
        }
        baseBob = Math.sin(t * 4 + this.bobPhase) * 0.02;
        break;
      }
    }

    if (this.stats.behavior === 'chase' && this.tail) {
      this.tail.rotation.z = Math.sin(t * 5 + this.bobPhase) * 0.4;
      this.tail.rotation.x = -0.35 + Math.sin(t * 3) * 0.15;
    }

    this.root.position.set(this.position.x, this.position.y + baseBob, this.position.z);
  }

  private canHop(): boolean {
    return (
      this.stats.type === 'maymun' ||
      this.stats.type === 'inek' ||
      this.stats.type === 'merakli-teyze' ||
      this.stats.type === 'mukemmeliyetci-kuzen'
    );
  }

  private tryHop(
    dt: number,
    blockedHoriz: boolean,
    target: THREE.Vector3,
    distXZ: number,
  ): void {
    if (this.jumpCooldown > 0 || this.vy > 0.1) return;

    if (this.stats.type === 'merakli-teyze') {
      const encounterDist = 0.9 + this.stats.radius;
      if (blockedHoriz || distXZ <= encounterDist) {
        this.vy = 7.4;
        this.jumpCooldown = 2.0;
      }
      return;
    }

    if (this.stats.type === 'mukemmeliyetci-kuzen') {
      if (blockedHoriz) {
        this.vy = 7.8;
        this.jumpCooldown = 0.85;
      }
      return;
    }

    const jumpSpeed = this.stats.type === 'maymun' ? 8.2 : 6.8;

    if (blockedHoriz) {
      this.vy = jumpSpeed;
      this.jumpCooldown = this.stats.type === 'maymun' ? 0.7 : 1.0;
      return;
    }

    if (this.stats.type === 'maymun' && target.y > this.position.y + 0.45) {
      this.vy = jumpSpeed;
      this.jumpCooldown = 0.85;
      return;
    }

    this.hopTimer -= dt;
    if (this.hopTimer > 0) return;

    if (this.stats.type === 'inek') {
      this.vy = jumpSpeed * 0.85;
      this.jumpCooldown = 1.4;
      this.hopTimer = 3.5 + Math.random() * 5;
    } else {
      this.vy = jumpSpeed * 0.75;
      this.jumpCooldown = 1.1;
      this.hopTimer = 2.2 + Math.random() * 3.5;
    }
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

  private tickSpeechBubble(dt: number): void {
    if (this.speechBubbleTimer <= 0) return;
    this.speechBubbleTimer -= dt;
    if (this.speechBubbleTimer <= 0) this.clearSpeechBubble();
  }

  dispose(): void {
    this.clearSpeechBubble();
    if (this.nameTag) {
      this.root.remove(this.nameTag);
      disposeNameTag(this.nameTag);
      this.nameTag = null;
    }
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
      }
    });
    for (const mat of this.materials) mat.dispose();
  }
}
