import * as THREE from 'three';
import { InputManager } from '../input/InputManager';
import { createLighting, type SceneLighting } from '../rendering/Lighting';
import { HUD } from '../ui/HUD';
import { MenuScreen } from '../ui/MenuScreen';
import { DialogueBox } from '../ui/DialogueBox';
import {
  ALTAR_MESSAGES,
  BALI_TREASURE_MESSAGES,
  CAKE_MESSAGES,
  CAT_FEED_MESSAGES,
  DUBAI_LOCAL_MESSAGES,
  DUBAI_NPC_MESSAGES,
  HUD_LABELS,
  LAMBO_DRIVE_MESSAGES,
  PIANO_PLAY_MESSAGES,
  SUZY_CAT_MESSAGES,
  TV_MESSAGES,
  WEDDING_NPC_MESSAGES,
  WIN_MESSAGES,
} from '../data/messages';
import { AnxietyMeter } from './AnxietyMeter';
import { AudioManager } from './AudioManager';
import { BalloonManager } from './BalloonManager';
import { EnemyManager } from './EnemyManager';
import { NpcManager } from './NpcManager';
import { Player } from './Player';
import { WeaponSystem } from './WeaponSystem';
import { makeLevelState, type LevelState } from './WaveManager';
import { World } from './World';
import { ProjectileEffects } from '../entities/Projectile';
import type { Enemy } from '../entities/Enemy';
import { WEAPONS, WEAPON_ORDER, type WeaponId } from '../data/weapons';
import { createNeonWallSign, createWallSign } from '../rendering/WallSign';
import { buildHallDecorations } from '../rendering/WeddingDecorations';
import { LAMBORGHINI_CABIN_HIDE } from '../rendering/lamborghini';
import { TvSlideshow } from '../rendering/TvSlideshow';
import { buildProps, updateEatingCat } from '../rendering/MapProps';
import { updateSuzyCatIdle } from '../rendering/SuzyCat';
import { buildTreasureChest } from '../rendering/TreasureChest';
import { PauseScreen } from '../ui/PauseScreen';
import { CommandConsole } from '../ui/CommandConsole';
import { BossCinematic } from '../ui/BossCinematic';
import { ConfettiOverlay } from '../ui/ConfettiOverlay';
import { EnemyProjectileManager } from './EnemyProjectiles';
import { loadSettings, saveSettings, type GameSettings } from './GameSettings';

import { MAPS, totalLevelCount, type MapId } from '../data/maps';
import { NPC_STATS } from '../data/npcs';
import { getCheatHelpEditorText, resolveCheat, type CheatId } from './CheatCodes';
import type { CommandSubmitResult } from '../ui/CommandConsole';

const CAKE_BUFF_DURATION = 15;

const CAR_MAX_SPEED = 14;
const CAR_REVERSE_MAX = 5;
const CAR_ACCEL = 26;
const CAR_DRAG = 2.4;
const CAR_TURN_RATE = 2.35;
const CAR_HALF_W = 0.95;
const CAR_HALF_L = 2.05;
const CAR_HEIGHT = 1.05;
/** Eye above car origin — low enough to read the hood, above the chassis. */
const CAR_EYE_HEIGHT = 0.78;
const CAR_MIN_PITCH = -0.35;
const CAR_MAX_PITCH = 0.22;
const CAR_DEFAULT_PITCH = -0.12;

type GameState = 'menu' | 'intro' | 'playing' | 'paused' | 'boss-cinematic' | 'transition' | 'map-intro' | 'win' | 'lose';

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
  private readonly npcs: NpcManager;
  private readonly anxiety: AnxietyMeter;
  private readonly hud: HUD;
  private readonly menu: MenuScreen;
  private readonly pause: PauseScreen;
  private readonly commandConsole: CommandConsole;
  private readonly bossCinematic: BossCinematic;
  private readonly confetti: ConfettiOverlay;
  private readonly dialogue: DialogueBox;
  private readonly effects: ProjectileEffects;
  private readonly enemyProjectiles: EnemyProjectileManager;
  private readonly audio: AudioManager;
  private readonly balloons: BalloonManager;

  private state: GameState = 'menu';
  private mapIndex = 0;
  private levelIndex = 0;
  private levelState: LevelState;
  private stagesCleared = 0;
  private score = 0;
  private lastTime = 0;
  private running = false;
  private activeWeapon: WeaponId = 'pistol';
  private cheatGodMode = false;
  private lightsaberMode = false;
  private weaponBeforeLightsaber: WeaponId = 'pistol';
  private catFed = false;
  private catAnimTime = 0;
  private catMesh: THREE.Object3D | null = null;
  private suzyCatMesh: THREE.Object3D | null = null;
  private suzyAnimTime = 0;
  private pianoPlayed = false;
  private pianoInteractArmed = false;
  private catInteractArmed = false;
  private altarUsedThisLevel = false;
  private cakeUsedThisLevel = false;
  private settings: GameSettings = loadSettings();
  private intentionalUnlock = false;
  private extraEnemiesRequired = 0;
  private bossCinematicEnemy: Enemy | null = null;
  private pendingBossPhase: 2 | 3 | null = null;
  private readonly bossCinematicPlayed = new Set<2 | 3>();
  private weddingChatNpc: 'bride' | 'groom' | null = null;
  private pendingFinalWin = false;
  private finalWinDelay = 0;
  private consoleResumePointerLock = false;
  private consoleResumePaused = false;
  private readonly waterOverlay: HTMLDivElement;
  private treasureChestMesh: THREE.Object3D | null = null;
  private treasureDiscovered = false;
  private lamborghiniMesh: THREE.Group | null = null;
  private drivingCar = false;
  private carX = 0;
  private carY = 3.01;
  private carZ = 0;
  private carYaw = 0;
  private carPitch = -0.06;
  private carSpeed = 0;
  private lamboInteractArmed = false;
  private plasmaTvMesh: THREE.Group | null = null;
  private plasmaTvOn = false;
  private tvSlideshow = new TvSlideshow();

  constructor(container: HTMLElement) {
    this.container = container;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.npcs = new NpcManager(this.scene);
    this.lighting = createLighting(this.scene, MAPS[0].atmosphere);
    this.balloons = new BalloonManager();

    this.loadMap(0);

    this.input = new InputManager(this.renderer.domElement);
    this.player = new Player(this.world, this.input, container.clientWidth / container.clientHeight);
    this.scene.add(this.player.camera);

    this.effects = new ProjectileEffects(this.scene);
    this.enemyProjectiles = new EnemyProjectileManager(this.scene);
    this.weapon = new WeaponSystem(this.world, this.effects);
    this.weapon.setBalloonRaycast((origin, direction, maxDistance) => {
      if (MAPS[this.mapIndex]?.id !== 'wedding-hall' || !this.balloons.hasRemaining()) return null;
      return this.balloons.raycastHit(origin, direction, maxDistance);
    });
    this.audio = new AudioManager();

    this.anxiety = new AnxietyMeter();
    this.enemies = new EnemyManager(this.scene, this.world, {
      onKilled: (enemy) => this.handleEnemyKilled(enemy),
      onContact: (enemy, dt) => this.handleEnemyContact(enemy, dt),
      onFlash: (enemy) => this.handleEnemyFlash(enemy),
      onBossPhase: (enemy, phase) => this.handleBossPhase(enemy, phase),
      onBossDeathEffect: (position, kind) => {
        if (kind === 'fire') this.effects.spawnBossFireBurst(position);
        else this.effects.spawnBossDustBurst(position);
      },
      onShootFireball: (origin, direction, speed, anxietyHit, color) =>
        this.enemyProjectiles.spawnFireball(origin, direction, speed, anxietyHit, color),
    });

    this.hud = new HUD(container);
    this.dialogue = new DialogueBox(container);
    this.menu = new MenuScreen(container, {
      onStart: () => this.startRun(),
      onRestart: () => this.startRun(),
    });
    this.pause = new PauseScreen(container, this.settings, {
      onResume: () => this.resumeFromPause(),
      onMainMenu: () => this.returnToMainMenu(),
      onSettingsChange: (settings) => this.applySettings(settings),
    });
    this.commandConsole = new CommandConsole(container, {
      onSubmit: (command) => this.handleCommandConsoleSubmit(command),
      onClose: () => this.closeCommandConsole(),
    });
    this.bossCinematic = new BossCinematic(container);
    this.confetti = new ConfettiOverlay(container);

    this.waterOverlay = document.createElement('div');
    this.waterOverlay.className = 'wa-water-overlay';
    this.waterOverlay.setAttribute('aria-hidden', 'true');
    Object.assign(this.waterOverlay.style, {
      position: 'absolute',
      inset: '0',
      pointerEvents: 'none',
      opacity: '0',
      transition: 'opacity 0.35s ease',
      background:
        'radial-gradient(ellipse at center, rgba(40,140,200,0.18) 0%, rgba(20,90,150,0.38) 70%, rgba(10,60,110,0.5) 100%)',
      boxShadow: 'inset 0 0 80px rgba(30,120,180,0.35)',
      zIndex: '8',
    });
    container.appendChild(this.waterOverlay);

    this.levelState = makeLevelState(MAPS[0].levels[0]);
    this.applySettings(this.settings);
    this.player.onFall = () => this.handlePlayerFall();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onCommandConsoleToggleKey);
    this.input.onLockChange(() => this.handlePointerLockChange());

    this.menu.showStart();
  }

  private loadMap(mapIndex: number): void {
    const mapDef = MAPS[mapIndex];
    this.lighting.apply(mapDef.atmosphere);

    if (this.world) {
      this.enemies?.clear();
      this.npcs?.clear();
      this.effects?.dispose();
      this.enemyProjectiles?.clear();
      this.world.disposeMesh();
    }

    this.world = new World(mapDef);
    this.worldGroup = this.world.buildMesh();
    this.scene.add(this.worldGroup);
    this.addBanner();
    this.addDecorations();
    this.addProps();
    this.npcs.spawnAll(this.world.npcs, this.world);
    this.audio?.setBgm(mapDef.bgm ?? null);
    this.catFed = false;
    this.pianoPlayed = false;
    this.pianoInteractArmed = false;
    this.catInteractArmed = false;
    this.drivingCar = false;
    this.lamboInteractArmed = false;
    this.player?.setExternalDrive(false);
    this.player?.setEyeHeightOverride(null);
    if (this.player) this.player.rig.setDrivingMode(false);
    this.setCabinOccludersVisible(true);
    this.audio?.stopCarEngine();

    this.weapon?.setWorld(this.world);
    this.enemies?.setWorld(this.world);
    this.player?.setWorld(this.world);
  }

  private addBanner(): void {
    if (!this.world.banner) return;
    const b = this.world.banner.position;
    const sign =
      b.style === 'neon'
        ? createNeonWallSign(this.world.banner.text, b.width, b.height)
        : createWallSign(this.world.banner.text, b.width, b.height);
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
    this.suzyCatMesh = null;
    this.treasureChestMesh = null;
    this.treasureDiscovered = false;
    this.plasmaTvMesh = null;
    this.plasmaTvOn = false;
    this.tvSlideshow.dispose();
    this.tvSlideshow = new TvSlideshow();
    this.balloons.clear();
    if (this.world.props.length === 0) return;
    const props = buildProps(this.world.props);
    this.worldGroup.add(props);
    this.balloons.registerFromScene(props);
    props.traverse((child) => {
      if (child.name === 'eating-cat') this.catMesh = child;
      if (child.name === 'suzy-cat') this.suzyCatMesh = child;
      if (child.name === 'lamborghini') this.lamborghiniMesh = child as THREE.Group;
      if (child.name === 'plasma-tv') this.plasmaTvMesh = child as THREE.Group;
    });
    this.setPlasmaTvPower(false);
    this.initLamborghiniFromWorld();
  }

  private initLamborghiniFromWorld(): void {
    this.drivingCar = false;
    this.lamboInteractArmed = false;
    this.carSpeed = 0;
    this.carPitch = CAR_DEFAULT_PITCH;

    const spec = this.world.props.find((p) => p.kind === 'lamborghini');
    if (!spec) return;

    this.carX = spec.x;
    this.carY = spec.y;
    this.carZ = spec.z;
    this.carYaw = spec.rotationY ?? 0;
    this.snapCarToGround();
    this.syncLamborghiniMesh();
  }

  private syncLamborghiniMesh(): void {
    if (!this.lamborghiniMesh) return;
    this.lamborghiniMesh.position.set(this.carX, this.carY, this.carZ);
    this.lamborghiniMesh.rotation.y = this.carYaw;

    const driveSpot = this.world.interactables.find((i) => i.kind === 'lamborghini-drive');
    if (driveSpot) {
      driveSpot.x = this.carX;
      driveSpot.z = this.carZ;
    }
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.player.resize(w / h);
  };

  private handlePointerLockChange(): void {
    if (this.state !== 'playing' && this.state !== 'paused') return;
    if (!this.input.isLocked()) {
      if (this.intentionalUnlock) {
        this.intentionalUnlock = false;
        return;
      }
      if (this.state === 'playing') this.enterPause();
    }
  }

  private applySettings(settings: GameSettings): void {
    this.settings = { ...settings };
    saveSettings(this.settings);
    this.player.setMouseSensitivity(this.settings.mouseSensitivity);
    this.audio.setMuted(this.settings.muted);
    this.audio.setSfxVolume(this.settings.sfxVolume);
    this.audio.setMusicVolume(this.settings.musicVolume);
    if (!this.settings.muted && (this.state === 'playing' || this.state === 'paused')) {
      const bgm = MAPS[this.mapIndex]?.bgm ?? null;
      if (bgm) this.audio.setBgm(bgm);
    }
    if (this.pause.isVisible()) this.pause.show(this.settings);
  }

  private enterPause(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.pause.show(this.settings);
  }

  private resumeFromPause(): void {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.pause.hide();
    this.input.requestPointerLock();
  }

  private returnToMainMenu(): void {
    this.state = 'menu';
    this.pause.hide();
    this.dialogue.hide();
    this.hud.hide();
    this.input.releasePointerLock();
    this.audio.stopBgm();
    this.enemies.clear();
    this.npcs.clear();
    this.menu.showStart(this.score > 0 ? this.score : undefined);
  }

  private handlePlayerFall(): void {
    if (this.state !== 'playing') return;
    if (this.cheatGodMode) return;
    this.anxiety.add(8);
    this.hud.flashDamage();
    this.audio.play('hurt');
  }

  private toggleMute(): void {
    this.settings.muted = this.audio.toggleMuted();
    saveSettings(this.settings);
    if (this.pause.isVisible()) this.pause.show(this.settings);
    const currentBgm = MAPS[this.mapIndex]?.bgm ?? null;
    if (!this.settings.muted && currentBgm && this.state === 'playing') {
      this.audio.setBgm(currentBgm);
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
    if (this.commandConsole.isOpen()) return;

    const active = this.state === 'playing' && this.input.isLocked();

    if (this.drivingCar) {
      this.tickCarDriving(dt, active);
    } else {
      this.player.update(dt, active);
    }
    this.tickWaterEffects();
    this.weapon.update(dt);
    this.effects.update(dt);

    if (this.state === 'playing') {
      if (this.pendingFinalWin) {
        this.finalWinDelay -= dt;
        this.confetti.update(dt);
        if (this.finalWinDelay <= 0) {
          this.pendingFinalWin = false;
          this.confetti.hide();
          this.showFinalWinScreen();
        }
      }

      if (this.input.consumePause()) {
        this.enterPause();
      }
      if (this.input.consumeMute()) {
        this.toggleMute();
      }

      this.enemies.update(dt, this.player.position);
      this.npcs.update(dt, this.world, this.world.interactables);
      this.enemyProjectiles.update(dt, this.player.position, this.world, (amount) => {
        this.anxiety.add(amount);
        this.hud.flashDamage();
        this.audio.play('hurt');
      });
      this.anxiety.update(dt, true);
      this.tickLevel(dt);
      this.tickMapSkipHint();
      this.tickCatInteraction(dt);
      this.tickPianoInteraction();
      this.tickAltarInteraction();
      this.tickWeddingNpcInteraction();
      this.tickDubaiExploreInteraction();
      if (this.plasmaTvOn) this.tvSlideshow.update(dt);
      this.tickSuzyCatInteraction(dt);
      this.tickCakeInteraction();
      this.tickBaliTreasureInteraction();

      if (active && this.levelState.phase !== 'celebration') {
        if (!this.lightsaberMode) {
          const requested = this.input.consumeWeaponSelect();
          if (requested !== null) this.setActiveWeapon(WEAPON_ORDER[requested]);
          const wheel = this.input.consumeWeaponScroll();
          if (wheel !== 0) this.cycleWeapon(wheel);
        } else {
          this.input.consumeWeaponSelect();
          this.input.consumeWeaponScroll();
        }
      }

      if (
        active &&
        this.levelState.phase !== 'celebration' &&
        this.input.consumeFire()
      ) {
        const origin = this.player.getEyePosition();
        const dir = this.player.getAimDirection();
        const result = this.weapon.fire(
          this.activeWeapon,
          origin,
          dir,
          this.enemies.enemies,
          {
            onBossPhase: (enemy, phase) => this.handleBossPhase(enemy, phase),
          },
        );
        if (result) {
          if (this.activeWeapon === 'lightsaber') {
            this.audio.playLightsaberHit();
            this.player.rig.onLightsaberSwing();
          } else {
            this.audio.play(this.activeWeapon === 'happiness' ? 'laser' : 'shoot');
            this.player.rig.onFire(result.recoil);
          }
          for (const entry of result.balloonHits) {
            this.balloons.pop(entry, (pos, color) => {
              this.effects.spawnBalloonPop(pos, color);
              this.audio.play('balloon-pop');
            });
          }
          if (result.hitEnemy && this.activeWeapon !== 'lightsaber') this.audio.play('hit');
          if (result.killedEnemy) this.handleBossKillCascade(result.killedEnemy);
        }
      }

      if (this.anxiety.isOverwhelmed()) {
        this.transitionToLose();
      }
    } else if (this.state === 'boss-cinematic') {
      this.bossCinematic.update(dt);
      this.enemies.update(dt, this.player.position);
      this.enemyProjectiles.update(dt, this.player.position, this.world, (amount) => {
        this.anxiety.add(amount);
        this.hud.flashDamage();
        this.audio.play('hurt');
      });
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
      enemiesLeft: Math.max(
        0,
        this.levelState.level.totalEnemies + this.extraEnemiesRequired - this.levelState.killedTotal,
      ),
      reloadRatio: this.weapon.cooldownRatio(),
      weaponName: this.player.rig.isCelebrationMode()
        ? HUD_LABELS.bouquet
        : this.player.rig.isMoneyMode()
          ? HUD_LABELS.money
          : WEAPONS[this.activeWeapon].displayName,
      bossHpRatio: this.getBossHpRatio(),
    });
  }

  private tickMapSkipHint(): void {
    if (this.levelState.phase !== 'awaiting-map-skip') return;

    const mapId = MAPS[this.mapIndex].id;
    const piano = this.world.interactables.find((item) => item.kind === 'piano');
    const cat = this.world.interactables.find((item) => item.kind === 'cat');

    if (mapId === 'concert-hall' && piano && this.isNearInteractable(piano)) {
      this.hud.setSubtitle([]);
      return;
    }
    if (mapId === 'lighthouse' && cat && this.isNearInteractable(cat)) {
      this.hud.setSubtitle([]);
      return;
    }

    if (mapId === 'concert-hall') {
      this.hud.setSubtitle([PIANO_PLAY_MESSAGES.mapSkipHint]);
    } else if (mapId === 'lighthouse') {
      this.hud.setSubtitle([CAT_FEED_MESSAGES.mapSkipHint]);
    }
  }

  private canUseMapSkipInteractable(): boolean {
    const phase = this.levelState.phase;
    return phase === 'active' || phase === 'awaiting-map-skip';
  }

  private tickCatInteraction(dt: number): void {
    if (this.catMesh) {
      this.catAnimTime += dt;
      updateEatingCat(this.catMesh, this.catAnimTime);
    }

    if (this.catFed || !this.input.isLocked() || !this.canUseMapSkipInteractable()) {
      if (!this.catFed) return;
      this.hud.setInteractPrompt(null);
      return;
    }

    const cat = this.world.interactables.find((item) => item.kind === 'cat');
    if (!cat) return;

    const near = this.isNearInteractable(cat);

    if (!near) {
      this.catInteractArmed = false;
      this.input.flushInteract();
      this.hud.setInteractPrompt(null);
      return;
    }

    this.hud.setInteractPrompt(CAT_FEED_MESSAGES.prompt);
    this.hud.setSubtitle([]);

    if (!this.catInteractArmed) {
      this.catInteractArmed = true;
      this.input.flushInteract();
      return;
    }

    if (this.input.consumeInteract()) {
      this.feedCatAndAdvance();
    }
  }

  private feedCatAndAdvance(): void {
    if (this.catFed) return;
    this.catFed = true;
    this.enemies.clear();
    this.state = 'transition';
    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);
    this.hud.setInteractPrompt(null);
    this.hud.setSubtitle([]);
    this.anxiety.reduce(20);

    this.dialogue.show({
      title: CAT_FEED_MESSAGES.title,
      body: CAT_FEED_MESSAGES.body,
      continueLabel: CAT_FEED_MESSAGES.button,
      onContinue: () => this.advanceStageAfterSkip(),
    });
  }

  private tickAltarInteraction(): void {
    if (this.altarUsedThisLevel || !this.input.isLocked()) return;
    if (this.levelState.phase === 'celebration') return;

    const altar = this.world.interactables.find((item) => item.kind === 'altar');
    if (!altar || !this.isNearInteractable(altar)) return;

    this.hud.setInteractPrompt(ALTAR_MESSAGES.prompt);

    if (this.input.consumeInteract()) {
      this.useAltarBreather();
    }
  }

  private useAltarBreather(): void {
    if (this.altarUsedThisLevel) return;
    this.altarUsedThisLevel = true;
    this.anxiety.reduce(15);
    this.hud.setInteractPrompt(null);
    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.dialogue.show({
      title: ALTAR_MESSAGES.title,
      body: ALTAR_MESSAGES.body,
      continueLabel: 'Devam Et',
      onContinue: () => {
        if (this.state === 'playing') this.input.requestPointerLock();
      },
    });
  }

  private tickCakeInteraction(): void {
    if (this.cakeUsedThisLevel || !this.input.isLocked()) return;

    const cake = this.world.interactables.find((item) => item.kind === 'cake');
    if (!cake || !this.isNearInteractable(cake)) return;

    this.hud.setInteractPrompt(CAKE_MESSAGES.prompt);

    if (this.input.consumeInteract()) {
      this.useCakeBoost();
    }
  }

  private useCakeBoost(): void {
    if (this.cakeUsedThisLevel) return;
    this.cakeUsedThisLevel = true;
    this.anxiety.freezeRise(CAKE_BUFF_DURATION);
    this.player.applySpeedBoost(CAKE_BUFF_DURATION);
    this.hud.setInteractPrompt(null);
    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.dialogue.show({
      title: CAKE_MESSAGES.title,
      body: CAKE_MESSAGES.body,
      continueLabel: 'Devam Et',
      onContinue: () => {
        if (this.state === 'playing') this.input.requestPointerLock();
      },
    });
  }

  private getSuzyInteractPoint(): { x: number; z: number; radius: number } | null {
    if (this.suzyCatMesh) {
      const pos = new THREE.Vector3();
      this.suzyCatMesh.getWorldPosition(pos);
      const suzy = this.world.interactables.find((item) => item.kind === 'suzy-cat');
      return { x: pos.x, z: pos.z, radius: suzy?.radius ?? 2.2 };
    }
    const suzy = this.world.interactables.find((item) => item.kind === 'suzy-cat');
    return suzy ? { x: suzy.x, z: suzy.z, radius: suzy.radius ?? 2.2 } : null;
  }

  private tickSuzyCatInteraction(dt: number): void {
    if (this.suzyCatMesh) {
      this.suzyAnimTime += dt;
      updateSuzyCatIdle(this.suzyCatMesh, this.suzyAnimTime);
    }

    if (!this.input.isLocked() || MAPS[this.mapIndex].id !== 'wedding-hall') return;

    const suzy = this.getSuzyInteractPoint();
    if (!suzy || !this.isNearInteractable(suzy)) return;

    // Gelin/damada daha yakınsak Suzy prompt'unu gösterme.
    if (this.levelState.phase === 'celebration') {
      const suzyDist = Math.hypot(this.player.position.x - suzy.x, this.player.position.z - suzy.z);
      const groom = this.world.interactables.find((item) => item.kind === 'groom-chat');
      const bride = this.world.interactables.find((item) => item.kind === 'bride-chat');
      const groomDist =
        groom && this.isNearInteractable(groom)
          ? Math.hypot(this.player.position.x - groom.x, this.player.position.z - groom.z)
          : Infinity;
      const brideDist =
        bride && this.isNearInteractable(bride)
          ? Math.hypot(this.player.position.x - bride.x, this.player.position.z - bride.z)
          : Infinity;
      if (Math.min(groomDist, brideDist) <= suzyDist) return;
    }

    this.hud.setInteractPrompt(SUZY_CAT_MESSAGES.prompt);

    if (this.input.consumeInteract()) {
      this.petSuzyCat();
    }
  }

  private petSuzyCat(): void {
    if (!this.suzyCatMesh) return;

    const dx = this.player.position.x - this.suzyCatMesh.position.x;
    const dz = this.player.position.z - this.suzyCatMesh.position.z;
    this.suzyCatMesh.rotation.y = Math.atan2(dx, dz);

    const heartOrigin = new THREE.Vector3();
    this.suzyCatMesh.getWorldPosition(heartOrigin);
    heartOrigin.y += 0.38;
    this.effects.spawnFloatingHearts(heartOrigin);
    this.audio.play('meow');
  }

  private tickWeddingNpcInteraction(): void {
    if (MAPS[this.mapIndex].id !== 'wedding-hall' || !this.input.isLocked()) {
      this.hud.setSubtitle([]);
      return;
    }

    const phase = this.levelState.phase;
    if (phase === 'celebration') {
      this.tickWeddingCelebrationInteraction();
      return;
    }

    if (phase !== 'active') {
      this.hud.setSubtitle([]);
      return;
    }

    const allSpawned = this.levelState.batchIndex >= this.levelState.level.batches.length;
    const enemiesRemain = !allSpawned || this.enemies.aliveCount() > 0;
    if (!enemiesRemain) {
      this.hud.setSubtitle([]);
      return;
    }

    const groom = this.world.interactables.find((item) => item.kind === 'groom-chat');
    const bride = this.world.interactables.find((item) => item.kind === 'bride-chat');
    const lines: string[] = [];

    if (groom && this.isNearInteractable(groom)) {
      lines.push(`${NPC_STATS.groom.displayName}: ${WEDDING_NPC_MESSAGES.groomStressed}`);
    }
    if (bride && this.isNearInteractable(bride)) {
      lines.push(`${NPC_STATS.bride.displayName}: ${WEDDING_NPC_MESSAGES.brideStressed}`);
    }

    this.hud.setSubtitle(lines);
  }

  private tickWeddingCelebrationInteraction(): void {
    this.hud.setSubtitle([]);

    const groom = this.world.interactables.find((item) => item.kind === 'groom-chat');
    const bride = this.world.interactables.find((item) => item.kind === 'bride-chat');
    const suzy = this.getSuzyInteractPoint();
    const nearGroom = groom ? this.isNearInteractable(groom) : false;
    const nearBride = bride ? this.isNearInteractable(bride) : false;
    const nearSuzy = suzy ? this.isNearInteractable(suzy) : false;

    if (!nearGroom && !nearBride) {
      // Pasta / Suzy kendi prompt'unu ayarlasın; burada silme.
      const cake = this.world.interactables.find((item) => item.kind === 'cake');
      const nearCake = cake ? this.isNearInteractable(cake) : false;
      if (!nearSuzy && !nearCake) this.hud.setInteractPrompt(null);
      return;
    }

    const groomDist = nearGroom && groom
      ? Math.hypot(this.player.position.x - groom.x, this.player.position.z - groom.z)
      : Infinity;
    const brideDist = nearBride && bride
      ? Math.hypot(this.player.position.x - bride.x, this.player.position.z - bride.z)
      : Infinity;
    const suzyDist = nearSuzy && suzy
      ? Math.hypot(this.player.position.x - suzy.x, this.player.position.z - suzy.z)
      : Infinity;

    // Suzy daha yakınsa sohbet prompt'unu dayatma.
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
      this.hud.setInteractPrompt(WEDDING_NPC_MESSAGES.groomChatPrompt);
    } else if (target === 'bride') {
      this.hud.setInteractPrompt(WEDDING_NPC_MESSAGES.brideChatPrompt);
    }

    if (this.input.consumeInteract() && target) {
      this.weddingChatNpc = target;
      this.openWeddingChatChoices();
    }
  }

  private openWeddingChatChoices(): void {
    const npc = this.weddingChatNpc;
    if (!npc) return;

    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.hud.setInteractPrompt(null);
    this.hud.setCrosshairVisible(false);

    this.dialogue.showChoices({
      title: WEDDING_NPC_MESSAGES.choiceTitle,
      speaker: NPC_STATS[npc].displayName,
      choices: [
        { id: 'a', label: WEDDING_NPC_MESSAGES.choices[npc].a },
        { id: 'b', label: WEDDING_NPC_MESSAGES.choices[npc].b },
        { id: 'c', label: WEDDING_NPC_MESSAGES.choices[npc].c },
      ],
      onChoose: (id) => this.showWeddingChatResponse(npc, id),
    });
  }

  private showWeddingChatResponse(npc: 'bride' | 'groom', choice: 'a' | 'b' | 'c'): void {
    const body = WEDDING_NPC_MESSAGES.responses[npc][choice];
    this.dialogue.show({
      title: NPC_STATS[npc].displayName,
      body,
      continueLabel: choice === 'c' ? 'Bali\'ye Git' : 'Devam Et',
      onContinue: () => {
        this.weddingChatNpc = null;
        if (choice === 'c') {
          this.transitionToBaliHoneymoon();
          return;
        }
        if (this.state === 'playing' && this.levelState.phase === 'celebration') {
          this.hud.setCrosshairVisible(true);
          this.input.requestPointerLock();
        }
      },
    });
  }

  private transitionToBaliHoneymoon(): void {
    const baliIndex = MAPS.findIndex((map) => map.id === 'bali');
    if (baliIndex < 0) return;

    this.dialogue.hide();
    this.player.rig.setCelebrationMode(false);
    this.anxiety.unlock();
    this.anxiety.reduce(40);
    this.mapIndex = baliIndex;
    this.levelIndex = 0;
    this.loadMap(baliIndex);
    this.player.respawn();
    this.hud.show();
    this.beginLevel(baliIndex, 0);
  }

  private isNearInteractable(item: { x: number; z: number; radius?: number }): boolean {
    const dx = this.player.position.x - item.x;
    const dz = this.player.position.z - item.z;
    return Math.sqrt(dx * dx + dz * dz) <= (item.radius ?? 2.5);
  }

  private tickPianoInteraction(): void {
    if (this.pianoPlayed || !this.input.isLocked() || !this.canUseMapSkipInteractable()) return;

    const piano = this.world.interactables.find((item) => item.kind === 'piano');
    if (!piano) return;

    const near = this.isNearInteractable(piano);

    if (!near) {
      this.pianoInteractArmed = false;
      this.input.flushInteract();
      if (!this.world.interactables.some((i) => i.kind === 'cat')) {
        this.hud.setInteractPrompt(null);
      }
      return;
    }

    this.hud.setInteractPrompt(PIANO_PLAY_MESSAGES.prompt);
    this.hud.setSubtitle([]);

    if (!this.pianoInteractArmed) {
      this.pianoInteractArmed = true;
      this.input.flushInteract();
      return;
    }

    if (this.input.consumeInteract()) {
      this.playPianoAndAdvance();
    }
  }

  private playPianoAndAdvance(): void {
    if (this.pianoPlayed) return;
    this.pianoPlayed = true;
    this.enemies.clear();
    this.state = 'transition';
    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);
    this.hud.setInteractPrompt(null);
    this.hud.setSubtitle([]);
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
    this.catFed = false;
    this.pianoInteractArmed = false;
    this.catInteractArmed = false;

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
    if (s.phase === 'celebration' || s.phase === 'awaiting-map-skip') return;
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
      const currentMap = MAPS[this.mapIndex];
      const isFinalBoss =
        currentMap.id === 'wedding-hall' &&
        this.levelIndex >= currentMap.levels.length - 1;

      if (isFinalBoss) {
        s.phase = 'clearing';
        this.startWeddingCelebrationMusic();
        this.audio.play('wave-clear');
        this.stagesCleared++;
        this.anxiety.lockAtZero();
        this.pendingFinalWin = true;
        this.finalWinDelay = 5;
        this.confetti.show();
        return;
      }

      const isMapSkipMap =
        currentMap.id === 'concert-hall' || currentMap.id === 'lighthouse';
      const isLastLevelInMap = this.levelIndex >= currentMap.levels.length - 1;

      if (isMapSkipMap && isLastLevelInMap) {
        s.phase = 'awaiting-map-skip';
        this.audio.play('wave-clear');
        return;
      }

      s.phase = 'clearing';
      this.finishLevel();
    }
  }

  private getBossHpRatio(): number | null {
    for (const enemy of this.enemies.enemies) {
      if (enemy.stats.isBoss && !enemy.dead) {
        return Math.max(0, Math.min(1, enemy.hp / enemy.stats.hp));
      }
    }
    return null;
  }

  private showFinalWinScreen(): void {
    this.anxiety.lockAtZero();
    this.state = 'win';
    this.intentionalUnlock = true;
    this.pause.hide();
    this.bossCinematic.hide();
    this.confetti.hide();
    this.dialogue.hide();
    this.hud.hide();
    this.input.releasePointerLock();
    this.audio.play('win');
    this.menu.showWin(this.score, this.stagesCleared, totalLevelCount(), {
      message: WIN_MESSAGES.finaleBody,
      onContinuePlaying: () => this.enterWeddingEpilogue(),
    });
  }

  private onCommandConsoleToggleKey = (event: KeyboardEvent): void => {
    if (this.commandConsole.isOpen() || event.key !== '"') return;
    if (this.state === 'menu') return;

    event.preventDefault();
    this.openCommandConsole();
  };

  private openCommandConsole(): void {
    this.consoleResumePointerLock =
      this.state === 'playing' && this.input.isLocked() && this.levelState.phase !== 'celebration';
    this.consoleResumePaused = this.state === 'paused';

    if (this.consoleResumePointerLock) {
      this.intentionalUnlock = true;
      this.input.releasePointerLock();
    }
    if (this.consoleResumePaused) {
      this.pause.hide();
    }

    this.commandConsole.openConsole();
  }

  private closeCommandConsole(): void {
    if (this.consoleResumePaused && this.state === 'paused') {
      this.pause.show(this.settings);
    } else if (this.consoleResumePointerLock && this.state === 'playing') {
      this.input.requestPointerLock();
    }

    this.consoleResumePointerLock = false;
    this.consoleResumePaused = false;
  }

  private handleCommandConsoleSubmit(command: string): CommandSubmitResult {
    const cheatId = resolveCheat(command);
    if (!cheatId) return 'Komut bulunamadı';
    return this.applyCheat(cheatId);
  }

  private applyCheat(cheatId: CheatId): CommandSubmitResult {
    switch (cheatId) {
      case 'happilymarried':
        this.teleportToWeddingEpilogue();
        return null;
      case 'nefesal':
        this.anxiety.reset();
        return null;
      case 'sakinol':
        this.anxiety.lockAtZero();
        return null;
      case 'iddqd':
        this.anxiety.lockAtZero();
        this.cheatGodMode = true;
        return null;
      case 'gulumse':
        if (this.state !== 'playing' && this.state !== 'boss-cinematic') {
          return 'Şu an kullanılamaz';
        }
        this.cheatKillAllEnemies();
        return null;
      case 'sabir999': {
        const enabled = this.weapon.damageMultiplier <= 1;
        this.weapon.damageMultiplier = enabled ? 10 : 1;
        return enabled ? 'Süper hasar: açık' : 'Süper hasar: kapalı';
      }
      case 'hizliates': {
        this.weapon.noCooldown = !this.weapon.noCooldown;
        return this.weapon.noCooldown ? 'Hızlı ateş: açık' : 'Hızlı ateş: kapalı';
      }
      case 'kosgelin':
        this.player.applySpeedBoost(60);
        return null;
      case 'dugunvakti':
        return this.cheatSkipLevel();
      case 'konserde':
        return this.teleportToMap('concert-hall', 0);
      case 'denizfeneri':
        return this.teleportToMap('lighthouse', 0);
      case 'bali':
        return this.teleportToMap('bali', 0);
      case 'dubai':
        return this.teleportToMap('dubai', 0);
      case 'baloncu':
        this.cheatPopAllBalloons();
        return null;
      case 'lightsaber': {
        if (this.lightsaberMode) {
          this.lightsaberMode = false;
          this.audio.stopLightsaberHold();
          this.setActiveWeapon(this.weaponBeforeLightsaber);
          return 'Işın kılıcı: kapalı';
        }
        if (this.activeWeapon !== 'lightsaber') {
          this.weaponBeforeLightsaber = this.activeWeapon;
        }
        this.lightsaberMode = true;
        this.setActiveWeapon('lightsaber');
        this.audio.ensureStarted();
        this.audio.startLightsaberHold();
        return 'Işın kılıcı: açık';
      }
      case 'help':
        return { help: getCheatHelpEditorText() };
      default:
        return 'Komut bulunamadı';
    }
  }

  private resetCheatState(): void {
    this.cheatGodMode = false;
    this.lightsaberMode = false;
    this.audio.stopLightsaberHold();
    this.weapon.resetCheatModifiers();
  }

  private cheatKillAllEnemies(): void {
    this.enemies.killAllLiving();
  }

  private cheatSkipLevel(): string | null {
    if (this.state !== 'playing' || this.levelState.phase !== 'active') {
      return 'Şu an kullanılamaz';
    }
    this.enemies.clear();
    this.enemyProjectiles.clear();
    this.levelState.phase = 'clearing';
    this.finishLevel();
    return null;
  }

  private cheatPopAllBalloons(): void {
    this.balloons.popAll((pos, color) => {
      this.effects.spawnBalloonPop(pos, color);
      this.audio.play('balloon-pop');
    });
  }

  private teleportToMap(mapId: MapId, levelIndex: number): string | null {
    if (
      this.state === 'menu' ||
      this.state === 'win' ||
      this.state === 'lose' ||
      this.state === 'boss-cinematic'
    ) {
      return 'Şu an kullanılamaz';
    }

    const mapIndex = MAPS.findIndex((map) => map.id === mapId);
    if (mapIndex < 0) return 'Şu an kullanılamaz';
    const mapDef = MAPS[mapIndex];
    if (!mapDef.levels[levelIndex]) return 'Şu an kullanılamaz';

    this.pendingFinalWin = false;
    this.finalWinDelay = 0;
    this.pendingBossPhase = null;
    this.bossCinematicEnemy = null;
    this.weddingChatNpc = null;
    this.extraEnemiesRequired = 0;
    this.bossCinematicPlayed.clear();
    this.confetti.hide();
    this.bossCinematic.hide();
    this.dialogue.hide();
    this.menu.hide();
    this.pause.hide();
    this.consoleResumePointerLock = false;
    this.consoleResumePaused = false;

    this.mapIndex = mapIndex;
    this.levelIndex = levelIndex;
    this.loadMap(mapIndex);
    this.enemies.clear();
    this.enemyProjectiles.clear();
    this.player.rig.setCelebrationMode(false);
    this.player.respawn();
    this.hud.show();
    this.beginLevel(mapIndex, levelIndex);
    return null;
  }

  private teleportToWeddingEpilogue(): void {
    this.audio.ensureStarted();
    const weddingMapIndex = MAPS.findIndex((map) => map.id === 'wedding-hall');
    if (weddingMapIndex < 0) return;

    this.pendingFinalWin = false;
    this.finalWinDelay = 0;
    this.pendingBossPhase = null;
    this.bossCinematicEnemy = null;
    this.weddingChatNpc = null;
    this.extraEnemiesRequired = 0;
    this.bossCinematicPlayed.clear();
    this.confetti.hide();
    this.bossCinematic.hide();
    this.dialogue.hide();
    this.menu.hide();
    this.pause.hide();
    this.consoleResumePointerLock = false;
    this.consoleResumePaused = false;

    this.mapIndex = weddingMapIndex;
    this.levelIndex = MAPS[weddingMapIndex].levels.length - 1;
    this.stagesCleared = totalLevelCount();
    this.loadMap(weddingMapIndex);
    this.levelState = makeLevelState(MAPS[weddingMapIndex].levels[this.levelIndex]);
    this.enemies.clear();
    this.enemyProjectiles.clear();
    this.anxiety.lockAtZero();
    this.player.respawn();
    this.hud.show();
    this.enterWeddingEpilogue();
  }

  private enterWeddingEpilogue(): void {
    this.menu.hide();
    this.state = 'playing';
    this.levelState.phase = 'celebration';
    this.cakeUsedThisLevel = false;
    this.player.rig.setCelebrationMode(true);
    this.hud.show();
    this.hud.setCrosshairVisible(false);
    this.hud.setInteractPrompt(null);
    this.hud.setSubtitle([]);
    this.anxiety.lockAtZero();
    this.startWeddingCelebrationMusic();
    this.input.requestPointerLock();
  }

  private showBaliWinScreen(): void {
    this.anxiety.lockAtZero();
    this.state = 'win';
    this.intentionalUnlock = true;
    this.pause.hide();
    this.bossCinematic.hide();
    this.confetti.hide();
    this.dialogue.hide();
    this.hud.hide();
    this.input.releasePointerLock();
    this.audio.stopBgm();
    this.audio.play('win');
    this.menu.showWin(this.score, this.stagesCleared, totalLevelCount(), {
      message: WIN_MESSAGES.baliFinaleBody,
      onContinuePlaying: () => this.enterBaliEpilogue(),
    });
  }

  private enterBaliEpilogue(): void {
    this.menu.hide();
    this.state = 'playing';
    this.levelState.phase = 'celebration';
    this.treasureDiscovered = false;
    this.player.rig.setCelebrationMode(false);
    this.hud.show();
    this.hud.setCrosshairVisible(true);
    this.hud.setInteractPrompt(null);
    this.hud.setSubtitle([]);
    this.anxiety.lockAtZero();
    this.enemies.clear();
    this.enemyProjectiles.clear();
    this.spawnAmbientFauna();
    this.spawnBaliTreasureChest();
    this.audio.setBgm(MAPS[this.mapIndex].bgm ?? null);
    this.input.requestPointerLock();
  }

  private spawnBaliTreasureChest(): void {
    if (this.treasureChestMesh) {
      this.worldGroup.remove(this.treasureChestMesh);
      this.treasureChestMesh = null;
    }
    const spot = this.world.treasureChest;
    if (!spot || !this.worldGroup) return;

    const chest = buildTreasureChest();
    chest.position.set(spot.x, spot.y, spot.z);
    if (spot.rotationY) chest.rotation.y = spot.rotationY;
    this.worldGroup.add(chest);
    this.treasureChestMesh = chest;

    // Ensure interactable exists for this session
    const existing = this.world.interactables.find((i) => i.kind === 'treasure-chest');
    if (!existing) {
      this.world.interactables.push({
        kind: 'treasure-chest',
        x: spot.x,
        y: spot.y,
        z: spot.z,
        radius: 2.4,
      });
    }
  }

  private tickBaliTreasureInteraction(): void {
    if (
      MAPS[this.mapIndex].id !== 'bali' ||
      this.levelState.phase !== 'celebration' ||
      !this.input.isLocked() ||
      this.treasureDiscovered ||
      !this.treasureChestMesh
    ) {
      return;
    }

    const chest = this.world.interactables.find((item) => item.kind === 'treasure-chest');
    if (!chest || !this.isNearInteractable(chest)) {
      this.hud.setInteractPrompt(null);
      return;
    }

    this.hud.setInteractPrompt(BALI_TREASURE_MESSAGES.prompt);

    if (this.input.consumeInteract()) {
      this.discoverBaliTreasure();
    }
  }

  private discoverBaliTreasure(): void {
    this.treasureDiscovered = true;
    this.hud.setInteractPrompt(null);
    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);
    this.audio.play('win');

    this.dialogue.show({
      title: BALI_TREASURE_MESSAGES.title,
      body: BALI_TREASURE_MESSAGES.body,
      continueLabel: BALI_TREASURE_MESSAGES.continueLabel,
      onContinue: () => this.transitionToDubai(),
    });
  }

  private transitionToDubai(): void {
    const dubaiIndex = MAPS.findIndex((map) => map.id === 'dubai');
    if (dubaiIndex < 0) return;

    this.dialogue.hide();
    this.player.rig.setHeldItem('none');
    this.anxiety.lockAtZero();
    this.mapIndex = dubaiIndex;
    this.levelIndex = 0;
    this.loadMap(dubaiIndex);
    this.enemies.clear();
    this.enemyProjectiles.clear();
    this.player.respawn();
    this.beginLevel(dubaiIndex, 0);
  }

  private tickDubaiExploreInteraction(): void {
    if (MAPS[this.mapIndex].id !== 'dubai' || !this.input.isLocked()) {
      return;
    }
    if (this.levelState.phase !== 'celebration') return;

    if (this.drivingCar) {
      this.hud.setSubtitle([]);
      this.hud.setInteractPrompt(LAMBO_DRIVE_MESSAGES.exitPrompt);
      if (this.input.consumeInteract()) this.exitCarDrive();
      return;
    }

    this.hud.setSubtitle([]);

    const lambo = this.world.interactables.find((item) => item.kind === 'lamborghini-drive');
    const groom = this.world.interactables.find((item) => item.kind === 'groom-chat');
    const bride = this.world.interactables.find((item) => item.kind === 'bride-chat');
    const tv = this.world.interactables.find((item) => item.kind === 'plasma-tv');
    const nearestLocal = this.findNearestDubaiLocal();
    const nearLambo = lambo ? this.isNearInteractable(lambo) : false;
    const nearGroom = groom ? this.isNearInteractable(groom) : false;
    const nearBride = bride ? this.isNearInteractable(bride) : false;
    const nearTv = tv ? this.isNearInteractable(tv) : false;
    const nearLocal = nearestLocal !== null;

    if (!nearLambo && !nearGroom && !nearBride && !nearLocal && !nearTv) {
      this.lamboInteractArmed = false;
      this.hud.setInteractPrompt(null);
      return;
    }

    const lamboDist =
      nearLambo && lambo
        ? Math.hypot(this.player.position.x - lambo.x, this.player.position.z - lambo.z)
        : Infinity;
    const groomDist =
      nearGroom && groom
        ? Math.hypot(this.player.position.x - groom.x, this.player.position.z - groom.z)
        : Infinity;
    const brideDist =
      nearBride && bride
        ? Math.hypot(this.player.position.x - bride.x, this.player.position.z - bride.z)
        : Infinity;
    const localDist = nearestLocal?.dist ?? Infinity;
    const tvDist =
      nearTv && tv ? Math.hypot(this.player.position.x - tv.x, this.player.position.z - tv.z) : Infinity;

    const closest = Math.min(lamboDist, groomDist, brideDist, localDist, tvDist);
    if (closest === lamboDist && nearLambo) {
      this.hud.setInteractPrompt(LAMBO_DRIVE_MESSAGES.prompt);
      if (!this.lamboInteractArmed) {
        this.lamboInteractArmed = true;
        this.input.flushInteract();
        return;
      }
      if (this.input.consumeInteract()) this.enterCarDrive();
      return;
    }

    this.lamboInteractArmed = false;

    if (closest === tvDist && nearTv) {
      this.hud.setInteractPrompt(this.plasmaTvOn ? TV_MESSAGES.turnOff : TV_MESSAGES.turnOn);
      if (this.input.consumeInteract()) this.setPlasmaTvPower(!this.plasmaTvOn);
      return;
    }

    if (closest === localDist && nearestLocal) {
      const prompt =
        nearestLocal.kind === 'camel-chat'
          ? DUBAI_LOCAL_MESSAGES.camelPrompt
          : DUBAI_LOCAL_MESSAGES.arabPrompt;
      this.hud.setInteractPrompt(prompt);
      if (this.input.consumeInteract()) {
        this.openDubaiLocalChat(nearestLocal.kind, nearestLocal.speakerName);
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
      this.hud.setInteractPrompt(DUBAI_NPC_MESSAGES.groomChatPrompt);
    } else if (target === 'bride') {
      this.hud.setInteractPrompt(DUBAI_NPC_MESSAGES.brideChatPrompt);
    }

    if (this.input.consumeInteract() && target) {
      this.weddingChatNpc = target;
      this.openDubaiChatChoices();
    }
  }

  private setPlasmaTvPower(on: boolean): void {
    this.plasmaTvOn = on;
    if (!this.plasmaTvMesh) return;

    const screen = this.plasmaTvMesh.getObjectByName('tv-screen') as THREE.Mesh | undefined;
    if (!screen) return;

    if (on) {
      void this.tvSlideshow.start(screen);
    } else {
      this.tvSlideshow.stop(screen);
    }
  }

  private findNearestDubaiLocal(): {
    kind: 'camel-chat' | 'arab-chat';
    dist: number;
    speakerName: string;
  } | null {
    let best: { kind: 'camel-chat' | 'arab-chat'; dist: number; speakerName: string } | null = null;
    for (const item of this.world.interactables) {
      if (item.kind !== 'camel-chat' && item.kind !== 'arab-chat') continue;
      if (!this.isNearInteractable(item)) continue;
      const dist = Math.hypot(this.player.position.x - item.x, this.player.position.z - item.z);
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

  private openDubaiLocalChat(kind: 'camel-chat' | 'arab-chat', speakerName: string): void {
    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.hud.setInteractPrompt(null);
    this.hud.setCrosshairVisible(false);

    const lines = DUBAI_LOCAL_MESSAGES.lines;
    const body = lines[Math.floor(Math.random() * lines.length)] ?? lines[0];
    const title =
      kind === 'camel-chat' ? `${speakerName} 🐪` : speakerName;

    this.dialogue.show({
      title,
      body: body.replace(/\n/g, '<br/>'),
      continueLabel: DUBAI_LOCAL_MESSAGES.continueLabel,
      onContinue: () => {
        if (this.state === 'playing' && this.levelState.phase === 'celebration') {
          this.hud.setCrosshairVisible(false);
          this.input.requestPointerLock();
        }
      },
    });
  }

  private enterCarDrive(): void {
    if (!this.lamborghiniMesh) return;
    this.drivingCar = true;
    this.carSpeed = 0;
    this.carPitch = CAR_DEFAULT_PITCH;
    this.player.setExternalDrive(true);
    this.player.setEyeHeightOverride(CAR_EYE_HEIGHT);
    this.setCabinOccludersVisible(false);
    this.player.rig.setDrivingMode(true);
    this.snapCarToGround();
    this.player.position.set(this.carX, this.carY, this.carZ);
    this.player.setViewAngles(this.carYaw, this.carPitch);
    this.hud.setCrosshairVisible(false);
    this.hud.setInteractPrompt(LAMBO_DRIVE_MESSAGES.exitPrompt);
    this.audio.ensureStarted();
    this.audio.startCarEngine();
  }

  private exitCarDrive(): void {
    this.drivingCar = false;
    this.carSpeed = 0;
    this.audio.stopCarEngine();
    this.player.setExternalDrive(false);
    this.player.setEyeHeightOverride(null);
    this.setCabinOccludersVisible(true);
    this.player.rig.setDrivingMode(false);
    this.player.rig.setHeldItem('money');
    const exitSide = 1.35;
    const exitX = this.carX - Math.cos(this.carYaw) * exitSide;
    const exitZ = this.carZ + Math.sin(this.carYaw) * exitSide;
    const stand = this.world.resolveStandingPoint(exitX, exitZ, 0.35, 1.7, 4);
    this.player.position.set(
      stand?.x ?? exitX,
      stand?.y ?? this.carY,
      stand?.z ?? exitZ,
    );
    this.player.setViewAngles(this.carYaw + Math.PI * 0.5, 0);
    this.hud.setCrosshairVisible(false);
    this.hud.setInteractPrompt(null);
  }

  private setCabinOccludersVisible(visible: boolean): void {
    if (!this.lamborghiniMesh) return;
    this.lamborghiniMesh.traverse((obj) => {
      if (obj.name === LAMBORGHINI_CABIN_HIDE) obj.visible = visible;
    });
  }

  private tickCarDriving(dt: number, active: boolean): void {
    if (active) {
      const { dx, dy } = this.input.consumeMouseDelta();
      const sens = this.player.getMouseSensitivity();
      this.carYaw -= dx * sens;
      this.carPitch -= dy * sens;
      if (this.carPitch > CAR_MAX_PITCH) this.carPitch = CAR_MAX_PITCH;
      if (this.carPitch < CAR_MIN_PITCH) this.carPitch = CAR_MIN_PITCH;

      const wishForward = this.input.isDown('forward') ? 1 : 0;
      const wishBack = this.input.isDown('back') ? 1 : 0;
      const throttle = wishForward - wishBack;

      if (throttle !== 0) {
        this.carSpeed += throttle * CAR_ACCEL * dt;
      } else {
        this.carSpeed *= Math.max(0, 1 - CAR_DRAG * dt);
      }

      if (this.carSpeed > CAR_MAX_SPEED) this.carSpeed = CAR_MAX_SPEED;
      if (this.carSpeed < -CAR_REVERSE_MAX) this.carSpeed = -CAR_REVERSE_MAX;

      if (Math.abs(this.carSpeed) > 0.35) {
        const steer = (this.input.isDown('left') ? 1 : 0) + (this.input.isDown('right') ? -1 : 0);
        if (steer !== 0) {
          this.carYaw += steer * CAR_TURN_RATE * dt * Math.sign(this.carSpeed);
        }
      }
    } else {
      this.carSpeed *= Math.max(0, 1 - CAR_DRAG * dt);
    }

    const moveX = -Math.sin(this.carYaw) * this.carSpeed * dt;
    const moveZ = -Math.cos(this.carYaw) * this.carSpeed * dt;
    this.moveCar(moveX, moveZ);
    this.snapCarToGround();

    this.player.position.set(this.carX, this.carY, this.carZ);
    this.player.setViewAngles(this.carYaw, this.carPitch);
    this.syncLamborghiniMesh();
    this.player.rig.update(dt, Math.abs(this.carSpeed) > 0.5, this.carSpeed);
    this.audio.updateCarEngine(Math.abs(this.carSpeed) / CAR_MAX_SPEED);
  }

  /** Keep wheels on the top solid surface (sand, asphalt, pad, etc.). */
  private snapCarToGround(): void {
    const cos = Math.cos(this.carYaw);
    const sin = Math.sin(this.carYaw);
    const local: Array<[number, number]> = [
      [0, 0],
      [-CAR_HALF_W * 0.55, -CAR_HALF_L * 0.55],
      [CAR_HALF_W * 0.55, -CAR_HALF_L * 0.55],
      [-CAR_HALF_W * 0.55, CAR_HALF_L * 0.55],
      [CAR_HALF_W * 0.55, CAR_HALF_L * 0.55],
    ];

    let sumY = 0;
    let count = 0;
    for (const [lx, lz] of local) {
      const wx = this.carX + lx * cos + lz * sin;
      const wz = this.carZ - lx * sin + lz * cos;
      const fx = Math.floor(wx);
      const fz = Math.floor(wz);
      for (let y = this.world.height - 1; y >= 0; y--) {
        if (this.world.isSolidAt(fx, y, fz)) {
          sumY += y + 1.01;
          count++;
          break;
        }
      }
    }

    if (count > 0) {
      this.carY = sumY / count;
    }
  }

  private moveCar(deltaX: number, deltaZ: number): void {
    if (deltaX !== 0) {
      const originalX = this.carX;
      const originalY = this.carY;
      this.carX = originalX + deltaX;
      this.snapCarToGround();
      if (this.carBodyCollides()) {
        this.carX = originalX;
        this.carY = originalY;
        this.snapCarToGround();
        this.carSpeed *= 0.35;
      }
    }
    if (deltaZ !== 0) {
      const originalZ = this.carZ;
      const originalY = this.carY;
      this.carZ = originalZ + deltaZ;
      this.snapCarToGround();
      if (this.carBodyCollides()) {
        this.carZ = originalZ;
        this.carY = originalY;
        this.snapCarToGround();
        this.carSpeed *= 0.35;
      }
    }
  }

  private carBodyCollides(): boolean {
    return this.world.vehicleBodyCollides(
      this.carX - CAR_HALF_W,
      this.carX + CAR_HALF_W,
      this.carZ - CAR_HALF_L,
      this.carZ + CAR_HALF_L,
      this.carY + 0.12,
      this.carY + CAR_HEIGHT,
    );
  }

  private openDubaiChatChoices(): void {
    const npc = this.weddingChatNpc;
    if (!npc) return;

    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.hud.setInteractPrompt(null);
    this.hud.setCrosshairVisible(false);

    this.dialogue.showChoices({
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
    this.dialogue.show({
      title: NPC_STATS[npc].displayName,
      body,
      continueLabel: 'Devam Et',
      onContinue: () => {
        this.weddingChatNpc = null;
        if (this.state === 'playing' && this.levelState.phase === 'celebration') {
          this.hud.setCrosshairVisible(false);
          this.input.requestPointerLock();
        }
      },
    });
  }

  private finishLevel(): void {
    this.audio.play('wave-clear');
    this.stagesCleared++;
    const currentMap = MAPS[this.mapIndex];
    const isLastLevelInMap = this.levelIndex >= currentMap.levels.length - 1;

    if (isLastLevelInMap && currentMap.id === 'bali') {
      this.showBaliWinScreen();
      return;
    }

    // Wedding remains the story finale; Bali is bonus and opened from epilogue chat.
    if (isLastLevelInMap && currentMap.id === 'wedding-hall') {
      this.transitionToWin();
      return;
    }

    const isLastMap = this.mapIndex >= MAPS.length - 1;
    if (isLastLevelInMap && isLastMap) {
      this.transitionToWin();
      return;
    }

    this.state = 'transition';
    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);

    const level = this.levelState.level;
    if (isLastLevelInMap) {
      this.dialogue.show({
        title: `${currentMap.displayName} - Tamamlandı`,
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
    this.altarUsedThisLevel = false;
    this.cakeUsedThisLevel = false;
    this.extraEnemiesRequired = 0;
    this.bossCinematicPlayed.clear();
    this.enemyProjectiles.clear();
    this.pianoInteractArmed = false;
    this.catInteractArmed = false;
    this.hud.setCrosshairVisible(false);
    if (levelIndex === 0) this.player.respawn();
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
    const mapDef = MAPS[this.mapIndex];

    if (mapDef.explorationOnly) {
      this.levelState.phase = 'celebration';
      this.levelState.timer = 0;
      this.player.rig.setHeldItem('money');
      this.hud.setCrosshairVisible(false);
      this.hud.setInteractPrompt(null);
      this.hud.setSubtitle([]);
      this.anxiety.lockAtZero();
      this.enemies.clear();
      this.enemyProjectiles.clear();
      this.hud.show();
      this.input.requestPointerLock();
      return;
    }

    this.levelState.phase = 'active';
    this.levelState.timer = 2.5;
    this.player.rig.setHeldItem('none');
    this.hud.setCrosshairVisible(true);
    this.hud.show();
    this.spawnAmbientFauna();
    this.input.requestPointerLock();
  }

  private spawnAmbientFauna(): void {
    if (!this.world.ambientFauna.length) return;
    this.enemies.spawnAmbientFauna(this.world.ambientFauna);
  }

  private tickWaterEffects(): void {
    const wet = this.player.isInWater();
    this.waterOverlay.style.opacity = wet ? '1' : '0';

    if (this.player.consumeEnteredWater()) {
      const splashAt = this.player.position.clone();
      splashAt.y += 0.85;
      this.effects.spawnWaterSplash(splashAt, true);
    }

    if (wet && this.player.consumeWaterMovePulse(0.32)) {
      const rippleAt = this.player.position.clone();
      rippleAt.y += 0.9;
      this.effects.spawnWaterRipple(rippleAt);
    }
  }

  private handleEnemyKilled(enemy: Enemy): void {
    if (!enemy.ambient) this.levelState.killedTotal++;
    this.score += enemy.stats.scoreValue;
    this.anxiety.reduce(enemy.stats.anxietyReward);
    this.audio.play('kill');
  }

  /** Wedding hall: when the gold boss dies, wipe the rest of the wave. */
  private handleBossKillCascade(killed: Enemy): void {
    if (MAPS[this.mapIndex].id !== 'wedding-hall' || !killed.stats.isBoss) return;

    const isFinalBoss = this.levelIndex >= MAPS[this.mapIndex].levels.length - 1;
    if (isFinalBoss) {
      this.anxiety.lockAtZero();
      this.startWeddingCelebrationMusic();
    }

    this.enemies.forceKillAllExcept(killed);
  }

  private startWeddingCelebrationMusic(): void {
    this.audio.ensureStarted();
    this.audio.setBgm('wedding-celebration');
  }

  private handleEnemyContact(enemy: Enemy, dt: number): void {
    if (this.cheatGodMode) return;
    this.anxiety.add(enemy.stats.contactAnxietyPerSecond * enemy.contactAnxietyMultiplier * dt);
    enemy.contactAccumulator += dt;
    if (enemy.contactAccumulator >= 0.6) {
      enemy.contactAccumulator = 0;
      this.hud.flashDamage();
      this.audio.play('hurt');
    }
  }

  private handleEnemyFlash(_enemy: Enemy): void {
    if (this.cheatGodMode) return;
    this.anxiety.add(12);
    this.hud.flashDamage();
    this.audio.play('hurt');
  }

  private handleBossPhase(enemy: Enemy, phase: 2 | 3): void {
    if (this.state === 'boss-cinematic' || this.bossCinematicPlayed.has(phase)) return;

    this.bossCinematicPlayed.add(phase);
    this.state = 'boss-cinematic';
    this.bossCinematicEnemy = enemy;
    this.pendingBossPhase = phase;
    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);
    this.dialogue.hide();

    for (const e of this.enemies.enemies) {
      e.combatFrozen = true;
    }
    enemy.startRageTransition(phase === 3 ? 2 : 1);

    const text = phase === 2 ? 'Altın Canavarı kızdı!' : 'Altın Canavarı ÖFKELENDİ!';
    const durationMs = phase === 2 ? 2800 : 2000;
    this.bossCinematic.show(text, durationMs, () => this.finishBossCinematic());
    this.audio.play('hurt');
    this.hud.flashDamage();
  }

  private finishBossCinematic(): void {
    const phase = this.pendingBossPhase;
    const enemy = this.bossCinematicEnemy;
    this.pendingBossPhase = null;
    this.bossCinematicEnemy = null;

    if (phase === 2 && enemy) {
      this.extraEnemiesRequired += 2;
      for (let i = 0; i < 2; i++) {
        this.enemies.spawn('merakli-teyze', [this.player.position, enemy.position], 6);
      }
    }

    for (const e of this.enemies.enemies) {
      e.combatFrozen = false;
    }

    if (this.state !== 'boss-cinematic') return;
    this.state = 'playing';
    this.hud.setCrosshairVisible(true);
    this.input.requestPointerLock();
  }

  private startRun(): void {
    this.audio.ensureStarted();
    this.pause.hide();
    this.stagesCleared = 0;
    this.score = 0;
    this.mapIndex = 0;
    this.levelIndex = 0;
    this.catFed = false;
    this.catAnimTime = 0;
    this.pianoPlayed = false;
    this.altarUsedThisLevel = false;
    this.cakeUsedThisLevel = false;
    this.player.rig.setCelebrationMode(false);
    this.bossCinematicPlayed.clear();
    this.pendingFinalWin = false;
    this.finalWinDelay = 0;
    this.confetti.hide();
    this.resetCheatState();
    this.loadMap(0);
    this.anxiety.unlock();
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
    this.pause.hide();
    this.bossCinematic.hide();
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
    this.pause.hide();
    this.bossCinematic.hide();
    this.hud.hide();
    this.dialogue.hide();
    this.input.releasePointerLock();
    this.audio.stopBgm();
    this.audio.play('lose');
    this.menu.showLose(this.score, this.stagesCleared, MAPS[this.mapIndex].displayName);
  }
}
