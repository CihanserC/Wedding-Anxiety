import * as THREE from 'three';

export type BalloonZone = 'arch' | 'garden';

export interface BalloonPopCallback {
  (position: THREE.Vector3, color: number): void;
}

interface BalloonEntry {
  root: THREE.Object3D;
  popped: boolean;
  color: number;
  zone: BalloonZone;
}

export interface BalloonRaycastHit {
  entry: BalloonEntry;
  distance: number;
  point: THREE.Vector3;
}

export class BalloonManager {
  private entries: BalloonEntry[] = [];

  clear(): void {
    this.entries = [];
  }

  registerFromScene(root: THREE.Object3D): void {
    root.updateMatrixWorld(true);
    root.traverse((child) => {
      if (!child.userData.isBalloon) return;
      this.entries.push({
        root: child,
        popped: false,
        color: child.userData.balloonColor as number,
        zone: (child.userData.balloonZone as BalloonZone) ?? 'garden',
      });
    });
  }

  hasRemaining(): boolean {
    return this.entries.some((e) => !e.popped);
  }

  raycastHit(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    maxDistance: number,
  ): BalloonRaycastHit | null {
    const dir = direction.clone().normalize();
    const radius = 0.24;
    let best: BalloonRaycastHit | null = null;

    for (const entry of this.entries) {
      if (entry.popped) continue;

      const center = new THREE.Vector3();
      entry.root.getWorldPosition(center);
      center.y += 0.08;

      const oc = new THREE.Vector3().subVectors(origin, center);
      const b = oc.dot(dir);
      const c = oc.dot(oc) - radius * radius;
      const disc = b * b - c;
      if (disc < 0) continue;

      const sqrtDisc = Math.sqrt(disc);
      let t = -b - sqrtDisc;
      if (t < 0) t = -b + sqrtDisc;
      if (t < 0 || t > maxDistance) continue;

      const point = origin.clone().addScaledVector(dir, t);
      if (!best || t < best.distance) {
        best = { entry, distance: t, point };
      }
    }

    return best;
  }

  pop(entry: unknown, onPop: BalloonPopCallback): void {
    this.popBalloon(entry as BalloonEntry, onPop);
  }

  popAll(onPop: BalloonPopCallback): void {
    for (const entry of this.entries) {
      this.popBalloon(entry, onPop);
    }
  }

  private popBalloon(entry: BalloonEntry, onPop: BalloonPopCallback): void {
    if (entry.popped) return;
    entry.popped = true;
    const pos = new THREE.Vector3();
    entry.root.getWorldPosition(pos);
    pos.y += 0.08;
    entry.root.visible = false;
    onPop(pos, entry.color);
  }
}
