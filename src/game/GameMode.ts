/** High-level play mode. Surface = voxel FPS; space modes = galaxy travel. */
export type GameMode = 'surface' | 'spaceFlight' | 'galaxyMap';

export function isSpaceMode(mode: GameMode): boolean {
  return mode === 'spaceFlight' || mode === 'galaxyMap';
}
