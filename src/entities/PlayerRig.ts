import * as THREE from 'three';
import type { WeaponId } from '../data/weapons';
import { buildCarInteriorViewmodel } from '../rendering/carInterior';
import { buildCelebrationBouquet } from '../rendering/FlowerBouquet';
import { buildMoneyBills } from '../rendering/MoneyBills';

export type HeldItem = 'none' | 'bouquet' | 'money';

/**
 * First-person weapon viewmodel. A THREE.Group is parented to the camera so
 * each weapon mesh sits in camera-space (bottom-right). Bob during movement,
 * kick back on fire. Also supports celebration bouquet / cash wad held items.
 */
export class PlayerRig {
  readonly root: THREE.Group;
  private readonly carInteriorGroup: THREE.Group;
  private readonly weapons: Map<WeaponId, THREE.Group> = new Map();
  private readonly bouquetGroup: THREE.Group;
  private readonly moneyGroup: THREE.Group;
  private activeId: WeaponId = 'pistol';
  private heldItem: HeldItem = 'none';
  private driving = false;
  private time = 0;
  private recoilPhase = 0;
  private swayPhase = 0;
  private swingPhase = 0;

  constructor() {
    this.root = new THREE.Group();
    this.root.position.set(0.35, -0.32, -0.65);

    this.weapons.set('pistol', buildPistol());
    this.weapons.set('rifle', buildRifle());
    this.weapons.set('shield', buildShield());
    this.weapons.set('happiness', buildHappinessBlaster());
    this.weapons.set('lightsaber', buildLightsaber());
    this.weapons.set('banana', buildBanana());

    for (const [id, group] of this.weapons) {
      group.visible = id === this.activeId;
      this.root.add(group);
    }

    this.bouquetGroup = buildCelebrationBouquet();
    this.bouquetGroup.visible = false;
    this.root.add(this.bouquetGroup);

    this.moneyGroup = buildMoneyBills();
    this.moneyGroup.visible = false;
    this.root.add(this.moneyGroup);

    this.carInteriorGroup = buildCarInteriorViewmodel();
    this.carInteriorGroup.position.set(0, -0.48, -0.28);
    this.carInteriorGroup.visible = false;
  }

  attachTo(parent: THREE.Object3D): void {
    parent.add(this.root);
    parent.add(this.carInteriorGroup);
  }

  setActive(id: WeaponId): void {
    if (this.heldItem !== 'none') return;
    if (this.activeId === id) return;
    this.activeId = id;
    for (const [wid, group] of this.weapons) {
      group.visible = wid === id;
    }
  }

  setHeldItem(item: HeldItem): void {
    if (this.driving) return;
    this.heldItem = item;
    this.bouquetGroup.visible = item === 'bouquet';
    this.moneyGroup.visible = item === 'money';
    for (const [wid, group] of this.weapons) {
      group.visible = item === 'none' && wid === this.activeId;
    }
    if (item !== 'none') {
      this.recoilPhase = 0;
    }
  }

  /**
   * Driving viewmodel mode.
   * - fps: cabin interior (wheel/dash) visible
   * - chase: third-person; hide cabin viewmodel and weapons
   */
  setDrivingMode(enabled: boolean, mode: 'fps' | 'chase' = 'fps'): void {
    this.driving = enabled;
    this.carInteriorGroup.visible = enabled && mode === 'fps';
    this.root.visible = !enabled;
    if (enabled) {
      this.bouquetGroup.visible = false;
      this.moneyGroup.visible = false;
      for (const group of this.weapons.values()) {
        group.visible = false;
      }
    }
  }

  isDrivingMode(): boolean {
    return this.driving;
  }

  /** Wedding epilogue bouquet — wraps setHeldItem. */
  setCelebrationMode(enabled: boolean): void {
    this.setHeldItem(enabled ? 'bouquet' : 'none');
  }

  isCelebrationMode(): boolean {
    return this.heldItem === 'bouquet';
  }

  isMoneyMode(): boolean {
    return this.heldItem === 'money';
  }

  getHeldItem(): HeldItem {
    return this.heldItem;
  }

  /** World-space tip of the active weapon barrel (falls back to weapon root). */
  getMuzzleWorldPosition(target = new THREE.Vector3()): THREE.Vector3 {
    const active = this.weapons.get(this.activeId);
    if (!active) return target;
    const point = active.getObjectByName('muzzle-point');
    if (point) point.getWorldPosition(target);
    else active.getWorldPosition(target);
    return target;
  }

  onFire(recoil: number): void {
    if (this.heldItem !== 'none') return;
    this.recoilPhase = Math.min(1, this.recoilPhase + recoil * 4);
  }

  onLightsaberSwing(): void {
    if (this.heldItem !== 'none') return;
    // Full swing cycle: 1 → 0 travels top → bottom along a 45° diagonal
    this.swingPhase = 1;
  }

  update(dt: number, moving: boolean, driveSpeed = 0, turboBlend = 0): void {
    this.time += dt;
    if (moving) {
      this.swayPhase += dt * 8;
    } else {
      this.swayPhase += dt * 2;
    }

    if (this.driving) {
      this.bobCarInterior(driveSpeed, turboBlend);
      return;
    }

    if (this.heldItem === 'bouquet') {
      this.bobHeld(this.bouquetGroup, moving, 0.3, -0.4, -0.48);
      return;
    }

    if (this.heldItem === 'money') {
      this.bobHeld(this.moneyGroup, moving, 0.28, -0.38, -0.5);
      return;
    }

    this.recoilPhase = Math.max(0, this.recoilPhase - dt * 5);
    // ~0.4s slash duration
    this.swingPhase = Math.max(0, this.swingPhase - dt * 2.5);

    const active = this.weapons.get(this.activeId);
    if (!active) return;

    const bobX = Math.cos(this.swayPhase) * (moving ? 0.02 : 0.005);
    const bobY = Math.abs(Math.sin(this.swayPhase)) * (moving ? 0.02 : 0.005);

    if (this.activeId === 'lightsaber') {
      this.applyLightsaberPose(active, bobX, bobY);
      return;
    }

    active.position.x = bobX;
    active.position.y = bobY;
    active.position.z = -this.recoilPhase * 0.15;
    active.rotation.x = -this.recoilPhase * 0.4;
    active.rotation.y = 0;
    active.rotation.z = 0;
  }

  /**
   * Idle tip points forward; on fire, blade arcs ~90° from raised
   * (top-right) to low (bottom-left) on a 45° diagonal plane.
   * swingPhase 1 = wind-up high, 0 = idle.
   */
  private applyLightsaberPose(
    active: THREE.Group,
    bobX: number,
    bobY: number,
  ): void {
    // Blade tip up: mesh extends along -Z, so flip 180° on X so tip isn't downward
    const idleX = -1.15 + Math.PI;
    const idleY = 0.08;
    const idleZ = 0.18;

    if (this.swingPhase <= 0) {
      active.position.set(bobX, bobY, 0);
      active.rotation.set(idleX, idleY, idleZ);
      return;
    }

    // progress 0 = start (raised), 1 = end of arc (then blend to idle)
    const progress = 1 - this.swingPhase;
    // Ease-in-out so the mid slash is the fast part
    const t = progress * progress * (3 - 2 * progress);

    // Raised (top of 45° diagonal) → follow-through (bottom of diagonal)
    const raised = { x: -1.75 + Math.PI, y: 0.4, z: 0.85 };
    const lowered = { x: -0.15 + Math.PI, y: -0.5, z: -0.75 };

    const rx = raised.x + (lowered.x - raised.x) * t;
    const ry = raised.y + (lowered.y - raised.y) * t;
    const rz = raised.z + (lowered.z - raised.z) * t;

    // Last ~20% of the cycle eases back toward idle so it doesn't stick low
    const recover = Math.max(0, (progress - 0.8) / 0.2);
    const recoverEase = recover * recover * (3 - 2 * recover);

    active.rotation.x = rx + (idleX - rx) * recoverEase;
    active.rotation.y = ry + (idleY - ry) * recoverEase;
    active.rotation.z = rz + (idleZ - rz) * recoverEase;

    // Hilt stays near hand; tip travels with the arc
    const lift = (1 - t) * 0.12 * (1 - recoverEase);
    const side = (0.5 - t) * 0.22 * (1 - recoverEase);
    active.position.x = bobX + side;
    active.position.y = bobY + lift;
    active.position.z = -0.04 * Math.sin(t * Math.PI) * (1 - recoverEase);
  }

  private bobCarInterior(driveSpeed: number, turboBlend = 0): void {
    const speedFactor = Math.min(1, Math.abs(driveSpeed) / 10);
    const turboShake = turboBlend * 0.022;
    const bobAmp = 0.008 + speedFactor * 0.018 + turboShake;
    const bobX = Math.cos(this.swayPhase * 1.4) * bobAmp + Math.sin(this.time * 38) * turboShake * 0.5;
    const bobY = Math.sin(this.swayPhase * 2.2) * bobAmp * 0.7 + Math.cos(this.time * 44) * turboShake * 0.35;
    this.carInteriorGroup.position.set(bobX, -0.48 + bobY, -0.28);

    const wheel = this.carInteriorGroup.getObjectByName('steering-wheel');
    if (wheel) {
      wheel.rotation.z =
        Math.sin(this.swayPhase * 0.6) * speedFactor * 0.08 + Math.sin(this.time * 32) * turboBlend * 0.06;
    }

    const turboFill = this.carInteriorGroup.getObjectByName('turbo-gauge-fill');
    if (turboFill instanceof THREE.Mesh) {
      const mat = turboFill.material as THREE.MeshLambertMaterial;
      mat.emissiveIntensity = 0.15 + turboBlend * 1.6;
      turboFill.scale.x = 0.6 + turboBlend * 0.5;
      turboFill.scale.y = 0.6 + turboBlend * 0.4;
    }
  }

  private bobHeld(
    group: THREE.Group,
    moving: boolean,
    baseX: number,
    baseY: number,
    baseZ: number,
  ): void {
    const bobX = Math.cos(this.swayPhase) * (moving ? 0.012 : 0.004);
    const bobY = Math.abs(Math.sin(this.swayPhase)) * (moving ? 0.014 : 0.004);
    const swayZ = Math.sin(this.swayPhase * 0.7) * 0.006;
    group.position.x = baseX + bobX;
    group.position.y = baseY + bobY;
    group.position.z = baseZ + swayZ;
    group.rotation.z = 0.08 + Math.sin(this.swayPhase * 0.5) * 0.03;
  }
}

function makeMat(color: number, opts: THREE.MeshLambertMaterialParameters = {}): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color, ...opts });
}

/** Invisible anchor at the barrel tip for muzzle VFX. */
function addMuzzlePoint(group: THREE.Group, x: number, y: number, z: number): void {
  const point = new THREE.Object3D();
  point.name = 'muzzle-point';
  point.position.set(x, y, z);
  group.add(point);
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

  addMuzzlePoint(g, 0, 0.02, -0.55);
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

  addMuzzlePoint(g, 0, 0.03, -1.11);
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

  addMuzzlePoint(g, 0, 0.1, -0.39);
  return g;
}

/** Voxel E-11 style blaster for Mutluluk Işını */
function buildHappinessBlaster(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = makeMat(0x2a2a30);
  const metalMat = makeMat(0x7a7a82);
  const darkMat = makeMat(0x181820);
  const gripMat = makeMat(0x3a3028);

  const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 0.42), bodyMat);
  receiver.position.set(0, 0, 0);
  g.add(receiver);

  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.72), darkMat);
  barrel.position.set(0, 0.02, -0.52);
  g.add(barrel);

  for (let i = 0; i < 5; i++) {
    const ventL = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.06, 0.06), darkMat);
    ventL.position.set(-0.06, 0.02, -0.22 - i * 0.11);
    g.add(ventL);
    const ventR = ventL.clone();
    ventR.position.x = 0.06;
    g.add(ventR);
  }

  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 0.08), metalMat);
    fin.position.set(0, 0.08, -0.28 - i * 0.13);
    g.add(fin);
  }

  const scopeBase = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.1, 0.18), bodyMat);
  scopeBase.position.set(0, 0.16, -0.08);
  g.add(scopeBase);
  const scopeMid = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.14), metalMat);
  scopeMid.position.set(0, 0.22, -0.02);
  g.add(scopeMid);
  const scopeEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.1), darkMat);
  scopeEye.position.set(0, 0.24, 0.1);
  g.add(scopeEye);

  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.14), darkMat);
  mag.position.set(-0.14, -0.08, -0.02);
  mag.rotation.z = 0.15;
  g.add(mag);

  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.26, 0.13), gripMat);
  grip.position.set(0, -0.2, 0.1);
  grip.rotation.x = 0.3;
  g.add(grip);

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.1), metalMat);
  guard.position.set(0, -0.08, 0.05);
  g.add(guard);

  const trigger = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.04), metalMat);
  trigger.position.set(0, -0.1, 0.06);
  g.add(trigger);

  const stock1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.32), metalMat);
  stock1.position.set(0, -0.06, -0.42);
  stock1.rotation.x = -0.2;
  g.add(stock1);
  const stock2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.22), metalMat);
  stock2.position.set(0, -0.1, -0.24);
  stock2.rotation.x = 0.15;
  g.add(stock2);

  const rearCap = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.12), bodyMat);
  rearCap.position.set(0, 0, 0.26);
  g.add(rearCap);

  const loop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.04), metalMat);
  loop.position.set(0, 0.02, 0.34);
  g.add(loop);

  addMuzzlePoint(g, 0, 0.02, -0.88);
  return g;
}

/** Classic crescent banana held in first-person — Bali-only. */
function buildBanana(): THREE.Group {
  const g = new THREE.Group();
  const peel = makeMat(0xffe135, { emissive: 0xffc107, emissiveIntensity: 0.2 });
  const peelDeep = makeMat(0xf0c020);
  const tip = makeMat(0xc4a35a);
  const stem = makeMat(0x4a3420);
  const bruise = makeMat(0xd4a017);

  // Crescent curve along -Z (forward), arching upward then down to tip
  const segments: Array<{
    w: number;
    h: number;
    d: number;
    x: number;
    y: number;
    z: number;
    rx: number;
    mat: THREE.MeshLambertMaterial;
  }> = [
    { w: 0.09, h: 0.09, d: 0.1, x: 0, y: 0.08, z: 0.14, rx: 0.35, mat: stem },
    { w: 0.14, h: 0.15, d: 0.14, x: 0, y: 0.1, z: 0.04, rx: 0.2, mat: peel },
    { w: 0.16, h: 0.17, d: 0.16, x: 0.01, y: 0.12, z: -0.08, rx: 0.05, mat: peel },
    { w: 0.17, h: 0.18, d: 0.17, x: 0.02, y: 0.1, z: -0.22, rx: -0.15, mat: peel },
    { w: 0.16, h: 0.17, d: 0.16, x: 0.02, y: 0.05, z: -0.36, rx: -0.35, mat: peelDeep },
    { w: 0.14, h: 0.15, d: 0.15, x: 0.01, y: -0.01, z: -0.48, rx: -0.55, mat: peel },
    { w: 0.11, h: 0.12, d: 0.12, x: 0, y: -0.08, z: -0.58, rx: -0.7, mat: peel },
    { w: 0.07, h: 0.08, d: 0.09, x: 0, y: -0.14, z: -0.66, rx: -0.85, mat: tip },
  ];

  for (const s of segments) {
    const seg = new THREE.Mesh(new THREE.BoxGeometry(s.w, s.h, s.d), s.mat);
    seg.position.set(s.x, s.y, s.z);
    seg.rotation.x = s.rx;
    g.add(seg);
  }

  // Subtle ridge / bruise spots for banana character
  const spotA = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.05), bruise);
  spotA.position.set(0.07, 0.14, -0.2);
  g.add(spotA);
  const spotB = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.035, 0.04), bruise);
  spotB.position.set(-0.06, 0.02, -0.4);
  g.add(spotB);

  // Stem nub at the held end
  const stemTip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.07), stem);
  stemTip.position.set(0, 0.1, 0.2);
  stemTip.rotation.x = 0.5;
  g.add(stemTip);

  addMuzzlePoint(g, 0, -0.12, -0.72);
  return g;
}

/** Voxel red lightsaber — cheat-only weapon viewmodel */
function buildLightsaber(): THREE.Group {
  const g = new THREE.Group();
  const hiltMat = makeMat(0x8a8a92);
  const darkMat = makeMat(0x2a2a30);
  const emitterMat = makeMat(0x404048, { emissive: 0x220000, emissiveIntensity: 0.3 });
  const bladeMat = new THREE.MeshLambertMaterial({
    color: 0xff2020,
    emissive: 0xff1010,
    emissiveIntensity: 0.95,
  });
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xffaaaa });

  // Grip / hilt pointing roughly toward camera (held bottom-right)
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.28), hiltMat);
  grip.position.set(0, -0.02, 0.12);
  g.add(grip);

  const gripBands: number[] = [-0.02, 0.06, 0.14];
  for (const z of gripBands) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.03), darkMat);
    band.position.set(0, -0.02, z);
    g.add(band);
  }

  const pommel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), darkMat);
  pommel.position.set(0, -0.02, 0.28);
  g.add(pommel);

  const emitter = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.1), emitterMat);
  emitter.position.set(0, -0.02, -0.06);
  g.add(emitter);

  const emitterRing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.03), hiltMat);
  emitterRing.position.set(0, -0.02, -0.12);
  g.add(emitterRing);

  // Blade extends forward (-Z) from emitter
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.05), bladeMat);
  blade.position.set(0, -0.02, -0.68);
  g.add(blade);

  const core = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.025, 1.02), coreMat);
  core.position.set(0, -0.02, -0.68);
  g.add(core);

  // Tip
  const tip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.06), bladeMat);
  tip.position.set(0, -0.02, -1.22);
  g.add(tip);

  // Idle pose applied in update (upright); keep mesh local identity here
  return g;
}
