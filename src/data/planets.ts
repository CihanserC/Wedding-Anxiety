import type { MapId } from './maps';

export type BiomeId =
  | 'desert'
  | 'snow'
  | 'rainforest'
  | 'swamp'
  | 'lava'
  | 'ocean-island'
  | 'void';

export type AlienDisposition = 'none' | 'peaceful' | 'hostile';

export type SpecialNpcId = 'darth-vader' | 'master-yoda';

export interface PlanetDefinition {
  id: string;
  name: string;
  biome: BiomeId;
  /** 0–100 coords for the 2D galaxy overlay. */
  galaxyPosition: { x: number; y: number };
  /** Position in the 3D space-flight scene. */
  spacePosition: { x: number; y: number; z: number };
  /** Surface map to load on landing. */
  mapId: MapId;
  disposition: AlienDisposition;
  hasContent: boolean;
  specialNpc?: SpecialNpcId;
  /** Hex color for procedural planet sphere (no external assets). */
  tint: number;
  blurb: string;
  /** Home world — landing returns to Dubai beside the UFO. */
  isHomeWorld?: boolean;
}

export const BIOME_LABELS: Record<BiomeId, string> = {
  desert: 'Çöl',
  snow: 'Kar',
  rainforest: 'Yağmur Ormanı',
  swamp: 'Bataklık',
  lava: 'Lav',
  'ocean-island': 'Okyanus Adası',
  void: 'Boş',
};

export const DISPOSITION_LABELS: Record<AlienDisposition, string> = {
  none: 'Issız',
  peaceful: 'Barışçıl',
  hostile: 'Düşmanca',
};

export const PLANETS: PlanetDefinition[] = [
  {
    id: 'earth',
    name: 'Dünya',
    biome: 'ocean-island',
    galaxyPosition: { x: 50, y: 50 },
    spacePosition: { x: 0, y: -20, z: -110 },
    mapId: 'dubai',
    disposition: 'peaceful',
    hasContent: true,
    isHomeWorld: true,
    tint: 0x2a7dd4,
    blurb: 'Ev. Dubai çölünde bekleyen bir uzay gemisi.',
  },
  {
    id: 'tatooine',
    name: 'Kum Diyar',
    biome: 'desert',
    galaxyPosition: { x: 22, y: 58 },
    spacePosition: { x: -180, y: 20, z: -120 },
    mapId: 'planet-desert',
    disposition: 'peaceful',
    hasContent: true,
    tint: 0xe4c48a,
    blurb: 'Altın kumlar ve barışçıl gezginler.',
  },
  {
    id: 'hoth',
    name: 'Buz Vadi',
    biome: 'snow',
    galaxyPosition: { x: 70, y: 28 },
    spacePosition: { x: 200, y: -30, z: -80 },
    mapId: 'planet-snow',
    disposition: 'hostile',
    hasContent: true,
    tint: 0xd0e8f8,
    blurb: 'Donmuş ovalar. Dikkat: düşmanca yaşam formları.',
  },
  {
    id: 'endor',
    name: 'Yeşil Taç',
    biome: 'rainforest',
    galaxyPosition: { x: 38, y: 72 },
    spacePosition: { x: -90, y: 40, z: 160 },
    mapId: 'planet-rainforest',
    disposition: 'peaceful',
    hasContent: true,
    tint: 0x3a9a4a,
    blurb: 'Yoğun yağmur ormanı ve dost canlısı yerliler.',
  },
  {
    id: 'dagobah',
    name: 'Sis Bataklığı',
    biome: 'swamp',
    galaxyPosition: { x: 55, y: 78 },
    spacePosition: { x: 60, y: -50, z: 200 },
    mapId: 'planet-swamp',
    disposition: 'peaceful',
    hasContent: true,
    specialNpc: 'master-yoda',
    tint: 0x4a6a38,
    blurb: 'Sisli bataklık. Bilge bir varlık seni bekliyor…',
  },
  {
    id: 'mustafar',
    name: 'Kızıl Ateş',
    biome: 'lava',
    galaxyPosition: { x: 78, y: 62 },
    spacePosition: { x: 220, y: 10, z: 90 },
    mapId: 'planet-lava',
    disposition: 'hostile',
    hasContent: true,
    specialNpc: 'darth-vader',
    tint: 0xc03010,
    blurb: 'Lav nehirleri. Karanlık bir lord burada yaşıyor.',
  },
  {
    id: 'kamino',
    name: 'Mavi Damla',
    biome: 'ocean-island',
    galaxyPosition: { x: 48, y: 35 },
    spacePosition: { x: 20, y: 60, z: -200 },
    mapId: 'planet-ocean-mini',
    disposition: 'none',
    hasContent: false,
    tint: 0x3a90c8,
    blurb: 'Neredeyse tamamen okyanus — minik bir ada.',
  },
  {
    id: 'void-a',
    name: 'Kül Küresi',
    biome: 'void',
    galaxyPosition: { x: 18, y: 30 },
    spacePosition: { x: -220, y: -40, z: 40 },
    mapId: 'planet-void',
    disposition: 'none',
    hasContent: true,
    tint: 0x6a6870,
    blurb: 'Kül gibi sessiz — gölgeler dolaşıyor.',
  },
  {
    id: 'void-b',
    name: 'Soluk Ay',
    biome: 'void',
    galaxyPosition: { x: 82, y: 40 },
    spacePosition: { x: 140, y: 80, z: -160 },
    mapId: 'planet-void',
    disposition: 'none',
    hasContent: true,
    tint: 0x9890a0,
    blurb: 'Soluk bir uydu. Gölgeler uyanık.',
  },
  {
    id: 'void-c',
    name: 'Kara Toz',
    biome: 'void',
    galaxyPosition: { x: 60, y: 18 },
    spacePosition: { x: -40, y: -70, z: -220 },
    mapId: 'planet-void',
    disposition: 'none',
    hasContent: true,
    tint: 0x3a3540,
    blurb: 'Tozlu sessizlikte turuncu gözler parlıyor.',
  },
];

export function getPlanetById(id: string): PlanetDefinition | undefined {
  return PLANETS.find((p) => p.id === id);
}

export function getPlanetByMapId(mapId: MapId): PlanetDefinition | undefined {
  return PLANETS.find((p) => p.mapId === mapId);
}
