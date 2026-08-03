import { HUD_LABELS } from '../data/messages';

export interface HUDState {
  anxietyPercent: number;
  wave: number;
  totalWaves: number;
  score: number;
  enemiesLeft: number;
  reloadRatio: number;
  weaponName: string;
}

export class HUD {
  private readonly root: HTMLDivElement;
  private readonly crosshair: HTMLDivElement;
  private readonly anxietyFill: HTMLDivElement;
  private readonly anxietyLabel: HTMLDivElement;
  private readonly waveLabel: HTMLDivElement;
  private readonly scoreLabel: HTMLDivElement;
  private readonly enemiesLabel: HTMLDivElement;
  private readonly reloadRing: HTMLDivElement;
  private readonly damageFlash: HTMLDivElement;
  private readonly weaponLabel: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'wa-hud';
    this.root.innerHTML = `
      <div class="wa-hud-topbar">
        <div class="wa-anxiety">
          <div class="wa-anxiety-label"></div>
          <div class="wa-anxiety-bar"><div class="wa-anxiety-fill"></div></div>
        </div>
        <div class="wa-stats">
          <div class="wa-stat wa-wave"></div>
          <div class="wa-stat wa-score"></div>
          <div class="wa-stat wa-enemies"></div>
        </div>
      </div>
      <div class="wa-crosshair">
        <div class="wa-crosshair-inner"></div>
      </div>
      <div class="wa-reload-ring"></div>
      <div class="wa-damage-flash"></div>
      <div class="wa-weapon"></div>
    `;
    container.appendChild(this.root);
    this.crosshair = this.root.querySelector('.wa-crosshair') as HTMLDivElement;
    this.anxietyFill = this.root.querySelector('.wa-anxiety-fill') as HTMLDivElement;
    this.anxietyLabel = this.root.querySelector('.wa-anxiety-label') as HTMLDivElement;
    this.waveLabel = this.root.querySelector('.wa-wave') as HTMLDivElement;
    this.scoreLabel = this.root.querySelector('.wa-score') as HTMLDivElement;
    this.enemiesLabel = this.root.querySelector('.wa-enemies') as HTMLDivElement;
    this.reloadRing = this.root.querySelector('.wa-reload-ring') as HTMLDivElement;
    this.damageFlash = this.root.querySelector('.wa-damage-flash') as HTMLDivElement;
    this.weaponLabel = this.root.querySelector('.wa-weapon') as HTMLDivElement;

    HUD.ensureStyles();
    this.hide();
  }

  show(): void {
    this.root.style.display = 'block';
  }

  hide(): void {
    this.root.style.display = 'none';
  }

  update(state: HUDState): void {
    const pct = Math.max(0, Math.min(100, state.anxietyPercent));
    this.anxietyFill.style.width = `${pct.toFixed(1)}%`;
    const hue = 110 - pct * 1.1;
    this.anxietyFill.style.background = `linear-gradient(90deg, hsl(${hue}, 75%, 55%), hsl(${Math.max(0, hue - 20)}, 80%, 45%))`;
    this.anxietyLabel.textContent = `${HUD_LABELS.anxiety}: %${pct.toFixed(0)}`;
    this.waveLabel.textContent = `${HUD_LABELS.wave} ${state.wave}/${state.totalWaves}`;
    this.scoreLabel.textContent = `${HUD_LABELS.score}: ${state.score}`;
    this.enemiesLabel.textContent = `${HUD_LABELS.enemiesLeft}: ${state.enemiesLeft}`;

    if (state.reloadRatio > 0) {
      this.reloadRing.style.opacity = '1';
      this.reloadRing.style.background = `conic-gradient(rgba(255,220,120,0.9) ${(1 - state.reloadRatio) * 360}deg, rgba(255,255,255,0.15) 0deg)`;
    } else {
      this.reloadRing.style.opacity = '0';
    }

    this.weaponLabel.textContent = state.weaponName;
  }

  flashDamage(): void {
    this.damageFlash.classList.remove('wa-flash-active');
    void this.damageFlash.offsetWidth;
    this.damageFlash.classList.add('wa-flash-active');
  }

  setCrosshairVisible(visible: boolean): void {
    this.crosshair.style.opacity = visible ? '1' : '0';
  }

  private static stylesInjected = false;
  static ensureStyles(): void {
    if (HUD.stylesInjected) return;
    HUD.stylesInjected = true;
    const css = `
      .wa-hud {
        position: absolute;
        inset: 0;
        pointer-events: none;
        color: #f4ecff;
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        z-index: 10;
      }
      .wa-hud-topbar {
        position: absolute;
        top: 18px;
        left: 24px;
        right: 24px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 20px;
      }
      .wa-anxiety {
        min-width: 260px;
        max-width: 360px;
        background: rgba(20, 10, 40, 0.55);
        padding: 10px 14px;
        border-radius: 10px;
        backdrop-filter: blur(6px);
        border: 1px solid rgba(255,255,255,0.1);
      }
      .wa-anxiety-label {
        font-size: 13px;
        letter-spacing: 0.5px;
        opacity: 0.9;
        margin-bottom: 6px;
      }
      .wa-anxiety-bar {
        height: 12px;
        background: rgba(255,255,255,0.12);
        border-radius: 999px;
        overflow: hidden;
      }
      .wa-anxiety-fill {
        height: 100%;
        width: 0;
        transition: width 0.15s ease, background 0.3s ease;
      }
      .wa-stats {
        display: flex;
        flex-direction: column;
        gap: 6px;
        align-items: flex-end;
      }
      .wa-stat {
        background: rgba(20, 10, 40, 0.55);
        padding: 6px 12px;
        border-radius: 8px;
        font-size: 14px;
        border: 1px solid rgba(255,255,255,0.08);
      }
      .wa-crosshair {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 22px;
        height: 22px;
        transition: opacity 0.2s ease;
      }
      .wa-crosshair::before,
      .wa-crosshair::after {
        content: '';
        position: absolute;
        background: rgba(255,255,255,0.85);
      }
      .wa-crosshair::before {
        left: 50%;
        top: 0;
        width: 2px;
        height: 100%;
        transform: translateX(-50%);
      }
      .wa-crosshair::after {
        top: 50%;
        left: 0;
        height: 2px;
        width: 100%;
        transform: translateY(-50%);
      }
      .wa-crosshair-inner {
        position: absolute;
        inset: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,0.7);
      }
      .wa-reload-ring {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 40px;
        height: 40px;
        margin: -20px 0 0 -20px;
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.15s ease;
        mask: radial-gradient(circle, transparent 12px, black 13px);
        -webkit-mask: radial-gradient(circle, transparent 12px, black 13px);
      }
      .wa-weapon {
        position: absolute;
        right: 24px;
        bottom: 20px;
        padding: 8px 16px;
        background: rgba(20, 10, 40, 0.6);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px;
        font-size: 15px;
        letter-spacing: 0.4px;
        color: #f4ecff;
        text-shadow: 0 1px 3px rgba(0,0,0,0.5);
      }
      .wa-damage-flash {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(255, 40, 80, 0) 55%, rgba(255, 40, 80, 0.55) 100%);
        opacity: 0;
        pointer-events: none;
      }
      .wa-damage-flash.wa-flash-active {
        animation: wa-flash 0.35s ease-out;
      }
      @keyframes wa-flash {
        0% { opacity: 0; }
        30% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}
