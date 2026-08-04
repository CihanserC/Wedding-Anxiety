import type { LevelDefinition } from '../data/maps';

export type LevelPhase =
  | 'intro'
  | 'active'
  | 'celebration'
  | 'clearing'
  | 'awaiting-map-skip'
  | 'done';

export interface LevelState {
  level: LevelDefinition;
  phase: LevelPhase;
  batchIndex: number;
  timer: number;
  spawnedTotal: number;
  killedTotal: number;
}

export function makeLevelState(level: LevelDefinition): LevelState {
  return {
    level,
    phase: 'intro',
    batchIndex: 0,
    timer: 0,
    spawnedTotal: 0,
    killedTotal: 0,
  };
}
