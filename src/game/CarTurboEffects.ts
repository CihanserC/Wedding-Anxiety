import * as THREE from 'three';

const EXHAUST_OFFSETS: Array<[number, number, number]> = [
  [-0.35, 0.22, 2.18],
  [0.35, 0.22, 2.18],
];

interface Spark {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  vz: number;
}

/**
 * Turbo VFX for the Lamborghini: exhaust flames, sparks, tail-light glow,
 * chassis pitch, screen speed lines, and FOV punch.
 */
export class CarTurboEffects {
  private readonly overlay: HTMLDivElement;
  private readonly sparks: Spark[] = [];
  private readonly sparkPool: THREE.Mesh[] = [];
  private lambo: THREE.Group | null = null;
  private flameGroup: THREE.Group | null = null;
  private exhaustLight: THREE.PointLight | null = null;
  private tailLights: THREE.Mesh[] = [];
  private chassis: THREE.Object3D | null = null;
  private wing: THREE.Object3D | null = null;
  private turboBlend = 0;
  private time = 0;
  private baseFov = 75;
  private readonly tmpVec = new THREE.Vector3();
  private readonly tmpBack = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'wa-turbo-overlay';
    this.overlay.innerHTML = `
      <div class="wa-turbo-vignette"></div>
      <div class="wa-turbo-streaks" aria-hidden="true">
        ${Array.from({ length: 12 }, (_, i) => `<div class="wa-turbo-streak" style="--i:${i}"></div>`).join('')}
      </div>
    `;
    container.appendChild(this.overlay);
    this.injectStyles();
  }

  private injectStyles(): void {
    if (document.getElementById('wa-turbo-styles')) return;
    const style = document.createElement('style');
    style.id = 'wa-turbo-styles';
    style.textContent = `
      .wa-turbo-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 4;
        opacity: 0;
        transition: opacity 0.12s ease-out;
      }
      .wa-turbo-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(255, 120, 40, 0.18) 100%);
        opacity: 0;
        transition: opacity 0.15s;
      }
      .wa-turbo-streaks {
        position: absolute;
        inset: 0;
        overflow: hidden;
      }
      .wa-turbo-streak {
        position: absolute;
        top: calc(10% + (var(--i) * 7%));
        left: -30%;
        width: 45%;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(255, 220, 160, 0.7), transparent);
        opacity: 0;
        transform: translateX(0);
        animation: wa-turbo-streak 0.35s linear infinite;
        animation-delay: calc(var(--i) * -0.05s);
        animation-play-state: paused;
      }
      .wa-turbo-overlay.active .wa-turbo-streak {
        animation-play-state: running;
      }
      .wa-turbo-overlay.active .wa-turbo-vignette {
        opacity: 1;
      }
      @keyframes wa-turbo-streak {
        0% { transform: translateX(0); opacity: 0; }
        15% { opacity: 0.85; }
        100% { transform: translateX(320%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  attach(lambo: THREE.Group): void {
    this.detach();
    this.lambo = lambo;
    this.chassis = lambo.getObjectByName('lambo-chassis') ?? null;
    this.wing = null;
    this.tailLights = [];
    lambo.traverse((obj) => {
      if (obj.userData.lamboWing) this.wing = obj;
      if (obj.name === 'lambo-tail-light' && obj instanceof THREE.Mesh) {
        this.tailLights.push(obj);
      }
    });

    const flames = new THREE.Group();
    flames.name = 'turbo-flames';
    for (const [x, y, z] of EXHAUST_OFFSETS) {
      const flame = this.buildFlameMesh();
      flame.position.set(x, y, z);
      flames.add(flame);
    }
    lambo.add(flames);
    this.flameGroup = flames;

    const light = new THREE.PointLight(0xff6620, 0, 5);
    light.position.set(0, 0.35, 2.25);
    lambo.add(light);
    this.exhaustLight = light;
  }

  detach(): void {
    if (this.flameGroup?.parent) this.flameGroup.parent.remove(this.flameGroup);
    if (this.exhaustLight?.parent) this.exhaustLight.parent.remove(this.exhaustLight);
    this.flameGroup = null;
    this.exhaustLight = null;
    this.lambo = null;
    this.chassis = null;
    this.wing = null;
    this.tailLights = [];
    this.clearSparks();
    this.turboBlend = 0;
    this.overlay.classList.remove('active');
    this.overlay.style.opacity = '0';
  }

  setBaseFov(fov: number): void {
    this.baseFov = fov;
  }

  /** @returns smoothed turbo blend 0..1 */
  getBlend(): number {
    return this.turboBlend;
  }

  update(
    dt: number,
    camera: THREE.PerspectiveCamera,
    turboActive: boolean,
    speed: number,
    scene: THREE.Scene,
  ): void {
    this.time += dt;
    const target = turboActive && speed > 0.5 ? 1 : 0;
    const rate = target > this.turboBlend ? 5.5 : 3.2;
    this.turboBlend += (target - this.turboBlend) * Math.min(1, rate * dt);

    const b = this.turboBlend;
    const speedFactor = Math.min(1, Math.abs(speed) / 14);

    // FOV punch
    const turboFov = this.baseFov + b * 13 + speedFactor * b * 4;
    camera.fov += (turboFov - camera.fov) * Math.min(1, 8 * dt);
    camera.updateProjectionMatrix();

    // Screen overlay
    const overlayOpacity = b * (0.35 + speedFactor * 0.45);
    this.overlay.style.opacity = String(overlayOpacity);
    if (b > 0.15) this.overlay.classList.add('active');
    else this.overlay.classList.remove('active');

    // Exhaust flames
    if (this.flameGroup) {
      this.flameGroup.visible = b > 0.04;
      const pulse = 0.85 + Math.sin(this.time * 42) * 0.15;
      const scaleY = (0.4 + b * 1.6) * pulse;
      const scaleXZ = 0.7 + b * 0.5;
      for (const child of this.flameGroup.children) {
        child.scale.set(scaleXZ, scaleY, scaleXZ * 0.8);
        child.rotation.y = Math.sin(this.time * 28) * 0.12;
      }
    }

    if (this.exhaustLight) {
      this.exhaustLight.intensity = b * (2.5 + speedFactor * 2);
      this.exhaustLight.color.setHSL(0.06 + Math.sin(this.time * 30) * 0.02, 1, 0.55);
    }

    // Tail lights brighten
    for (const light of this.tailLights) {
      const mat = light.material as THREE.MeshLambertMaterial;
      mat.emissiveIntensity = 0.55 + b * 1.4;
    }

    // Chassis squat / nose lift
    if (this.chassis) {
      const accelPitch = -Math.min(0.055, Math.abs(speed) * 0.0035) - b * 0.035;
      this.chassis.rotation.x += (accelPitch - this.chassis.rotation.x) * Math.min(1, 10 * dt);
    }
    if (this.wing) {
      const wingAngle = b * -0.22;
      this.wing.rotation.x += (wingAngle - this.wing.rotation.x) * Math.min(1, 8 * dt);
    }

    // Sparks from exhaust
    if (b > 0.25 && this.lambo && Math.random() < b * speedFactor * dt * 28) {
      for (const [x, y, z] of EXHAUST_OFFSETS) {
        this.spawnSpark(this.lambo, x, y, z, scene);
      }
    }
    this.tickSparks(dt, scene);
  }

  private buildFlameMesh(): THREE.Group {
    const g = new THREE.Group();
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xfff0a0,
      transparent: true,
      opacity: 0.95,
    });
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0xff5500,
      transparent: true,
      opacity: 0.65,
    });
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.1), coreMat);
    core.position.y = 0.18;
    g.add(core);
    const outer = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.14), outerMat);
    outer.position.y = 0.22;
    g.add(outer);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.08), outerMat);
    tip.position.y = 0.48;
    g.add(tip);
    return g;
  }

  private spawnSpark(lambo: THREE.Group, lx: number, ly: number, lz: number, scene: THREE.Scene): void {
    let mesh = this.sparkPool.pop();
    if (!mesh) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffcc44,
        transparent: true,
        opacity: 1,
      });
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), mat);
    }
    lambo.localToWorld(this.tmpVec.set(lx, ly, lz));
    mesh.position.copy(this.tmpVec);
    scene.add(mesh);
    this.tmpBack.set(0, 0, 1).applyQuaternion(lambo.quaternion);
    const spread = 0.6 + this.turboBlend * 1.2;
    const backSpeed = 2.5 + Math.random() * 2.5 + this.turboBlend * 3;
    this.sparks.push({
      mesh,
      life: 0,
      maxLife: 0.18 + Math.random() * 0.14,
      vx: this.tmpBack.x * backSpeed + (Math.random() - 0.5) * spread,
      vy: Math.random() * 0.8 + 0.3,
      vz: this.tmpBack.z * backSpeed + (Math.random() - 0.5) * spread,
    });
  }

  private tickSparks(dt: number, scene: THREE.Scene): void {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const s = this.sparks[i];
      s.life += dt;
      if (s.life >= s.maxLife) {
        scene.remove(s.mesh);
        this.sparkPool.push(s.mesh);
        this.sparks.splice(i, 1);
        continue;
      }
      const t = s.life / s.maxLife;
      s.mesh.position.x += s.vx * dt;
      s.mesh.position.y += s.vy * dt;
      s.mesh.position.z += s.vz * dt;
      s.vy -= 4 * dt;
      const mat = s.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 1 - t;
      s.mesh.scale.setScalar(1 - t * 0.6);
    }
  }

  private clearSparks(): void {
    for (const s of this.sparks) {
      s.mesh.parent?.remove(s.mesh);
      this.sparkPool.push(s.mesh);
    }
    this.sparks.length = 0;
  }

  destroy(): void {
    this.detach();
    this.overlay.remove();
    document.getElementById('wa-turbo-styles')?.remove();
  }
}
