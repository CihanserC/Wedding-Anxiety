/**
 * Procedural Web Audio SFX + optional map background music.
 * Mozart Allegro uses a simplified Eine kleine Nachtmusik theme loop
 * (public-domain melody) when no external mp3 is present.
 */

type Sfx = 'shoot' | 'hit' | 'kill' | 'wave-clear' | 'hurt' | 'win' | 'lose';
export type BgmId = 'mozart-allegro' | null;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private muted = false;
  private bgmId: BgmId = null;
  private bgmTimer: number | null = null;
  private bgmHtml: HTMLAudioElement | null = null;
  private bgmNoteIndex = 0;

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
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 0.35;
    if (this.musicGain) this.musicGain.gain.value = muted ? 0 : 0.12;
    if (this.bgmHtml) this.bgmHtml.muted = muted;
  }

  play(sfx: Sfx): void {
    if (!this.ctx || !this.masterGain || this.muted) return;
    switch (sfx) {
      case 'shoot':
        this.playShoot();
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
    }
  }

  /** Start / swap / stop map background music. */
  setBgm(id: BgmId): void {
    this.stopBgm();
    if (!id || this.muted) return;
    this.ensureStarted();
    this.bgmId = id;

    if (id === 'mozart-allegro') {
      this.tryExternalMozart().catch(() => this.startMozartLoop());
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

  /**
   * Simplified Eine kleine Nachtmusik K.525 Allegro opening theme in G major.
   * Melody only — recognizable classical vibe without needing an asset file.
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
      if (this.bgmId !== 'mozart-allegro' || !this.ctx || !this.musicGain || this.muted) return;
      const note = melody[this.bgmNoteIndex % melody.length];
      this.bgmNoteIndex++;
      if (note.freq > 0) this.playMusicNote(note.freq, (note.beats * beatMs) / 1000);
      this.bgmTimer = window.setTimeout(step, note.beats * beatMs);
    };
    step();
  }

  private playMusicNote(freq: number, duration: number): void {
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
    gain.gain.exponentialRampToValueAtTime(0.9, now + 0.02);
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
}
