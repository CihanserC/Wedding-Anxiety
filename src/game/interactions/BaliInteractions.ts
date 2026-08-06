import { BALI_TREASURE_MESSAGES } from '../../data/messages';
import type { InteractionHost } from './types';

export class BaliInteractions {
  private treasureDiscovered = false;

  constructor(private readonly host: InteractionHost) {}

  resetForNewRun(): void {
    this.treasureDiscovered = false;
  }

  isTreasureDiscovered(): boolean {
    return this.treasureDiscovered;
  }

  setTreasureDiscovered(value: boolean): void {
    this.treasureDiscovered = value;
  }

  tickTreasure(hasChestMesh: boolean): void {
    if (
      this.host.getMapId() !== 'bali' ||
      this.host.levelState.phase !== 'celebration' ||
      this.treasureDiscovered ||
      !hasChestMesh
    ) {
      return;
    }

    const chest = this.host.findInteractable('treasure-chest');
    if (!chest || !this.host.isNearInteractable(chest)) {
      this.host.hud.setInteractPrompt(null);
      return;
    }

    this.host.hud.setInteractPrompt(BALI_TREASURE_MESSAGES.prompt);

    if (this.host.input.consumeInteract()) {
      this.discoverTreasure();
    }
  }

  private discoverTreasure(): void {
    this.treasureDiscovered = true;
    this.host.hud.setInteractPrompt(null);
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setCrosshairVisible(false);
    this.host.audio.play('win');

    this.host.dialogue.show({
      title: BALI_TREASURE_MESSAGES.title,
      body: BALI_TREASURE_MESSAGES.body,
      continueLabel: BALI_TREASURE_MESSAGES.continueLabel,
      onContinue: () => this.host.transitionToDubai(),
    });
  }
}
