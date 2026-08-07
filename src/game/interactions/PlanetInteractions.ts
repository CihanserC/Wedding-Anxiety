import { SPACE_UFO_MESSAGES } from '../../data/messages';
import type { AiCharacterId } from '../../data/aiPrompts';
import type { InteractionHost } from './types';

export interface PlanetAiHost {
  openAiChat(characterId: AiCharacterId): void;
  returnToGalaxy(): void;
}

/**
 * Planet-surface interactions: Vader/Yoda AI chat, alien/frog chatter,
 * and F to board the spaceship back to galaxy flight.
 */
export class PlanetInteractions {
  constructor(
    private readonly host: InteractionHost,
    private readonly ai: PlanetAiHost,
  ) {}

  tick(): void {
    const mapId = this.host.getMapId();
    if (!mapId.startsWith('planet-')) return;
    if (this.host.state !== 'playing') return;
    if (!this.host.input.isLocked()) return;

    if (this.host.input.consumeBoardShip()) {
      this.ai.returnToGalaxy();
      return;
    }

    this.host.hud.setSubtitle([]);

    const vader = this.host.findInteractable('vader-chat');
    const yoda = this.host.findInteractable('yoda-chat');
    const alien = this.host.findInteractable('alien-chat');
    const frogs = this.host.world.interactables.filter((i) => i.kind === 'frog-chat');

    type Cand = { dist: number; label: string; act: () => void };
    const cands: Cand[] = [];

    if (vader && this.host.isNearInteractable(vader)) {
      cands.push({
        dist: Math.hypot(this.host.player.position.x - vader.x, this.host.player.position.z - vader.z),
        label: 'E — Darth Vader ile konuş',
        act: () => this.openChat('darth-vader'),
      });
    }
    if (yoda && this.host.isNearInteractable(yoda)) {
      cands.push({
        dist: Math.hypot(this.host.player.position.x - yoda.x, this.host.player.position.z - yoda.z),
        label: 'E — Usta Yoda ile konuş',
        act: () => this.openChat('master-yoda'),
      });
    }
    if (alien && this.host.isNearInteractable(alien)) {
      cands.push({
        dist: Math.hypot(this.host.player.position.x - alien.x, this.host.player.position.z - alien.z),
        label: `E — ${(alien.speakerName ?? 'Uzaylı')} ile konuş`,
        act: () => this.openAlienChat(alien.speakerName ?? 'Uzaylı'),
      });
    }
    for (const frog of frogs) {
      if (!this.host.isNearInteractable(frog)) continue;
      const name = frog.speakerName ?? 'Kurbağa';
      cands.push({
        dist: Math.hypot(this.host.player.position.x - frog.x, this.host.player.position.z - frog.z),
        label: `E — ${name} ile konuş`,
        act: () => this.openFrogChat(name),
      });
    }

    if (cands.length === 0) {
      this.host.hud.setInteractPrompt(SPACE_UFO_MESSAGES.boardShipPrompt);
      this.host.input.flushInteract();
      return;
    }

    cands.sort((a, b) => a.dist - b.dist);
    const best = cands[0];
    this.host.hud.setInteractPrompt(best.label);
    if (this.host.input.consumeInteract()) best.act();
  }

  private openChat(characterId: AiCharacterId): void {
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setCrosshairVisible(false);
    this.ai.openAiChat(characterId);
  }

  private openAlienChat(name: string): void {
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setCrosshairVisible(false);
    const lines = [
      `${name}: Selam, yolcu. Yıldızların arasında yolculuk ediyor musun?`,
      `${name}: Barış içinde yaşarız burada. Düşman gezegenlerden uzak dur.`,
      `${name}: Geminde yiyecek var mı? Takas yapabiliriz… belki.`,
    ];
    const body = lines[Math.floor(Math.random() * lines.length)];
    this.host.dialogue.show({
      title: name,
      body,
      continueLabel: 'Devam',
      onContinue: () => {
        if (this.host.state === 'playing') {
          this.host.hud.setCrosshairVisible(false);
          this.host.requestPointerLock();
        }
      },
    });
  }

  private openFrogChat(name: string): void {
    this.host.setIntentionalUnlock(true);
    this.host.releasePointerLock();
    this.host.hud.setInteractPrompt(null);
    this.host.hud.setCrosshairVisible(false);
    const lines = [
      `${name}: Gıp gıp… Yağmur güzel, değil mi?`,
      `${name}: Vııırak! Usta Yoda aşağıda, ağaç evin dibinde oturur.`,
      `${name}: Blup blup — sivrisinekler bugün lezzetli.`,
      `${name}: Bataklık senin dostun… eğer dikkatliysen.`,
    ];
    const body = lines[Math.floor(Math.random() * lines.length)];
    this.host.dialogue.show({
      title: name,
      body,
      continueLabel: 'Devam',
      onContinue: () => {
        if (this.host.state === 'playing') {
          this.host.hud.setCrosshairVisible(this.host.getMapId().startsWith('planet-'));
          this.host.requestPointerLock();
        }
      },
    });
  }
}
