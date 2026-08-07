import * as THREE from 'three';
import type { BiomeId, PlanetDefinition } from '../data/planets';
import { createNameTag } from './EntityNameTag';

const TEX_SIZE = 384;

type Rgb = [number, number, number];

function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function hash2(x: number, y: number): number {
  return hash(x * 12.9898 + y * 78.233);
}

function smoothNoise(x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

function fbm(x: number, y: number, octaves = 4): number {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += smoothNoise(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return value;
}

function hexToRgb(hex: number): Rgb {
  return [(hex >> 16) & 255, (hex >> 8) & 255, hex & 255];
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function setPixel(data: Uint8ClampedArray, i: number, rgb: Rgb, a = 255): void {
  data[i] = rgb[0];
  data[i + 1] = rgb[1];
  data[i + 2] = rgb[2];
  data[i + 3] = a;
}

interface BiomeLook {
  atmosphere: number;
  atmosphereOpacity: number;
  emissive: number;
  emissiveIntensity: number;
  spinSpeed: number;
  ring?: { color: number; opacity: number; inner: number; outer: number };
  clouds?: boolean;
  moon?: boolean;
}

function biomeLook(planet: PlanetDefinition): BiomeLook {
  const biome = planet.biome;
  switch (biome) {
    case 'desert':
      return {
        atmosphere: 0xd4b080,
        atmosphereOpacity: 0.14,
        emissive: 0x3a2810,
        emissiveIntensity: 0.08,
        spinSpeed: 0.07,
      };
    case 'snow':
      return {
        atmosphere: 0xa8d4f0,
        atmosphereOpacity: 0.2,
        emissive: 0x6080a0,
        emissiveIntensity: 0.12,
        spinSpeed: 0.05,
      };
    case 'rainforest':
      return {
        atmosphere: 0x60c080,
        atmosphereOpacity: 0.18,
        emissive: 0x102810,
        emissiveIntensity: 0.08,
        spinSpeed: 0.09,
        clouds: true,
      };
    case 'swamp':
      return {
        atmosphere: 0x6a8050,
        atmosphereOpacity: 0.28,
        emissive: 0x1a2810,
        emissiveIntensity: 0.1,
        spinSpeed: 0.04,
      };
    case 'lava':
      return {
        atmosphere: 0xff5020,
        atmosphereOpacity: 0.22,
        emissive: 0xff3010,
        emissiveIntensity: 0.45,
        spinSpeed: 0.06,
      };
    case 'void':
      return {
        atmosphere: 0x505060,
        atmosphereOpacity: planet.id === 'void-c' ? 0.1 : 0.12,
        emissive: planet.id === 'void-c' ? 0x402010 : 0x202028,
        emissiveIntensity: planet.id === 'void-c' ? 0.2 : 0.06,
        spinSpeed: 0.03,
        ring: planet.id === 'void-b'
          ? { color: 0xb0a8c0, opacity: 0.35, inner: 1.35, outer: 1.85 }
          : undefined,
      };
    case 'ocean-island':
    default:
      return {
        atmosphere: planet.isHomeWorld ? 0x6ab0ff : 0x50a0d8,
        atmosphereOpacity: planet.isHomeWorld ? 0.26 : 0.22,
        emissive: 0x104060,
        emissiveIntensity: 0.1,
        spinSpeed: planet.isHomeWorld ? 0.1 : 0.08,
        clouds: true,
        moon: !!planet.isHomeWorld,
      };
  }
}

function paintSurface(
  ctx: CanvasRenderingContext2D,
  planet: PlanetDefinition,
  size: number,
): void {
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const tint = hexToRgb(planet.tint);
  const seed = hash(planet.id.length * 17 + planet.tint);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const lat = v * 2 - 1;
      const n = fbm(u * 6 + seed * 20, v * 4 + seed * 10, 5);
      const n2 = fbm(u * 14 + 3, v * 10 - seed * 5, 3);
      const i = (y * size + x) * 4;
      const rgb = paintBiomePixel(planet.biome, planet, tint, lat, n, n2, u, v);
      setPixel(data, i, rgb);
    }
  }
  ctx.putImageData(img, 0, 0);
}

function paintBiomePixel(
  biome: BiomeId,
  planet: PlanetDefinition,
  tint: Rgb,
  lat: number,
  n: number,
  n2: number,
  u: number,
  v: number,
): Rgb {
  const pole = Math.abs(lat);

  switch (biome) {
    case 'desert': {
      const sand = tint;
      const dune = mix(sand, [180, 110, 50], 0.35 + n * 0.4);
      const rock = mix([90, 70, 50], [60, 45, 35], n2);
      let c = mix(dune, rock, n > 0.62 ? 0.55 : n * 0.15);
      if (pole > 0.82) c = mix(c, [210, 190, 160], (pole - 0.82) * 3);
      // Banding
      const band = Math.sin(v * Math.PI * 8 + n * 2) * 0.08;
      return mix(c, sand, 0.3 + band);
    }
    case 'snow': {
      const ice = mix(tint, [255, 255, 255], 0.35);
      const deep = mix([140, 180, 210], [100, 140, 180], n);
      let c = mix(ice, deep, n * 0.45);
      if (n2 > 0.72) c = mix(c, [80, 110, 140], 0.5); // cracks
      if (pole > 0.55) c = mix(c, [245, 250, 255], (pole - 0.55) * 1.4);
      return c;
    }
    case 'rainforest': {
      const ocean = [40, 90, 140] as Rgb;
      const land = mix(tint, [30, 100, 40], 0.4);
      const forest = mix(land, [20, 60, 25], n2 * 0.6);
      const landMask = n > 0.48 ? 1 : 0;
      let c = landMask ? forest : ocean;
      if (landMask && n2 > 0.7) c = mix(c, [50, 90, 30], 0.4);
      if (pole > 0.88) c = mix(c, [200, 220, 230], 0.5);
      return c;
    }
    case 'swamp': {
      const murk = mix(tint, [60, 70, 40], 0.3);
      const bog = mix([50, 55, 30], [90, 80, 45], n);
      const water = mix([40, 55, 45], [30, 45, 40], n2);
      let c = n > 0.5 ? mix(murk, bog, n2) : water;
      if (n2 > 0.75) c = mix(c, [70, 90, 40], 0.35);
      return c;
    }
    case 'lava': {
      const rock = mix([40, 30, 28], [20, 16, 14], n);
      const lava = mix([255, 80, 20], [255, 40, 0], n2);
      const vein = Math.abs(Math.sin(u * 40 + n * 8) * Math.cos(v * 30 + n2 * 6));
      const hot = vein > 0.75 || n2 > 0.78;
      return hot ? lava : mix(rock, lava, n > 0.7 ? 0.25 : 0.05);
    }
    case 'void': {
      const rock = mix(tint, [30, 28, 35], 0.4);
      const crater = mix(rock, [15, 14, 18], n2 > 0.65 ? 0.7 : n * 0.3);
      let c = crater;
      // Crater rings
      if (n > 0.7 && n2 < 0.4) c = mix(c, [50, 48, 55], 0.5);
      if (planet.id === 'void-c' && n2 > 0.82 && hash2(u * 50, v * 50) > 0.7) {
        c = mix(c, [255, 140, 40], 0.75);
      }
      return c;
    }
    case 'ocean-island':
    default: {
      const oceanDeep = mix(tint, [20, 60, 120], 0.35);
      const oceanShallow = mix(tint, [60, 160, 200], 0.25);
      const land = planet.isHomeWorld
        ? mix([50, 120, 50], [120, 100, 60], n2)
        : mix([80, 140, 70], [160, 150, 100], n2);
      const islandThresh = planet.isHomeWorld ? 0.52 : 0.78;
      const isLand = n > islandThresh;
      let c = isLand ? land : mix(oceanDeep, oceanShallow, n2 * 0.6 + (1 - pole) * 0.2);
      if (isLand && planet.isHomeWorld && n2 > 0.55) c = mix(c, [40, 100, 40], 0.4);
      if (pole > 0.85) c = mix(c, [240, 245, 255], (pole - 0.85) * 4);
      return c;
    }
  }
}

function paintClouds(ctx: CanvasRenderingContext2D, size: number, seed: number): void {
  const img = ctx.getImageData(0, 0, size, size);
  const data = img.data;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;
      const c = fbm(u * 8 + seed, v * 5 + seed * 2, 4);
      const band = Math.sin(v * Math.PI * 3 + c * 2) * 0.15 + 0.5;
      if (c > 0.58 && band > 0.45) {
        const i = (y * size + x) * 4;
        const alpha = Math.min(0.55, (c - 0.58) * 2.2);
        data[i] = Math.round(data[i] * (1 - alpha) + 245 * alpha);
        data[i + 1] = Math.round(data[i + 1] * (1 - alpha) + 248 * alpha);
        data[i + 2] = Math.round(data[i + 2] * (1 - alpha) + 255 * alpha);
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function makePlanetTexture(planet: PlanetDefinition, look: BiomeLook): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_SIZE;
  canvas.height = TEX_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    const fallback = new THREE.CanvasTexture(canvas);
    return fallback;
  }
  paintSurface(ctx, planet, TEX_SIZE);
  if (look.clouds) {
    paintClouds(ctx, TEX_SIZE, hash(planet.tint));
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Detailed procedural planet for the space-flight scene.
 * Biome-specific canvas textures, atmosphere, optional rings/moons.
 */
export function buildSpacePlanet(planet: PlanetDefinition): THREE.Group {
  const root = new THREE.Group();
  root.name = `space-planet-${planet.id}`;

  const look = biomeLook(planet);
  const baseRadius = 12 + (planet.hasContent ? 6 : 2) + (planet.isHomeWorld ? 2 : 0);
  const radius = baseRadius;

  const body = new THREE.Group();
  const texture = makePlanetTexture(planet, look);
  const mat = new THREE.MeshLambertMaterial({
    map: texture,
    color: 0xffffff,
    emissive: look.emissive,
    emissiveIntensity: look.emissiveIntensity,
  });
  if (planet.biome === 'lava') {
    mat.emissiveMap = texture;
    mat.emissiveIntensity = 0.55;
  }

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), mat);
  body.add(sphere);

  // Soft atmosphere shell
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.08, 32, 24),
    new THREE.MeshBasicMaterial({
      color: look.atmosphere,
      transparent: true,
      opacity: look.atmosphereOpacity,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  body.add(atmosphere);

  // Outer glow rim
  const rim = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 1.14, 24, 16),
    new THREE.MeshBasicMaterial({
      color: look.atmosphere,
      transparent: true,
      opacity: look.atmosphereOpacity * 0.35,
      side: THREE.BackSide,
      depthWrite: false,
    }),
  );
  body.add(rim);

  if (look.ring) {
    const ringGeo = new THREE.RingGeometry(
      radius * look.ring.inner,
      radius * look.ring.outer,
      64,
    );
    const ringMat = new THREE.MeshBasicMaterial({
      color: look.ring.color,
      transparent: true,
      opacity: look.ring.opacity,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.4;
    body.add(ring);
  }

  if (look.moon) {
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(radius * 0.18, 16, 12),
      new THREE.MeshLambertMaterial({ color: 0xc8c4b8, emissive: 0x303028, emissiveIntensity: 0.1 }),
    );
    moon.position.set(radius * 1.7, radius * 0.35, radius * 0.4);
    body.add(moon);
  }

  root.add(body);

  const label = createNameTag(planet.name, {
    color: '#4da6ff',
    stroke: '#001a33',
  });
  label.position.y = radius + 10;
  label.scale.multiplyScalar(28);
  root.add(label);

  root.userData.planetId = planet.id;
  root.userData.spinSpeed = look.spinSpeed;
  root.userData.spinBody = body;
  root.userData.radius = radius;

  return root;
}
