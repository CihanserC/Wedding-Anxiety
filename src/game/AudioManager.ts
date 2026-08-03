/**
 * Procedural Web Audio SFX. No external assets, no libraries.
 * All sounds are short envelope-shaped oscillator/noise bursts.
 */

type Sfx = 'shoot' | 'hit' | 'kill' | 'wave-clear' | 'hurt' | 'win' | 'lose';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private muted = false;

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
    } catch {
      this.ctx = null;
    }
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.masterGain) this.masterGain.gain.value = muted ? 0 : 0.35;
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
