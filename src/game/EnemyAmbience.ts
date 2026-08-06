import * as THREE from 'three';
import { MERAKLI_TEYZE_TAUNTS, MUKEMMELIYETCI_KUZEN_TAUNTS } from '../data/messages';
import type { Enemy } from '../entities/Enemy';
import type { EnemyType } from '../data/enemies';
import type { AudioManager } from './AudioManager';

const HEAR_RADIUS = 18;
const GROWL_MIN = 4;
const GROWL_MAX = 8;
const TAUNT_MIN = 6;
const TAUNT_MAX = 12;
const TAUNT_DURATION = 3.5;

const GROWL_PITCH: Partial<Record<EnemyType, number>> = {
  'merakli-teyze': 0.75,
  'mukemmeliyetci-kuzen': 0.95,
  'zaman-canavari': 1.05,
  'fotograf-flasoru': 1.2,
  'beklenti-golgesi': 0.55,
  maymun: 1.15,
  inek: 0.7,
  kertenkele: 1.4,
};

const ENEMY_TAUNTS: Partial<Record<EnemyType, string[]>> = {
  'merakli-teyze': MERAKLI_TEYZE_TAUNTS,
  'mukemmeliyetci-kuzen': MUKEMMELIYETCI_KUZEN_TAUNTS,
};

/**
 * Periodic deep growls for combat enemies and speech-bubble taunts
 * for talkative types. Only enemies near the player make noise.
 */
export class EnemyAmbience {
  private globalTauntLock = 0;
  private globalGrowlLock = 0;

  tick(
    dt: number,
    enemies: readonly Enemy[],
    playerPos: THREE.Vector3,
    audio: AudioManager,
    enabled: boolean,
  ): void {
    if (!enabled) return;

    if (this.globalTauntLock > 0) this.globalTauntLock -= dt;
    if (this.globalGrowlLock > 0) this.globalGrowlLock -= dt;

    const readyGrowlers: Enemy[] = [];

    for (const enemy of enemies) {
      if (enemy.ambient || enemy.dead || enemy.dying || enemy.combatFrozen) continue;

      const dx = enemy.position.x - playerPos.x;
      const dz = enemy.position.z - playerPos.z;
      const distSq = dx * dx + dz * dz;
      const inRange = distSq <= HEAR_RADIUS * HEAR_RADIUS;

      enemy.growlCooldown -= dt;
      if (enemy.growlCooldown <= 0) {
        enemy.growlCooldown = GROWL_MIN + Math.random() * (GROWL_MAX - GROWL_MIN);
        if (inRange) readyGrowlers.push(enemy);
      }

      const taunts = ENEMY_TAUNTS[enemy.stats.type];
      if (!taunts || taunts.length === 0) continue;

      enemy.tauntCooldown -= dt;
      if (enemy.tauntCooldown > 0 || !inRange || this.globalTauntLock > 0) continue;

      const line = taunts[Math.floor(Math.random() * taunts.length)];
      enemy.showTaunt(line, TAUNT_DURATION);
      audio.playEnemyGrowl(GROWL_PITCH[enemy.stats.type] ?? 1);
      enemy.tauntCooldown = TAUNT_MIN + Math.random() * (TAUNT_MAX - TAUNT_MIN);
      this.globalTauntLock = TAUNT_DURATION + 0.4;
      this.globalGrowlLock = 0.9;
    }

    if (readyGrowlers.length > 0 && this.globalGrowlLock <= 0) {
      const pick = readyGrowlers[Math.floor(Math.random() * readyGrowlers.length)];
      const pitch = GROWL_PITCH[pick.stats.type] ?? 1;
      audio.playEnemyGrowl(pitch * (0.92 + Math.random() * 0.16));
      this.globalGrowlLock = 0.85;
    }
  }
}
