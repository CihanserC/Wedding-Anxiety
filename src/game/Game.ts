import * as THREE from 'three';
import { InputManager } from '../input/InputManager';
import { createLighting } from '../rendering/Lighting';
import { HUD } from '../ui/HUD';
import { MenuScreen } from '../ui/MenuScreen';
import { DialogueBox } from '../ui/DialogueBox';
import {
  START_MESSAGES,
  WAVE_CLEAR_MESSAGES,
  WAVE_INTRO_MESSAGES,
} from '../data/messages';
import { AnxietyMeter } from './AnxietyMeter';
import { AudioManager } from './AudioManager';
import { EnemyManager } from './EnemyManager';
import { Player } from './Player';
import { WeaponSystem } from './WeaponSystem';
import { WAVES, makeWaveState, totalWaveCount, type WaveState } from './WaveManager';
import { World } from './World';
import { ProjectileEffects } from '../entities/Projectile';
import type { Enemy } from '../entities/Enemy';

type GameState = 'menu' | 'wave-intro' | 'playing' | 'wave-transition' | 'win' | 'lose';

export class Game {
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private readonly world: World;
  private readonly player: Player;
  private readonly input: InputManager;
  private readonly weapon: WeaponSystem;
  private readonly enemies: EnemyManager;
  private readonly anxiety: AnxietyMeter;
  private readonly hud: HUD;
  private readonly menu: MenuScreen;
  private readonly dialogue: DialogueBox;
  private readonly effects: ProjectileEffects;
  private readonly audio: AudioManager;

  private state: GameState = 'menu';
  private waveState: WaveState;
  private score = 0;
  private lastTime = 0;
  private running = false;
  private worldGroup: THREE.Group;

  constructor(container: HTMLElement) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    createLighting(this.scene);

    this.world = new World(32, 32, 10);
    this.worldGroup = this.world.buildMesh();
    this.scene.add(this.worldGroup);

    this.input = new InputManager(this.renderer.domElement);
    this.player = new Player(this.world, this.input, container.clientWidth / container.clientHeight);

    this.effects = new ProjectileEffects(this.scene);
    this.weapon = new WeaponSystem(this.world, this.effects);
    this.audio = new AudioManager();

    this.anxiety = new AnxietyMeter();
    this.enemies = new EnemyManager(this.scene, this.world, {
      onKilled: (enemy) => this.handleEnemyKilled(enemy),
      onContact: (enemy, dt) => this.handleEnemyContact(enemy, dt),
    });

    this.hud = new HUD(container);
    this.dialogue = new DialogueBox(container);
    this.menu = new MenuScreen(container, {
      onStart: () => this.startRun(),
      onRestart: () => this.startRun(),
    });

    this.waveState = makeWaveState(WAVES[0]);

    window.addEventListener('resize', this.onResize);
    this.input.onLockChange(() => this.handlePointerLockChange());

    this.menu.showStart();
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.player.resize(w / h);
  };

  private handlePointerLockChange(): void {
    if (this.state !== 'playing') return;
    if (!this.input.isLocked()) {
      this.dialogue.show({
        title: 'Duraklatıldı',
        body: START_MESSAGES.tip,
        continueLabel: 'Geri Dön',
        onContinue: () => {
          if (this.state === 'playing') this.input.requestPointerLock();
        },
      });
    } else {
      this.dialogue.hide();
    }
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.frame);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    this.update(dt);
    this.renderer.render(this.scene, this.player.camera);
    requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    const active = this.state === 'playing' && this.input.isLocked();

    this.player.update(dt, active);
    this.weapon.update(dt);
    this.effects.update(dt);

    if (this.state === 'playing') {
      this.enemies.update(dt, this.player.position);
      this.anxiety.update(dt, true);
      this.tickWave(dt);

      if (active && this.input.consumeFire()) {
        const origin = this.player.getEyePosition();
        const dir = this.player.getAimDirection();
        const result = this.weapon.fire(origin, dir, this.enemies.enemies);
        if (result) {
          this.audio.play('shoot');
          if (result.hitEnemy) this.audio.play('hit');
        }
      }

      if (this.anxiety.isOverwhelmed()) {
        this.transitionToLose();
      }
    }

    this.hud.update({
      anxietyPercent: this.anxiety.percent,
      wave: this.waveState.wave.index,
      totalWaves: totalWaveCount(),
      score: this.score,
      enemiesLeft: Math.max(0, this.waveState.wave.totalEnemies - this.waveState.killedTotal),
      reloadRatio: this.weapon.cooldownRatio(),
    });
  }

  private tickWave(dt: number): void {
    const s = this.waveState;
    if (s.phase !== 'active') return;

    s.timer -= dt;
    if (s.batchIndex < s.wave.batches.length && s.timer <= 0) {
      const batch = s.wave.batches[s.batchIndex];
      const before = this.enemies.aliveCount();
      this.enemies.spawnBatch([batch], this.player.position);
      s.spawnedTotal += this.enemies.aliveCount() - before;
      s.batchIndex++;
      s.timer = s.wave.batchInterval;
    }

    const allSpawned = s.batchIndex >= s.wave.batches.length;
    if (allSpawned && this.enemies.aliveCount() === 0) {
      s.phase = 'clearing';
      this.finishWave();
    }
  }

  private finishWave(): void {
    this.audio.play('wave-clear');
    const finished = this.waveState.wave.index;

    if (finished >= totalWaveCount()) {
      this.transitionToWin();
      return;
    }

    this.state = 'wave-transition';
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);

    this.dialogue.show({
      title: `Dalga ${finished} tamamlandı!`,
      body: WAVE_CLEAR_MESSAGES[finished] ?? 'Devam ediyoruz Hilal, sen çok iyisin.',
      continueLabel: 'Sonraki Dalga',
      onContinue: () => this.beginWave(finished + 1),
    });
  }

  private beginWave(index: number): void {
    const wave = WAVES[index - 1];
    if (!wave) {
      this.transitionToWin();
      return;
    }
    this.waveState = makeWaveState(wave);
    this.state = 'wave-intro';
    this.hud.setCrosshairVisible(false);
    this.anxiety.reduce(15);

    const intro = WAVE_INTRO_MESSAGES[index];
    this.dialogue.show({
      title: intro?.title ?? `Dalga ${index}`,
      body: intro?.body ?? 'Hazırlan Hilal!',
      continueLabel: 'Başla',
      onContinue: () => this.activateWave(),
    });
  }

  private activateWave(): void {
    this.state = 'playing';
    this.waveState.phase = 'active';
    this.waveState.timer = 0.5;
    this.hud.setCrosshairVisible(true);
    this.hud.show();
    this.input.requestPointerLock();
  }

  private handleEnemyKilled(enemy: Enemy): void {
    this.waveState.killedTotal++;
    this.score += enemy.stats.scoreValue;
    this.anxiety.reduce(enemy.stats.anxietyReward);
    this.audio.play('kill');
  }

  private handleEnemyContact(enemy: Enemy, dt: number): void {
    this.anxiety.add(enemy.stats.contactAnxietyPerSecond * dt);
    enemy.contactAccumulator += dt;
    if (enemy.contactAccumulator >= 0.6) {
      enemy.contactAccumulator = 0;
      this.hud.flashDamage();
      this.audio.play('hurt');
    }
  }

  private startRun(): void {
    this.audio.ensureStarted();
    this.enemies.clear();
    this.effects.dispose();
    this.anxiety.reset();
    this.score = 0;
    this.player.respawn();
    this.menu.hide();
    this.hud.show();
    this.beginWave(1);
  }

  private transitionToWin(): void {
    this.state = 'win';
    this.hud.hide();
    this.dialogue.hide();
    this.input.releasePointerLock();
    this.audio.play('win');
    this.menu.showWin(this.score, totalWaveCount());
  }

  private transitionToLose(): void {
    if (this.state === 'lose') return;
    this.state = 'lose';
    this.hud.hide();
    this.dialogue.hide();
    this.input.releasePointerLock();
    this.audio.play('lose');
    this.menu.showLose(this.score, this.waveState.wave.index);
  }
}
