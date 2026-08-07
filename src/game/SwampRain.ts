import * as THREE from 'three';

const DROP_COUNT = 1400;
const FALL_SPEED = 14;
const AREA = 28;
const HEIGHT = 16;

/**
 * Continuous rain particle sheet for the misty swamp planet.
 */
export class SwampRain {
  private points: THREE.Points | null = null;
  private positions: Float32Array | null = null;
  private active = false;

  attach(scene: THREE.Scene): void {
    this.dispose(scene);
    const positions = new Float32Array(DROP_COUNT * 3);
    for (let i = 0; i < DROP_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * AREA * 2;
      positions[i * 3 + 1] = Math.random() * HEIGHT + 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * AREA * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xa8c0b0,
      size: 0.08,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
      sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    points.name = 'swamp-rain';
    points.frustumCulled = false;
    scene.add(points);
    this.points = points;
    this.positions = positions;
    this.active = true;
  }

  update(dt: number, camera: THREE.Camera): void {
    if (!this.active || !this.points || !this.positions) return;
    const cx = camera.position.x;
    const cz = camera.position.z;
    this.points.position.set(cx, 0, cz);

    const pos = this.positions;
    for (let i = 0; i < DROP_COUNT; i++) {
      const iy = i * 3 + 1;
      pos[iy] -= FALL_SPEED * dt * (0.75 + (i % 5) * 0.08);
      if (pos[iy] < 1.2) {
        pos[i * 3] = (Math.random() - 0.5) * AREA * 2;
        pos[iy] = HEIGHT + Math.random() * 4;
        pos[i * 3 + 2] = (Math.random() - 0.5) * AREA * 2;
      }
    }
    const attr = this.points.geometry.getAttribute('position') as THREE.BufferAttribute;
    attr.needsUpdate = true;
  }

  dispose(scene: THREE.Scene): void {
    this.active = false;
    if (!this.points) return;
    scene.remove(this.points);
    this.points.geometry.dispose();
    const mat = this.points.material;
    if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
    else mat.dispose();
    this.points = null;
    this.positions = null;
  }

  isActive(): boolean {
    return this.active;
  }
}
