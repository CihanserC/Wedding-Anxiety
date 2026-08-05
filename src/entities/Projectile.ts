import * as THREE from 'three';

/**
 * Very light "bullet tracer" and muzzle flash: two short-lived meshes that
 * fade out. Managed as a simple pool of active effects.
 */

interface EffectEntry {
  object: THREE.Object3D;
  born: number;
  life: number;
  materials: THREE.Material[];
  floatY?: number;
  bobPhase?: number;
}

interface LaserBoltEntry {
  group: THREE.Group;
  from: THREE.Vector3;
  to: THREE.Vector3;
  born: number;
  travelTime: number;
  fadeTime: number;
  materials: THREE.MeshBasicMaterial[];
}

export class ProjectileEffects {
  private readonly scene: THREE.Scene;
  private readonly effects: EffectEntry[] = [];
  private readonly laserBolts: LaserBoltEntry[] = [];
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
    this.effects.push({ object: line, born: this.now, life: 0.12, materials: [material] });
  }

  /** Thin elongated Star Wars-style bolt: white core + colored glow halo. */
  spawnLaserBolt(from: THREE.Vector3, to: THREE.Vector3, color = 0xff2020): void {
    const dir = to.clone().sub(from);
    const distance = dir.length();
    if (distance < 0.05) return;
    dir.normalize();

    const group = new THREE.Group();
    const glowMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.6,
    });
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.95), glowMat);
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.045, 0.88), coreMat);
    group.add(glow, core);

    group.position.copy(from);
    group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
    this.scene.add(group);

    const travelTime = Math.min(0.2, Math.max(0.08, distance / 90));
    this.laserBolts.push({
      group,
      from: from.clone(),
      to: to.clone(),
      born: this.now,
      travelTime,
      fadeTime: 0.06,
      materials: [glowMat, coreMat],
    });
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
    this.effects.push({ object: mesh, born: this.now, life: 0.08, materials: [material] });
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
    this.effects.push({ object: mesh, born: this.now, life: 0.25, materials: [material] });
  }

  spawnBossFireBurst(position: THREE.Vector3): void {
    const colors = [0xff3300, 0xff6600, 0xffaa22];
    for (let i = 0; i < 9; i++) {
      const size = 0.18 + Math.random() * 0.28;
      const geometry = new THREE.SphereGeometry(size, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: colors[i % colors.length],
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 1.4;
      mesh.position.y += Math.random() * 1.6;
      mesh.position.z += (Math.random() - 0.5) * 1.4;
      this.scene.add(mesh);
      this.effects.push({
        object: mesh,
        born: this.now,
        life: 0.35 + Math.random() * 0.35,
        materials: [material],
      });
    }
  }

  spawnBalloonPop(position: THREE.Vector3, color: number): void {
    const flashGeom = new THREE.SphereGeometry(0.4, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.75,
    });
    const flash = new THREE.Mesh(flashGeom, flashMat);
    flash.position.copy(position);
    this.scene.add(flash);
    this.effects.push({ object: flash, born: this.now, life: 0.14, materials: [flashMat] });

    const shardColors = [color, 0xffffff, color, 0xfff0f5];
    for (let i = 0; i < 12; i++) {
      const size = 0.05 + Math.random() * 0.1;
      const geometry = new THREE.SphereGeometry(size, 5, 5);
      const material = new THREE.MeshBasicMaterial({
        color: shardColors[i % shardColors.length],
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 0.35;
      mesh.position.y += (Math.random() - 0.5) * 0.35;
      mesh.position.z += (Math.random() - 0.5) * 0.35;
      this.scene.add(mesh);
      this.effects.push({
        object: mesh,
        born: this.now,
        life: 0.28 + Math.random() * 0.22,
        materials: [material],
      });
    }
  }

  /** Minik kalpler — 2 sn boyunca yukarı süzülür ve solar. */
  spawnFloatingHearts(origin: THREE.Vector3): void {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const heart = this.buildHeartMesh();
      heart.position.copy(origin);
      heart.position.x += (i - (count - 1) / 2) * 0.14 + (Math.random() - 0.5) * 0.06;
      heart.position.y += 0.34 + Math.random() * 0.1;
      heart.position.z += (Math.random() - 0.5) * 0.06;
      this.scene.add(heart);
      const materials: THREE.Material[] = [];
      heart.traverse((child) => {
        if (child instanceof THREE.Mesh) materials.push(child.material as THREE.Material);
      });
      this.effects.push({
        object: heart,
        born: this.now,
        life: 2.0,
        materials,
        floatY: 0.25 + Math.random() * 0.15,
        bobPhase: Math.random() * Math.PI * 2,
      });
    }
  }

  private buildHeartMesh(): THREE.Group {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: 0xff6b9d, transparent: true, opacity: 1 });
    const left = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat);
    left.position.set(-0.035, 0, 0);
    const right = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat);
    right.position.set(0.035, 0, 0);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 6, 6), mat);
    tip.position.set(0, -0.04, 0);
    tip.scale.set(1.1, 0.75, 0.7);
    g.add(left, right, tip);
    return g;
  }

  spawnBossDustBurst(position: THREE.Vector3): void {
    for (let i = 0; i < 12; i++) {
      const size = 0.1 + Math.random() * 0.22;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const gray = 0x777777 + Math.floor(Math.random() * 0x444444);
      const material = new THREE.MeshBasicMaterial({
        color: gray,
        transparent: true,
        opacity: 0.75,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(position);
      mesh.position.x += (Math.random() - 0.5) * 1.8;
      mesh.position.y += 0.2 + Math.random() * 0.8;
      mesh.position.z += (Math.random() - 0.5) * 1.8;
      this.scene.add(mesh);
      this.effects.push({
        object: mesh,
        born: this.now,
        life: 0.55 + Math.random() * 0.45,
        materials: [material],
      });
    }
  }

  update(dt: number): void {
    this.now += dt;
    for (let i = this.effects.length - 1; i >= 0; i--) {
      const e = this.effects[i];
      const age = this.now - e.born;
      const t = age / e.life;
      if (t >= 1) {
        this.scene.remove(e.object);
        disposeObject3D(e.object);
        for (const mat of e.materials) {
          if (!matUsedElsewhere(mat, this.effects, e)) mat.dispose();
        }
        this.effects.splice(i, 1);
        continue;
      }
      const opacity = 1 - t;
      for (const mat of e.materials) {
        (mat as THREE.Material & { opacity: number }).opacity = opacity;
      }
      if (e.floatY) {
        e.object.position.y += e.floatY * dt;
      }
      if (e.bobPhase !== undefined) {
        e.object.position.x += Math.sin(this.now * 3.5 + e.bobPhase) * dt * 0.15;
      }
      if (e.object instanceof THREE.Mesh) {
        e.object.scale.setScalar(1 + t * 0.6);
      } else if (e.floatY) {
        const pulse = 1 + Math.sin(t * Math.PI) * 0.15;
        e.object.scale.setScalar(pulse);
      }
    }

    for (let i = this.laserBolts.length - 1; i >= 0; i--) {
      const bolt = this.laserBolts[i];
      const age = this.now - bolt.born;
      const totalLife = bolt.travelTime + bolt.fadeTime;
      if (age >= totalLife) {
        this.scene.remove(bolt.group);
        for (const child of bolt.group.children) {
          const mesh = child as THREE.Mesh;
          mesh.geometry.dispose();
        }
        for (const mat of bolt.materials) mat.dispose();
        this.laserBolts.splice(i, 1);
        continue;
      }

      const travelT = Math.min(1, age / bolt.travelTime);
      bolt.group.position.lerpVectors(bolt.from, bolt.to, travelT);

      if (age > bolt.travelTime) {
        const fadeT = (age - bolt.travelTime) / bolt.fadeTime;
        const opacity = 1 - fadeT;
        for (const mat of bolt.materials) mat.opacity = opacity;
      }
    }
  }

  dispose(): void {
    for (const e of this.effects) {
      this.scene.remove(e.object);
      disposeObject3D(e.object);
      for (const mat of e.materials) {
        if (!matUsedElsewhere(mat, this.effects, e)) mat.dispose();
      }
    }
    this.effects.length = 0;

    for (const bolt of this.laserBolts) {
      this.scene.remove(bolt.group);
      for (const child of bolt.group.children) {
        const mesh = child as THREE.Mesh;
        mesh.geometry.dispose();
      }
      for (const mat of bolt.materials) mat.dispose();
    }
    this.laserBolts.length = 0;
  }
}

function disposeObject3D(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      child.geometry.dispose();
    }
  });
}

function matUsedElsewhere(mat: THREE.Material, effects: EffectEntry[], skip: EffectEntry): boolean {
  for (const e of effects) {
    if (e === skip) continue;
    if (e.materials.includes(mat)) return true;
  }
  return false;
}
