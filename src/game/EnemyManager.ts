import * as THREE from 'three';
import { Enemy } from '../entities/Enemy';
import type { EnemyType } from '../data/enemies';
import type { World } from './World';

export interface SpawnRequest {
  type: EnemyType;
  count: number;
}

export interface EnemyManagerEvents {
  onKilled?: (enemy: Enemy) => void;
  onContact?: (enemy: Enemy, dt: number) => void;
}

const CONTACT_RADIUS = 0.9;

export class EnemyManager {
  readonly enemies: Enemy[] = [];
  private readonly scene: THREE.Scene;
  private readonly world: World;
  private readonly rand: () => number = Math.random;
  private readonly events: EnemyManagerEvents;

  constructor(scene: THREE.Scene, world: World, events: EnemyManagerEvents = {}) {
    this.scene = scene;
    this.world = world;
    this.events = events;
  }

  spawn(type: EnemyType, playerPos: THREE.Vector3, minDist = 8): Enemy {
    const pos = this.world.randomSpawnPoint(this.rand, playerPos, minDist);
    const enemy = new Enemy(this.world, type, pos);
    this.enemies.push(enemy);
    this.scene.add(enemy.root);
    return enemy;
  }

  spawnBatch(requests: SpawnRequest[], playerPos: THREE.Vector3): void {
    for (const req of requests) {
      for (let i = 0; i < req.count; i++) {
        this.spawn(req.type, playerPos);
      }
    }
  }

  aliveCount(): number {
    let n = 0;
    for (const e of this.enemies) if (!e.dead) n++;
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
      enemy.update(dt, playerPos);
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
}
