/**
 * Procedural Web Audio SFX + optional map background music.
 * Mozart Allegro uses a simplified Eine kleine Nachtmusik theme loop
 * (public-domain melody) when no external mp3 is present.
 */

type Sfx =
  | 'shoot'
  | 'laser'
  | 'hit'
  | 'kill'
  | 'wave-clear'
  | 'hurt'
  | 'win'
  | 'lose'
  | 'balloon-pop'
  | 'meow'
  | 'ui-click'
  | 'camera-shutter';
export type BgmId =
  | 'menu-peace'
  | 'mozart-allegro'
  | 'lighthouse-ambient'
  | 'wedding-hope'
  | 'wedding-celebration'
  | 'bali-tropical'
  | 'dubai-luxury'
  | 'space-calm'
  | null;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = false;
  private sfxVolume = 0.35;
  private musicVolume = 0.12;
  private bgmId: BgmId = null;
  private bgmTimer: number | null = null;
  private bgmHtml: HTMLAudioElement | null = null;
  private bgmNoteIndex = 0;
  private blasterBuffer: AudioBuffer | null = null;
  private blasterLoadPromise: Promise<void> | null = null;
  private monkeyBuffer: AudioBuffer | null = null;
  private monkeyLoadPromise: Promise<void> | null = null;
  private lightsaberHitBuffer: AudioBuffer | null = null;
  private lightsaberHoldBuffer: AudioBuffer | null = null;
  private lightsaberLoadPromise: Promise<void> | null = null;
  private lightsaberHoldSource: AudioBufferSourceNode | null = null;
  private lightsaberHoldGain: GainNode | null = null;
  private lightsaberHoldWanted = false;
  private lightsaberHoldResumeTimer: number | null = null;
  private readonly lightsaberHoldPeak = 0.14;

  private carEngineWanted = false;
  private carEngineGain: GainNode | null = null;
  private carEngineOscLow: OscillatorNode | null = null;
  private carEngineOscHigh: OscillatorNode | null = null;
  private carEngineNoise: AudioBufferSourceNode | null = null;
  private carEngineFilter: BiquadFilterNode | null = null;
  private carEngineSpeed = 0;
  private carEngineTurbo = 0;

  private heliRotorWanted = false;
  private heliRotorGain: GainNode | null = null;
  private heliRotorNoise: AudioBufferSourceNode | null = null;
  private heliRotorThump: OscillatorNode | null = null;
  private heliRotorThumpGain: GainNode | null = null;
  private heliRotorWhine: OscillatorNode | null = null;
  private heliRotorFilter: BiquadFilterNode | null = null;
  private heliRotorLfo: OscillatorNode | null = null;
  private heliRotorLfoGain: GainNode | null = null;
  private heliRotorIntensity = 0;

  ensureStarted(): void {
    if (this.ctx) return;
    try {
      const AC: typeof AudioContext =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.35;
      this.masterGain.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.12;
      this.musicGain.connect(this.ctx.destination);
      void this.loadBlasterSound();
      void this.loadMonkeySound();
      void this.loadLightsaberSounds();
    } catch {
      this.ctx = null;
    }
    if (this.ctx?.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyVolumes();
    if (!muted) {
      this.ensureBgmLoopAlive();
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = volume;
    this.applyVolumes();
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = volume;
    this.applyVolumes();
  }

  isMuted(): boolean {
    return this.muted;
  }

  toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /** Restart procedural BGM if the loop died while muted (e.g. legacy sessions). */
  private ensureBgmLoopAlive(): void {
    const id = this.bgmId;
    if (!id) return;
    if (this.bgmHtml) {
      void this.bgmHtml.play().catch(() => {});
      return;
    }
    if (this.bgmTimer !== null) return;
    this.startBgmImmediate(id);
  }

  private applyVolumes(): void {
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.sfxVolume;
    }
    if (this.musicGain) {
      this.musicGain.gain.value = this.muted ? 0 : this.musicVolume;
    }
    if (this.bgmHtml) this.bgmHtml.muted = this.muted;
    if (this.lightsaberHoldGain) {
      this.lightsaberHoldGain.gain.value = this.muted ? 0 : this.lightsaberHoldPeak;
    }
    if (this.carEngineGain && this.carEngineWanted) {
      this.carEngineGain.gain.value = this.muted ? 0 : this.carEngineTargetGain(this.carEngineSpeed, this.carEngineTurbo);
    }
    if (this.heliRotorGain && this.heliRotorWanted) {
      this.heliRotorGain.gain.value = this.muted
        ? 0
        : this.heliRotorTargetGain(this.heliRotorIntensity);
    }
  }

  play(sfx: Sfx): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    switch (sfx) {
      case 'shoot':
        this.playShoot();
        break;
      case 'laser':
        this.playLaser();
        break;
      case 'hit':
        this.playHit();
        break;
      case 'kill':
        this.playKill();
        break;
      case 'wave-clear':
        this.playWaveClear();
        break;
      case 'hurt':
        this.playHurt();
        break;
      case 'win':
        this.playWin();
        break;
      case 'lose':
        this.playLose();
        break;
      case 'balloon-pop':
        this.playBalloonPop();
        break;
      case 'meow':
        this.playMeow();
        break;
      case 'ui-click':
        this.playUiClick();
        break;
      case 'camera-shutter':
        this.playCameraShutter();
        break;
    }
  }

  /**
   * Deep, unsettling enemy growl. `pitch` scales base frequency
   * (lower = thicker; e.g. merakli-teyze ~0.75, maymun ~1.15).
   */
  playEnemyGrowl(pitch = 1): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const p = Math.max(0.4, Math.min(2.2, pitch));
    const base = (72 + Math.random() * 18) * p;
    const duration = 0.38 + Math.random() * 0.12;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(28, base * 0.55), now + duration);
    oscGain.gain.setValueAtTime(0.0001, now);
    oscGain.gain.linearRampToValueAtTime(0.38, now + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(420 * p, now);
    filter.frequency.exponentialRampToValueAtTime(180 * p, now + duration);
    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(base * 0.5, now);
    osc2.frequency.exponentialRampToValueAtTime(Math.max(22, base * 0.28), now + duration * 0.9);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.linearRampToValueAtTime(0.16, now + 0.015);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.95);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now);
    osc2.stop(now + duration + 0.05);

    this.noiseBurst(duration * 0.85, 380 * p, 0.14);
  }

  /** Short piano note for map-skip interaction. */
  playPianoNote(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(392, t);
    osc.frequency.exponentialRampToValueAtTime(330, t + 0.35);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  /** Start / swap / stop map background music with a short crossfade. */
  setBgm(id: BgmId): void {
    if (id === this.bgmId) return;
    this.crossfadeToBgm(id);
  }

  private crossfadeToBgm(id: BgmId): void {
    if (!this.ctx || !this.musicGain) {
      this.stopBgm();
      if (id && !this.muted) this.startBgmImmediate(id);
      return;
    }

    const gain = this.musicGain.gain;
    const now = this.ctx.currentTime;
    const fadeOut = 0.35;
    const fadeIn = 0.45;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + fadeOut);

    window.setTimeout(() => {
      this.stopBgm();
      if (!id || this.muted) return;
      this.startBgmImmediate(id);
      if (!this.ctx || !this.musicGain) return;
      const t = this.ctx.currentTime;
      this.musicGain.gain.cancelScheduledValues(t);
      this.musicGain.gain.setValueAtTime(0, t);
      this.musicGain.gain.linearRampToValueAtTime(this.musicVolume, t + fadeIn);
    }, Math.ceil(fadeOut * 1000) + 20);
  }

  private startBgmImmediate(id: BgmId): void {
    if (!id || this.muted) return;
    this.ensureStarted();
    this.bgmId = id;

    if (id === 'menu-peace') {
      this.startMenuPeace();
    } else if (id === 'mozart-allegro') {
      this.tryExternalMozart().catch(() => this.startMozartLoop());
    } else if (id === 'lighthouse-ambient') {
      this.startLighthouseAmbient();
    } else if (id === 'wedding-hope') {
      this.startWeddingHope();
    } else if (id === 'wedding-celebration') {
      this.startWeddingCelebration();
    } else if (id === 'bali-tropical') {
      this.startBaliTropical();
    } else if (id === 'dubai-luxury') {
      this.tryExternalDubaiArabicChiptune().catch(() => this.startDubaiLuxuryLoop());
    } else if (id === 'space-calm') {
      this.startSpaceCalm();
    }
  }

  stopBgm(): void {
    if (this.bgmTimer !== null) {
      window.clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmHtml) {
      this.bgmHtml.pause();
      this.bgmHtml.src = '';
      this.bgmHtml = null;
    }
    this.bgmNoteIndex = 0;
    this.bgmId = null;
  }

  private async tryExternalMozart(): Promise<void> {
    const url = `${import.meta.env.BASE_URL}mozart-allegro.mp3`;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.28;
    await new Promise<void>((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      audio.addEventListener('error', () => reject(new Error('no file')), { once: true });
      audio.load();
    });
    if (this.bgmId !== 'mozart-allegro') return;
    this.bgmHtml = audio;
    await audio.play();
  }

  private async tryExternalDubaiArabicChiptune(): Promise<void> {
    const url = `${import.meta.env.BASE_URL}${encodeURIComponent('Arabic Chiptune.mp3')}`;
    const audio = new Audio(url);
    audio.loop = true;
    audio.volume = 0.3;
    await new Promise<void>((resolve, reject) => {
      audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      audio.addEventListener('error', () => reject(new Error('no file')), { once: true });
      audio.load();
    });
    if (this.bgmId !== 'dubai-luxury') return;
    this.bgmHtml = audio;
    await audio.play();
  }

  /**
   * Simplified Eine kleine Nachtmusik K.525 Allegro opening theme in G major.
   * Melody only; recognizable classical vibe without needing an asset file.
   */
  private startMozartLoop(): void {
    if (!this.ctx || !this.musicGain || this.bgmId !== 'mozart-allegro') return;

    // Frequencies for the famous opening + continuation phrase
    const melody: Array<{ freq: number; beats: number }> = [
      { freq: 392.0, beats: 1 }, // G4
      { freq: 587.33, beats: 1 }, // D5
      { freq: 392.0, beats: 1 },
      { freq: 587.33, beats: 1 },
      { freq: 392.0, beats: 1 },
      { freq: 587.33, beats: 1 },
      { freq: 783.99, beats: 1.5 }, // G5
      { freq: 739.99, beats: 0.5 }, // F#5
      { freq: 659.25, beats: 0.5 }, // E5
      { freq: 587.33, beats: 0.5 }, // D5
      { freq: 523.25, beats: 0.5 }, // C5
      { freq: 493.88, beats: 0.5 }, // B4
      { freq: 440.0, beats: 0.5 }, // A4
      { freq: 392.0, beats: 1 }, // G4
      { freq: 493.88, beats: 1 }, // B4
      { freq: 523.25, beats: 1 }, // C5
      { freq: 587.33, beats: 2 }, // D5
      { freq: 0, beats: 0.5 }, // rest
      { freq: 587.33, beats: 0.5 },
      { freq: 659.25, beats: 0.5 },
      { freq: 698.46, beats: 0.5 }, // F5
      { freq: 783.99, beats: 1 },
      { freq: 698.46, beats: 0.5 },
      { freq: 659.25, beats: 0.5 },
      { freq: 587.33, beats: 1 },
      { freq: 523.25, beats: 1 },
      { freq: 493.88, beats: 1 },
      { freq: 440.0, beats: 1 },
      { freq: 392.0, beats: 2 },
      { freq: 0, beats: 1 },
    ];

    const beatMs = 220;
    const step = (): void => {
      if (this.bgmId !== 'mozart-allegro' || !this.ctx || !this.musicGain) return;
      const note = melody[this.bgmNoteIndex % melody.length];
      this.bgmNoteIndex++;
      if (!this.muted && note.freq > 0) this.playMusicNote(note.freq, (note.beats * beatMs) / 1000);
      this.bgmTimer = window.setTimeout(step, note.beats * beatMs);
    };
    step();
  }

  /** Calm, spacious arpeggios for the main menu. */
  private startMenuPeace(): void {
    if (!this.ctx || !this.musicGain || this.bgmId !== 'menu-peace') return;

    const melody: Array<{ freq: number; beats: number }> = [
      { freq: 261.63, beats: 3 },
      { freq: 329.63, beats: 3 },
      { freq: 392.0, beats: 3 },
      { freq: 493.88, beats: 4 },
      { freq: 392.0, beats: 3 },
      { freq: 329.63, beats: 3 },
      { freq: 261.63, beats: 5 },
      { freq: 0, beats: 2 },
      { freq: 293.66, beats: 3 },
      { freq: 369.99, beats: 3 },
      { freq: 440.0, beats: 3 },
      { freq: 523.25, beats: 4 },
      { freq: 440.0, beats: 3 },
      { freq: 369.99, beats: 3 },
      { freq: 293.66, beats: 5 },
      { freq: 0, beats: 3 },
      { freq: 246.94, beats: 4 },
      { freq: 311.13, beats: 4 },
      { freq: 369.99, beats: 4 },
      { freq: 466.16, beats: 5 },
      { freq: 369.99, beats: 4 },
      { freq: 311.13, beats: 4 },
      { freq: 246.94, beats: 6 },
      { freq: 0, beats: 4 },
    ];

    const beatMs = 540;
    const step = (): void => {
      if (this.bgmId !== 'menu-peace' || !this.ctx || !this.musicGain) return;
      const note = melody[this.bgmNoteIndex % melody.length];
      this.bgmNoteIndex++;
      if (!this.muted && note.freq > 0) this.playSoftMusicNote(note.freq, (note.beats * beatMs) / 1000);
      this.bgmTimer = window.setTimeout(step, note.beats * beatMs);
    };
    step();
  }

  /** Soft ocean-like ambient loop for the lighthouse map. */
  private startLighthouseAmbient(): void {
    if (!this.ctx || !this.musicGain || this.bgmId !== 'lighthouse-ambient') return;

    const melody: Array<{ freq: number; beats: number }> = [
      { freq: 196.0, beats: 2 },
      { freq: 220.0, beats: 2 },
      { freq: 246.94, beats: 2 },
      { freq: 220.0, beats: 2 },
      { freq: 196.0, beats: 2 },
      { freq: 174.61, beats: 2 },
      { freq: 0, beats: 1 },
      { freq: 164.81, beats: 2 },
      { freq: 196.0, beats: 2 },
      { freq: 220.0, beats: 4 },
      { freq: 0, beats: 2 },
    ];

    const beatMs = 480;
    const step = (): void => {
      if (this.bgmId !== 'lighthouse-ambient' || !this.ctx || !this.musicGain) return;
      const note = melody[this.bgmNoteIndex % melody.length];
      this.bgmNoteIndex++;
      if (!this.muted && note.freq > 0) this.playMusicNote(note.freq, (note.beats * beatMs) / 1000, 0.55);
      this.bgmTimer = window.setTimeout(step, note.beats * beatMs);
    };
    step();
  }

  /** Bright pentatonic-ish loop for the Bali honeymoon island. */
  private startBaliTropical(): void {
    if (!this.ctx || !this.musicGain || this.bgmId !== 'bali-tropical') return;

    const melody: Array<{ freq: number; beats: number }> = [
      { freq: 392.0, beats: 1 },
      { freq: 440.0, beats: 1 },
      { freq: 493.88, beats: 1 },
      { freq: 587.33, beats: 2 },
      { freq: 493.88, beats: 1 },
      { freq: 440.0, beats: 1 },
      { freq: 392.0, beats: 2 },
      { freq: 0, beats: 0.5 },
      { freq: 349.23, beats: 1 },
      { freq: 392.0, beats: 1 },
      { freq: 440.0, beats: 1 },
      { freq: 523.25, beats: 2 },
      { freq: 440.0, beats: 1 },
      { freq: 392.0, beats: 1 },
      { freq: 329.63, beats: 2 },
      { freq: 0, beats: 1 },
    ];

    const beatMs = 340;
    const step = (): void => {
      if (this.bgmId !== 'bali-tropical' || !this.ctx || !this.musicGain) return;
      const note = melody[this.bgmNoteIndex % melody.length];
      this.bgmNoteIndex++;
      if (!this.muted && note.freq > 0) this.playMusicNote(note.freq, (note.beats * beatMs) / 1000, 0.55);
      this.bgmTimer = window.setTimeout(step, note.beats * beatMs);
    };
    step();
  }

  /** Slow golden ambient for the Dubai luxury villa (procedural fallback). */
  private startDubaiLuxuryLoop(): void {
    if (!this.ctx || !this.musicGain || this.bgmId !== 'dubai-luxury') return;

    const melody: Array<{ freq: number; beats: number }> = [
      { freq: 196.0, beats: 2 },
      { freq: 246.94, beats: 2 },
      { freq: 293.66, beats: 2 },
      { freq: 392.0, beats: 3 },
      { freq: 293.66, beats: 2 },
      { freq: 246.94, beats: 2 },
      { freq: 220.0, beats: 2 },
      { freq: 196.0, beats: 3 },
      { freq: 0, beats: 1 },
      { freq: 233.08, beats: 2 },
      { freq: 293.66, beats: 2 },
      { freq: 349.23, beats: 2 },
      { freq: 440.0, beats: 3 },
      { freq: 349.23, beats: 2 },
      { freq: 293.66, beats: 2 },
      { freq: 246.94, beats: 4 },
      { freq: 0, beats: 2 },
    ];

    const beatMs = 420;
    const step = (): void => {
      if (this.bgmId !== 'dubai-luxury' || !this.ctx || !this.musicGain) return;
      const note = melody[this.bgmNoteIndex % melody.length];
      this.bgmNoteIndex++;
      if (!this.muted && note.freq > 0) this.playMusicNote(note.freq, (note.beats * beatMs) / 1000, 0.5);
      this.bgmTimer = window.setTimeout(step, note.beats * beatMs);
    };
    step();
  }

  /** Calm 8-bit loop for space flight. */
  private startSpaceCalm(): void {
    if (!this.ctx || !this.musicGain || this.bgmId !== 'space-calm') return;

    // Soft minor/pentatonic phrases with rests — slow chiptune ambience
    const melody: Array<{ freq: number; beats: number }> = [
      { freq: 196.0, beats: 2 }, // G3
      { freq: 233.08, beats: 2 }, // Bb3
      { freq: 261.63, beats: 2 }, // C4
      { freq: 311.13, beats: 3 }, // Eb4
      { freq: 261.63, beats: 2 },
      { freq: 233.08, beats: 2 },
      { freq: 196.0, beats: 3 },
      { freq: 0, beats: 2 },
      { freq: 174.61, beats: 2 }, // F3
      { freq: 196.0, beats: 2 },
      { freq: 233.08, beats: 2 },
      { freq: 293.66, beats: 3 }, // D4
      { freq: 233.08, beats: 2 },
      { freq: 196.0, beats: 2 },
      { freq: 174.61, beats: 4 },
      { freq: 0, beats: 3 },
      { freq: 155.56, beats: 2 }, // Eb3
      { freq: 196.0, beats: 2 },
      { freq: 233.08, beats: 3 },
      { freq: 261.63, beats: 2 },
      { freq: 233.08, beats: 2 },
      { freq: 196.0, beats: 4 },
      { freq: 0, beats: 4 },
    ];

    const beatMs = 600;
    const step = (): void => {
      if (this.bgmId !== 'space-calm' || !this.ctx || !this.musicGain) return;
      const note = melody[this.bgmNoteIndex % melody.length];
      this.bgmNoteIndex++;
      if (!this.muted && note.freq > 0) {
        this.playChiptuneNote(note.freq, (note.beats * beatMs) / 1000, 0.32);
      }
      this.bgmTimer = window.setTimeout(step, note.beats * beatMs);
    };
    step();
  }

  /** Warm ascending arpeggios for the wedding hall. */
  private startWeddingHope(): void {
    if (!this.ctx || !this.musicGain || this.bgmId !== 'wedding-hope') return;

    const melody: Array<{ freq: number; beats: number }> = [
      { freq: 261.63, beats: 1 },
      { freq: 329.63, beats: 1 },
      { freq: 392.0, beats: 1 },
      { freq: 523.25, beats: 2 },
      { freq: 392.0, beats: 1 },
      { freq: 329.63, beats: 1 },
      { freq: 293.66, beats: 1 },
      { freq: 261.63, beats: 2 },
      { freq: 0, beats: 0.5 },
      { freq: 349.23, beats: 1 },
      { freq: 440.0, beats: 1 },
      { freq: 523.25, beats: 1 },
      { freq: 659.25, beats: 2 },
      { freq: 523.25, beats: 1 },
      { freq: 440.0, beats: 1 },
      { freq: 392.0, beats: 3 },
      { freq: 0, beats: 1 },
    ];

    const beatMs = 300;
    const step = (): void => {
      if (this.bgmId !== 'wedding-hope' || !this.ctx || !this.musicGain) return;
      const note = melody[this.bgmNoteIndex % melody.length];
      this.bgmNoteIndex++;
      if (!this.muted && note.freq > 0) this.playMusicNote(note.freq, (note.beats * beatMs) / 1000, 0.7);
      this.bgmTimer = window.setTimeout(step, note.beats * beatMs);
    };
    step();
  }

  /** Bridal chorus loop — plays when the wedding hall boss is defeated. */
  private startWeddingCelebration(): void {
    if (!this.ctx || !this.musicGain || this.bgmId !== 'wedding-celebration') return;

    const melody: Array<{ freq: number; beats: number }> = [
      { freq: 493.88, beats: 1.5 },
      { freq: 659.25, beats: 1 },
      { freq: 659.25, beats: 1 },
      { freq: 739.99, beats: 1 },
      { freq: 830.61, beats: 1 },
      { freq: 659.25, beats: 1 },
      { freq: 830.61, beats: 1 },
      { freq: 659.25, beats: 1 },
      { freq: 830.61, beats: 1 },
      { freq: 659.25, beats: 2 },
      { freq: 987.77, beats: 1 },
      { freq: 987.77, beats: 1 },
      { freq: 987.77, beats: 1 },
      { freq: 830.61, beats: 1 },
      { freq: 659.25, beats: 1 },
      { freq: 739.99, beats: 1 },
      { freq: 830.61, beats: 2 },
      { freq: 0, beats: 1 },
    ];

    const beatMs = 360;
    const step = (): void => {
      if (this.bgmId !== 'wedding-celebration' || !this.ctx || !this.musicGain) return;
      const note = melody[this.bgmNoteIndex % melody.length];
      this.bgmNoteIndex++;
      if (!this.muted && note.freq > 0) this.playMusicNote(note.freq, (note.beats * beatMs) / 1000, 0.75);
      this.bgmTimer = window.setTimeout(step, note.beats * beatMs);
    };
    step();
  }

  private playMusicNote(freq: number, duration: number, peak = 0.9): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    // Soft classical-ish harmonic
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, now);
    gain2.gain.value = 0.25;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + Math.max(duration * 0.9, 0.08));

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc2.connect(gain2);
    gain2.connect(gain);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration + 0.05);
    osc2.stop(now + duration + 0.05);
  }

  private playSoftMusicNote(freq: number, duration: number, peak = 0.38): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 0.5, now);
    gain2.gain.value = 0.18;

    const attack = Math.min(0.35, duration * 0.25);
    const release = Math.max(duration * 0.85, 0.2);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + release);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc2.connect(gain2);
    gain2.connect(gain);
    osc.start(now);
    osc2.start(now);
    osc.stop(now + duration + 0.1);
    osc2.stop(now + duration + 0.1);
  }

  /** Soft square-wave note for calm 8-bit space ambience. */
  private playChiptuneNote(freq: number, duration: number, peak = 0.35): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    filter.Q.value = 0.6;

    const attack = 0.02;
    const release = Math.max(duration * 0.85, 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + release);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + duration + 0.08);
  }

  private envelope(gain: GainNode, attack: number, decay: number, peak = 1): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay);
  }

  private beep(freq: number, wave: OscillatorType, attack: number, decay: number, peak = 0.5, freqTarget?: number): void {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (freqTarget !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(freqTarget, 20),
        ctx.currentTime + attack + decay,
      );
    }
    osc.connect(gain);
    gain.connect(this.masterGain!);
    this.envelope(gain, attack, decay, peak);
    osc.start();
    osc.stop(ctx.currentTime + attack + decay + 0.05);
  }

  private noiseBurst(duration: number, filterFreq: number, peak = 0.4): void {
    const ctx = this.ctx!;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    this.envelope(gain, 0.005, duration, peak);
    src.start();
    src.stop(ctx.currentTime + duration + 0.05);
  }

  private playShoot(): void {
    this.beep(880, 'square', 0.005, 0.09, 0.35, 260);
    this.noiseBurst(0.06, 2400, 0.15);
  }

  /** Star Wars-style blaster — plays public/blaster-sound.mp3 (Mutluluk Işını). */
  private playLaser(): void {
    if (!this.ctx || !this.masterGain) return;
    if (this.blasterBuffer) {
      this.playBlasterBuffer();
      return;
    }
    void this.loadBlasterSound();
  }

  private playBlasterBuffer(): void {
    if (!this.ctx || !this.masterGain || !this.blasterBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.blasterBuffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.85;
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start();
  }

  private loadBlasterSound(): Promise<void> {
    if (this.blasterBuffer) return Promise.resolve();
    if (this.blasterLoadPromise) return this.blasterLoadPromise;
    this.blasterLoadPromise = (async () => {
      if (!this.ctx) return;
      const url = `${import.meta.env.BASE_URL}blaster-sound.mp3`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`blaster-sound fetch failed: ${res.status}`);
      const arr = await res.arrayBuffer();
      this.blasterBuffer = await this.ctx.decodeAudioData(arr.slice(0));
    })().catch(() => {
      this.blasterLoadPromise = null;
    });
    return this.blasterLoadPromise;
  }

  /** Monkey screech — public/monkey_sound.mp3, optional delay before play. */
  playMonkeyScreech(delayMs = 4000): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    if (!this.monkeyBuffer) {
      void this.loadMonkeySound().then(() => {
        if (this.monkeyBuffer) this.scheduleMonkeyScreech(delayMs);
      });
      return;
    }
    this.scheduleMonkeyScreech(delayMs);
  }

  private scheduleMonkeyScreech(delayMs: number): void {
    const play = () => this.playMonkeyBuffer();
    if (delayMs > 0) {
      window.setTimeout(play, delayMs);
    } else {
      play();
    }
  }

  private playMonkeyBuffer(): void {
    if (!this.ctx || !this.masterGain || this.muted || !this.monkeyBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.monkeyBuffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.9;
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start();
  }

  private loadMonkeySound(): Promise<void> {
    if (this.monkeyBuffer) return Promise.resolve();
    if (this.monkeyLoadPromise) return this.monkeyLoadPromise;
    this.monkeyLoadPromise = (async () => {
      if (!this.ctx) return;
      const url = `${import.meta.env.BASE_URL}monkey_sound.mp3`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`monkey_sound fetch failed: ${res.status}`);
      const arr = await res.arrayBuffer();
      this.monkeyBuffer = await this.ctx.decodeAudioData(arr.slice(0));
    })().catch(() => {
      this.monkeyLoadPromise = null;
    });
    return this.monkeyLoadPromise;
  }

  /** One-shot swing/hit — public/lightsaber-hit.mp3 */
  playLightsaberHit(): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    if (!this.lightsaberHitBuffer) {
      void this.loadLightsaberSounds();
      return;
    }
    this.pauseLightsaberHoldBriefly(180);
    const src = this.ctx.createBufferSource();
    src.buffer = this.lightsaberHitBuffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.85;
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start();
  }

  /** Soft looping idle hum while lightsaber mode is active. */
  startLightsaberHold(): void {
    this.lightsaberHoldWanted = true;
    this.clearLightsaberHoldResume();
    if (!this.ctx || !this.masterGain) {
      this.ensureStarted();
    }
    void this.loadLightsaberSounds().then(() => {
      if (this.lightsaberHoldWanted) this.beginLightsaberHoldLoop();
    });
  }

  stopLightsaberHold(): void {
    this.lightsaberHoldWanted = false;
    this.clearLightsaberHoldResume();
    this.endLightsaberHoldLoop();
  }

  /** Briefly mute the hold loop so the hit SFX is clear. */
  pauseLightsaberHoldBriefly(ms: number): void {
    if (!this.lightsaberHoldWanted) return;
    this.endLightsaberHoldLoop();
    this.clearLightsaberHoldResume();
    this.lightsaberHoldResumeTimer = window.setTimeout(() => {
      this.lightsaberHoldResumeTimer = null;
      if (this.lightsaberHoldWanted) this.beginLightsaberHoldLoop();
    }, ms);
  }

  private clearLightsaberHoldResume(): void {
    if (this.lightsaberHoldResumeTimer !== null) {
      window.clearTimeout(this.lightsaberHoldResumeTimer);
      this.lightsaberHoldResumeTimer = null;
    }
  }

  private beginLightsaberHoldLoop(): void {
    if (!this.ctx || !this.masterGain || !this.lightsaberHoldBuffer) return;
    if (this.lightsaberHoldSource) return;

    const src = this.ctx.createBufferSource();
    src.buffer = this.lightsaberHoldBuffer;
    src.loop = true;
    const gain = this.ctx.createGain();
    gain.gain.value = this.muted ? 0 : this.lightsaberHoldPeak;
    src.connect(gain);
    gain.connect(this.masterGain);
    src.start();
    this.lightsaberHoldSource = src;
    this.lightsaberHoldGain = gain;
    src.onended = () => {
      if (this.lightsaberHoldSource === src) {
        this.lightsaberHoldSource = null;
        this.lightsaberHoldGain = null;
      }
    };
  }

  private endLightsaberHoldLoop(): void {
    if (this.lightsaberHoldSource) {
      try {
        this.lightsaberHoldSource.stop();
      } catch {
        /* already stopped */
      }
      this.lightsaberHoldSource.disconnect();
      this.lightsaberHoldSource = null;
    }
    if (this.lightsaberHoldGain) {
      this.lightsaberHoldGain.disconnect();
      this.lightsaberHoldGain = null;
    }
  }

  private loadLightsaberSounds(): Promise<void> {
    if (this.lightsaberHitBuffer && this.lightsaberHoldBuffer) return Promise.resolve();
    if (this.lightsaberLoadPromise) return this.lightsaberLoadPromise;
    this.lightsaberLoadPromise = (async () => {
      if (!this.ctx) return;
      const base = import.meta.env.BASE_URL;
      const [hitRes, holdRes] = await Promise.all([
        fetch(`${base}lightsaber-hit.mp3`),
        fetch(`${base}lightsaber-hold.mp3`),
      ]);
      if (!hitRes.ok) throw new Error(`lightsaber-hit fetch failed: ${hitRes.status}`);
      if (!holdRes.ok) throw new Error(`lightsaber-hold fetch failed: ${holdRes.status}`);
      const [hitArr, holdArr] = await Promise.all([
        hitRes.arrayBuffer(),
        holdRes.arrayBuffer(),
      ]);
      const [hitBuf, holdBuf] = await Promise.all([
        this.ctx!.decodeAudioData(hitArr.slice(0)),
        this.ctx!.decodeAudioData(holdArr.slice(0)),
      ]);
      this.lightsaberHitBuffer = hitBuf;
      this.lightsaberHoldBuffer = holdBuf;
    })().catch(() => {
      this.lightsaberLoadPromise = null;
    });
    return this.lightsaberLoadPromise;
  }

  /** Looping supercar engine — pitch/volume follow |speed| / maxSpeed. */
  startCarEngine(): void {
    this.carEngineWanted = true;
    this.carEngineSpeed = 0;
    if (!this.ctx || !this.masterGain) this.ensureStarted();
    this.beginCarEngineLoop();
  }

  stopCarEngine(): void {
    this.carEngineWanted = false;
    this.carEngineSpeed = 0;
    this.carEngineTurbo = 0;
    this.endCarEngineLoop();
  }

  /** @param normalizedSpeed 0..1 relative to top speed */
  /** @param turboBlend 0..1 turbo intensity */
  updateCarEngine(normalizedSpeed: number, turboBlend = 0): void {
    if (!this.carEngineWanted) return;
    const t = Math.max(0, Math.min(1, normalizedSpeed));
    const turbo = Math.max(0, Math.min(1, turboBlend));
    this.carEngineSpeed = t;
    this.carEngineTurbo = turbo;
    if (!this.carEngineGain) {
      this.beginCarEngineLoop();
      return;
    }
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const effective = Math.min(1, t + turbo * 0.3);
    const idleHz = 58;
    const topHz = 145 + turbo * 65;
    const lowHz = idleHz + (topHz - idleHz) * effective;
    if (this.carEngineOscLow) {
      this.carEngineOscLow.frequency.setTargetAtTime(lowHz, now, 0.05);
    }
    if (this.carEngineOscHigh) {
      this.carEngineOscHigh.frequency.setTargetAtTime(lowHz * (2.05 + effective * 0.35 + turbo * 0.4), now, 0.05);
    }
    if (this.carEngineFilter) {
      this.carEngineFilter.frequency.setTargetAtTime(380 + effective * 2200 + turbo * 1400, now, 0.07);
      this.carEngineFilter.Q.setTargetAtTime(0.7 + effective * 1.8 + turbo * 2.2, now, 0.08);
    }
    if (!this.muted) {
      this.carEngineGain.gain.setTargetAtTime(this.carEngineTargetGain(effective, turbo), now, 0.05);
    }
  }

  private carEngineTargetGain(normalizedSpeed: number, turbo = 0): number {
    return 0.04 + normalizedSpeed * 0.12 + turbo * 0.08;
  }

  private beginCarEngineLoop(): void {
    if (!this.ctx || !this.masterGain || !this.carEngineWanted) return;
    if (this.carEngineGain) return;

    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = this.muted ? 0 : this.carEngineTargetGain(this.carEngineSpeed, this.carEngineTurbo);

    const oscLow = ctx.createOscillator();
    oscLow.type = 'sawtooth';
    oscLow.frequency.value = 58;

    const oscHigh = ctx.createOscillator();
    oscHigh.type = 'square';
    oscHigh.frequency.value = 119;

    const lowGain = ctx.createGain();
    lowGain.gain.value = 0.55;
    const highGain = ctx.createGain();
    highGain.gain.value = 0.12;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 480;
    filter.Q.value = 0.7;

    // Soft exhaust hiss
    const noiseDur = 1.5;
    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseDur), ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 900;
    noiseFilter.Q.value = 0.6;
    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.045;

    oscLow.connect(lowGain);
    oscHigh.connect(highGain);
    lowGain.connect(filter);
    highGain.connect(filter);
    filter.connect(gain);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gain);
    gain.connect(this.masterGain);

    oscLow.start();
    oscHigh.start();
    noise.start();

    this.carEngineGain = gain;
    this.carEngineOscLow = oscLow;
    this.carEngineOscHigh = oscHigh;
    this.carEngineNoise = noise;
    this.carEngineFilter = filter;
  }

  private endCarEngineLoop(): void {
    const stopOsc = (osc: OscillatorNode | AudioBufferSourceNode | null): void => {
      if (!osc) return;
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      try {
        osc.disconnect();
      } catch {
        /* already disconnected */
      }
    };
    stopOsc(this.carEngineOscLow);
    stopOsc(this.carEngineOscHigh);
    stopOsc(this.carEngineNoise);
    this.carEngineOscLow = null;
    this.carEngineOscHigh = null;
    this.carEngineNoise = null;
    if (this.carEngineFilter) {
      this.carEngineFilter.disconnect();
      this.carEngineFilter = null;
    }
    if (this.carEngineGain) {
      this.carEngineGain.disconnect();
      this.carEngineGain = null;
    }
  }

  /** Looping helicopter rotor wash — intensity follows blade speed 0..1. */
  startHeliRotor(): void {
    this.heliRotorWanted = true;
    this.heliRotorIntensity = 0.2;
    if (!this.ctx || !this.masterGain) this.ensureStarted();
    this.beginHeliRotorLoop();
  }

  stopHeliRotor(): void {
    this.heliRotorWanted = false;
    this.heliRotorIntensity = 0;
    this.endHeliRotorLoop();
  }

  /** @param intensity 0..1 rotor power (idle → flight) */
  updateHeliRotor(intensity: number): void {
    if (!this.heliRotorWanted) return;
    const t = Math.max(0, Math.min(1, intensity));
    this.heliRotorIntensity = t;
    if (!this.heliRotorGain) {
      this.beginHeliRotorLoop();
      return;
    }
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Blade thump rate rises with rotor speed
    if (this.heliRotorLfo) {
      this.heliRotorLfo.frequency.setTargetAtTime(12 + t * 28, now, 0.08);
    }
    if (this.heliRotorLfoGain) {
      this.heliRotorLfoGain.gain.setTargetAtTime(0.012 + t * 0.055, now, 0.08);
    }
    if (this.heliRotorThump) {
      this.heliRotorThump.frequency.setTargetAtTime(38 + t * 55, now, 0.06);
    }
    if (this.heliRotorWhine) {
      this.heliRotorWhine.frequency.setTargetAtTime(220 + t * 380, now, 0.06);
    }
    if (this.heliRotorFilter) {
      this.heliRotorFilter.frequency.setTargetAtTime(420 + t * 1600, now, 0.08);
      this.heliRotorFilter.Q.setTargetAtTime(0.5 + t * 0.9, now, 0.08);
    }
    if (!this.muted) {
      this.heliRotorGain.gain.setTargetAtTime(this.heliRotorTargetGain(t), now, 0.06);
    }
  }

  private heliRotorTargetGain(intensity: number): number {
    return 0.035 + intensity * 0.14;
  }

  private beginHeliRotorLoop(): void {
    if (!this.ctx || !this.masterGain || !this.heliRotorWanted) return;
    if (this.heliRotorGain) return;

    const ctx = this.ctx;
    const gain = ctx.createGain();
    gain.gain.value = this.muted ? 0 : this.heliRotorTargetGain(this.heliRotorIntensity);

    // Broadband rotor whoosh
    const noiseDur = 2;
    const noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseDur), ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 700;
    filter.Q.value = 0.7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.55;

    // Low thump body
    const thump = ctx.createOscillator();
    thump.type = 'triangle';
    thump.frequency.value = 45;
    const thumpGain = ctx.createGain();
    thumpGain.gain.value = 0.28;

    // Higher turbine whine
    const whine = ctx.createOscillator();
    whine.type = 'sawtooth';
    whine.frequency.value = 260;
    const whineGain = ctx.createGain();
    whineGain.gain.value = 0.04;
    const whineFilter = ctx.createBiquadFilter();
    whineFilter.type = 'lowpass';
    whineFilter.frequency.value = 900;

    // LFO pulses noise for blade chop
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 18;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(gain);

    thump.connect(thumpGain);
    thumpGain.connect(gain);

    whine.connect(whineFilter);
    whineFilter.connect(whineGain);
    whineGain.connect(gain);

    lfo.connect(lfoGain);
    lfoGain.connect(noiseGain.gain);

    gain.connect(this.masterGain);

    noise.start();
    thump.start();
    whine.start();
    lfo.start();

    this.heliRotorGain = gain;
    this.heliRotorNoise = noise;
    this.heliRotorThump = thump;
    this.heliRotorThumpGain = thumpGain;
    this.heliRotorWhine = whine;
    this.heliRotorFilter = filter;
    this.heliRotorLfo = lfo;
    this.heliRotorLfoGain = lfoGain;
  }

  private endHeliRotorLoop(): void {
    const stopOsc = (osc: OscillatorNode | AudioBufferSourceNode | null): void => {
      if (!osc) return;
      try {
        osc.stop();
      } catch {
        /* already stopped */
      }
      try {
        osc.disconnect();
      } catch {
        /* already disconnected */
      }
    };
    stopOsc(this.heliRotorNoise);
    stopOsc(this.heliRotorThump);
    stopOsc(this.heliRotorWhine);
    stopOsc(this.heliRotorLfo);
    this.heliRotorNoise = null;
    this.heliRotorThump = null;
    this.heliRotorWhine = null;
    this.heliRotorLfo = null;
    if (this.heliRotorLfoGain) {
      this.heliRotorLfoGain.disconnect();
      this.heliRotorLfoGain = null;
    }
    if (this.heliRotorThumpGain) {
      this.heliRotorThumpGain.disconnect();
      this.heliRotorThumpGain = null;
    }
    if (this.heliRotorFilter) {
      this.heliRotorFilter.disconnect();
      this.heliRotorFilter = null;
    }
    if (this.heliRotorGain) {
      this.heliRotorGain.disconnect();
      this.heliRotorGain = null;
    }
  }

  private playHit(): void {
    this.beep(520, 'triangle', 0.005, 0.08, 0.3, 340);
  }

  private playKill(): void {
    this.beep(400, 'sawtooth', 0.005, 0.18, 0.35, 120);
    this.noiseBurst(0.14, 1200, 0.2);
  }

  private playHurt(): void {
    this.beep(160, 'sawtooth', 0.005, 0.22, 0.45, 90);
  }

  private playWaveClear(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => {
      setTimeout(() => this.beep(n, 'triangle', 0.01, 0.22, 0.35), i * 90);
    });
  }

  private playWin(): void {
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
    notes.forEach((n, i) => {
      setTimeout(() => this.beep(n, 'sine', 0.015, 0.3, 0.4), i * 110);
    });
  }

  private playLose(): void {
    const notes = [440, 349.23, 261.63, 196];
    notes.forEach((n, i) => {
      setTimeout(() => this.beep(n, 'sawtooth', 0.01, 0.35, 0.4), i * 160);
    });
  }

  private playBalloonPop(): void {
    this.beep(160 + Math.random() * 100, 'sine', 0.001, 0.07, 0.5, 55);
    this.noiseBurst(0.045, 2000, 0.28);
  }

  /** Soft menu / UI button tap. */
  private playUiClick(): void {
    this.beep(880, 'sine', 0.002, 0.04, 0.2, 1400);
    this.beep(660, 'triangle', 0.001, 0.028, 0.1, 900);
  }

  /** Kısa, tatlı miyav — Suzy Çıtçıt. */
  /** Mechanical camera shutter: sharp click + short noise slap. */
  private playCameraShutter(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    this.beep(2200, 'square', 0.001, 0.04, 0.28, 900);
    this.beep(1400, 'triangle', 0.001, 0.055, 0.18, 400);

    const noiseDur = 0.09;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * noiseDur), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1800;
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
    src.stop(now + noiseDur);
  }

  private playMeow(): void {
    if (!this.ctx || !this.masterGain) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(780, now);
    osc.frequency.linearRampToValueAtTime(980, now + 0.07);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.28);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.32);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1170, now + 0.02);
    osc2.frequency.exponentialRampToValueAtTime(520, now + 0.22);
    gain2.gain.setValueAtTime(0.0001, now + 0.02);
    gain2.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.02);
    osc2.stop(now + 0.26);
  }
}
