import * as THREE from 'three';
import type { WeaponId } from '../data/weapons';
import { buildCelebrationBouquet } from '../rendering/FlowerBouquet';

/**
 * First-person weapon viewmodel. A THREE.Group is parented to the camera so
 * each weapon mesh sits in camera-space (bottom-right). Bob during movement,
 * kick back on fire.
 */
export class PlayerRig {
  readonly root: THREE.Group;
  private readonly weapons: Map<WeaponId, THREE.Group> = new Map();
  private readonly bouquetGroup: THREE.Group;
  private activeId: WeaponId = 'pistol';
  private celebrationMode = false;
  private time = 0;
  private recoilPhase = 0;
  private swayPhase = 0;

  constructor() {
    this.root = new THREE.Group();
    this.root.position.set(0.35, -0.32, -0.65);

    this.weapons.set('pistol', buildPistol());
    this.weapons.set('rifle', buildRifle());
    this.weapons.set('shield', buildShield());

    for (const [id, group] of this.weapons) {
      group.visible = id === this.activeId;
      this.root.add(group);
    }

    this.bouquetGroup = buildCelebrationBouquet();
    this.bouquetGroup.visible = false;
    this.root.add(this.bouquetGroup);
  }

  attachTo(parent: THREE.Object3D): void {
    parent.add(this.root);
  }

  setActive(id: WeaponId): void {
    if (this.celebrationMode) return;
    if (this.activeId === id) return;
    this.activeId = id;
    for (const [wid, group] of this.weapons) {
      group.visible = wid === id;
    }
  }

  setCelebrationMode(enabled: boolean): void {
    this.celebrationMode = enabled;
    this.bouquetGroup.visible = enabled;
    for (const [wid, group] of this.weapons) {
      group.visible = !enabled && wid === this.activeId;
    }
    if (enabled) {
      this.recoilPhase = 0;
    }
  }

  isCelebrationMode(): boolean {
    return this.celebrationMode;
  }

  onFire(recoil: number): void {
    if (this.celebrationMode) return;
    this.recoilPhase = Math.min(1, this.recoilPhase + recoil * 4);
  }

  update(dt: number, moving: boolean): void {
    this.time += dt;
    if (moving) {
      this.swayPhase += dt * 8;
    } else {
      this.swayPhase += dt * 2;
    }

    if (this.celebrationMode) {
      const bobX = Math.cos(this.swayPhase) * (moving ? 0.012 : 0.004);
      const bobY = Math.abs(Math.sin(this.swayPhase)) * (moving ? 0.014 : 0.004);
      const swayZ = Math.sin(this.swayPhase * 0.7) * 0.006;
      this.bouquetGroup.position.x = 0.3 + bobX;
      this.bouquetGroup.position.y = -0.4 + bobY;
      this.bouquetGroup.position.z = -0.48 + swayZ;
      this.bouquetGroup.rotation.z = 0.08 + Math.sin(this.swayPhase * 0.5) * 0.03;
      return;
    }

    this.recoilPhase = Math.max(0, this.recoilPhase - dt * 5);

    const active = this.weapons.get(this.activeId);
    if (!active) return;

    const bobX = Math.cos(this.swayPhase) * (moving ? 0.02 : 0.005);
    const bobY = Math.abs(Math.sin(this.swayPhase)) * (moving ? 0.02 : 0.005);
    active.position.x = bobX;
    active.position.y = bobY;
    active.position.z = -this.recoilPhase * 0.15;
    active.rotation.x = -this.recoilPhase * 0.4;
  }
}

function makeMat(color: number, opts: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

function buildPistol(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = makeMat(0x2a2a30);
  const gripMat = makeMat(0x3a2418);
  const detailMat = makeMat(0xd0d0d8);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.4), bodyMat);
  body.position.set(0, 0, 0);
  g.add(body);

  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.5), bodyMat);
  barrel.position.set(0, 0.02, -0.3);
  g.add(barrel);

  const sight = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.06), detailMat);
  sight.position.set(0, 0.12, -0.15);
  g.add(sight);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.14), gripMat);
  grip.position.set(0, -0.2, 0.08);
  grip.rotation.x = 0.25;
  g.add(grip);

  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.06, 0.05), detailMat);
  trigger.position.set(0, -0.05, 0.04);
  g.add(trigger);

  return g;
}

function buildRifle(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = makeMat(0x1c2418);
  const stockMat = makeMat(0x4a2e18);
  const barrelMat = makeMat(0x14141a);
  const detailMat = makeMat(0xa0a0a8);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.55), bodyMat);
  receiver.position.set(0, 0, 0);
  g.add(receiver);

  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), barrelMat);
  barrel.position.set(0, 0.03, -0.55);
  g.add(barrel);

  const muzzleBrake = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.12), detailMat);
  muzzleBrake.position.set(0, 0.03, -1.05);
  g.add(muzzleBrake);

  const scope = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.3), detailMat);
  scope.position.set(0, 0.18, -0.15);
  g.add(scope);

  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.4), stockMat);
  stock.position.set(0, -0.02, 0.4);
  g.add(stock);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.24, 0.14), stockMat);
  grip.position.set(0, -0.2, 0.15);
  grip.rotation.x = 0.35;
  g.add(grip);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.14), barrelMat);
  mag.position.set(0, -0.2, -0.05);
  g.add(mag);

  return g;
}

function buildShield(): THREE.Group {
  const g = new THREE.Group();
  const coreMat = makeMat(0x102030);
  const plasmaMat = new THREE.MeshBasicMaterial({
    color: 0x60d0ff,
    transparent: true,
    opacity: 0.7,
  });
  const rimMat = makeMat(0x3060a0, { emissive: 0x2080c0, emissiveIntensity: 0.5 });

  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.28, 0.14), coreMat);
  handle.position.set(0, -0.05, 0.15);
  g.add(handle);

  const emitter = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.2), coreMat);
  emitter.position.set(0, 0.05, -0.1);
  g.add(emitter);

  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.05), rimMat);
  rim.position.set(0, 0.1, -0.35);
  g.add(rim);

  const plasma = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.03), plasmaMat);
  plasma.position.set(0, 0.1, -0.37);
  g.add(plasma);

  const rays: Array<[number, number]> = [
    [0, 0.28],
    [0, -0.28],
    [0.28, 0],
    [-0.28, 0],
  ];
  for (const [rx, ry] of rays) {
    const ray = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.05), rimMat);
    ray.position.set(rx, 0.1 + ry, -0.35);
    g.add(ray);
  }

  return g;
}
