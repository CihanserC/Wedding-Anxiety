import * as THREE from 'three';
import type { Enemy, EnemyUpdateEvents } from '../entities/Enemy';
import type { ProjectileEffects } from '../entities/Projectile';
import type { World } from './World';
import { WEAPONS, type WeaponDefinition, type WeaponId } from '../data/weapons';

export interface FireResult {
  hitEnemy: Enemy | null;
  killedEnemy: Enemy | null;
  hitPoint: THREE.Vector3;
  recoil: number;
}

export class WeaponSystem {
  private cooldown = 0;
  private currentCooldownMax = 0.22;
  private readonly effects: ProjectileEffects;
  private world: World;

  constructor(world: World, effects: ProjectileEffects) {
    this.world = world;
    this.effects = effects;
  }

  setWorld(world: World): void {
    this.world = world;
  }

  update(dt: number): void {
    if (this.cooldown > 0) this.cooldown -= dt;
  }

  canFire(): boolean {
    return this.cooldown <= 0;
  }

  cooldownRatio(): number {
    if (this.currentCooldownMax <= 0) return 0;
    return Math.max(0, Math.min(1, this.cooldown / this.currentCooldownMax));
  }

  fire(
    weaponId: WeaponId,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    enemies: Enemy[],
    enemyEvents?: EnemyUpdateEvents,
  ): FireResult | null {
    if (!this.canFire()) return null;
    const weapon = WEAPONS[weaponId];
    this.cooldown = weapon.cooldown;
    this.currentCooldownMax = weapon.cooldown;

    let bestHitEnemy: Enemy | null = null;
    let killed: Enemy | null = null;
    let hitPoint = origin.clone().addScaledVector(direction, weapon.range);

    const right = tempRight(direction);
    const up = tempUp(direction, right);

    for (let p = 0; p < weapon.pellets; p++) {
      const pelletDir = direction.clone();
      if (weapon.spread > 0) {
        const angleX = (Math.random() - 0.5) * weapon.spread;
        const angleY = (Math.random() - 0.5) * weapon.spread;
        pelletDir.addScaledVector(right, angleX).addScaledVector(up, angleY).normalize();
      }

      const end = this.fireOneRay(weapon, origin, pelletDir, enemies, enemyEvents);
      if (end.hitEnemy && !bestHitEnemy) bestHitEnemy = end.hitEnemy;
      if (end.killedEnemy && !killed) killed = end.killedEnemy;
      if (p === 0) hitPoint = end.point;
    }

    const muzzle = origin.clone().addScaledVector(direction, 0.6);
    muzzle.y -= 0.15;
    this.effects.spawnMuzzleFlash(muzzle, weapon.muzzleColor, weapon.muzzleSize);

    return {
      hitEnemy: bestHitEnemy,
      killedEnemy: killed,
      hitPoint,
      recoil: weapon.recoil,
    };
  }

  private fireOneRay(
    weapon: WeaponDefinition,
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    enemies: Enemy[],
    enemyEvents?: EnemyUpdateEvents,
  ): { point: THREE.Vector3; hitEnemy: Enemy | null; killedEnemy: Enemy | null } {
    const worldHit = this.raycastWorld(origin, direction, weapon.range);
    const enemyHit = this.raycastEnemies(
      origin,
      direction,
      enemies,
      worldHit?.distance ?? weapon.range,
    );

    let end: THREE.Vector3;
    let hitEnemy: Enemy | null = null;
    let killedEnemy: Enemy | null = null;

    if (enemyHit) {
      end = enemyHit.point;
      hitEnemy = enemyHit.enemy;
      const killedNow = enemyHit.enemy.applyHitWithEvents(weapon.damage, enemyEvents);
      if (killedNow) killedEnemy = enemyHit.enemy;
      this.effects.spawnHitSpark(end, enemyHit.enemy.stats.accentColor);
    } else if (worldHit) {
      end = worldHit.point;
      this.effects.spawnHitSpark(end, 0xfff4a0);
    } else {
      end = origin.clone().addScaledVector(direction, weapon.range);
    }

    const muzzle = origin.clone().addScaledVector(direction, 0.6);
    muzzle.y -= 0.15;
    this.effects.spawnTracer(muzzle, end, weapon.tracerColor);

    return { point: end, hitEnemy, killedEnemy };
  }

  private raycastWorld(
    origin: THREE.Vector3,
    dir: THREE.Vector3,
    maxRange: number,
  ): { point: THREE.Vector3; distance: number } | null {
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
    for (let i = 0; i < maxRange * 3; i++) {
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
      if (t > maxRange) break;
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
      if (enemy.dead || enemy.dying) continue;
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

function tempRight(dir: THREE.Vector3): THREE.Vector3 {
  const up = new THREE.Vector3(0, 1, 0);
  const r = new THREE.Vector3().crossVectors(dir, up);
  if (r.lengthSq() < 1e-6) r.set(1, 0, 0);
  return r.normalize();
}

function tempUp(dir: THREE.Vector3, right: THREE.Vector3): THREE.Vector3 {
  return new THREE.Vector3().crossVectors(right, dir).normalize();
}
