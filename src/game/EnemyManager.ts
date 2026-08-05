import * as THREE from 'three';
import { Enemy, type EnemyUpdateEvents } from '../entities/Enemy';
import { ENEMY_STATS, type EnemyType } from '../data/enemies';
import type { FaunaSpawnSpec } from './worldGen/types';
import type { World } from './World';

export interface SpawnRequest {
  type: EnemyType;
  count: number;
}

export interface EnemyManagerEvents {
  onKilled?: (enemy: Enemy) => void;
  onContact?: (enemy: Enemy, dt: number) => void;
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
}

const CONTACT_RADIUS = 0.9;
const PLAYER_CONTACT_HEIGHT = 1.75;

export class EnemyManager {
  readonly enemies: Enemy[] = [];
  private readonly scene: THREE.Scene;
  private world: World;
  private readonly rand: () => number = Math.random;
  private readonly events: EnemyManagerEvents;
  private readonly enemyUpdateEvents: EnemyUpdateEvents;

  constructor(scene: THREE.Scene, world: World, events: EnemyManagerEvents = {}) {
    this.scene = scene;
    this.world = world;
    this.events = events;
    this.enemyUpdateEvents = {
      onFlash: (enemy) => this.events.onFlash?.(enemy),
      onBossPhase: (enemy, phase) => this.events.onBossPhase?.(enemy, phase),
      onBossDeathEffect: (position, kind) => this.events.onBossDeathEffect?.(position, kind),
      onShootFireball: (origin, direction, speed, anxietyHit, color) =>
        this.events.onShootFireball?.(origin, direction, speed, anxietyHit, color),
    };
  }

  setWorld(world: World): void {
    this.world = world;
  }

  spawn(type: EnemyType, avoid: THREE.Vector3 | THREE.Vector3[], minDist = 10): Enemy {
    const stats = ENEMY_STATS[type];
    const pos = this.world.randomSpawnPoint(
      this.rand,
      avoid,
      minDist,
      stats.radius,
      stats.height,
    );
    const enemy = new Enemy(this.world, type, pos);
    this.enemies.push(enemy);
    this.scene.add(enemy.root);
    return enemy;
  }

  spawnAt(type: EnemyType, x: number, y: number, z: number, ambient = false): Enemy {
    const stats = ENEMY_STATS[type];
    const resolved =
      this.world.resolveStandingPoint(x, z, stats.radius, stats.height) ??
      new THREE.Vector3(x, y, z);
    const enemy = new Enemy(this.world, type, resolved);
    enemy.ambient = ambient;
    this.enemies.push(enemy);
    this.scene.add(enemy.root);
    return enemy;
  }

  spawnAmbientFauna(specs: FaunaSpawnSpec[]): void {
    this.clearAmbient();
    for (const spec of specs) {
      const stats = ENEMY_STATS[spec.type];
      const resolved = this.world.resolveStandingPoint(
        spec.x,
        spec.z,
        stats.radius,
        stats.height,
        10,
      );
      if (!resolved) continue;
      this.spawnAt(spec.type, resolved.x, resolved.y, resolved.z, true);
    }
  }

  clearAmbient(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (!enemy.ambient) continue;
      this.scene.remove(enemy.root);
      enemy.dispose();
      this.enemies.splice(i, 1);
    }
  }

  spawnBatch(requests: SpawnRequest[], playerPos: THREE.Vector3): void {
    const avoid: THREE.Vector3[] = [playerPos.clone()];
    for (const req of requests) {
      for (let i = 0; i < req.count; i++) {
        const enemy = this.spawn(req.type, avoid, 10);
        avoid.push(enemy.position.clone());
      }
    }
  }

  aliveCount(): number {
    let n = 0;
    for (const e of this.enemies) if (!e.dead && !e.ambient) n++;
    return n;
  }

  update(dt: number, playerPos: THREE.Vector3): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      if (enemy.dead) {
        this.scene.remove(enemy.root);
        enemy.dispose();
        this.events.onKilled?.(enemy);
        this.enemies.splice(i, 1);
        continue;
      }
      enemy.update(dt, playerPos, this.enemyUpdateEvents);

      if (enemy.stats.behavior === 'wander' || enemy.stats.contactAnxietyPerSecond <= 0) {
        continue;
      }

      const playerMinY = playerPos.y;
      const playerMaxY = playerPos.y + PLAYER_CONTACT_HEIGHT;
      const enemyMinY = enemy.position.y;
      const enemyMaxY = enemy.position.y + enemy.stats.height;
      const verticalOverlap = Math.min(playerMaxY, enemyMaxY) - Math.max(playerMinY, enemyMinY);
      if (verticalOverlap < 0.45) continue;

      const dx = enemy.position.x - playerPos.x;
      const dz = enemy.position.z - playerPos.z;
      const distSq = dx * dx + dz * dz;
      const threshold = CONTACT_RADIUS + enemy.stats.radius;
      if (distSq <= threshold * threshold) {
        this.events.onContact?.(enemy, dt);
      }
    }
  }

  clear(): void {
    for (const e of this.enemies) {
      this.scene.remove(e.root);
      e.dispose();
    }
    this.enemies.length = 0;
  }

  /** Start death animation on every living enemy except `except`. */
  forceKillAllExcept(except: Enemy): void {
    for (const enemy of this.enemies) {
      if (enemy === except || enemy.dying || enemy.dead) continue;
      enemy.forceKill();
    }
  }

  /** Start death animation on every living enemy. */
  killAllLiving(): void {
    for (const enemy of this.enemies) {
      if (enemy.dying || enemy.dead) continue;
      enemy.forceKill();
    }
  }
}
