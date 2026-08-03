import * as THREE from 'three';

/**
 * Very light "bullet tracer" and muzzle flash: two short-lived meshes that
 * fade out. Managed as a simple pool of active effects.
 */

interface EffectEntry {
  mesh: THREE.Mesh | THREE.Line;
  born: number;
  life: number;
  material: THREE.Material;
}

export class ProjectileEffects {
  private readonly scene: THREE.Scene;
  private readonly effects: EffectEntry[] = [];
  private now = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  spawnTracer(from: THREE.Vector3, to: THREE.Vector3, color = 0xfff4a0): void {
    const geometry = new THREE.BufferGeometry().setFromPoints([from.clone(), to.clone()]);
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.effects.push({ mesh: line, born: this.now, life: 0.12, material });
  }

  spawnMuzzleFlash(position: THREE.Vector3, color = 0xfff2b0, size = 0.08): void {
    const geometry = new THREE.SphereGeometry(size, 8, 8);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.effects.push({ mesh, born: this.now, life: 0.08, material });
  }

  spawnHitSpark(position: THREE.Vector3, color = 0xffd8ff): void {
    const geometry = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    this.scene.add(mesh);
    this.effects.push({ mesh, born: this.now, life: 0.25, material });
  }

  update(dt: number): void {
    this.now += dt;
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      const age = this.now - e.born;
      const t = age / e.life;
      if (t >= 1) {
        this.scene.remove(e.mesh);
        e.mesh.geometry.dispose();
        e.material.dispose();
        this.effects.splice(i, 1);
        continue;
      }
      const mat = e.material as THREE.Material & { opacity: number };
      mat.opacity = 1 - t;
      if (e.mesh instanceof THREE.Mesh) {
        e.mesh.scale.setScalar(1 + t * 0.6);
      }
    }
  }

  dispose(): void {
    for (const e of this.effects) {
      this.scene.remove(e.mesh);
      e.mesh.geometry.dispose();
      e.material.dispose();
    }
    this.effects.length = 0;
  }
}
