import * as THREE from 'three';
import { InputManager } from '../input/InputManager';
import { createLighting, type SceneLighting } from '../rendering/Lighting';
import { HUD } from '../ui/HUD';
import { MenuScreen } from '../ui/MenuScreen';
import { DialogueBox } from '../ui/DialogueBox';
import { START_MESSAGES, CAT_FEED_MESSAGES, PIANO_PLAY_MESSAGES } from '../data/messages';
import { AnxietyMeter } from './AnxietyMeter';
import { AudioManager } from './AudioManager';
import { EnemyManager } from './EnemyManager';
import { Player } from './Player';
import { WeaponSystem } from './WeaponSystem';
import { makeLevelState, type LevelState } from './WaveManager';
import { World } from './World';
import { ProjectileEffects } from '../entities/Projectile';
import type { Enemy } from '../entities/Enemy';
import { WEAPONS, WEAPON_ORDER, type WeaponId } from '../data/weapons';
import { createWallSign } from '../rendering/WallSign';
import { buildHallDecorations } from '../rendering/WeddingDecorations';
import { buildProps, updateEatingCat } from '../rendering/MapProps';
import { MAPS, totalLevelCount } from '../data/maps';

type GameState = 'menu' | 'intro' | 'playing' | 'transition' | 'map-intro' | 'win' | 'lose';

export class Game {
  private readonly container: HTMLElement;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene: THREE.Scene;
  private world!: World;
  private worldGroup!: THREE.Group;
  private lighting: SceneLighting;
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
  private mapIndex = 0;
  private levelIndex = 0;
  private levelState: LevelState;
  private stagesCleared = 0;
  private score = 0;
  private lastTime = 0;
  private running = false;
  private activeWeapon: WeaponId = 'pistol';
  private catFed = false;
  private catAnimTime = 0;
  private catMesh: THREE.Object3D | null = null;
  private pianoPlayed = false;

  constructor(container: HTMLElement) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.lighting = createLighting(this.scene, MAPS[0].atmosphere);

    this.loadMap(0);

    this.input = new InputManager(this.renderer.domElement);
    this.player = new Player(this.world, this.input, container.clientWidth / container.clientHeight);
    this.scene.add(this.player.camera);

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

    this.levelState = makeLevelState(MAPS[0].levels[0]);

    window.addEventListener('resize', this.onResize);
    this.input.onLockChange(() => this.handlePointerLockChange());

    this.menu.showStart();
  }

  private loadMap(mapIndex: number): void {
    const mapDef = MAPS[mapIndex];
    this.lighting.apply(mapDef.atmosphere);

    if (this.world) {
      this.enemies?.clear();
      this.effects?.dispose();
      this.world.disposeMesh();
    }

    this.world = new World(mapDef);
    this.worldGroup = this.world.buildMesh();
    this.scene.add(this.worldGroup);
    this.addBanner();
    this.addDecorations();
    this.addProps();
    this.audio?.setBgm(mapDef.bgm ?? null);

    this.weapon?.setWorld(this.world);
    this.enemies?.setWorld(this.world);
    this.player?.setWorld(this.world);
  }

  private addBanner(): void {
    if (!this.world.banner) return;
    const b = this.world.banner.position;
    const sign = createWallSign(this.world.banner.text, b.width, b.height);
    sign.position.set(b.x, b.y, b.z);
    sign.rotation.y = b.rotationY;
    this.worldGroup.add(sign);
  }

  private addDecorations(): void {
    if (!this.world.decorations) return;
    const decor = buildHallDecorations(this.world.decorations);
    this.worldGroup.add(decor);
  }

  private addProps(): void {
    this.catMesh = null;
    if (this.world.props.length === 0) return;
    const props = buildProps(this.world.props);
    this.worldGroup.add(props);
    props.traverse((child) => {
      if (child.name === 'eating-cat') this.catMesh = child;
    });
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
      this.tickLevel(dt);
      this.tickCatInteraction(dt);
      this.tickPianoInteraction();

      if (active) {
        const requested = this.input.consumeWeaponSelect();
        if (requested !== null) this.setActiveWeapon(WEAPON_ORDER[requested]);
        const wheel = this.input.consumeWeaponScroll();
        if (wheel !== 0) this.cycleWeapon(wheel);
      }

      if (active && this.input.consumeFire()) {
        const origin = this.player.getEyePosition();
        const dir = this.player.getAimDirection();
        const result = this.weapon.fire(this.activeWeapon, origin, dir, this.enemies.enemies);
        if (result) {
          this.audio.play('shoot');
          this.player.rig.onFire(result.recoil);
          if (result.hitEnemy) this.audio.play('hit');
        }
      }

      if (this.anxiety.isOverwhelmed()) {
        this.transitionToLose();
      }
    }

    this.hud.update({
      anxietyPercent: this.anxiety.percent,
      mapName: MAPS[this.mapIndex].displayName,
      mapIndex: this.mapIndex + 1,
      totalMaps: MAPS.length,
      level: this.levelIndex + 1,
      totalLevels: MAPS[this.mapIndex].levels.length,
      overallStage: this.stagesCleared + 1,
      totalStages: totalLevelCount(),
      score: this.score,
      enemiesLeft: Math.max(0, this.levelState.level.totalEnemies - this.levelState.killedTotal),
      reloadRatio: this.weapon.cooldownRatio(),
      weaponName: WEAPONS[this.activeWeapon].displayName,
    });
  }

  private tickCatInteraction(dt: number): void {
    if (this.catMesh) {
      this.catAnimTime += dt;
      updateEatingCat(this.catMesh, this.catAnimTime);
    }

    if (this.catFed || !this.input.isLocked()) {
      this.hud.setInteractPrompt(null);
      return;
    }

    const cat = this.world.interactables.find((item) => item.kind === 'cat');
    if (!cat) {
      this.hud.setInteractPrompt(null);
      return;
    }

    const dx = this.player.position.x - cat.x;
    const dz = this.player.position.z - cat.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const near = dist <= (cat.radius ?? 2.5);

    if (!near) {
      this.hud.setInteractPrompt(null);
      return;
    }

    this.hud.setInteractPrompt(CAT_FEED_MESSAGES.prompt);

    if (this.input.consumeInteract()) {
      this.feedCatAndAdvance();
    }
  }

  private feedCatAndAdvance(): void {
    if (this.catFed) return;
    this.catFed = true;
    this.enemies.clear();
    this.state = 'transition';
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);
    this.hud.setInteractPrompt(null);
    this.anxiety.reduce(20);

    this.dialogue.show({
      title: CAT_FEED_MESSAGES.title,
      body: CAT_FEED_MESSAGES.body,
      continueLabel: CAT_FEED_MESSAGES.button,
      onContinue: () => this.advanceStageAfterSkip(),
    });
  }

  private tickPianoInteraction(): void {
    if (this.pianoPlayed || !this.input.isLocked()) return;

    const piano = this.world.interactables.find((item) => item.kind === 'piano');
    if (!piano) return;

    // If cat prompt already showing, don't override (different maps anyway)
    const dx = this.player.position.x - piano.x;
    const dz = this.player.position.z - piano.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    const near = dist <= (piano.radius ?? 3);

    if (!near) {
      // Only clear if we're not also showing cat prompt — cat handler manages its own
      if (!this.world.interactables.some((i) => i.kind === 'cat')) {
        this.hud.setInteractPrompt(null);
      }
      return;
    }

    this.hud.setInteractPrompt(PIANO_PLAY_MESSAGES.prompt);

    if (this.input.consumeInteract()) {
      this.playPianoAndAdvance();
    }
  }

  private playPianoAndAdvance(): void {
    if (this.pianoPlayed) return;
    this.pianoPlayed = true;
    this.enemies.clear();
    this.state = 'transition';
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);
    this.hud.setInteractPrompt(null);
    this.anxiety.reduce(25);
    this.audio.play('wave-clear');

    this.dialogue.show({
      title: PIANO_PLAY_MESSAGES.title,
      body: PIANO_PLAY_MESSAGES.body,
      continueLabel: PIANO_PLAY_MESSAGES.button,
      onContinue: () => this.advanceStageAfterSkip(),
    });
  }

  private advanceStageAfterSkip(): void {
    const currentMap = MAPS[this.mapIndex];
    const isLastMap = this.mapIndex >= MAPS.length - 1;

    // Count remaining levels in this map as cleared (including the current one)
    const levelsLeftInMap = currentMap.levels.length - this.levelIndex;
    this.stagesCleared += levelsLeftInMap;
    this.pianoPlayed = false;

    if (isLastMap) {
      this.transitionToWin();
      return;
    }

    this.mapIndex += 1;
    this.levelIndex = 0;
    this.loadMap(this.mapIndex);
    this.anxiety.reduce(25);
    this.player.respawn();

    const nextMap = MAPS[this.mapIndex];
    this.state = 'map-intro';
    this.dialogue.show({
      title: `Yeni Harita: ${nextMap.displayName}`,
      body: nextMap.description,
      continueLabel: 'Yolculuğa Başla',
      onContinue: () => this.beginLevel(this.mapIndex, 0),
    });
  }

  private setActiveWeapon(id: WeaponId | undefined): void {
    if (!id) return;
    this.activeWeapon = id;
    this.player.rig.setActive(id);
  }

  private cycleWeapon(direction: number): void {
    const idx = WEAPON_ORDER.indexOf(this.activeWeapon);
    const next = (idx + direction + WEAPON_ORDER.length) % WEAPON_ORDER.length;
    this.setActiveWeapon(WEAPON_ORDER[next]);
  }

  private tickLevel(dt: number): void {
    const s = this.levelState;
    if (s.phase !== 'active') return;

    s.timer -= dt;
    if (s.batchIndex < s.level.batches.length && s.timer <= 0) {
      const batch = s.level.batches[s.batchIndex];
      const before = this.enemies.aliveCount();
      this.enemies.spawnBatch([batch], this.player.position);
      s.spawnedTotal += this.enemies.aliveCount() - before;
      s.batchIndex++;
      s.timer = s.level.batchInterval;
    }

    const allSpawned = s.batchIndex >= s.level.batches.length;
    if (allSpawned && this.enemies.aliveCount() === 0) {
      s.phase = 'clearing';
      this.finishLevel();
    }
  }

  private finishLevel(): void {
    this.audio.play('wave-clear');
    this.stagesCleared++;
    const currentMap = MAPS[this.mapIndex];
    const isLastLevelInMap = this.levelIndex >= currentMap.levels.length - 1;
    const isLastMap = this.mapIndex >= MAPS.length - 1;

    if (isLastLevelInMap && isLastMap) {
      this.transitionToWin();
      return;
    }

    this.state = 'transition';
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);

    const level = this.levelState.level;
    if (isLastLevelInMap) {
      this.dialogue.show({
        title: `${currentMap.displayName} — Tamamlandı`,
        body: level.clearMessage,
        continueLabel: 'Yeni Yolculuk',
        onContinue: () => this.transitionToNextMap(),
      });
    } else {
      this.dialogue.show({
        title: `Level ${level.index} tamamlandı`,
        body: level.clearMessage,
        continueLabel: 'Sonraki Level',
        onContinue: () => this.beginLevel(this.mapIndex, this.levelIndex + 1),
      });
    }
  }

  private transitionToNextMap(): void {
    const nextMapIndex = this.mapIndex + 1;
    const nextMap = MAPS[nextMapIndex];
    this.state = 'map-intro';
    this.dialogue.show({
      title: `Yeni Harita: ${nextMap.displayName}`,
      body: nextMap.description,
      continueLabel: 'Yolculuğa Başla',
      onContinue: () => {
        this.mapIndex = nextMapIndex;
        this.levelIndex = 0;
        this.loadMap(nextMapIndex);
        this.anxiety.reduce(25);
        this.player.respawn();
        this.beginLevel(this.mapIndex, 0);
      },
    });
  }

  private beginLevel(mapIndex: number, levelIndex: number): void {
    const mapDef = MAPS[mapIndex];
    if (!mapDef) {
      this.transitionToWin();
      return;
    }
    const level = mapDef.levels[levelIndex];
    if (!level) {
      this.transitionToWin();
      return;
    }
    this.mapIndex = mapIndex;
    this.levelIndex = levelIndex;
    this.levelState = makeLevelState(level);
    this.state = 'intro';
    this.hud.setCrosshairVisible(false);
    if (levelIndex > 0) this.anxiety.reduce(10);

    this.dialogue.show({
      title: level.title,
      body: level.intro,
      continueLabel: 'Başla',
      onContinue: () => this.activateLevel(),
    });
  }

  private activateLevel(): void {
    this.state = 'playing';
    this.levelState.phase = 'active';
    this.levelState.timer = 0.5;
    this.hud.setCrosshairVisible(true);
    this.hud.show();
    this.input.requestPointerLock();
  }

  private handleEnemyKilled(enemy: Enemy): void {
    this.levelState.killedTotal++;
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
    this.stagesCleared = 0;
    this.score = 0;
    this.mapIndex = 0;
    this.levelIndex = 0;
    this.catFed = false;
    this.catAnimTime = 0;
    this.pianoPlayed = false;
    this.loadMap(0);
    this.anxiety.reset();
    this.setActiveWeapon('pistol');
    this.player.respawn();
    this.menu.hide();
    this.hud.show();

    const firstMap = MAPS[0];
    this.state = 'map-intro';
    this.dialogue.show({
      title: firstMap.displayName,
      body: firstMap.description,
      continueLabel: 'Yolculuğa Başla',
      onContinue: () => this.beginLevel(0, 0),
    });
  }

  private transitionToWin(): void {
    this.state = 'win';
    this.hud.hide();
    this.dialogue.hide();
    this.input.releasePointerLock();
    this.audio.stopBgm();
    this.audio.play('win');
    this.menu.showWin(this.score, this.stagesCleared, totalLevelCount());
  }

  private transitionToLose(): void {
    if (this.state === 'lose') return;
    this.state = 'lose';
    this.hud.hide();
    this.dialogue.hide();
    this.input.releasePointerLock();
    this.audio.stopBgm();
    this.audio.play('lose');
    this.menu.showLose(this.score, this.stagesCleared, MAPS[this.mapIndex].displayName);
  }
}
