import type { InputManager } from '../../input/InputManager';
import type { HUD } from '../../ui/HUD';
import type { DialogueBox } from '../../ui/DialogueBox';
import type { AudioManager } from '../AudioManager';
import type { AnxietyMeter } from '../AnxietyMeter';
import type { EnemyManager } from '../EnemyManager';
import type { Player } from '../Player';
import type { World } from '../World';
import type { ProjectileEffects } from '../../entities/Projectile';
import type { LevelState } from '../WaveManager';
import type { MapId } from '../../data/maps';
import type { InteractableSpec } from '../worldGen/types';

export type InteractionGameState =
  | 'menu'
  | 'intro'
  | 'playing'
  | 'paused'
  | 'boss-cinematic'
  | 'transition'
  | 'map-intro'
  | 'win'
  | 'lose';

export interface InteractionHost {
  readonly mapIndex: number;
  readonly levelIndex: number;
  readonly levelState: LevelState;
  readonly state: InteractionGameState;
  readonly world: World;
  readonly input: InputManager;
  readonly player: Player;
  readonly hud: HUD;
  readonly dialogue: DialogueBox;
  readonly audio: AudioManager;
  readonly anxiety: AnxietyMeter;
  readonly enemies: EnemyManager;
  readonly effects: ProjectileEffects;

  getMapId(): MapId;
  isNearInteractable(item: { x: number; z: number; radius?: number }): boolean;
  setState(state: InteractionGameState): void;
  setIntentionalUnlock(value: boolean): void;
  advanceStageAfterSkip(): void;
  transitionToBaliHoneymoon(): void;
  transitionToDubai(): void;
  returnToMainMenu(): void;
  beginLevel(mapIndex: number, levelIndex: number): void;
  loadMap(mapIndex: number): void;
  respawnPlayer(): void;
  requestPointerLock(): void;
  releasePointerLock(): void;
  findInteractable(kind: InteractableSpec['kind']): InteractableSpec | undefined;
  unlockBaliTreasureHunt(): void;
  enterSpaceMode(): void;
}
