import * as THREE from 'three';
import { InputManager } from '../input/InputManager';
import { createLighting, type SceneLighting } from '../rendering/Lighting';
import { HUD } from '../ui/HUD';
import { MenuScreen } from '../ui/MenuScreen';
import { DialogueBox } from '../ui/DialogueBox';
import {
  BALI_TREASURE_MESSAGES,
  BOSS_PHASE_MESSAGES,
  HUD_LABELS,
  LAMBO_DRIVE_MESSAGES,
  LEVEL_BREATHER_MESSAGES,
  MAP_BRIDGE_MESSAGES,
  WAVE_TRANSITION_LABELS,
  WIN_MESSAGES,
} from '../data/messages';
import { AnxietyMeter } from './AnxietyMeter';
import { AudioManager } from './AudioManager';
import { BalloonManager } from './BalloonManager';
import { EnemyAmbience } from './EnemyAmbience';
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
import { buildProps } from '../rendering/MapProps';
import { buildTheaterSeats } from '../rendering/concertSeats';
import { buildTreasureChest } from '../rendering/TreasureChest';
import { PauseScreen } from '../ui/PauseScreen';
import { CommandConsole } from '../ui/CommandConsole';
import { BossCinematic } from '../ui/BossCinematic';
import { ConfettiOverlay } from '../ui/ConfettiOverlay';
import { EnemyProjectileManager } from './EnemyProjectiles';
import { loadSettings, saveSettings, type GameSettings } from './GameSettings';

import { ENEMY_STATS } from '../data/enemies';
import { MAPS, totalLevelCount, type MapId } from '../data/maps';
import { getCheatHelpEditorText, resolveCheat, type CheatId } from './CheatCodes';
import type { CommandSubmitResult } from '../ui/CommandConsole';
import { BaliInteractions } from './interactions/BaliInteractions';
import { DubaiInteractions, type DubaiCarHost } from './interactions/DubaiInteractions';
import { CarTurboEffects } from './CarTurboEffects';
import { MapSkipInteractions } from './interactions/MapSkipInteractions';
import { WeddingInteractions } from './interactions/WeddingInteractions';
import type { InteractionGameState, InteractionHost } from './interactions/types';

const CAR_MAX_SPEED = 14;
const CAR_TURBO_MAX_SPEED = 23;
const CAR_REVERSE_MAX = 5;
const CAR_ACCEL = 26;
const CAR_TURBO_ACCEL_MUL = 2.1;
const CAR_DRAG = 2.4;
const CAR_TURBO_DRAG = 1.1;
const CAR_TURN_RATE = 2.35;
const CAR_HALF_W = 0.95;
const CAR_HALF_L = 2.05;
const CAR_HEIGHT = 1.05;
/** Eye above car origin — low enough to read the hood, above the chassis. */
const CAR_EYE_HEIGHT = 0.78;
const CAR_MIN_PITCH = -0.35;
const CAR_MAX_PITCH = 0.22;
const CAR_DEFAULT_PITCH = -0.12;
/** Third-person chase camera (racing-style) while driving. */
const CHASE_DISTANCE = 6.5;
const CHASE_HEIGHT = 2.8;
const CHASE_LOOK_AHEAD = 4;
const CHASE_LOOK_HEIGHT = 1.1;
const CHASE_SMOOTH = 9;

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
  private readonly enemyAmbience = new EnemyAmbience();
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
  private settings: GameSettings = loadSettings();
  private intentionalUnlock = false;
  private extraEnemiesRequired = 0;
  private bossCinematicEnemy: Enemy | null = null;
  private pendingBossPhase: 2 | 3 | null = null;
  private readonly bossCinematicPlayed = new Set<2 | 3>();
  private pendingFinalWin = false;
  private finalWinDelay = 0;
  private celebrationWinHandler: (() => void) | null = null;
  private flashWarningTimer = 0;
  private consoleResumePointerLock = false;
  private consoleResumePaused = false;
  private readonly waterOverlay: HTMLDivElement;
  private treasureChestMesh: THREE.Object3D | null = null;
  private lamborghiniMesh: THREE.Group | null = null;
  private drivingCar = false;
  private carCameraChase = true;
  private chaseCamInitialized = false;
  private readonly chaseCamPos = new THREE.Vector3();
  private readonly chaseLookAt = new THREE.Vector3();
  private readonly chaseIdealPos = new THREE.Vector3();
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
  private readonly carTurbo: CarTurboEffects;

  private readonly interactionHost: InteractionHost;
  private readonly mapSkip: MapSkipInteractions;
  private readonly wedding: WeddingInteractions;
  private readonly bali: BaliInteractions;
  private readonly dubai: DubaiInteractions;

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

    this.input = new InputManager(this.renderer.domElement);

    this.audio = new AudioManager();
    this.anxiety = new AnxietyMeter();

    this.hud = new HUD(container);
    this.dialogue = new DialogueBox(container);
    this.menu = new MenuScreen(container, {
      onStart: () => this.startRun(),
      onRestart: () => this.startRun(),
      onInteract: () => this.startMenuMusic(),
      onClick: () => this.playMenuClick(),
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

    this.interactionHost = this.createInteractionHost();
    this.mapSkip = new MapSkipInteractions(this.interactionHost);
    this.wedding = new WeddingInteractions(this.interactionHost);
    this.bali = new BaliInteractions(this.interactionHost);
    this.dubai = new DubaiInteractions(this.interactionHost, this.createDubaiCarHost());

    this.loadMap(0);

    this.player = new Player(this.world, this.input, container.clientWidth / container.clientHeight);
    this.scene.add(this.player.camera);

    this.carTurbo = new CarTurboEffects(container);
    this.carTurbo.setBaseFov(this.player.camera.fov);

    this.effects = new ProjectileEffects(this.scene);
    this.enemyProjectiles = new EnemyProjectileManager(this.scene);
    this.weapon = new WeaponSystem(this.world, this.effects);
    this.weapon.setBalloonRaycast((origin, direction, maxDistance) => {
      if (MAPS[this.mapIndex]?.id !== 'wedding-hall' || !this.balloons.hasRemaining()) return null;
      return this.balloons.raycastHit(origin, direction, maxDistance);
    });
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

    this.levelState = makeLevelState(MAPS[0].levels[0]);
    this.applySettings(this.settings);
    this.player.onFall = () => this.handlePlayerFall();

    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onCommandConsoleToggleKey);
    this.input.onLockChange(() => this.handlePointerLockChange());

    this.menu.showStart();
    this.startMenuMusic();
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
    this.renderer.setPixelRatio(
      mapDef.id === 'dubai' ? Math.min(window.devicePixelRatio, 1.5) : Math.min(window.devicePixelRatio, 2),
    );
    this.mapSkip.resetForMapLoad();
    this.bali.resetForMapLoad();
    this.addBanner();
    this.addDecorations();
    this.addProps();
    this.npcs.spawnAll(this.world.npcs, this.world);
    this.audio?.setBgm(mapDef.bgm ?? null);
    this.drivingCar = false;
    this.carCameraChase = true;
    this.chaseCamInitialized = false;
    this.player?.setExternalDrive(false);
    this.player?.setEyeHeightOverride(null);
    if (this.player) this.player.rig.setDrivingMode(false);
    this.setCabinOccludersVisible(true);
    this.audio?.stopCarEngine();

    this.weapon?.setWorld(this.world);
    this.enemies?.setWorld(this.world);
    this.player?.setWorld(this.world);

    if (mapDef.id === 'bali' && this.player) {
      this.setActiveWeapon('banana');
    } else if (this.activeWeapon === 'banana' && this.player) {
      this.setActiveWeapon('pistol');
    }
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
    this.treasureChestMesh = null;
    this.bali.setTreasureDiscovered(false);
    this.bali.setBananaTreeMesh(null);
    this.plasmaTvMesh = null;
    this.plasmaTvOn = false;
    this.tvSlideshow.dispose();
    this.tvSlideshow = new TvSlideshow();
    this.balloons.clear();
    if (this.world.props.length > 0) {
      const props = buildProps(this.world.props);
      this.worldGroup.add(props);
      this.balloons.registerFromScene(props);
      props.traverse((child) => {
        if (child.name === 'eating-cat') this.mapSkip.setCatMesh(child);
        if (child.name === 'suzy-cat') this.wedding.setSuzyCatMesh(child);
        if (child.name === 'lamborghini') this.lamborghiniMesh = child as THREE.Group;
        if (child.name === 'plasma-tv') this.plasmaTvMesh = child as THREE.Group;
        if (child.name === 'giant-banana-tree') this.bali.setBananaTreeMesh(child);
      });
    }
    if (this.world.theaterSeats.length > 0) {
      this.worldGroup.add(buildTheaterSeats(this.world.theaterSeats));
    }
    this.setPlasmaTvPower(false);
    this.initLamborghiniFromWorld();
  }

  private initLamborghiniFromWorld(): void {
    this.drivingCar = false;
    this.carCameraChase = true;
    this.chaseCamInitialized = false;
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
    this.hud.setMuted(this.settings.muted);
    if (!this.settings.muted) {
      if (this.state === 'menu') {
        this.audio.setBgm('menu-peace');
      } else if (this.state === 'playing' || this.state === 'paused') {
        const bgm = MAPS[this.mapIndex]?.bgm ?? null;
        if (bgm) this.audio.setBgm(bgm);
      }
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
    this.startMenuMusic();
  }

  private startMenuMusic(): void {
    this.audio.ensureStarted();
    if (!this.settings.muted) {
      this.audio.setBgm('menu-peace');
    }
  }

  private playMenuClick(): void {
    this.audio.ensureStarted();
    this.audio.play('ui-click');
  }

  private resumeBgmAfterUnmute(): void {
    if (this.state === 'menu') {
      this.audio.setBgm('menu-peace');
      return;
    }
    if (this.state !== 'playing' && this.state !== 'paused') return;

    if (MAPS[this.mapIndex]?.id === 'wedding-hall' && this.levelState.phase === 'celebration') {
      this.audio.setBgm('wedding-celebration');
      return;
    }

    const bgm = MAPS[this.mapIndex]?.bgm ?? null;
    if (bgm) this.audio.setBgm(bgm);
  }

  private handlePlayerFall(): void {
    if (this.state !== 'playing') return;
    if (this.cheatGodMode) return;
    this.anxiety.add(8);
    this.hud.flashDamage();
    this.audio.play('hurt');
  }

  private toggleMute(): void {
    this.audio.ensureStarted();
    this.settings.muted = this.audio.toggleMuted();
    saveSettings(this.settings);
    this.hud.setMuted(this.settings.muted);
    if (this.pause.isVisible()) this.pause.show(this.settings);
    if (!this.settings.muted) {
      this.resumeBgmAfterUnmute();
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

    if (
      (this.state === 'menu' || this.state === 'playing' || this.state === 'paused') &&
      this.input.consumeMute()
    ) {
      this.toggleMute();
    }

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
          const handler = this.celebrationWinHandler;
          this.celebrationWinHandler = null;
          if (handler) handler();
          else this.showFinalWinScreen();
        }
      }

      if (this.input.consumePause()) {
        this.enterPause();
      }

      this.enemies.update(dt, this.player.position);
      this.enemyAmbience.tick(
        dt,
        this.enemies.enemies,
        this.player.position,
        this.audio,
        this.state === 'playing' && this.levelState.phase !== 'celebration',
      );
      this.npcs.update(dt, this.world, this.world.interactables);
      this.enemyProjectiles.update(dt, this.player.position, this.world, (amount) => {
        this.anxiety.add(amount);
        this.hud.flashDamage();
        this.audio.play('hurt');
      });
      this.anxiety.update(dt, true);
      this.tickLevel(dt);
      this.mapSkip.tickMapSkipHint();
      this.mapSkip.tickCat(dt);
      this.mapSkip.tickPiano();
      this.wedding.tickAltar();
      this.wedding.tickWeddingNpc();
      this.dubai.tickExplore();
      if (this.plasmaTvOn) this.tvSlideshow.update(dt);
      this.wedding.tickSuzyCat(dt);
      this.wedding.tickCake();
      this.bali.tickTreasure(this.treasureChestMesh !== null);
      this.bali.tickBananaTree(dt);

      if (this.flashWarningTimer > 0) {
        this.flashWarningTimer -= dt;
        if (this.flashWarningTimer <= 0) this.hud.setSubtitle([]);
      }

      if (active && this.levelState.phase !== 'celebration') {
        if (MAPS[this.mapIndex].id === 'bali' || this.lightsaberMode) {
          this.input.consumeWeaponSelect();
          this.input.consumeWeaponScroll();
        } else {
          const requested = this.input.consumeWeaponSelect();
          if (requested !== null) this.setActiveWeapon(WEAPON_ORDER[requested]);
          const wheel = this.input.consumeWeaponScroll();
          if (wheel !== 0) this.cycleWeapon(wheel);
        }
      }

      if (
        active &&
        this.levelState.phase !== 'celebration' &&
        this.input.consumeFire()
      ) {
        const origin = this.player.getEyePosition();
        const dir = this.player.getAimDirection();
        const muzzle = this.player.rig.getMuzzleWorldPosition();
        const result = this.weapon.fire(
          this.activeWeapon,
          origin,
          dir,
          muzzle,
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

    const mapDef = MAPS[this.mapIndex];
    const exploreMode =
      mapDef.explorationOnly || this.levelState.phase === 'celebration' || this.drivingCar;

    this.hud.update({
      mode: exploreMode ? 'explore' : 'combat',
      anxietyPercent: this.anxiety.percent,
      mapName: mapDef.shortName,
      mapIndex: this.mapIndex + 1,
      totalMaps: MAPS.length,
      level: this.levelIndex + 1,
      totalLevels: mapDef.levels.length,
      overallStage: this.stagesCleared + 1,
      totalStages: totalLevelCount(),
      score: this.score,
      enemiesLeft: Math.max(
        0,
        this.levelState.level.totalEnemies + this.extraEnemiesRequired - this.levelState.killedTotal,
      ),
      reloadRatio: exploreMode ? 0 : this.weapon.cooldownRatio(),
      weaponName: this.player.rig.isCelebrationMode()
        ? HUD_LABELS.bouquet
        : this.player.rig.isMoneyMode()
          ? HUD_LABELS.money
          : WEAPONS[this.activeWeapon].displayName,
      bossHpRatio: exploreMode ? null : this.getBossHpRatio(),
      bossLabel: ENEMY_STATS['beklenti-golgesi'].displayName,
    });
  }

  private advanceStageAfterSkip(): void {
    const currentMap = MAPS[this.mapIndex];
    const isLastMap = this.mapIndex >= MAPS.length - 1;

    // Count remaining levels in this map as cleared (including the current one)
    const levelsLeftInMap = currentMap.levels.length - this.levelIndex;
    this.stagesCleared += levelsLeftInMap;
    this.mapSkip.resetSkipFlagsAfterAdvance();

    if (isLastMap) {
      this.transitionToWin();
      return;
    }

    const fromMapId = currentMap.id;
    this.mapIndex += 1;
    this.levelIndex = 0;
    this.loadMap(this.mapIndex);
    this.anxiety.reduce(25);
    this.player.respawn();

    const nextMap = MAPS[this.mapIndex];
    this.state = 'map-intro';
    this.dialogue.show({
      title: `Yeni Harita: ${nextMap.displayName}`,
      body: this.buildMapIntroBody(nextMap, fromMapId),
      continueLabel: 'Yolculuğa Başla',
      onContinue: () => this.beginLevel(this.mapIndex, 0, { skipDialogue: true }),
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
      case 'dugunsalonu':
        return this.teleportToMap('wedding-hall', 0);
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
    this.celebrationWinHandler = null;
    this.pendingBossPhase = null;
    this.bossCinematicEnemy = null;
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

  private enterWeddingEpilogue(): void {
    this.menu.hide();
    this.state = 'playing';
    this.levelState.phase = 'celebration';
    this.wedding.resetForLevel();
    this.player.rig.setCelebrationMode(true);
    this.hud.show();
    this.hud.setCrosshairVisible(false);
    this.hud.setInteractPrompt(null);
    this.hud.setSubtitle([]);
    this.anxiety.lockAtZero();
    this.startWeddingCelebrationMusic();
    this.input.requestPointerLock();
  }

  private showBaliWinScreen(message?: string): void {
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
      message: message ?? WIN_MESSAGES.baliFinaleBody,
      onContinuePlaying: () => this.enterBaliEpilogue(),
    });
  }

  private enterBaliEpilogue(): void {
    this.menu.hide();
    this.state = 'playing';
    this.startBaliTreasureHunt();
    this.input.requestPointerLock();
  }

  unlockBaliTreasureHunt(): void {
    if (MAPS[this.mapIndex]?.id !== 'bali') return;
    if (this.levelState.phase === 'celebration') return;
    this.startBaliTreasureHunt();
    this.hud.setSubtitle([BALI_TREASURE_MESSAGES.hint]);
  }

  private startBaliTreasureHunt(): void {
    this.levelState.phase = 'celebration';
    this.bali.setTreasureDiscovered(false);
    this.player.rig.setCelebrationMode(false);
    this.hud.show();
    this.hud.setCrosshairVisible(true);
    this.hud.setInteractPrompt(null);
    this.anxiety.lockAtZero();
    this.enemies.clear();
    this.enemyProjectiles.clear();
    this.spawnAmbientFauna();
    this.spawnBaliTreasureChest();
    this.audio.setBgm(MAPS[this.mapIndex].bgm ?? null);
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

  private drivingInteractPrompt(): string {
    return `${LAMBO_DRIVE_MESSAGES.exitPrompt}  ·  ${LAMBO_DRIVE_MESSAGES.turbo}  ·  ${LAMBO_DRIVE_MESSAGES.cameraToggle}`;
  }

  private applyCarCameraMode(): void {
    if (this.carCameraChase) {
      this.player.setEyeHeightOverride(null);
      this.setCabinOccludersVisible(true);
      this.player.rig.setDrivingMode(true, 'chase');
      this.chaseCamInitialized = false;
    } else {
      this.carPitch = CAR_DEFAULT_PITCH;
      this.player.setEyeHeightOverride(CAR_EYE_HEIGHT);
      this.setCabinOccludersVisible(false);
      this.player.rig.setDrivingMode(true, 'fps');
      this.player.position.set(this.carX, this.carY, this.carZ);
      this.player.setViewAngles(this.carYaw, this.carPitch);
    }
  }

  private updateChaseCamera(dt: number): void {
    const turboBlend = this.carTurbo.getBlend();
    const chaseDist = CHASE_DISTANCE + turboBlend * 1.8;
    const chaseHeight = CHASE_HEIGHT + turboBlend * 0.35;
    // Forward is (-sin(yaw), 0, -cos(yaw)); camera sits behind + above the car.
    this.chaseIdealPos.set(
      this.carX + Math.sin(this.carYaw) * chaseDist,
      this.carY + chaseHeight,
      this.carZ + Math.cos(this.carYaw) * chaseDist,
    );

    if (!this.chaseCamInitialized) {
      this.chaseCamPos.copy(this.chaseIdealPos);
      this.chaseCamInitialized = true;
    } else {
      const t = 1 - Math.exp(-CHASE_SMOOTH * dt);
      this.chaseCamPos.lerp(this.chaseIdealPos, t);
    }

    this.chaseLookAt.set(
      this.carX - Math.sin(this.carYaw) * CHASE_LOOK_AHEAD,
      this.carY + CHASE_LOOK_HEIGHT,
      this.carZ - Math.cos(this.carYaw) * CHASE_LOOK_AHEAD,
    );

    this.player.camera.position.copy(this.chaseCamPos);
    this.player.camera.lookAt(this.chaseLookAt);
  }

  private enterCarDrive(): void {
    if (!this.lamborghiniMesh) return;
    this.drivingCar = true;
    this.carSpeed = 0;
    this.carPitch = CAR_DEFAULT_PITCH;
    this.carCameraChase = true;
    this.chaseCamInitialized = false;
    this.player.setExternalDrive(true);
    this.snapCarToGround();
    this.player.position.set(this.carX, this.carY, this.carZ);
    this.applyCarCameraMode();
    this.hud.setCrosshairVisible(false);
    this.hud.setInteractPrompt(this.drivingInteractPrompt());
    this.audio.ensureStarted();
    this.audio.startCarEngine();
    if (this.lamborghiniMesh) this.carTurbo.attach(this.lamborghiniMesh);
  }

  private exitCarDrive(): void {
    this.drivingCar = false;
    this.carSpeed = 0;
    this.carCameraChase = true;
    this.chaseCamInitialized = false;
    this.carTurbo.detach();
    this.player.camera.fov = 75;
    this.player.camera.updateProjectionMatrix();
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
    if (active && this.input.consumeCameraToggle()) {
      this.carCameraChase = !this.carCameraChase;
      this.applyCarCameraMode();
      this.hud.setInteractPrompt(this.drivingInteractPrompt());
    }

    if (active) {
      const { dx, dy } = this.input.consumeMouseDelta();
      if (!this.carCameraChase) {
        const sens = this.player.getMouseSensitivity();
        this.carYaw -= dx * sens;
        this.carPitch -= dy * sens;
        if (this.carPitch > CAR_MAX_PITCH) this.carPitch = CAR_MAX_PITCH;
        if (this.carPitch < CAR_MIN_PITCH) this.carPitch = CAR_MIN_PITCH;
      }

      const wishForward = this.input.isDown('forward') ? 1 : 0;
      const wishBack = this.input.isDown('back') ? 1 : 0;
      const throttle = wishForward - wishBack;
      const turboWanted =
        this.input.isDown('sprint') && throttle > 0 && this.carSpeed > 0.2;
      const maxSpeed = turboWanted ? CAR_TURBO_MAX_SPEED : CAR_MAX_SPEED;
      const drag = turboWanted ? CAR_TURBO_DRAG : CAR_DRAG;

      if (throttle !== 0) {
        const accel = CAR_ACCEL * (turboWanted ? CAR_TURBO_ACCEL_MUL : 1);
        this.carSpeed += throttle * accel * dt;
      } else {
        this.carSpeed *= Math.max(0, 1 - drag * dt);
      }

      if (this.carSpeed > maxSpeed) this.carSpeed = maxSpeed;
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
    if (this.carCameraChase) {
      this.updateChaseCamera(dt);
    } else {
      this.player.setViewAngles(this.carYaw, this.carPitch);
    }
    this.syncLamborghiniMesh();

    const turboActive =
      active &&
      this.input.isDown('sprint') &&
      this.carSpeed > 0.5 &&
      this.input.isDown('forward');
    this.carTurbo.update(
      dt,
      this.player.camera,
      turboActive,
      this.carSpeed,
      this.scene,
    );
    const turboBlend = this.carTurbo.getBlend();

    this.player.rig.update(dt, Math.abs(this.carSpeed) > 0.5, this.carSpeed, turboBlend);
    this.audio.updateCarEngine(
      Math.abs(this.carSpeed) / CAR_TURBO_MAX_SPEED,
      turboBlend,
    );
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

    this.intentionalUnlock = true;
    this.input.releasePointerLock();
    this.hud.setCrosshairVisible(false);

    // Between levels: one scenario popup only (next level intro) — skip the
    // generic "Level X tamamlandı" dialogue so players aren't hit twice.
    if (!isLastLevelInMap) {
      this.beginLevel(this.mapIndex, this.levelIndex + 1);
      return;
    }

    const level = this.levelState.level;
    this.state = 'transition';
    this.dialogue.show({
      title: level.title,
      body: level.clearMessage,
      continueLabel: 'Yeni Yolculuk',
      onContinue: () => this.transitionToNextMap(),
    });
  }

  private transitionToNextMap(): void {
    const currentMap = MAPS[this.mapIndex];
    const nextMapIndex = this.mapIndex + 1;
    const nextMap = MAPS[nextMapIndex];
    this.state = 'map-intro';
    this.dialogue.show({
      title: `Yeni Harita: ${nextMap.displayName}`,
      body: this.buildMapIntroBody(nextMap, currentMap.id),
      continueLabel: 'Yolculuğa Başla',
      onContinue: () => {
        this.mapIndex = nextMapIndex;
        this.levelIndex = 0;
        this.loadMap(nextMapIndex);
        this.anxiety.reduce(25);
        this.player.respawn();
        this.beginLevel(this.mapIndex, 0, { skipDialogue: true });
      },
    });
  }

  private buildMapIntroBody(
    mapDef: (typeof MAPS)[number],
    fromMapId?: MapId,
  ): string {
    const bridge = fromMapId
      ? MAP_BRIDGE_MESSAGES[`${fromMapId}->${mapDef.id}`]
      : undefined;
    const firstIntro = mapDef.levels[0]?.intro;
    const base = firstIntro ? `${mapDef.description}\n\n${firstIntro}` : mapDef.description;
    return bridge ? `${bridge}\n\n${base}` : base;
  }

  private beginLevel(
    mapIndex: number,
    levelIndex: number,
    options?: { skipDialogue?: boolean },
  ): void {
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
    this.wedding.resetForLevel();
    this.extraEnemiesRequired = 0;
    this.bossCinematicPlayed.clear();
    this.enemyProjectiles.clear();
    this.hud.setCrosshairVisible(false);
    if (levelIndex === 0) this.player.respawn();

    if (levelIndex > 0) this.anxiety.reduce(10);

    if (options?.skipDialogue) {
      this.activateLevel();
      return;
    }

    const breatherKey = `${mapDef.id}-${level.index}`;
    const breatherLine = LEVEL_BREATHER_MESSAGES[breatherKey];
    const introBody = levelIndex > 0
      ? `${level.intro}\n\n${WAVE_TRANSITION_LABELS.breatherBody}${breatherLine ? ` ${breatherLine}` : ''}`
      : level.intro;

    this.dialogue.show({
      title: level.title,
      body: introBody,
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
    if (mapDef.id === 'bali') {
      this.setActiveWeapon('banana');
    }
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

  private handleEnemyFlash(enemy: Enemy): void {
    this.effects.spawnCameraFlash(enemy.getFlashLensWorldPosition());
    this.hud.flashCamera();
    this.audio.play('camera-shutter');
    if (this.cheatGodMode) return;
    this.anxiety.add(12);
    this.flashWarningTimer = 1.2;
    this.hud.setSubtitle(['Flaş!']);
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

    const text = phase === 2 ? BOSS_PHASE_MESSAGES.phase2 : BOSS_PHASE_MESSAGES.phase3;
    const hint = phase === 2 ? BOSS_PHASE_MESSAGES.hint2 : BOSS_PHASE_MESSAGES.hint3;
    const durationMs = phase === 2 ? 2800 : 2000;
    this.bossCinematic.show(text, durationMs, () => this.finishBossCinematic());
    this.hud.setSubtitle([hint]);
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

  private createInteractionHost(): InteractionHost {
    const game = this;
    return {
      get mapIndex() {
        return game.mapIndex;
      },
      get levelIndex() {
        return game.levelIndex;
      },
      get levelState() {
        return game.levelState;
      },
      get state() {
        return game.state as InteractionGameState;
      },
      get world() {
        return game.world;
      },
      get input() {
        return game.input;
      },
      get player() {
        return game.player;
      },
      get hud() {
        return game.hud;
      },
      get dialogue() {
        return game.dialogue;
      },
      get audio() {
        return game.audio;
      },
      get anxiety() {
        return game.anxiety;
      },
      get enemies() {
        return game.enemies;
      },
      get effects() {
        return game.effects;
      },
      getMapId: () => MAPS[game.mapIndex].id,
      isNearInteractable: (item) => game.isNearInteractable(item),
      setState: (state) => {
        game.state = state;
      },
      setIntentionalUnlock: (value) => {
        game.intentionalUnlock = value;
      },
      advanceStageAfterSkip: () => game.advanceStageAfterSkip(),
      transitionToBaliHoneymoon: () => game.transitionToBaliHoneymoon(),
      transitionToDubai: () => game.transitionToDubai(),
      returnToMainMenu: () => game.returnToMainMenu(),
      beginLevel: (mapIndex, levelIndex) => game.beginLevel(mapIndex, levelIndex),
      loadMap: (mapIndex) => game.loadMap(mapIndex),
      respawnPlayer: () => game.player.respawn(),
      requestPointerLock: () => game.input.requestPointerLock(),
      releasePointerLock: () => game.input.releasePointerLock(),
      findInteractable: (kind) => game.world.interactables.find((item) => item.kind === kind),
      unlockBaliTreasureHunt: () => game.unlockBaliTreasureHunt(),
    };
  }

  private createDubaiCarHost(): DubaiCarHost {
    const game = this;
    return {
      isDriving: () => game.drivingCar,
      enterDrive: () => game.enterCarDrive(),
      exitDrive: () => game.exitCarDrive(),
      isTvOn: () => game.plasmaTvOn,
      setTvPower: (on) => game.setPlasmaTvPower(on),
      isLamboInteractArmed: () => game.lamboInteractArmed,
      armLamboInteract: () => {
        game.lamboInteractArmed = true;
      },
      disarmLamboInteract: () => {
        game.lamboInteractArmed = false;
      },
      flushInteract: () => game.input.flushInteract(),
    };
  }

  private isNearInteractable(item: { x: number; z: number; radius?: number }): boolean {
    const dx = this.player.position.x - item.x;
    const dz = this.player.position.z - item.z;
    return Math.sqrt(dx * dx + dz * dz) <= (item.radius ?? 2.5);
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

  private startRun(): void {
    this.audio.ensureStarted();
    this.pause.hide();
    this.stagesCleared = 0;
    this.score = 0;
    this.mapIndex = 0;
    this.levelIndex = 0;
    this.mapSkip.resetForNewRun();
    this.wedding.resetForNewRun();
    this.bali.resetForNewRun();
    this.dubai.resetForNewRun();
    this.player.rig.setCelebrationMode(false);
    this.bossCinematicPlayed.clear();
    this.pendingFinalWin = false;
    this.finalWinDelay = 0;
    this.celebrationWinHandler = null;
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
      body: this.buildMapIntroBody(firstMap),
      continueLabel: 'Yolculuğa Başla',
      onContinue: () => this.beginLevel(0, 0, { skipDialogue: true }),
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
