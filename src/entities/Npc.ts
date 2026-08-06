import * as THREE from 'three';
import { NPC_STATS, type NpcType } from '../data/npcs';
import type { World } from '../game/World';
import { buildNpcMesh } from './npcMeshes';

const WANDER_SPEED: Partial<Record<NpcType, number>> = {
  camel: 0.7,
  'arab-man': 1.05,
  'arab-woman': 0.95,
};

/**
 * World NPC. Bride/groom stay put; Dubai locals can slowly wander near home.
 */
export class Npc {
  readonly stats;
  readonly root: THREE.Group;
  readonly position: THREE.Vector3;
  readonly wander: boolean;
  private readonly home = new THREE.Vector3();
  private readonly wanderRadius: number;
  private readonly wanderDir = new THREE.Vector3(1, 0, 0);
  private wanderTimer = 1 + Math.random() * 2;
  private stuckTime = 0;
  private bobPhase = Math.random() * Math.PI * 2;
  private grounded = false;

  constructor(
    type: NpcType,
    position: THREE.Vector3,
    rotationY: number,
    pose: 'standing' | 'sitting' = 'standing',
    wander = false,
    wanderRadius = 6,
    variant = 0,
  ) {
    this.stats = NPC_STATS[type];
    this.position = position.clone();
    this.home.copy(position);
    this.wander = wander;
    this.wanderRadius = wanderRadius;
    this.root = buildNpcMesh(type, pose, variant);
    this.root.position.copy(this.position);
    this.root.rotation.y = rotationY;
    this.wanderDir.set(Math.sin(rotationY), 0, Math.cos(rotationY));
  }

  /** Place feet on the top solid surface so the body is not inside the floor. */
  snapToGround(world: World, resetHome = false): void {
    const standY = this.groundY(world, this.position.x, this.position.z);
    if (standY === null) return;
    this.position.y = standY;
    this.root.position.y = standY;
    if (resetHome) {
      this.home.set(this.position.x, standY, this.position.z);
    } else {
      this.home.y = standY;
    }
    this.grounded = true;
  }

  update(dt: number, world: World): void {
    if (!this.wander) return;

    if (!this.grounded) this.snapToGround(world);

    this.wanderTimer -= dt;
    if (this.wanderTimer <= 0) {
      this.pickNewDirection();
      this.wanderTimer = 2.8 + Math.random() * 3.2;
    }

    // Soft pull back toward home when past the leash
    const dxHome = this.position.x - this.home.x;
    const dzHome = this.position.z - this.home.z;
    const distHome = Math.hypot(dxHome, dzHome);
    if (distHome > this.wanderRadius) {
      this.wanderDir.set(-dxHome / distHome, 0, -dzHome / distHome);
      this.wanderTimer = 1.5 + Math.random();
    }

    const speed = WANDER_SPEED[this.stats.type] ?? 0.9;
    const beforeX = this.position.x;
    const beforeZ = this.position.z;
    this.tryMove(world, this.wanderDir.x * speed * dt, this.wanderDir.z * speed * dt);

    // Follow terrain height after each step
    const standY = this.groundY(world, this.position.x, this.position.z);
    if (standY !== null) this.position.y = standY;

    const moved =
      Math.abs(this.position.x - beforeX) + Math.abs(this.position.z - beforeZ) > 1e-4;

    if (!moved) {
      this.stuckTime += dt;
      // Only turn after a short stuck window — prevents per-frame spin
      if (this.stuckTime > 0.2) {
        this.turnAwayFromWall();
        this.wanderTimer = 1.2 + Math.random() * 0.8;
        this.stuckTime = 0;
      }
    } else {
      this.stuckTime = 0;
      this.root.rotation.y = Math.atan2(this.wanderDir.x, this.wanderDir.z);
    }

    this.root.position.x = this.position.x;
    this.root.position.z = this.position.z;

    this.bobPhase += dt * (moved ? 5 : 1.5);
    this.root.position.y = this.position.y + (moved ? Math.sin(this.bobPhase) * 0.025 : 0);
  }

  private pickNewDirection(): void {
    const angle = Math.random() * Math.PI * 2;
    this.wanderDir.set(Math.sin(angle), 0, Math.cos(angle));
  }

  private turnAwayFromWall(): void {
    const current = Math.atan2(this.wanderDir.x, this.wanderDir.z);
    const turn = (0.55 + Math.random() * 0.9) * Math.PI * (Math.random() < 0.5 ? 1 : -1);
    const next = current + turn;
    this.wanderDir.set(Math.sin(next), 0, Math.cos(next));
    this.root.rotation.y = next;
  }

  private groundY(world: World, x: number, z: number): number | null {
    const fx = Math.floor(x);
    const fz = Math.floor(z);
    for (let y = world.height - 1; y >= 0; y--) {
      if (!world.isSolidAt(fx, y, fz)) continue;
      // Prefer walkable ground — skip floating skyline chunks high above desert
      if (y > 6) continue;
      return y + 1.01;
    }
    return null;
  }

  private tryMove(world: World, dx: number, dz: number): void {
    if (dx !== 0) {
      const original = this.position.x;
      this.position.x = original + dx;
      if (this.collides(world) || !this.canStandAt(world, this.position.x, this.position.z)) {
        this.position.x = original;
      }
    }
    if (dz !== 0) {
      const original = this.position.z;
      this.position.z = original + dz;
      if (this.collides(world) || !this.canStandAt(world, this.position.x, this.position.z)) {
        this.position.z = original;
      }
    }
  }

  /** Reject steps onto missing / too-steep ground. */
  private canStandAt(world: World, x: number, z: number): boolean {
    const nextY = this.groundY(world, x, z);
    if (nextY === null) return false;
    // Don't climb more than ~1.2 blocks in one step
    if (Math.abs(nextY - this.position.y) > 1.25) return false;
    return true;
  }

  private collides(world: World): boolean {
    const r = this.stats.radius;
    // Body starts slightly above feet so the floor voxel is never sampled
    const min = new THREE.Vector3(
      this.position.x - r,
      this.position.y + 0.08,
      this.position.z - r,
    );
    const max = new THREE.Vector3(
      this.position.x + r,
      this.position.y + this.stats.height * 0.9,
      this.position.z + r,
    );
    return world.boxCollides(min, max);
  }

  dispose(): void {
    this.root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        const mat = obj.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat.dispose();
      }
    });
  }
}
