import * as THREE from 'three';
import type { World } from './World';

interface Fireball {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  radius: number;
  anxietyHit: number;
}

const PLAYER_HEIGHT = 1.75;

export class EnemyProjectileManager {
  private readonly scene: THREE.Scene;
  private readonly fireballs: Fireball[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnFireball(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    speed = 7,
    anxietyHit = 8,
    color = 0xff3318,
  ): void {
    const dir = direction.clone().normalize();
    const radius = color === 0x9b4de0 ? 0.24 : color === 0xff1200 ? 0.26 : 0.22;
    const geometry = new THREE.SphereGeometry(radius, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.92,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(origin);
    this.scene.add(mesh);
    this.fireballs.push({
      mesh,
      velocity: dir.multiplyScalar(speed),
      radius: radius + 0.06,
      anxietyHit,
    });
  }

  update(
    dt: number,
    playerPos: THREE.Vector3,
    world: World,
    onHit: (anxietyAmount: number) => void,
  ): void {
    const playerMinY = playerPos.y;
    const playerMaxY = playerPos.y + PLAYER_HEIGHT;
    const playerCenter = new THREE.Vector3(
      playerPos.x,
      playerPos.y + PLAYER_HEIGHT * 0.5,
      playerPos.z,
    );

    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.mesh.position.addScaledVector(fb.velocity, dt);

      const bx = Math.floor(fb.mesh.position.x);
      const by = Math.floor(fb.mesh.position.y);
      const bz = Math.floor(fb.mesh.position.z);
      if (world.isSolidAt(bx, by, bz) || world.isSolidAt(bx, by - 1, bz)) {
        this.removeAt(i);
        continue;
      }

      const ballMinY = fb.mesh.position.y - fb.radius;
      const ballMaxY = fb.mesh.position.y + fb.radius;
      const verticalOverlap = Math.min(playerMaxY, ballMaxY) - Math.max(playerMinY, ballMinY);
      const dx = fb.mesh.position.x - playerCenter.x;
      const dz = fb.mesh.position.z - playerCenter.z;
      const distXZ = Math.sqrt(dx * dx + dz * dz);
      if (distXZ < 0.75 + fb.radius && verticalOverlap > 0.2) {
        onHit(fb.anxietyHit);
        this.removeAt(i);
        continue;
      }

      if (fb.mesh.position.y < -2 || fb.mesh.position.y > 40) {
        this.removeAt(i);
      }
    }
  }

  clear(): void {
    while (this.fireballs.length > 0) this.removeAt(0);
  }

  private removeAt(index: number): void {
    const fb = this.fireballs[index];
    this.scene.remove(fb.mesh);
    fb.mesh.geometry.dispose();
    (fb.mesh.material as THREE.Material).dispose();
    this.fireballs.splice(index, 1);
  }
}
