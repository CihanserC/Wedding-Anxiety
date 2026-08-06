import * as THREE from 'three';
import { BALI_TREASURE_MESSAGES, BANANA_TREE_MESSAGES } from '../../data/messages';
import type { InteractionHost } from './types';

export class BaliInteractions {
  private treasureDiscovered = false;
  private bananaTreeShaken = false;
  private bananaTreeMesh: THREE.Object3D | null = null;
  private bananaTreeArmed = false;
  private shakeTime = 0;
  private shaking = false;
  private bananaPilePosition: THREE.Vector3 | null = null;
  private subtitleClearTimer = 0;
  private bananaPopupTimer = 0;

  constructor(private readonly host: InteractionHost) {}

  resetForNewRun(): void {
    this.treasureDiscovered = false;
    this.resetBananaTree();
  }

  resetForMapLoad(): void {
    this.bananaTreeShaken = false;
    this.bananaTreeArmed = false;
    this.shakeTime = 0;
    this.shaking = false;
    this.bananaPilePosition = null;
    this.subtitleClearTimer = 0;
    this.bananaPopupTimer = 0;
    // Keep bananaTreeMesh — addProps may already have set it, or will set it next.
  }

  private resetBananaTree(): void {
    this.bananaTreeShaken = false;
    this.bananaTreeMesh = null;
    this.bananaTreeArmed = false;
    this.shakeTime = 0;
    this.shaking = false;
    this.bananaPilePosition = null;
    this.subtitleClearTimer = 0;
    this.bananaPopupTimer = 0;
  }

  isTreasureDiscovered(): boolean {
    return this.treasureDiscovered;
  }

  setTreasureDiscovered(value: boolean): void {
    this.treasureDiscovered = value;
  }

  isBananaTreeShaken(): boolean {
    return this.bananaTreeShaken;
  }

  setBananaTreeMesh(mesh: THREE.Object3D | null): void {
    this.bananaTreeMesh = mesh;
  }

  tickBananaTree(dt: number): void {
    if (this.subtitleClearTimer > 0) {
      this.subtitleClearTimer -= dt;
      if (this.subtitleClearTimer <= 0) this.host.hud.setSubtitle([]);
    }

    if (this.bananaPopupTimer > 0) {
      this.bananaPopupTimer -= dt;
      if (this.bananaPopupTimer <= 0) this.showBananaPeacePopup();
    }

    if (this.shaking && this.bananaTreeMesh) {
      this.shakeTime += dt;
      const t = this.shakeTime;
      this.bananaTreeMesh.rotation.z = Math.sin(t * 22) * 0.08 * Math.max(0, 1 - t / 1.2);
      this.bananaTreeMesh.rotation.x = Math.sin(t * 18 + 0.5) * 0.05 * Math.max(0, 1 - t / 1.2);
      if (t >= 1.2) {
        this.bananaTreeMesh.rotation.z = 0;
        this.bananaTreeMesh.rotation.x = 0;
        this.shaking = false;
      }
    }

    // Late-spawned monkeys also go for the pile after a shake
    if (this.bananaTreeShaken && this.bananaPilePosition) {
      for (const enemy of this.host.enemies.enemies) {
        if (
          enemy.stats.type === 'maymun' &&
          !enemy.dead &&
          !enemy.dying &&
          !enemy.bananaDistracted
        ) {
          enemy.markMonkeyFed(this.bananaPilePosition);
        }
      }
    }

    if (
      this.host.getMapId() !== 'bali' ||
      this.host.levelState.phase !== 'active' ||
      this.bananaTreeShaken ||
      !this.host.input.isLocked()
    ) {
      return;
    }

    const tree = this.host.findInteractable('banana-tree');
    if (!tree) return;

    if (!this.host.isNearInteractable(tree)) {
      this.bananaTreeArmed = false;
      this.host.input.flushInteract();
      return;
    }

    this.host.hud.setInteractPrompt(BANANA_TREE_MESSAGES.prompt);

    if (!this.bananaTreeArmed) {
      this.bananaTreeArmed = true;
      this.host.input.flushInteract();
      return;
    }

    if (this.host.input.consumeInteract()) {
      this.shakeBananaTree();
    }
  }

  private shakeBananaTree(): void {
    if (this.bananaTreeShaken) return;
    this.bananaTreeShaken = true;
    this.host.hud.setInteractPrompt(null);
    this.shaking = true;
    this.shakeTime = 0;

    const hanging = this.bananaTreeMesh?.getObjectByName('hanging-bananas');
    const bananaCount =
      typeof hanging?.userData?.bananaCount === 'number'
        ? (hanging.userData.bananaCount as number)
        : 50;
    this.hideHangingBananas(hanging);

    const tree = this.host.findInteractable('banana-tree');
    const origin = new THREE.Vector3(
      tree?.x ?? this.host.player.position.x,
      (tree?.y ?? 2) + 6.8,
      tree?.z ?? this.host.player.position.z,
    );
    const groundY = 2.05;
    this.bananaPilePosition = this.host.effects.spawnFallingBananas(
      origin,
      groundY,
      bananaCount,
    );

    this.host.audio.play('wave-clear');
    this.host.hud.setSubtitle([BANANA_TREE_MESSAGES.subtitle]);
    this.subtitleClearTimer = 3.5;

    this.feedAllMonkeys();
    this.bananaPopupTimer = 3;
  }

  private showBananaPeacePopup(): void {
    this.bananaPopupTimer = 0;
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.dialogue.show({
      title: BANANA_TREE_MESSAGES.popupTitle,
      body: BANANA_TREE_MESSAGES.popupBody,
      continueLabel: BANANA_TREE_MESSAGES.popupContinue,
      onContinue: () => {
        this.host.unlockBaliTreasureHunt();
        if (this.host.state === 'playing') this.host.requestPointerLock();
      },
    });
  }

  private feedAllMonkeys(): void {
    if (!this.bananaPilePosition) return;
    for (const enemy of this.host.enemies.enemies) {
      if (enemy.stats.type === 'maymun' && !enemy.dead && !enemy.dying) {
        enemy.markMonkeyFed(this.bananaPilePosition);
      }
    }
  }

  private hideHangingBananas(hanging: THREE.Object3D | undefined): void {
    if (hanging) {
      hanging.visible = false;
      hanging.traverse((child) => {
        child.visible = false;
      });
      return;
    }
    // Fallback if mesh ref was lost — search from the tree root
    this.bananaTreeMesh?.traverse((child) => {
      if (child.name === 'hanging-bananas' || child.name === 'hanging-banana') {
        child.visible = false;
      }
    });
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
