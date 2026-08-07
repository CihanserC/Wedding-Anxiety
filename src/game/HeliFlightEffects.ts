import * as THREE from 'three';

interface DustPuff {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  vz: number;
}

/**
 * Helicopter flight VFX: ground rotor wash / dust, subtle FOV throb, speed vignette.
 */
export class HeliFlightEffects {
  private readonly overlay: HTMLDivElement;
  private heli: THREE.Group | null = null;
  private washLight: THREE.PointLight | null = null;
  private readonly dust: DustPuff[] = [];
  private readonly dustPool: THREE.Mesh[] = [];
  private intensity = 0;
  private time = 0;
  private baseFov = 75;
  private readonly tmp = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'wa-heli-overlay';
    this.overlay.innerHTML = `<div class="wa-heli-vignette"></div>`;
    container.appendChild(this.overlay);
    this.injectStyles();
  }

  private injectStyles(): void {
    if (document.getElementById('wa-heli-styles')) return;
    const style = document.createElement('style');
    style.id = 'wa-heli-styles';
    style.textContent = `
      .wa-heli-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 4;
        opacity: 0;
        transition: opacity 0.18s ease-out;
      }
      .wa-heli-vignette {
        position: absolute;
        inset: 0;
        background: radial-gradient(
          ellipse 75% 55% at 50% 45%,
          transparent 45%,
          rgba(20, 40, 55, 0.22) 100%
        );
      }
    `;
    document.head.appendChild(style);
  }

  attach(heli: THREE.Group): void {
    this.detach();
    this.heli = heli;
    const light = new THREE.PointLight(0xc8b890, 0, 14);
    light.position.set(0, -0.4, 0.1);
    heli.add(light);
    this.washLight = light;
  }

  detach(): void {
    if (this.washLight?.parent) this.washLight.parent.remove(this.washLight);
    this.washLight = null;
    this.heli = null;
    this.clearDust();
    this.intensity = 0;
    this.overlay.style.opacity = '0';
  }

  setBaseFov(fov: number): void {
    this.baseFov = fov;
  }

  update(
    dt: number,
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    opts: {
      rotorIntensity: number;
      speed: number;
      altitude: number;
      grounded: boolean;
      chaseCam: boolean;
    },
  ): void {
    this.time += dt;
    const target = Math.max(0, Math.min(1, opts.rotorIntensity));
    this.intensity += (target - this.intensity) * Math.min(1, 6 * dt);
    const b = this.intensity;
    const speedFactor = Math.min(1, Math.abs(opts.speed) / 30);

    // Subtle FOV throb with rotor (stronger when flying fast)
    if (opts.chaseCam) {
      const throb = Math.sin(this.time * (18 + b * 22)) * b * 0.55;
      const targetFov = this.baseFov + speedFactor * b * 4 + throb;
      camera.fov += (targetFov - camera.fov) * Math.min(1, 8 * dt);
      camera.updateProjectionMatrix();
    }

    this.overlay.style.opacity = String(b * (0.12 + speedFactor * 0.35));

    // Downwash light under belly — brighter near ground
    if (this.washLight) {
      const nearGround = opts.altitude < 8 ? 1 - opts.altitude / 8 : 0;
      this.washLight.intensity = b * (0.4 + nearGround * 2.8 + speedFactor * 0.5);
      this.washLight.distance = 8 + nearGround * 10;
    }

    // Sand / dust kick-up when hovering low
    const wash =
      !opts.grounded && opts.altitude < 7 && b > 0.4
        ? (1 - opts.altitude / 7) * b
        : opts.grounded && b > 0.45
          ? b * 0.35
          : 0;
    if (this.heli && wash > 0.08 && Math.random() < wash * dt * 40) {
      this.spawnDust(scene, wash);
    }
    this.tickDust(dt, scene);
  }

  private spawnDust(scene: THREE.Scene, wash: number): void {
    if (!this.heli) return;
    let mesh = this.dustPool.pop();
    if (!mesh) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0xd2b48c,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      });
      mesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), mat);
    }
    const ang = Math.random() * Math.PI * 2;
    const rad = 0.8 + Math.random() * 2.2;
    this.heli.localToWorld(this.tmp.set(Math.cos(ang) * rad, 0.05, Math.sin(ang) * rad));
    mesh.position.copy(this.tmp);
    mesh.scale.setScalar(0.7 + Math.random() * 0.8);
    scene.add(mesh);

    const outSpeed = 1.5 + wash * 4 + Math.random() * 2;
    this.dust.push({
      mesh,
      life: 0,
      maxLife: 0.35 + Math.random() * 0.4,
      vx: Math.cos(ang) * outSpeed,
      vy: 0.4 + Math.random() * 1.2 + wash * 1.5,
      vz: Math.sin(ang) * outSpeed,
    });
  }

  private tickDust(dt: number, scene: THREE.Scene): void {
    for (let i = this.dust.length - 1; i >= 0; i--) {
      const d = this.dust[i];
      d.life += dt;
      if (d.life >= d.maxLife) {
        scene.remove(d.mesh);
        this.dustPool.push(d.mesh);
        this.dust.splice(i, 1);
        continue;
      }
      const t = d.life / d.maxLife;
      d.mesh.position.x += d.vx * dt;
      d.mesh.position.y += d.vy * dt;
      d.mesh.position.z += d.vz * dt;
      d.vy -= 2.5 * dt;
      d.vx *= 1 - 1.2 * dt;
      d.vz *= 1 - 1.2 * dt;
      const mat = d.mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - t) * 0.65;
      d.mesh.scale.setScalar(0.7 + t * 1.8);
    }
  }

  private clearDust(): void {
    for (const d of this.dust) {
      d.mesh.parent?.remove(d.mesh);
      this.dustPool.push(d.mesh);
    }
    this.dust.length = 0;
  }

  destroy(): void {
    this.detach();
    this.overlay.remove();
  }
}
