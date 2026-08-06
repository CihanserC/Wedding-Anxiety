import * as THREE from 'three';
import {
  ALTAR_MESSAGES,
  CAKE_MESSAGES,
  SUZY_CAT_MESSAGES,
  WEDDING_NPC_MESSAGES,
} from '../../data/messages';
import { NPC_STATS } from '../../data/npcs';
import { updateSuzyCatIdle } from '../../rendering/SuzyCat';
import type { InteractionHost } from './types';

const CAKE_BUFF_DURATION = 15;

export class WeddingInteractions {
  private altarUsedThisLevel = false;
  private cakeUsedThisLevel = false;
  private weddingChatNpc: 'bride' | 'groom' | null = null;
  private suzyCatMesh: THREE.Object3D | null = null;
  private suzyAnimTime = 0;

  constructor(private readonly host: InteractionHost) {}

  resetForNewRun(): void {
    this.altarUsedThisLevel = false;
    this.cakeUsedThisLevel = false;
    this.weddingChatNpc = null;
    this.suzyAnimTime = 0;
  }

  resetForLevel(): void {
    this.altarUsedThisLevel = false;
    this.cakeUsedThisLevel = false;
  }

  setSuzyCatMesh(mesh: THREE.Object3D | null): void {
    this.suzyCatMesh = mesh;
  }

  tickAltar(): void {
    if (this.altarUsedThisLevel || !this.host.input.isLocked()) return;
    if (this.host.levelState.phase === 'celebration') return;

    const altar = this.host.findInteractable('altar');
    if (!altar || !this.host.isNearInteractable(altar)) return;

    this.host.hud.setInteractPrompt(ALTAR_MESSAGES.prompt);

    if (this.host.input.consumeInteract()) {
      this.useAltarBreather();
    }
  }

  private useAltarBreather(): void {
    if (this.altarUsedThisLevel) return;
    this.altarUsedThisLevel = true;
    this.host.anxiety.reduce(15);
    this.host.hud.setInteractPrompt(null);
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.dialogue.show({
      title: ALTAR_MESSAGES.title,
      body: ALTAR_MESSAGES.body,
      continueLabel: 'Devam Et',
      onContinue: () => {
        if (this.host.state === 'playing') this.host.requestPointerLock();
      },
    });
  }

  tickCake(): void {
    if (this.cakeUsedThisLevel || !this.host.input.isLocked()) return;

    const cake = this.host.findInteractable('cake');
    if (!cake || !this.host.isNearInteractable(cake)) return;

    this.host.hud.setInteractPrompt(CAKE_MESSAGES.prompt);

    if (this.host.input.consumeInteract()) {
      this.useCakeBoost();
    }
  }

  private useCakeBoost(): void {
    if (this.cakeUsedThisLevel) return;
    this.cakeUsedThisLevel = true;
    this.host.anxiety.freezeRise(CAKE_BUFF_DURATION);
    this.host.anxiety.reduce(10);
    this.host.player.applySpeedBoost(CAKE_BUFF_DURATION);
    this.host.hud.setInteractPrompt(null);
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.dialogue.show({
      title: CAKE_MESSAGES.title,
      body: CAKE_MESSAGES.body,
      continueLabel: 'Devam Et',
      onContinue: () => {
        if (this.host.state === 'playing') this.host.requestPointerLock();
      },
    });
  }

  tickSuzyCat(dt: number): void {
    if (this.suzyCatMesh) {
      this.suzyAnimTime += dt;
      updateSuzyCatIdle(this.suzyCatMesh, this.suzyAnimTime);
    }

    if (!this.host.input.isLocked() || this.host.getMapId() !== 'wedding-hall') return;

    const suzy = this.getSuzyInteractPoint();
    if (!suzy || !this.host.isNearInteractable(suzy)) return;

    if (this.host.levelState.phase === 'celebration') {
      const suzyDist = Math.hypot(this.host.player.position.x - suzy.x, this.host.player.position.z - suzy.z);
      const groom = this.host.findInteractable('groom-chat');
      const bride = this.host.findInteractable('bride-chat');
      const groomDist =
        groom && this.host.isNearInteractable(groom)
          ? Math.hypot(this.host.player.position.x - groom.x, this.host.player.position.z - groom.z)
          : Infinity;
      const brideDist =
        bride && this.host.isNearInteractable(bride)
          ? Math.hypot(this.host.player.position.x - bride.x, this.host.player.position.z - bride.z)
          : Infinity;
      if (Math.min(groomDist, brideDist) <= suzyDist) return;
    }

    this.host.hud.setInteractPrompt(SUZY_CAT_MESSAGES.prompt);

    if (this.host.input.consumeInteract()) {
      this.petSuzyCat();
    }
  }

  private petSuzyCat(): void {
    if (!this.suzyCatMesh) return;

    const dx = this.host.player.position.x - this.suzyCatMesh.position.x;
    const dz = this.host.player.position.z - this.suzyCatMesh.position.z;
    this.suzyCatMesh.rotation.y = Math.atan2(dx, dz);

    const heartOrigin = new THREE.Vector3();
    this.suzyCatMesh.getWorldPosition(heartOrigin);
    heartOrigin.y += 0.38;
    this.host.effects.spawnFloatingHearts(heartOrigin);
    this.host.audio.play('meow');
    this.host.anxiety.reduce(8);
  }

  private getSuzyInteractPoint(): { x: number; z: number; radius: number } | null {
    if (this.suzyCatMesh) {
      const pos = new THREE.Vector3();
      this.suzyCatMesh.getWorldPosition(pos);
      const suzy = this.host.findInteractable('suzy-cat');
      return { x: pos.x, z: pos.z, radius: suzy?.radius ?? 2.2 };
    }
    const suzy = this.host.findInteractable('suzy-cat');
    return suzy ? { x: suzy.x, z: suzy.z, radius: suzy.radius ?? 2.2 } : null;
  }

  tickWeddingNpc(): void {
    if (this.host.getMapId() !== 'wedding-hall' || !this.host.input.isLocked()) {
      this.host.hud.setSubtitle([]);
      return;
    }

    const phase = this.host.levelState.phase;
    if (phase === 'celebration') {
      this.tickWeddingCelebration();
      return;
    }

    if (phase !== 'active') {
      this.host.hud.setSubtitle([]);
      return;
    }

    const allSpawned = this.host.levelState.batchIndex >= this.host.levelState.level.batches.length;
    const enemiesRemain = !allSpawned || this.host.enemies.aliveCount() > 0;
    if (!enemiesRemain) {
      this.host.hud.setSubtitle([]);
      return;
    }

    const groom = this.host.findInteractable('groom-chat');
    const bride = this.host.findInteractable('bride-chat');
    const lines: string[] = [];

    if (groom && this.host.isNearInteractable(groom)) {
      lines.push(`${NPC_STATS.groom.displayName}: ${WEDDING_NPC_MESSAGES.groomStressed}`);
    }
    if (bride && this.host.isNearInteractable(bride)) {
      lines.push(`${NPC_STATS.bride.displayName}: ${WEDDING_NPC_MESSAGES.brideStressed}`);
    }

    this.host.hud.setSubtitle(lines);
  }

  private tickWeddingCelebration(): void {
    this.host.hud.setSubtitle([]);

    const groom = this.host.findInteractable('groom-chat');
    const bride = this.host.findInteractable('bride-chat');
    const suzy = this.getSuzyInteractPoint();
    const nearGroom = groom ? this.host.isNearInteractable(groom) : false;
    const nearBride = bride ? this.host.isNearInteractable(bride) : false;
    const nearSuzy = suzy ? this.host.isNearInteractable(suzy) : false;

    if (!nearGroom && !nearBride) {
      const cake = this.host.findInteractable('cake');
      const nearCake = cake ? this.host.isNearInteractable(cake) : false;
      if (!nearSuzy && !nearCake) this.host.hud.setInteractPrompt(null);
      return;
    }

    const groomDist =
      nearGroom && groom
        ? Math.hypot(this.host.player.position.x - groom.x, this.host.player.position.z - groom.z)
        : Infinity;
    const brideDist =
      nearBride && bride
        ? Math.hypot(this.host.player.position.x - bride.x, this.host.player.position.z - bride.z)
        : Infinity;
    const suzyDist =
      nearSuzy && suzy
        ? Math.hypot(this.host.player.position.x - suzy.x, this.host.player.position.z - suzy.z)
        : Infinity;

    if (suzyDist < Math.min(groomDist, brideDist)) return;

    let target: 'bride' | 'groom' | null = null;
    if (nearGroom && nearBride) {
      target = groomDist <= brideDist ? 'groom' : 'bride';
    } else if (nearGroom) {
      target = 'groom';
    } else if (nearBride) {
      target = 'bride';
    }

    if (target === 'groom') {
      this.host.hud.setInteractPrompt(WEDDING_NPC_MESSAGES.groomChatPrompt);
    } else if (target === 'bride') {
      this.host.hud.setInteractPrompt(WEDDING_NPC_MESSAGES.brideChatPrompt);
    }

    if (this.host.input.consumeInteract() && target) {
      this.weddingChatNpc = target;
      this.openWeddingChatChoices();
    }
  }

  private openWeddingChatChoices(): void {
    const npc = this.weddingChatNpc;
    if (!npc) return;

    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setCrosshairVisible(false);

    this.host.dialogue.showChoices({
      title: WEDDING_NPC_MESSAGES.choiceTitle,
      speaker: NPC_STATS[npc].displayName,
      choices: [
        { id: 'a', label: WEDDING_NPC_MESSAGES.choices[npc].a },
        { id: 'b', label: WEDDING_NPC_MESSAGES.choices[npc].b },
        { id: 'c', label: `✈ ${WEDDING_NPC_MESSAGES.choices[npc].c}` },
      ],
      onChoose: (id) => this.showWeddingChatResponse(npc, id),
    });
  }

  private showWeddingChatResponse(npc: 'bride' | 'groom', choice: 'a' | 'b' | 'c'): void {
    const body = WEDDING_NPC_MESSAGES.responses[npc][choice];
    this.host.dialogue.show({
      title: NPC_STATS[npc].displayName,
      body,
      continueLabel: choice === 'c' ? "Bali'ye Git" : 'Devam Et',
      onContinue: () => {
        this.weddingChatNpc = null;
        if (choice === 'c') {
          this.host.transitionToBaliHoneymoon();
          return;
        }
        if (this.host.state === 'playing' && this.host.levelState.phase === 'celebration') {
          this.host.hud.setCrosshairVisible(false);
          this.host.requestPointerLock();
        }
      },
    });
  }
}
