import type { SpawnRequest } from './EnemyManager';

export interface WaveDefinition {
  index: number;
  totalEnemies: number;
  batches: SpawnRequest[];
  batchInterval: number;
}

export const WAVES: WaveDefinition[] = [
  {
    index: 1,
    totalEnemies: 8,
    batchInterval: 4,
    batches: [
      { type: 'merakli-teyze', count: 3 },
      { type: 'merakli-teyze', count: 3 },
      { type: 'merakli-teyze', count: 2 },
    ],
  },
  {
    index: 2,
    totalEnemies: 12,
    batchInterval: 3.5,
    batches: [
      { type: 'merakli-teyze', count: 2 },
      { type: 'mukemmeliyetci-kuzen', count: 3 },
      { type: 'mukemmeliyetci-kuzen', count: 2 },
      { type: 'zaman-canavari', count: 2 },
      { type: 'mukemmeliyetci-kuzen', count: 3 },
    ],
  },
  {
    index: 3,
    totalEnemies: 14,
    batchInterval: 3,
    batches: [
      { type: 'zaman-canavari', count: 3 },
      { type: 'mukemmeliyetci-kuzen', count: 3 },
      { type: 'zaman-canavari', count: 3 },
      { type: 'merakli-teyze', count: 4 },
      { type: 'beklenti-golgesi', count: 1 },
    ],
  },
];

export type WavePhase = 'intro' | 'active' | 'clearing' | 'done';

export interface WaveState {
  wave: WaveDefinition;
  phase: WavePhase;
  batchIndex: number;
  timer: number;
  spawnedTotal: number;
  killedTotal: number;
}

export function makeWaveState(wave: WaveDefinition): WaveState {
  return {
    wave,
    phase: 'intro',
    batchIndex: 0,
    timer: 0,
    spawnedTotal: 0,
    killedTotal: 0,
  };
}

export function totalWaveCount(): number {
  return WAVES.length;
}
