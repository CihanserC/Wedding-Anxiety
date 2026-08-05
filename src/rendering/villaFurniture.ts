import * as THREE from 'three';

function lambert(color: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color });
}

function box(w: number, h: number, d: number, material: THREE.Material): THREE.Mesh {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}

/** King bed — headboard, mattress, two pillows. */
export function buildKingBed(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'king-bed';

  const wood = lambert(0x6b4423);
  const woodDark = lambert(0x4a2e15);
  const linen = lambert(0xf5f0e6);
  const pillow = lambert(0xfff8f0);
  const accent = lambert(0xc4785a);

  const frame = box(2.0, 0.22, 2.4, wood);
  frame.position.set(0, 0.18, 0);
  g.add(frame);

  const headboard = box(2.05, 0.9, 0.12, woodDark);
  headboard.position.set(0, 0.7, -1.15);
  g.add(headboard);

  const mattress = box(1.85, 0.28, 2.2, linen);
  mattress.position.set(0, 0.4, 0.05);
  g.add(mattress);

  const blanket = box(1.85, 0.08, 1.3, accent);
  blanket.position.set(0, 0.56, 0.4);
  g.add(blanket);

  for (const side of [-1, 1]) {
    const p = box(0.55, 0.18, 0.4, pillow);
    p.position.set(side * 0.4, 0.62, -0.75);
    g.add(p);
  }

  return g;
}

/** Three-seat sofa — tropical beige / coffee tones. */
export function buildSofa(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'sofa';

  const frame = lambert(0x5c4030);
  const cushion = lambert(0xd4c4a8);
  const cushionDark = lambert(0xc0ae8e);

  const base = box(2.4, 0.35, 0.95, frame);
  base.position.set(0, 0.25, 0);
  g.add(base);

  const seat = box(2.3, 0.22, 0.85, cushion);
  seat.position.set(0, 0.5, 0.02);
  g.add(seat);

  const back = box(2.35, 0.7, 0.18, cushionDark);
  back.position.set(0, 0.85, -0.38);
  g.add(back);

  for (const side of [-1, 1]) {
    const arm = box(0.18, 0.45, 0.9, frame);
    arm.position.set(side * 1.1, 0.55, 0);
    g.add(arm);
  }

  // Seat division cushions
  for (const ox of [-0.7, 0, 0.7]) {
    const c = box(0.65, 0.12, 0.7, cushion);
    c.position.set(ox, 0.62, 0.05);
    g.add(c);
  }

  return g;
}

function createTvOffScreenMaterial(): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: 0x1a1a22 });
}

/** Wall-mounted cinema TV — screen mesh named `tv-screen` for on/off toggling. */
export function buildPlasmaTv(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'plasma-tv';

  const black = lambert(0x111111);
  const wood = lambert(0x5c4030);
  const silver = lambert(0x909090);

  // Low media console
  const console = box(1.8, 0.14, 0.55, wood);
  console.position.set(0, 0.18, 0);
  g.add(console);

  for (const side of [-1, 1]) {
    const leg = box(0.1, 0.22, 0.45, wood);
    leg.position.set(side * 0.72, 0.08, 0);
    g.add(leg);
  }

  // Panel sits on the console — not floating above it
  const panelY = 0.86;
  const bracket = box(0.35, 0.05, 0.1, silver);
  bracket.position.set(0, 0.34, -0.02);
  g.add(bracket);

  const bezel = box(1.75, 1.08, 0.07, black);
  bezel.position.set(0, panelY, 0);
  g.add(bezel);

  const display = box(1.65, 0.98, 0.035, createTvOffScreenMaterial());
  display.name = 'tv-screen';
  display.position.set(0, panelY, 0.038);
  g.add(display);

  const chin = box(0.4, 0.03, 0.04, silver);
  chin.position.set(0, panelY - 0.52, 0.04);
  g.add(chin);

  return g;
}

/** Simple wooden dining chair. */
export function buildDiningChair(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'dining-chair';

  const wood = lambert(0x8b5e3a);
  const woodDark = lambert(0x6a4528);
  const seat = lambert(0xc4a882);

  for (const [lx, lz] of [
    [-0.22, -0.22],
    [0.22, -0.22],
    [-0.22, 0.22],
    [0.22, 0.22],
  ] as Array<[number, number]>) {
    const leg = box(0.06, 0.5, 0.06, woodDark);
    leg.position.set(lx, 0.25, lz);
    g.add(leg);
  }

  const seatPad = box(0.5, 0.06, 0.5, seat);
  seatPad.position.set(0, 0.52, 0);
  g.add(seatPad);

  const backRest = box(0.48, 0.55, 0.06, wood);
  backRest.position.set(0, 0.85, -0.22);
  g.add(backRest);

  const backSlat = box(0.06, 0.5, 0.04, woodDark);
  backSlat.position.set(0, 0.82, -0.22);
  g.add(backSlat);

  return g;
}

/** Four-legged dining table with marble-ish top. */
export function buildDiningTable(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'dining-table';

  const wood = lambert(0x6b4423);
  const top = lambert(0xe8e0d4);
  const gold = lambert(0xd4af37);

  for (const [lx, lz] of [
    [-0.7, -0.45],
    [0.7, -0.45],
    [-0.7, 0.45],
    [0.7, 0.45],
  ] as Array<[number, number]>) {
    const leg = box(0.08, 0.7, 0.08, wood);
    leg.position.set(lx, 0.35, lz);
    g.add(leg);
  }

  const surface = box(1.7, 0.08, 1.1, top);
  surface.position.set(0, 0.74, 0);
  g.add(surface);

  const trim = box(1.75, 0.03, 1.15, gold);
  trim.position.set(0, 0.69, 0);
  g.add(trim);

  return g;
}

/** Bali-style jukung outrigger — long teak hull, bamboo booms, striped sail. */
export function buildBoat(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'boat';

  const teak = lambert(0x9a6b2f);
  const teakDark = lambert(0x5c3a18);
  const teakLight = lambert(0xb89050);
  const bamboo = lambert(0xc8a860);
  const bambooDark = lambert(0x8a7040);
  const sailCream = lambert(0xf5eed8);
  const sailRed = lambert(0xc62828);
  const sailGold = lambert(0xd4af37);
  const rope = lambert(0xb89860);
  const white = lambert(0xf8f4ec);
  const garland = [0xff6b9d, 0xffd166, 0xffffff, 0x7ec8e3];

  // Keel / lower hull
  const keel = box(1.05, 0.22, 4.6, teakDark);
  keel.position.set(0, 0.18, 0.05);
  g.add(keel);

  // Main hull sides (slightly raised)
  for (const side of [-1, 1]) {
    const sideHull = box(0.12, 0.38, 4.2, teak);
    sideHull.position.set(side * 0.48, 0.38, 0.05);
    g.add(sideHull);
  }

  // Bow — layered prow tapering to a point
  for (let i = 0; i < 4; i++) {
    const bowSeg = box(0.95 - i * 0.18, 0.32 - i * 0.04, 0.55, i === 0 ? teak : teakDark);
    bowSeg.position.set(0, 0.34 + i * 0.02, -2.05 - i * 0.42);
    bowSeg.rotation.x = -0.18 - i * 0.08;
    g.add(bowSeg);
  }

  // Bow spirit — curved upward ornament
  const spirit = box(0.14, 0.55, 0.14, sailGold);
  spirit.position.set(0, 0.72, -3.55);
  spirit.rotation.x = -0.35;
  g.add(spirit);
  const spiritTip = box(0.1, 0.22, 0.1, sailRed);
  spiritTip.position.set(0, 1.02, -3.62);
  spiritTip.rotation.x = -0.2;
  g.add(spiritTip);

  // Flower garland on bow
  for (let i = 0; i < 5; i++) {
    const bud = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 6, 6),
      lambert(garland[i % garland.length]),
    );
    bud.position.set(Math.sin(i * 1.1) * 0.18, 0.58 + i * 0.06, -2.85 - i * 0.12);
    g.add(bud);
  }

  // Stern deck platform
  const stern = box(1.15, 0.12, 0.85, teakLight);
  stern.position.set(0, 0.52, 2.15);
  g.add(stern);

  // Gunwales
  for (const side of [-1, 1]) {
    const rail = box(0.1, 0.18, 3.8, teakLight);
    rail.position.set(side * 0.52, 0.58, 0.1);
    g.add(rail);
  }

  // Deck planks
  for (let i = 0; i < 5; i++) {
    const plank = box(0.82, 0.04, 0.55, i % 2 === 0 ? teakLight : teak);
    plank.position.set(0, 0.5, -1.2 + i * 0.62);
    g.add(plank);
  }

  // Bench seats
  for (const [z, rot] of [
    [-0.4, 0],
    [0.85, Math.PI],
  ] as Array<[number, number]>) {
    const bench = box(0.75, 0.12, 0.22, teakDark);
    bench.position.set(0, 0.62, z);
    bench.rotation.y = rot;
    g.add(bench);
    const back = box(0.75, 0.18, 0.08, bambooDark);
    back.position.set(0, 0.78, z + (rot === 0 ? -0.14 : 0.14));
    g.add(back);
  }

  // Hull stripe — red / gold accent along waterline
  for (const side of [-1, 1]) {
    const stripe = box(0.04, 0.08, 3.6, sailRed);
    stripe.position.set(side * 0.54, 0.28, 0.1);
    g.add(stripe);
    const goldLine = box(0.04, 0.05, 3.6, sailGold);
    goldLine.position.set(side * 0.54, 0.22, 0.1);
    g.add(goldLine);
  }

  // Outrigger float (ama) — carved log shape
  const float = box(0.32, 0.26, 2.8, teakDark);
  float.position.set(-1.65, 0.16, 0.15);
  g.add(float);
  const floatTipF = box(0.22, 0.18, 0.45, teakDark);
  floatTipF.position.set(-1.65, 0.14, -1.35);
  floatTipF.rotation.x = -0.15;
  g.add(floatTipF);
  const floatTipB = box(0.22, 0.18, 0.45, teakDark);
  floatTipB.position.set(-1.65, 0.14, 1.65);
  floatTipB.rotation.x = 0.12;
  g.add(floatTipB);

  // Bamboo booms (aka) + cross braces
  for (const oz of [-1.0, -0.2, 0.6, 1.35]) {
    const boom = box(1.45, 0.08, 0.08, bamboo);
    boom.position.set(-0.82, 0.42, oz);
    g.add(boom);
  }
  for (const oz of [-0.6, 0.35]) {
    const brace = box(0.06, 0.06, 0.9, bambooDark);
    brace.position.set(-1.65, 0.32, oz);
    brace.rotation.y = 0.35;
    g.add(brace);
  }

  // Main mast + yard
  const mast = box(0.1, 2.4, 0.1, teakDark);
  mast.position.set(0.05, 1.55, -0.15);
  g.add(mast);
  const yard = box(0.08, 0.08, 1.35, bamboo);
  yard.position.set(0.05, 2.55, -0.15);
  yard.rotation.y = 0.08;
  g.add(yard);

  // Triangular main sail — cream body with red/gold stripes
  const mainSail = box(0.05, 1.85, 1.25, sailCream);
  mainSail.position.set(0.42, 1.75, -0.15);
  mainSail.rotation.z = -0.12;
  g.add(mainSail);
  for (let i = 0; i < 4; i++) {
    const band = box(0.06, 0.14, 1.15 - i * 0.08, i % 2 === 0 ? sailRed : sailGold);
    band.position.set(0.44, 1.35 + i * 0.38, -0.15);
    band.rotation.z = -0.12;
    g.add(band);
  }

  // Small jib at bow
  const jib = box(0.04, 1.0, 0.75, white);
  jib.position.set(0.08, 1.05, -1.55);
  jib.rotation.x = 0.15;
  jib.rotation.z = 0.08;
  g.add(jib);

  // Shade canopy over stern
  const canopyPoleL = box(0.07, 1.05, 0.07, bamboo);
  canopyPoleL.position.set(-0.42, 1.0, 1.85);
  g.add(canopyPoleL);
  const canopyPoleR = box(0.07, 1.05, 0.07, bamboo);
  canopyPoleR.position.set(0.42, 1.0, 1.85);
  g.add(canopyPoleR);
  const canopy = box(1.05, 0.06, 0.95, lambert(0xf4c4a0));
  canopy.position.set(0, 1.48, 1.85);
  g.add(canopy);

  // Tiller + rudder hint
  const tiller = box(0.08, 0.55, 0.08, teakDark);
  tiller.position.set(0, 0.82, 2.45);
  tiller.rotation.x = -0.25;
  g.add(tiller);
  const rudder = box(0.18, 0.45, 0.06, teakDark);
  rudder.position.set(0, 0.22, 2.55);
  g.add(rudder);

  // Rope coils + net basket
  for (const [x, z] of [
    [0.28, 1.35],
    [-0.22, 0.55],
  ] as Array<[number, number]>) {
    const coil = box(0.22, 0.12, 0.22, rope);
    coil.position.set(x, 0.58, z);
    g.add(coil);
  }
  const basket = box(0.35, 0.28, 0.35, bambooDark);
  basket.position.set(-0.3, 0.62, 1.45);
  g.add(basket);

  return g;
}
