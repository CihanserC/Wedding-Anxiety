import {
  DUBAI_FINALE_MESSAGES,
  DUBAI_LOCAL_MESSAGES,
  DUBAI_NPC_MESSAGES,
  LAMBO_DRIVE_MESSAGES,
  SPACE_UFO_MESSAGES,
  TV_MESSAGES,
} from '../../data/messages';
import { NPC_STATS } from '../../data/npcs';
import type { InteractionHost } from './types';

export interface DubaiCarHost {
  isDriving(): boolean;
  enterDrive(): void;
  exitDrive(): void;
  isTvOn(): boolean;
  setTvPower(on: boolean): void;
  isLamboInteractArmed(): boolean;
  armLamboInteract(): void;
  disarmLamboInteract(): void;
  flushInteract(): void;
}

export class DubaiInteractions {
  private dubaiFinaleShown = false;
  private lamboInteractArmed = false;

  constructor(
    private readonly host: InteractionHost,
    private readonly car: DubaiCarHost,
  ) {}

  resetForNewRun(): void {
    this.dubaiFinaleShown = false;
    this.lamboInteractArmed = false;
  }

  tickExplore(): void {
    if (this.host.getMapId() !== 'dubai' || !this.host.input.isLocked()) return;
    if (this.host.levelState.phase !== 'celebration') return;

    if (this.car.isDriving()) {
      this.host.hud.setSubtitle([]);
      this.host.hud.setInteractPrompt(
        `${LAMBO_DRIVE_MESSAGES.exitPrompt}  ·  ${LAMBO_DRIVE_MESSAGES.cameraToggle}`,
      );
      if (this.host.input.consumeInteract()) this.car.exitDrive();
      return;
    }

    this.host.hud.setSubtitle([]);

    const sunset = this.host.findInteractable('sunset-point');
    const lambo = this.host.findInteractable('lamborghini-drive');
    const groom = this.host.findInteractable('groom-chat');
    const bride = this.host.findInteractable('bride-chat');
    const tv = this.host.findInteractable('plasma-tv');
    const ufo = this.host.findInteractable('ufo-board');
    const nearestLocal = this.findNearestLocal();

    const nearSunset = sunset ? this.host.isNearInteractable(sunset) : false;
    const nearLambo = lambo ? this.host.isNearInteractable(lambo) : false;
    const nearGroom = groom ? this.host.isNearInteractable(groom) : false;
    const nearBride = bride ? this.host.isNearInteractable(bride) : false;
    const nearTv = tv ? this.host.isNearInteractable(tv) : false;
    const nearUfo = ufo ? this.host.isNearInteractable(ufo) : false;
    const nearLocal = nearestLocal !== null;

    if (!nearSunset && !nearLambo && !nearGroom && !nearBride && !nearLocal && !nearTv && !nearUfo) {
      this.lamboInteractArmed = false;
      this.host.hud.setInteractPrompt(null);
      return;
    }

    const dist = (item: { x: number; z: number } | undefined, near: boolean) =>
      near && item
        ? Math.hypot(this.host.player.position.x - item.x, this.host.player.position.z - item.z)
        : Infinity;

    const sunsetDist = dist(sunset, nearSunset);
    const lamboDist = dist(lambo, nearLambo);
    const groomDist = dist(groom, nearGroom);
    const brideDist = dist(bride, nearBride);
    const localDist = nearestLocal?.dist ?? Infinity;
    const tvDist = dist(tv, nearTv);
    const ufoDist = dist(ufo, nearUfo);

    const closest = Math.min(sunsetDist, lamboDist, groomDist, brideDist, localDist, tvDist, ufoDist);

    if (closest === sunsetDist && nearSunset) {
      this.host.hud.setInteractPrompt(DUBAI_FINALE_MESSAGES.prompt);
      if (this.host.input.consumeInteract()) this.openFinale();
      return;
    }

    if (closest === lamboDist && nearLambo) {
      this.host.hud.setInteractPrompt(LAMBO_DRIVE_MESSAGES.prompt);
      if (!this.lamboInteractArmed) {
        this.lamboInteractArmed = true;
        this.host.input.flushInteract();
        return;
      }
      if (this.host.input.consumeInteract()) this.car.enterDrive();
      return;
    }

    this.lamboInteractArmed = false;

    if (closest === ufoDist && nearUfo) {
      this.host.hud.setInteractPrompt(SPACE_UFO_MESSAGES.prompt);
      if (this.host.input.consumeInteract()) this.openSpaceUfoTeaser();
      return;
    }

    if (closest === tvDist && nearTv) {
      this.host.hud.setInteractPrompt(this.car.isTvOn() ? TV_MESSAGES.turnOff : TV_MESSAGES.turnOn);
      if (this.host.input.consumeInteract()) this.car.setTvPower(!this.car.isTvOn());
      return;
    }

    if (closest === localDist && nearestLocal) {
      const prompt =
        nearestLocal.kind === 'camel-chat'
          ? DUBAI_LOCAL_MESSAGES.camelPrompt
          : DUBAI_LOCAL_MESSAGES.arabPrompt;
      this.host.hud.setInteractPrompt(prompt);
      if (this.host.input.consumeInteract()) {
        this.openLocalChat(nearestLocal.kind, nearestLocal.speakerName);
      }
      return;
    }

    let target: 'bride' | 'groom' | null = null;
    if (nearGroom && nearBride) {
      target = groomDist <= brideDist ? 'groom' : 'bride';
    } else if (nearGroom) {
      target = 'groom';
    } else if (nearBride) {
      target = 'bride';
    }

    if (target === 'groom') {
      this.host.hud.setInteractPrompt(DUBAI_NPC_MESSAGES.groomChatPrompt);
    } else if (target === 'bride') {
      this.host.hud.setInteractPrompt(DUBAI_NPC_MESSAGES.brideChatPrompt);
    }

    if (this.host.input.consumeInteract() && target) {
      this.openDubaiChatChoices(target);
    }
  }

  private openFinale(): void {
    if (this.dubaiFinaleShown) {
      this.showFinaleChoices();
      return;
    }
    this.dubaiFinaleShown = true;
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setCrosshairVisible(false);
    this.host.audio.play('win');

    this.host.dialogue.show({
      title: DUBAI_FINALE_MESSAGES.title,
      body: DUBAI_FINALE_MESSAGES.body,
      continueLabel: DUBAI_FINALE_MESSAGES.continueExploring,
      onContinue: () => this.showFinaleChoices(),
    });
  }

  private showFinaleChoices(): void {
    this.host.dialogue.showChoices({
      title: DUBAI_FINALE_MESSAGES.title,
      speaker: 'Hilal & Cihanser',
      choices: [
        { id: 'a', label: DUBAI_FINALE_MESSAGES.continueExploring },
        { id: 'b', label: DUBAI_FINALE_MESSAGES.mainMenu },
      ],
      onChoose: (id) => {
        if (id === 'b') {
          this.host.returnToMainMenu();
          return;
        }
        if (this.host.state === 'playing') {
          this.host.hud.setCrosshairVisible(false);
          this.host.requestPointerLock();
        }
      },
    });
  }

  private findNearestLocal(): {
    kind: 'camel-chat' | 'arab-chat';
    dist: number;
    speakerName: string;
  } | null {
    let best: { kind: 'camel-chat' | 'arab-chat'; dist: number; speakerName: string } | null = null;
    for (const item of this.host.world.interactables) {
      if (item.kind !== 'camel-chat' && item.kind !== 'arab-chat') continue;
      if (!this.host.isNearInteractable(item)) continue;
      const dist = Math.hypot(this.host.player.position.x - item.x, this.host.player.position.z - item.z);
      if (!best || dist < best.dist) {
        best = {
          kind: item.kind,
          dist,
          speakerName:
            item.speakerName ??
            (item.kind === 'camel-chat' ? NPC_STATS.camel.displayName : NPC_STATS['arab-man'].displayName),
        };
      }
    }
    return best;
  }

  private openLocalChat(kind: 'camel-chat' | 'arab-chat', speakerName: string): void {
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setCrosshairVisible(false);

    const speakerLines = DUBAI_LOCAL_MESSAGES.bySpeaker[speakerName];
    const pool = speakerLines ?? DUBAI_LOCAL_MESSAGES.lines;
    const body = pool[Math.floor(Math.random() * pool.length)] ?? pool[0];
    const title = kind === 'camel-chat' ? `${speakerName} 🐪` : speakerName;

    this.host.dialogue.show({
      title,
      body: body.replace(/\n/g, '<br/>'),
      continueLabel: DUBAI_LOCAL_MESSAGES.continueLabel,
      onContinue: () => {
        if (this.host.state === 'playing' && this.host.levelState.phase === 'celebration') {
          this.host.hud.setCrosshairVisible(false);
          this.host.requestPointerLock();
        }
      },
    });
  }

  private openSpaceUfoTeaser(): void {
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setCrosshairVisible(false);
    this.host.audio.play('win');

    this.host.dialogue.show({
      title: SPACE_UFO_MESSAGES.title,
      body: SPACE_UFO_MESSAGES.body,
      continueLabel: SPACE_UFO_MESSAGES.continueLabel,
      onContinue: () => {
        if (this.host.state === 'playing' && this.host.levelState.phase === 'celebration') {
          this.host.hud.setCrosshairVisible(false);
          this.host.requestPointerLock();
        }
      },
    });
  }

  private openDubaiChatChoices(npc: 'bride' | 'groom'): void {
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setCrosshairVisible(false);

    this.host.dialogue.showChoices({
      title: DUBAI_NPC_MESSAGES.choiceTitle,
      speaker: NPC_STATS[npc].displayName,
      choices: [
        { id: 'a', label: DUBAI_NPC_MESSAGES.choices[npc].a },
        { id: 'b', label: DUBAI_NPC_MESSAGES.choices[npc].b },
        { id: 'c', label: DUBAI_NPC_MESSAGES.choices[npc].c },
      ],
      onChoose: (id) => this.showDubaiChatResponse(npc, id),
    });
  }

  private showDubaiChatResponse(npc: 'bride' | 'groom', choice: 'a' | 'b' | 'c'): void {
    const body = DUBAI_NPC_MESSAGES.responses[npc][choice];
    this.host.dialogue.show({
      title: NPC_STATS[npc].displayName,
      body,
      continueLabel: 'Devam Et',
      onContinue: () => {
        if (this.host.state === 'playing' && this.host.levelState.phase === 'celebration') {
          this.host.hud.setCrosshairVisible(false);
          this.host.requestPointerLock();
        }
      },
    });
  }
}
