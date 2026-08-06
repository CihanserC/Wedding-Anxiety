import * as THREE from 'three';
import { CAT_FEED_MESSAGES, PIANO_PLAY_MESSAGES } from '../../data/messages';
import { updateEatingCat } from '../../rendering/MapProps';
import type { InteractionHost } from './types';

export class MapSkipInteractions {
  private catFed = false;
  private pianoPlayed = false;
  private catInteractArmed = false;
  private pianoInteractArmed = false;
  private catMesh: THREE.Object3D | null = null;
  private catAnimTime = 0;

  constructor(private readonly host: InteractionHost) {}

  resetForNewRun(): void {
    this.catFed = false;
    this.pianoPlayed = false;
    this.catInteractArmed = false;
    this.pianoInteractArmed = false;
    this.catAnimTime = 0;
  }

  resetForMapLoad(): void {
    this.catFed = false;
    this.pianoPlayed = false;
    this.catInteractArmed = false;
    this.pianoInteractArmed = false;
  }

  setCatMesh(mesh: THREE.Object3D | null): void {
    this.catMesh = mesh;
  }

  tickMapSkipHint(): void {
    if (this.host.levelState.phase !== 'awaiting-map-skip') return;

    const mapId = this.host.getMapId();
    const piano = this.host.findInteractable('piano');
    const cat = this.host.findInteractable('cat');

    if (mapId === 'concert-hall' && piano && this.host.isNearInteractable(piano)) {
      this.host.hud.setSubtitle([]);
      return;
    }
    if (mapId === 'lighthouse' && cat && this.host.isNearInteractable(cat)) {
      this.host.hud.setSubtitle([]);
      return;
    }

    if (mapId === 'concert-hall') {
      this.host.hud.setSubtitle([PIANO_PLAY_MESSAGES.mapSkipHint]);
    } else if (mapId === 'lighthouse') {
      this.host.hud.setSubtitle([CAT_FEED_MESSAGES.mapSkipHint]);
    }
  }

  tickCat(dt: number): void {
    if (this.catMesh) {
      this.catAnimTime += dt;
      updateEatingCat(this.catMesh, this.catAnimTime);
    }

    if (this.catFed || !this.host.input.isLocked() || !this.canUseMapSkip()) {
      if (!this.catFed) return;
      this.host.hud.setInteractPrompt(null);
      return;
    }

    const cat = this.host.findInteractable('cat');
    if (!cat) return;

    if (!this.host.isNearInteractable(cat)) {
      this.catInteractArmed = false;
      this.host.input.flushInteract();
      this.host.hud.setInteractPrompt(null);
      return;
    }

    this.host.hud.setInteractPrompt(CAT_FEED_MESSAGES.prompt);
    this.host.hud.setSubtitle([]);

    if (!this.catInteractArmed) {
      this.catInteractArmed = true;
      this.host.input.flushInteract();
      return;
    }

    if (this.host.input.consumeInteract()) {
      this.confirmCatSkip();
    }
  }

  tickPiano(): void {
    if (this.pianoPlayed || !this.host.input.isLocked() || !this.canUseMapSkip()) return;

    const piano = this.host.findInteractable('piano');
    if (!piano) return;

    if (!this.host.isNearInteractable(piano)) {
      this.pianoInteractArmed = false;
      this.host.input.flushInteract();
      if (!this.host.findInteractable('cat')) {
        this.host.hud.setInteractPrompt(null);
      }
      return;
    }

    this.host.hud.setInteractPrompt(PIANO_PLAY_MESSAGES.prompt);
    this.host.hud.setSubtitle([]);

    if (!this.pianoInteractArmed) {
      this.pianoInteractArmed = true;
      this.host.input.flushInteract();
      return;
    }

    if (this.host.input.consumeInteract()) {
      this.confirmPianoSkip();
    }
  }

  private canUseMapSkip(): boolean {
    const phase = this.host.levelState.phase;
    return phase === 'active' || phase === 'awaiting-map-skip';
  }

  private confirmCatSkip(): void {
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.dialogue.showChoices({
      title: CAT_FEED_MESSAGES.confirmTitle,
      speaker: 'Harita Atlama',
      choices: [
        { id: 'a', label: CAT_FEED_MESSAGES.confirmButton },
        { id: 'b', label: CAT_FEED_MESSAGES.cancelButton },
      ],
      onChoose: (id) => {
        if (id === 'a') this.feedCatAndAdvance();
        else this.host.requestPointerLock();
      },
    });
  }

  private confirmPianoSkip(): void {
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.dialogue.showChoices({
      title: PIANO_PLAY_MESSAGES.confirmTitle,
      speaker: 'Harita Atlama',
      choices: [
        { id: 'a', label: PIANO_PLAY_MESSAGES.confirmButton },
        { id: 'b', label: PIANO_PLAY_MESSAGES.cancelButton },
      ],
      onChoose: (id) => {
        if (id === 'a') this.playPianoAndAdvance();
        else this.host.requestPointerLock();
      },
    });
  }

  private feedCatAndAdvance(): void {
    if (this.catFed) return;
    this.catFed = true;
    this.host.enemies.clear();
    this.host.setState('transition');
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setCrosshairVisible(false);
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setSubtitle([]);
    this.host.anxiety.reduce(20);

    this.host.dialogue.show({
      title: CAT_FEED_MESSAGES.title,
      body: CAT_FEED_MESSAGES.body,
      continueLabel: CAT_FEED_MESSAGES.button,
      onContinue: () => this.host.advanceStageAfterSkip(),
    });
  }

  private playPianoAndAdvance(): void {
    if (this.pianoPlayed) return;
    this.pianoPlayed = true;
    this.host.enemies.clear();
    this.host.setState('transition');
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setCrosshairVisible(false);
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setSubtitle([]);
    this.host.anxiety.reduce(25);
    this.host.audio.play('wave-clear');
    this.host.audio.playPianoNote();

    this.host.dialogue.show({
      title: PIANO_PLAY_MESSAGES.title,
      body: PIANO_PLAY_MESSAGES.body,
      continueLabel: PIANO_PLAY_MESSAGES.button,
      onContinue: () => this.host.advanceStageAfterSkip(),
    });
  }

  resetSkipFlagsAfterAdvance(): void {
    this.pianoPlayed = false;
    this.catFed = false;
    this.pianoInteractArmed = false;
    this.catInteractArmed = false;
  }
}
