import * as THREE from 'three';
import type { Enemy } from '../entities/Enemy';
import type { ProjectileEffects } from '../entities/Projectile';
import type { World } from './World';

const RAY_MAX = 60;
const DAMAGE = 1;
const COOLDOWN = 0.22;

export interface FireResult {
  hitEnemy: Enemy | null;
  killedEnemy: Enemy | null;
  hitPoint: THREE.Vector3;
}

export class WeaponSystem {
  private cooldown = 0;
  private readonly effects: ProjectileEffects;
  private readonly world: World;

  constructor(world: World, effects: ProjectileEffects) {
    this.world = world;
    this.effects = effects;
  }

  update(dt: number): void {
    if (this.cooldown > 0) this.cooldown -= dt;
  }

  canFire(): boolean {
    return this.cooldown <= 0;
  }

  cooldownRatio(): number {
    return Math.max(0, Math.min(1, this.cooldown / COOLDOWN));
  }

  fire(origin: THREE.Vector3, direction: THREE.Vector3, enemies: Enemy[]): FireResult | null {
    if (!this.canFire()) return null;
    this.cooldown = COOLDOWN;

    const worldHit = this.raycastWorld(origin, direction);
    const enemyHit = this.raycastEnemies(origin, direction, enemies, worldHit?.distance ?? RAY_MAX);

    let end: THREE.Vector3;
    let killed: Enemy | null = null;
    let hitEnemyResult: Enemy | null = null;

    if (enemyHit) {
      end = enemyHit.point;
      const killedNow = enemyHit.enemy.applyHit(DAMAGE);
      hitEnemyResult = enemyHit.enemy;
      if (killedNow) killed = enemyHit.enemy;
      this.effects.spawnHitSpark(end, enemyHit.enemy.stats.accentColor);
    } else if (worldHit) {
      end = worldHit.point;
      this.effects.spawnHitSpark(end, 0xfff4a0);
    } else {
      end = origin.clone().addScaledVector(direction, RAY_MAX);
    }

    const muzzle = origin.clone().addScaledVector(direction, 0.6);
    muzzle.y -= 0.15;
    this.effects.spawnMuzzleFlash(muzzle);
    this.effects.spawnTracer(muzzle, end);

    return { hitEnemy: hitEnemyResult, killedEnemy: killed, hitPoint: end };
  }

  /**
   * Cheap voxel raycast using a bounded DDA. Steps up to RAY_MAX voxels.
   * Returns the world-space hit point on the first solid block or null.
   */
  private raycastWorld(origin: THREE.Vector3, dir: THREE.Vector3): { point: THREE.Vector3; distance: number } | null {
    let x = Math.floor(origin.x);
    let y = Math.floor(origin.y);
    let z = Math.floor(origin.z);

    const stepX = dir.x > 0 ? 1 : dir.x < 0 ? -1 : 0;
    const stepY = dir.y > 0 ? 1 : dir.y < 0 ? -1 : 0;
    const stepZ = dir.z > 0 ? 1 : dir.z < 0 ? -1 : 0;

    const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
    const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
    const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;

    const nextBoundary = (o: number, s: number) =>
      s > 0 ? Math.floor(o) + 1 : Math.floor(o);
    let tMaxX = stepX !== 0 ? (nextBoundary(origin.x, stepX) - origin.x) / dir.x : Infinity;
    let tMaxY = stepY !== 0 ? (nextBoundary(origin.y, stepY) - origin.y) / dir.y : Infinity;
    let tMaxZ = stepZ !== 0 ? (nextBoundary(origin.z, stepZ) - origin.z) / dir.z : Infinity;

    let t = 0;
    for (let i = 0; i < RAY_MAX * 3; i++) {
      if (this.world.isSolidAt(x, y, z)) {
        const point = origin.clone().addScaledVector(dir, t);
        return { point, distance: t };
      }
      if (tMaxX < tMaxY && tMaxX < tMaxZ) {
        t = tMaxX;
        tMaxX += tDeltaX;
        x += stepX;
      } else if (tMaxY < tMaxZ) {
        t = tMaxY;
        tMaxY += tDeltaY;
        y += stepY;
      } else {
        t = tMaxZ;
        tMaxZ += tDeltaZ;
        z += stepZ;
      }
      if (t > RAY_MAX) break;
    }
    return null;
  }

  private raycastEnemies(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    enemies: Enemy[],
    maxDistance: number,
  ): { enemy: Enemy; point: THREE.Vector3; distance: number } | null {
    const ray = new THREE.Ray(origin, dir);
    let best: { enemy: Enemy; point: THREE.Vector3; distance: number } | null = null;
    const tmp = new THREE.Vector3();
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      const box = enemy.getBox();
      const hit = ray.intersectBox(box, tmp);
      if (!hit) continue;
      const dist = hit.distanceTo(origin);
      if (dist > maxDistance) continue;
      if (!best || dist < best.distance) {
        best = { enemy, point: hit.clone(), distance: dist };
      }
    }
    return best;
  }
}
