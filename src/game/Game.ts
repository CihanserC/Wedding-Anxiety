import * as THREE from 'three';
import { InputManager } from '../input/InputManager';
import { createLighting, type SceneLighting } from '../rendering/Lighting';
import { HUD } from '../ui/HUD';
import { MenuScreen } from '../ui/MenuScreen';
import { DialogueBox } from '../ui/DialogueBox';
import { CAT_FEED_MESSAGES, PIANO_PLAY_MESSAGES, ALTAR_MESSAGES, CAKE_MESSAGES, SUZY_CAT_MESSAGES, HUD_LABELS, WEDDING_NPC_MESSAGES, WIN_MESSAGES } from '../data/messages';
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
import { buildProps, updateEatingCat } from '../rendering/MapProps';
import { updateSuzyCatIdle } from '../rendering/SuzyCat';
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
    this.npcs.spawnAll(this.world.npcs);
    this.audio?.setBgm(mapDef.bgm ?? null);
    this.catFed = false;
    this.pianoPlayed = false;
    this.pianoInteractArmed = false;
    this.catInteractArmed = false;

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
    this.balloons.clear();
    if (this.world.props.length === 0) return;
    const props = buildProps(this.world.props);
    this.worldGroup.add(props);
    this.balloons.registerFromScene(props);
    props.traverse((child) => {
      if (child.name === 'eating-cat') this.catMesh = child;
      if (child.name === 'suzy-cat') this.suzyCatMesh = child;
    });
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

    this.player.update(dt, active);
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
      this.tickSuzyCatInteraction(dt);
      this.tickCakeInteraction();

      if (active && this.levelState.phase !== 'celebration') {
        const requested = this.input.consumeWeaponSelect();
        if (requested !== null) this.setActiveWeapon(WEAPON_ORDER[requested]);
        const wheel = this.input.consumeWeaponScroll();
        if (wheel !== 0) this.cycleWeapon(wheel);
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
          this.audio.play(this.activeWeapon === 'happiness' ? 'laser' : 'shoot');
          this.player.rig.onFire(result.recoil);
          for (const entry of result.balloonHits) {
            this.balloons.pop(entry, (pos, color) => {
              this.effects.spawnBalloonPop(pos, color);
              this.audio.play('balloon-pop');
            });
          }
          if (result.hitEnemy) this.audio.play('hit');
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
      continueLabel: 'Devam Et',
      onContinue: () => {
        this.weddingChatNpc = null;
        if (this.state === 'playing' && this.levelState.phase === 'celebration') {
          this.hud.setCrosshairVisible(true);
          this.input.requestPointerLock();
        }
      },
    });
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
    this.audio.stopBgm();
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
      case 'baloncu':
        this.cheatPopAllBalloons();
        return null;
      case 'help':
        return { help: getCheatHelpEditorText() };
      default:
        return 'Komut bulunamadı';
    }
  }

  private resetCheatState(): void {
    this.cheatGodMode = false;
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
    this.audio.setBgm(MAPS[this.mapIndex].bgm ?? null);
    this.input.requestPointerLock();
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
    this.levelState.phase = 'active';
    this.levelState.timer = 2.5;
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

  /** Wedding hall: when the gold boss dies, wipe the rest of the wave. */
  private handleBossKillCascade(killed: Enemy): void {
    if (MAPS[this.mapIndex].id !== 'wedding-hall' || !killed.stats.isBoss) return;

    const isFinalBoss = this.levelIndex >= MAPS[this.mapIndex].levels.length - 1;
    if (isFinalBoss) this.anxiety.lockAtZero();

    this.enemies.forceKillAllExcept(killed);
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
