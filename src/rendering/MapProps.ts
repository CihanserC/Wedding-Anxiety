import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { PropSpec } from '../game/worldGen/types';
import { buildSuzyCat } from './SuzyCat';
import {
  buildBananaPlant,
  buildBroadleafTree,
  buildFern,
  buildPalmTree,
  buildTropicalBush,
} from './tropicalProps';
import { buildTreasureChest } from './TreasureChest';
import { buildLamborghini } from './lamborghini';
import {
  buildBoat,
  buildDiningChair,
  buildDiningTable,
  buildKingBed,
  buildPlasmaTv,
  buildSofa,
} from './villaFurniture';
import {
  buildConductorPodium,
  buildStageFootlights,
  buildStageSideDrape,
  buildStageSpotlight,
} from './concertStage';
import { buildCoastalPicnic, buildCoastalPine, buildCoastalTree } from './coastalProps';
import { buildGardenFlower } from './gardenFlowers';
import { buildWallPainting } from './famousPaintings';

/**
 * Non-voxel decorative props placed by map generators: stage instruments
 * for the concert hall, sunset sun, cat, GLB lighthouse, and GLB car.
 */
export function buildProps(specs: PropSpec[]): THREE.Group {
  const group = new THREE.Group();
  group.name = 'map-props';
  for (const spec of specs) {
    const mesh = buildProp(spec);
    mesh.position.set(spec.x, spec.y, spec.z);
    if (spec.rotationY) mesh.rotation.y = spec.rotationY;
    if (!['lighthouse', 'car', 'cake-table'].includes(spec.kind) && spec.scale) mesh.scale.setScalar(spec.scale);
    group.add(mesh);
  }
  return group;
}

function buildProp(spec: PropSpec): THREE.Group {
  switch (spec.kind) {
    case 'grand-piano':
      return buildGrandPiano();
    case 'cello':
      return buildCello();
    case 'violin':
      return buildViolin();
    case 'music-stand':
      return buildMusicStand();
    case 'sun':
      return buildSun();
    case 'cat':
      return buildCat();
    case 'lighthouse':
      return buildLighthouseModel(spec.scale ?? 1);
    case 'car':
      return buildCarModel(spec.scale ?? 1);
    case 'cake-table':
      return buildCakeTable(spec.scale ?? 1);
    case 'wedding-arch':
      return buildWeddingArch();
    case 'wedding-steps':
      return buildWeddingStageSteps();
    case 'balloon-cluster':
      return buildBalloonCluster();
    case 'suzy-cat':
      return buildSuzyCat();
    case 'palm-tree':
      return buildPalmTree();
    case 'broadleaf-tree':
      return buildBroadleafTree();
    case 'tropical-bush':
      return buildTropicalBush();
    case 'banana-plant':
      return buildBananaPlant();
    case 'fern':
      return buildFern();
    case 'treasure-chest':
      return buildTreasureChest();
    case 'boat':
      return buildBoat();
    case 'king-bed':
      return buildKingBed();
    case 'sofa':
      return buildSofa();
    case 'plasma-tv':
      return buildPlasmaTv();
    case 'dining-chair':
      return buildDiningChair();
    case 'dining-table':
      return buildDiningTable();
    case 'lamborghini':
      return buildLamborghini();
    case 'ufo':
      return buildUfo();
    case 'conductor-podium':
      return buildConductorPodium();
    case 'stage-spotlight':
      return buildStageSpotlight();
    case 'stage-footlights':
      return buildStageFootlights();
    case 'stage-side-drape':
      return buildStageSideDrape();
    case 'coastal-picnic':
      return buildCoastalPicnic();
    case 'coastal-pine':
      return buildCoastalPine();
    case 'coastal-tree':
      return buildCoastalTree();
    case 'garden-flower':
      return buildGardenFlower(Math.floor(spec.x * 13 + spec.z * 7));
    case 'wall-painting':
      return buildWallPainting(spec.paintingId ?? 'mona-lisa');
  }
  return new THREE.Group();
}

/** Classic saucer — desert secret for the space route stub. */
function buildUfo(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'ufo';

  const hull = lambert(0xb8c0cc);
  const dark = lambert(0x3a4250);
  const rim = lambert(0x8a94a4);
  const glow = new THREE.MeshBasicMaterial({
    color: 0x66ffe0,
    transparent: true,
    opacity: 0.85,
  });
  const domeGlass = new THREE.MeshLambertMaterial({
    color: 0xa8e8ff,
    transparent: true,
    opacity: 0.55,
  });

  const disc = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 0.45, 28), hull);
  disc.position.y = 1.35;
  g.add(disc);

  const underside = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 0.35, 24), dark);
  underside.position.y = 1.05;
  g.add(underside);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.55, 0.08, 8, 36), rim);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 1.35;
  g.add(ring);

  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.05, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), domeGlass);
  dome.position.y = 1.55;
  g.add(dome);

  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), glow);
  cockpit.position.y = 1.85;
  g.add(cockpit);

  const lightColors = [0x66ffe0, 0xff66aa, 0xffe066, 0x66aaff];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const light = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 8, 8),
      new THREE.MeshBasicMaterial({ color: lightColors[i % lightColors.length] }),
    );
    light.position.set(Math.cos(angle) * 2.35, 1.2, Math.sin(angle) * 2.35);
    g.add(light);
  }

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + 0.4;
    const leg = box(0.1, 0.7, 0.1, dark);
    leg.position.set(Math.cos(angle) * 1.5, 0.45, Math.sin(angle) * 1.5);
    leg.rotation.z = Math.cos(angle) * 0.25;
    leg.rotation.x = -Math.sin(angle) * 0.25;
    g.add(leg);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 0.08, 10), rim);
    pad.position.set(Math.cos(angle) * 1.65, 0.08, Math.sin(angle) * 1.65);
    g.add(pad);
  }

  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(1.1, 1.4, 16, 1, true),
    new THREE.MeshBasicMaterial({
      color: 0x66ffe0,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  beam.position.y = 0.35;
  beam.rotation.x = Math.PI;
  g.add(beam);

  return g;
}

/** Floral wedding ceremony arch — half-circle with drapes, flowers, and balloons. */
function buildWeddingArch(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'wedding-arch';

  const marble = lambert(0xf2ece6);
  const white = lambert(0xffffff);
  const gold = lambert(0xd4af37);
  const blush = lambert(0xf4c4d0);
  const curtain = lambert(0xf8b4c4);
  const green = lambert(0x5a9e5a);

  const pillarX = 2.05;
  const pillarH = 2.75;
  const pillarZ = -0.35;
  const archBaseY = pillarH + 0.12;

  const platform = box(5.4, 0.14, 2.6, marble);
  platform.position.set(0, 0.07, 0.15);
  g.add(platform);
  const trimFront = box(5.5, 0.06, 0.12, gold);
  trimFront.position.set(0, 0.04, 1.35);
  g.add(trimFront);
  const trimBack = box(5.5, 0.06, 0.12, gold);
  trimBack.position.set(0, 0.04, -1.15);
  g.add(trimBack);

  const petalColors = [0xffb7c5, 0xff8fab, 0xffffff, 0xffd6e0];
  for (let i = 0; i < 28; i++) {
    const petal = box(0.08, 0.02, 0.08, lambert(petalColors[i % petalColors.length]));
    const angle = (i / 28) * Math.PI * 2;
    const r = 0.4 + (i % 5) * 0.35;
    petal.position.set(Math.cos(angle) * r * 0.55, 0.16, 0.15 + Math.sin(angle) * r * 0.35);
    petal.rotation.y = angle;
    g.add(petal);
  }

  for (const side of [-1, 1]) {
    const px = side * pillarX;
    const baseRing = box(0.55, 0.18, 0.55, gold);
    baseRing.position.set(px, 0.22, pillarZ);
    g.add(baseRing);

    const pillar = box(0.38, pillarH, 0.38, white);
    pillar.position.set(px, pillarH * 0.5 + 0.12, pillarZ);
    g.add(pillar);

    const cap = box(0.48, 0.16, 0.48, gold);
    cap.position.set(px, pillarH + 0.2, pillarZ);
    g.add(cap);

    addFlowerCluster(g, px, pillarH + 0.35, pillarZ, iFlowerPalette(side));
    addFlowerCluster(g, px, pillarH * 0.55 + 0.12, pillarZ + 0.22, iFlowerPalette(side + 2));

    const drape = box(0.06, 2.2, 0.9, curtain);
    drape.position.set(px + side * 0.28, 1.35, 0.35);
    drape.rotation.z = side * 0.12;
    g.add(drape);
    const drapeFold = box(0.05, 1.6, 0.45, blush);
    drapeFold.position.set(px + side * 0.22, 1.1, 0.55);
    drapeFold.rotation.z = side * 0.18;
    g.add(drapeFold);
  }

  const archRadius = 2.05;
  const archSegments = 36;
  const outerPts: THREE.Vector3[] = [];
  const innerPts: THREE.Vector3[] = [];
  for (let i = 0; i <= archSegments; i++) {
    const angle = Math.PI - (Math.PI * i) / archSegments;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    outerPts.push(new THREE.Vector3(cos * archRadius, archBaseY + sin * archRadius, pillarZ));
    innerPts.push(
      new THREE.Vector3(cos * (archRadius - 0.18), archBaseY + sin * (archRadius - 0.18), pillarZ),
    );
  }

  const outerCurve = new THREE.CatmullRomCurve3(outerPts);
  const innerCurve = new THREE.CatmullRomCurve3(innerPts);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(outerCurve, 48, 0.16, 8, false), white));
  g.add(new THREE.Mesh(new THREE.TubeGeometry(innerCurve, 48, 0.07, 6, false), gold));

  for (let i = 0; i <= archSegments; i++) {
    if (i % 2 !== 0) continue;
    const t = i / archSegments;
    const pt = outerCurve.getPoint(t);
    if (i % 4 === 0) {
      addFlowerCluster(g, pt.x, pt.y + 0.12, pt.z, iFlowerPalette(i));
    } else {
      const leaf = box(0.14, 0.06, 0.22, green);
      leaf.position.copy(pt);
      leaf.position.y += 0.08;
      leaf.rotation.z = (pt.x / archRadius) * 0.4;
      g.add(leaf);
    }
  }

  for (const offset of [-0.5, 0, 0.5]) {
    for (let j = 0; j < 4; j++) {
      const bud = new THREE.Mesh(
        new THREE.SphereGeometry(0.06, 6, 6),
        lambert(iFlowerPalette(j + Math.abs(offset))),
      );
      bud.position.set(offset, archBaseY + archRadius - 0.15 - j * 0.22, pillarZ + 0.12);
      g.add(bud);
      if (j < 3) {
        const string = box(0.02, 0.18, 0.02, lambert(0xcccccc));
        string.position.set(offset, bud.position.y + 0.1, pillarZ + 0.12);
        g.add(string);
      }
    }
  }

  const balloonColors = [0xff6b9d, 0xffd166, 0x7ec8e3, 0xffffff, 0xc9a0ff, 0xff8fab];
  for (let i = 0; i < 6; i++) {
    const side = i < 3 ? -1 : 1;
    const idx = i % 3;
    addBalloon(
      g,
      side * (pillarX + 0.65 + idx * 0.15),
      2.2 + idx * 0.55,
      0.55 + idx * 0.2,
      balloonColors[i],
      'arch',
    );
  }

  const tableLegY = 0.55;
  for (const [lx, lz] of [
    [-0.55, -0.25],
    [0.55, -0.25],
    [-0.55, 0.35],
    [0.55, 0.35],
  ] as Array<[number, number]>) {
    const leg = box(0.1, tableLegY, 0.1, gold);
    leg.position.set(lx, tableLegY * 0.5 + 0.14, lz + 0.55);
    g.add(leg);
  }
  const tableTop = box(1.55, 0.08, 0.95, white);
  tableTop.position.set(0, tableLegY + 0.14, 0.55);
  g.add(tableTop);
  const cloth = box(1.62, 0.04, 1.02, lambert(0xfffaf8));
  cloth.position.set(0, tableLegY + 0.2, 0.55);
  g.add(cloth);
  addFlowerCluster(g, 0, tableLegY + 0.38, 0.55, 0);
  addFlowerCluster(g, -0.35, tableLegY + 0.32, 0.55, 3);
  addFlowerCluster(g, 0.35, tableLegY + 0.32, 0.55, 5);

  return g;
}

/** Sarı-beyaz tören merdiveni — sahne (y=2) ile halı (y=1) arası. */
function buildWeddingStageSteps(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'wedding-stage-steps';

  const white = lambert(0xfffaf5);
  const cream = lambert(0xf2ebe3);
  const yellow = lambert(0xf0d060);
  const gold = lambert(0xd4af37);

  const stepCount = 7;
  const totalH = 1.0;
  const stepH = totalH / stepCount;
  const stepD = 0.42;
  const width = 4.2;

  for (let i = 0; i < stepCount; i++) {
    // i=0 en alt (seyirci tarafı), i=stepCount-1 en üst (sahne kenarı)
    const treadMat = i % 2 === 0 ? white : cream;
    const y = stepH * (i + 0.5);
    const z = -((stepCount - 1 - i) * stepD);

    const tread = box(width - i * 0.08, stepH, stepD - 0.02, treadMat);
    tread.position.set(0, y, z);
    g.add(tread);

    // Sarı/altın ön kenar (nosing)
    const nose = box(width - i * 0.08 + 0.06, 0.05, 0.06, i % 2 === 0 ? yellow : gold);
    nose.position.set(0, y + stepH * 0.5 - 0.02, z - (stepD - 0.02) * 0.5 + 0.02);
    g.add(nose);

    // Yan sarı şeritler
    const sideL = box(0.07, stepH, stepD - 0.02, yellow);
    sideL.position.set(-(width - i * 0.08) * 0.5, y, z);
    g.add(sideL);
    const sideR = box(0.07, stepH, stepD - 0.02, gold);
    sideR.position.set((width - i * 0.08) * 0.5, y, z);
    g.add(sideR);
  }

  return g;
}

const FLOWER_PALETTE = [0xff6b9d, 0xffb7c5, 0xffffff, 0xffd166, 0xff8fab, 0xe8a0ff];

function iFlowerPalette(seed: number): number {
  return FLOWER_PALETTE[Math.abs(seed) % FLOWER_PALETTE.length];
}

function addFlowerCluster(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  seed: number,
): void {
  const green = lambert(0x4a8f4a);
  const offsets: Array<[number, number, number]> = [
    [0, 0, 0],
    [0.1, 0.06, 0.05],
    [-0.09, 0.05, -0.04],
    [0.06, 0.08, -0.07],
    [-0.05, 0.04, 0.08],
  ];
  for (let i = 0; i < offsets.length; i++) {
    const [ox, oy, oz] = offsets[i];
    const bloom = new THREE.Mesh(
      new THREE.SphereGeometry(0.07 + (i === 0 ? 0.03 : 0), 7, 7),
      lambert(iFlowerPalette(seed + i)),
    );
    bloom.position.set(x + ox, y + oy, z + oz);
    parent.add(bloom);
  }
  const stem = box(0.04, 0.12, 0.04, green);
  stem.position.set(x, y - 0.06, z);
  parent.add(stem);
}

function addBalloon(
  parent: THREE.Group,
  x: number,
  y: number,
  z: number,
  color: number,
  zone: 'arch' | 'garden' = 'garden',
): THREE.Group {
  const g = new THREE.Group();
  g.userData.isBalloon = true;
  g.userData.balloonColor = color;
  g.userData.balloonZone = zone;
  g.position.set(x, y, z);

  const string = box(0.02, 0.55, 0.02, lambert(0xbbbbbb));
  string.position.set(0, -0.35, 0);
  g.add(string);

  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    lambert(color),
  );
  balloon.scale.set(1, 1.15, 1);
  g.add(balloon);

  const knot = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 6, 6),
    lambert(0xdddddd),
  );
  knot.position.set(0, -0.28, 0);
  g.add(knot);

  parent.add(g);
  return g;
}

/** Garden balloon bouquet — weighted cluster for outdoor decoration. */
function buildBalloonCluster(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'balloon-cluster';

  const colors = [0xff6b9d, 0xffd166, 0x7ec8e3, 0xffffff, 0xc9a0ff];
  const layout: Array<[number, number, number]> = [
    [0, 1.55, 0],
    [-0.42, 1.95, 0.18],
    [0.48, 1.82, -0.14],
    [-0.18, 2.4, -0.12],
    [0.32, 2.2, 0.28],
  ];
  for (let i = 0; i < layout.length; i++) {
    const [lx, ly, lz] = layout[i];
    addBalloon(g, lx, ly, lz, colors[i % colors.length], 'garden');
  }

  const base = box(0.3, 0.1, 0.3, lambert(0xcccccc));
  base.position.set(0, 0.05, 0);
  g.add(base);

  return g;
}

/** Target height for the wedding cake GLB on the table (~0.9 blocks). */
const CAKE_TARGET_HEIGHT = 0.9;

function buildCakeTable(extraScale: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'cake-table';
  const white = lambert(0xffffff);

  for (const [lx, lz] of [
    [-0.55, -0.38],
    [0.55, -0.38],
    [-0.55, 0.38],
    [0.55, 0.38],
  ] as Array<[number, number]>) {
    const leg = box(0.1, 0.95, 0.1, white);
    leg.position.set(lx, 0.475, lz);
    g.add(leg);
  }

  const top = box(1.35, 0.06, 0.95, white);
  top.position.set(0, 1.0, 0);
  g.add(top);

  const cakeAnchor = new THREE.Group();
  cakeAnchor.position.y = 1.06;
  g.add(cakeAnchor);

  const loader = new GLTFLoader();
  const url = `${import.meta.env.BASE_URL}wedding_cake.glb`;
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const height = Math.max(size.y, 0.001);
      const scale = (CAKE_TARGET_HEIGHT / height) * extraScale;
      model.scale.setScalar(scale);

      model.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      fitted.getCenter(center);
      model.position.set(-center.x, -fitted.min.y, -center.z);

      prepareGlbMeshes(model);
      cakeAnchor.add(model);
    },
    undefined,
    () => {
      const stub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.4, CAKE_TARGET_HEIGHT, 10),
        new THREE.MeshLambertMaterial({ color: 0xfff0f5 }),
      );
      stub.position.y = CAKE_TARGET_HEIGHT * 0.5;
      cakeAnchor.add(stub);
    },
  );

  return g;
}

/** Target world length for the car GLB (voxel-style model, ~4.5 blocks long). */
const CAR_TARGET_LENGTH = 4.5;

function buildCarModel(extraScale: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'car-model';

  const loader = new GLTFLoader();
  const url = `${import.meta.env.BASE_URL}car.glb`;
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const length = Math.max(size.x, size.z, 0.001);
      const scale = (CAR_TARGET_LENGTH / length) * extraScale;
      model.scale.setScalar(scale);

      model.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      fitted.getCenter(center);
      model.position.set(-center.x, -fitted.min.y, -center.z);

      prepareGlbMeshes(model);
      g.add(model);
    },
    undefined,
    () => {
      const stub = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 1.2, 4.2),
        new THREE.MeshLambertMaterial({ color: 0xcc3333 }),
      );
      stub.position.y = 0.6;
      g.add(stub);
    },
  );

  return g;
}

/** Target world height for the lighthouse GLB (matches old voxel tower feel). */
const LIGHTHOUSE_TARGET_HEIGHT = 16;

/** Preserve GLB textures — do not replace with flat colours. */
function prepareGlbMeshes(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = false;
    child.receiveShadow = false;

    const srcMats = Array.isArray(child.material) ? child.material : [child.material];
    const prepared = srcMats.map((src) => {
      if (src instanceof THREE.MeshStandardMaterial) {
        // Keep the stripe texture; soften PBR so sunset lighting reads clearly
        src.metalness = 0;
        src.roughness = 0.9;
        if (src.map) src.map.colorSpace = THREE.SRGBColorSpace;
        return src;
      }

      if ('map' in src && src.map) {
        const map = src.map as THREE.Texture;
        map.colorSpace = THREE.SRGBColorSpace;
        return new THREE.MeshLambertMaterial({
          map,
          color: 'color' in src && src.color instanceof THREE.Color ? src.color.clone() : new THREE.Color(1, 1, 1),
        });
      }

      return src;
    });

    child.material = prepared.length === 1 ? prepared[0] : prepared;
  });
}

function buildLighthouseModel(extraScale: number): THREE.Group {
  const g = new THREE.Group();
  g.name = 'lighthouse-model';

  const loader = new GLTFLoader();
  const url = `${import.meta.env.BASE_URL}lighthouse.glb`;
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const height = Math.max(size.y, 0.001);
      const scale = (LIGHTHOUSE_TARGET_HEIGHT / height) * extraScale;
      model.scale.setScalar(scale);

      // Sit on the rock pad: bottom at y=0, centered on XZ
      model.updateMatrixWorld(true);
      const fitted = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      fitted.getCenter(center);
      model.position.set(-center.x, -fitted.min.y, -center.z);

      prepareGlbMeshes(model);

      // Soft white fill so white stripes read bright without washing out black bands
      const towerLight = new THREE.PointLight(0xffffff, 1.6, 40, 1.4);
      towerLight.position.set(0, LIGHTHOUSE_TARGET_HEIGHT * 0.55, 5);
      g.add(towerLight);

      g.add(model);
    },
    undefined,
    () => {
      // Fallback stub if the GLB fails to load
      const stub = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.6, LIGHTHOUSE_TARGET_HEIGHT, 12),
        new THREE.MeshLambertMaterial({ color: 0xf1e6d0 }),
      );
      stub.position.y = LIGHTHOUSE_TARGET_HEIGHT * 0.5;
      g.add(stub);
    },
  );

  return g;
}

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(
  w: number,
  h: number,
  d: number,
  material: THREE.Material,
): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

function buildGrandPiano(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'grand-piano';
  const black = lambert(0x141418);
  const white = lambert(0xf5f0e8);

  const body = box(2.4, 0.45, 1.6, black);
  body.position.set(0, 1.0, 0);
  g.add(body);

  // Curved tail approximated with a narrower rear section
  const tail = box(1.5, 0.45, 0.9, black);
  tail.position.set(0.3, 1.0, 1.1);
  g.add(tail);

  // Open lid propped at an angle
  const lid = box(2.3, 0.06, 1.7, black);
  lid.position.set(0, 1.55, 0.45);
  lid.rotation.x = -0.55;
  g.add(lid);
  const lidStick = box(0.06, 0.7, 0.06, black);
  lidStick.position.set(0.9, 1.4, 0.7);
  lidStick.rotation.x = -0.3;
  g.add(lidStick);

  // Keyboard
  const keys = box(1.6, 0.08, 0.35, white);
  keys.position.set(0, 1.18, -0.85);
  g.add(keys);
  const keyLip = box(1.7, 0.12, 0.1, black);
  keyLip.position.set(0, 1.12, -1.02);
  g.add(keyLip);

  // Legs
  for (const [lx, lz] of [
    [-1.0, -0.6],
    [1.0, -0.6],
    [0.2, 1.3],
  ] as Array<[number, number]>) {
    const leg = box(0.14, 0.8, 0.14, black);
    leg.position.set(lx, 0.4, lz);
    g.add(leg);
  }

  // Bench
  const bench = box(1.1, 0.1, 0.45, black);
  bench.position.set(0, 0.55, -1.6);
  g.add(bench);
  for (const [lx, lz] of [
    [-0.45, -1.75],
    [0.45, -1.75],
    [-0.45, -1.45],
    [0.45, -1.45],
  ] as Array<[number, number]>) {
    const leg = box(0.08, 0.5, 0.08, black);
    leg.position.set(lx, 0.25, lz);
    g.add(leg);
  }

  return g;
}

function buildCello(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'cello';
  const wood = lambert(0x8a4520);
  const dark = lambert(0x3a2010);

  const lean = new THREE.Group();
  lean.rotation.x = -0.18;
  g.add(lean);

  const lower = box(0.72, 0.85, 0.28, wood);
  lower.position.set(0, 0.75, 0);
  lean.add(lower);

  const upper = box(0.52, 0.55, 0.26, wood);
  upper.position.set(0, 1.35, 0);
  lean.add(upper);

  const neck = box(0.09, 0.85, 0.09, dark);
  neck.position.set(0, 1.95, -0.02);
  lean.add(neck);

  const scroll = box(0.14, 0.2, 0.14, dark);
  scroll.position.set(0, 2.42, -0.02);
  lean.add(scroll);

  const fingerboard = box(0.12, 0.9, 0.05, dark);
  fingerboard.position.set(0, 1.6, 0.15);
  lean.add(fingerboard);

  const endpin = box(0.04, 0.35, 0.04, dark);
  endpin.position.set(0, 0.18, 0.05);
  g.add(endpin);

  return g;
}

function buildViolin(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'violin';
  const wood = lambert(0xa05028);
  const dark = lambert(0x2a1808);

  const body = box(0.38, 0.12, 0.55, wood);
  body.position.set(0, 0.85, 0);
  body.rotation.x = 1.2;
  g.add(body);

  const neck = box(0.06, 0.06, 0.55, dark);
  neck.position.set(0, 0.95, -0.4);
  neck.rotation.x = 1.15;
  g.add(neck);

  const scroll = box(0.1, 0.1, 0.1, dark);
  scroll.position.set(0, 1.15, -0.72);
  g.add(scroll);

  // Resting on a chair-like stand
  const stand = box(0.08, 0.7, 0.08, dark);
  stand.position.set(0, 0.35, 0.1);
  g.add(stand);
  const rest = box(0.45, 0.06, 0.25, dark);
  rest.position.set(0, 0.72, 0.05);
  g.add(rest);

  return g;
}

function buildMusicStand(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'music-stand';
  const metal = lambert(0x40404a);
  const sheet = lambert(0xf5f5f0);

  const pole = box(0.05, 1.1, 0.05, metal);
  pole.position.set(0, 0.55, 0);
  g.add(pole);

  const base = box(0.5, 0.05, 0.5, metal);
  base.position.set(0, 0.03, 0);
  g.add(base);

  const desk = box(0.6, 0.45, 0.03, metal);
  desk.position.set(0, 1.25, 0.05);
  desk.rotation.x = -0.35;
  g.add(desk);

  const paper = box(0.45, 0.32, 0.01, sheet);
  paper.position.set(0, 1.27, 0.03);
  paper.rotation.x = -0.35;
  g.add(paper);

  return g;
}

export interface CatAnimRefs {
  headGroup: THREE.Group;
  tail: THREE.Mesh;
}

export function getCatAnimRefs(group: THREE.Object3D): CatAnimRefs | null {
  const headGroup = group.userData.headGroup as THREE.Group | undefined;
  const tail = group.userData.tail as THREE.Mesh | undefined;
  if (!headGroup || !tail) return null;
  return { headGroup, tail };
}

export function updateEatingCat(group: THREE.Object3D, time: number): void {
  const refs = getCatAnimRefs(group);
  if (!refs) return;
  refs.headGroup.rotation.x = 0.55 + Math.sin(time * 4) * 0.06;
  refs.tail.rotation.x = -0.4 + Math.sin(time * 2.5) * 0.08;
}

function buildCat(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'eating-cat';
  const black = lambert(0x1a1a1a);
  const white = lambert(0xf2f2f2);
  const pink = lambert(0xffb0b8);
  const bowlMat = lambert(0x7a4020);
  const foodMat = lambert(0xc87830);

  const body = box(0.52, 0.24, 0.38, white);
  body.position.set(0, 0.16, 0);
  g.add(body);

  const backPatch = box(0.28, 0.22, 0.14, black);
  backPatch.position.set(-0.08, 0.2, -0.06);
  g.add(backPatch);

  const legFL = box(0.1, 0.14, 0.1, white);
  legFL.position.set(0.14, 0.07, 0.12);
  g.add(legFL);
  const legFR = box(0.1, 0.14, 0.1, white);
  legFR.position.set(0.14, 0.07, -0.12);
  g.add(legFR);
  const legBL = box(0.1, 0.14, 0.1, black);
  legBL.position.set(-0.16, 0.07, 0.12);
  g.add(legBL);
  const legBR = box(0.1, 0.14, 0.1, black);
  legBR.position.set(-0.16, 0.07, -0.12);
  g.add(legBR);

  const headGroup = new THREE.Group();
  headGroup.position.set(0.18, 0.26, 0.24);
  headGroup.rotation.x = 0.55;
  g.add(headGroup);

  const head = box(0.3, 0.26, 0.28, white);
  headGroup.add(head);

  const facePatch = box(0.14, 0.14, 0.06, black);
  facePatch.position.set(0.06, 0.04, 0.12);
  headGroup.add(facePatch);

  const earL = box(0.09, 0.11, 0.05, black);
  earL.position.set(-0.12, 0.2, 0);
  headGroup.add(earL);
  const earR = box(0.09, 0.11, 0.05, black);
  earR.position.set(0.12, 0.2, 0);
  headGroup.add(earR);

  const nose = box(0.05, 0.04, 0.04, pink);
  nose.position.set(0, -0.1, 0.15);
  headGroup.add(nose);

  const tail = box(0.09, 0.07, 0.38, black);
  tail.position.set(-0.3, 0.22, -0.16);
  tail.rotation.x = -0.4;
  g.add(tail);

  const bowl = box(0.38, 0.1, 0.38, bowlMat);
  bowl.position.set(0.38, 0.05, 0.38);
  g.add(bowl);

  const food = box(0.24, 0.09, 0.24, foodMat);
  food.position.set(0.38, 0.13, 0.38);
  g.add(food);

  for (let i = 0; i < 4; i++) {
    const crumb = box(0.05, 0.04, 0.05, foodMat);
    crumb.position.set(0.28 + i * 0.05, 0.16, 0.32 + (i % 2) * 0.08);
    g.add(crumb);
  }

  g.userData.headGroup = headGroup;
  g.userData.tail = tail;
  return g;
}

function buildSun(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'sunset-sun';

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(22, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xff5a08, fog: false }),
  );
  g.add(core);

  const mid = new THREE.Mesh(
    new THREE.SphereGeometry(30, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xff8530,
      transparent: true,
      opacity: 0.5,
      fog: false,
      depthWrite: false,
    }),
  );
  g.add(mid);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(40, 32, 32),
    new THREE.MeshBasicMaterial({
      color: 0xffb050,
      transparent: true,
      opacity: 0.28,
      fog: false,
      depthWrite: false,
    }),
  );
  g.add(halo);

  const outerGlow = new THREE.Mesh(
    new THREE.SphereGeometry(55, 24, 24),
    new THREE.MeshBasicMaterial({
      color: 0xffd090,
      transparent: true,
      opacity: 0.12,
      fog: false,
      depthWrite: false,
    }),
  );
  g.add(outerGlow);

  return g;
}
