import { HUD_LABELS } from '../data/messages';

export interface HUDState {
  mode?: 'combat' | 'explore';
  anxietyPercent: number;
  mapName: string;
  mapIndex: number;
  totalMaps: number;
  level: number;
  totalLevels: number;
  overallStage: number;
  totalStages: number;
  score: number;
  enemiesLeft: number;
  reloadRatio: number;
  weaponName: string;
  bossHpRatio?: number | null;
  bossLabel?: string;
}

export class HUD {
  private readonly root: HTMLDivElement;
  private readonly crosshair: HTMLDivElement;
  private readonly anxietyFill: HTMLDivElement;
  private readonly anxietyPct: HTMLDivElement;
  private readonly anxietyBlock: HTMLDivElement;
  private readonly mapLabel: HTMLDivElement;
  private readonly scoreValue: HTMLDivElement;
  private readonly enemiesValue: HTMLDivElement;
  private readonly enemiesStat: HTMLDivElement;
  private readonly reloadRing: HTMLDivElement;
  private readonly damageFlash: HTMLDivElement;
  private readonly cameraFlash: HTMLDivElement;
  private readonly weaponLabel: HTMLDivElement;
  private readonly interactPrompt: HTMLDivElement;
  private readonly subtitle: HTMLDivElement;
  private readonly bossHealth: HTMLDivElement;
  private readonly bossHealthLabel: HTMLDivElement;
  private readonly bossHealthFill: HTMLDivElement;
  private readonly muteIndicator: HTMLDivElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'wa-hud';
    this.root.innerHTML = `
      <div class="wa-hud-topbar">
        <div class="wa-boss-health">
          <div class="wa-boss-health-label">Altın Canavarı</div>
          <div class="wa-boss-health-bar"><div class="wa-boss-health-fill"></div></div>
        </div>
        <div class="wa-anxiety" aria-label="${HUD_LABELS.anxiety}">
          <div class="wa-anxiety-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 21s-6.7-4.35-9.33-8.1C.8 10.4 1.4 6.9 4.2 5.4 6.1 4.4 8.3 5 12 8.1c3.7-3.1 5.9-3.7 7.8-2.7 2.8 1.5 3.4 5 1.53 7.5C18.7 16.65 12 21 12 21z"/>
            </svg>
          </div>
          <div class="wa-anxiety-meter">
            <div class="wa-anxiety-bar">
              <div class="wa-anxiety-fill"></div>
              <div class="wa-anxiety-segments" aria-hidden="true"></div>
            </div>
            <div class="wa-anxiety-pct">0%</div>
          </div>
        </div>
        <div class="wa-stats-panel">
          <div class="wa-stats-map"></div>
          <div class="wa-stats-divider"></div>
          <div class="wa-stats-row">
            <div class="wa-stat-cell wa-score">
              <div class="wa-stat-value">0</div>
              <div class="wa-stat-label">${HUD_LABELS.score}</div>
            </div>
            <div class="wa-stat-cell wa-enemies">
              <div class="wa-stat-value">0</div>
              <div class="wa-stat-label">${HUD_LABELS.enemiesLeft}</div>
            </div>
          </div>
        </div>
      </div>
      <div class="wa-crosshair">
        <div class="wa-crosshair-inner"></div>
      </div>
      <div class="wa-reload-ring"></div>
      <div class="wa-damage-flash"></div>
      <div class="wa-camera-flash"></div>
      <div class="wa-weapon"></div>
      <div class="wa-interact-prompt"></div>
      <div class="wa-subtitle"></div>
      <div class="wa-mute-indicator" hidden aria-label="Ses kapalı">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.11c2.89.86 5 3.54 5 6.66zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/>
        </svg>
      </div>
    `;
    container.appendChild(this.root);
    this.crosshair = this.root.querySelector('.wa-crosshair') as HTMLDivElement;
    this.anxietyFill = this.root.querySelector('.wa-anxiety-fill') as HTMLDivElement;
    this.anxietyPct = this.root.querySelector('.wa-anxiety-pct') as HTMLDivElement;
    this.anxietyBlock = this.root.querySelector('.wa-anxiety') as HTMLDivElement;
    this.mapLabel = this.root.querySelector('.wa-stats-map') as HTMLDivElement;
    this.scoreValue = this.root.querySelector('.wa-score .wa-stat-value') as HTMLDivElement;
    this.enemiesValue = this.root.querySelector('.wa-enemies .wa-stat-value') as HTMLDivElement;
    this.enemiesStat = this.root.querySelector('.wa-enemies') as HTMLDivElement;
    this.reloadRing = this.root.querySelector('.wa-reload-ring') as HTMLDivElement;
    this.damageFlash = this.root.querySelector('.wa-damage-flash') as HTMLDivElement;
    this.cameraFlash = this.root.querySelector('.wa-camera-flash') as HTMLDivElement;
    this.weaponLabel = this.root.querySelector('.wa-weapon') as HTMLDivElement;
    this.interactPrompt = this.root.querySelector('.wa-interact-prompt') as HTMLDivElement;
    this.subtitle = this.root.querySelector('.wa-subtitle') as HTMLDivElement;
    this.bossHealth = this.root.querySelector('.wa-boss-health') as HTMLDivElement;
    this.bossHealthLabel = this.root.querySelector('.wa-boss-health-label') as HTMLDivElement;
    this.bossHealthFill = this.root.querySelector('.wa-boss-health-fill') as HTMLDivElement;
    this.muteIndicator = this.root.querySelector('.wa-mute-indicator') as HTMLDivElement;

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
    const explore = state.mode === 'explore';
    const pct = explore ? 0 : Math.max(0, Math.min(100, state.anxietyPercent));

    this.anxietyBlock.style.display = explore ? 'none' : 'flex';
    this.enemiesStat.style.display = explore ? 'none' : 'flex';
    this.weaponLabel.style.display = explore ? 'none' : 'block';
    // Crosshair visibility is owned by setCrosshairVisible (planets keep the
    // alien gun in explore mode and still need a reticle).

    this.anxietyFill.style.width = `${pct.toFixed(1)}%`;
    const hue = 110 - pct * 1.1;
    this.anxietyFill.style.background = `linear-gradient(90deg, hsl(${hue}, 75%, 55%), hsl(${Math.max(0, hue - 20)}, 80%, 45%))`;
    this.anxietyPct.textContent = `${pct.toFixed(0)}%`;
    this.anxietyBlock.classList.toggle('wa-anxiety--critical', pct > 75);

    this.mapLabel.textContent = state.mapName;
    this.scoreValue.textContent = String(state.score);
    this.enemiesValue.textContent = String(state.enemiesLeft);

    if (!explore && state.reloadRatio > 0) {
      this.reloadRing.style.opacity = '1';
      this.reloadRing.style.background = `conic-gradient(rgba(255,220,120,0.9) ${(1 - state.reloadRatio) * 360}deg, rgba(255,255,255,0.15) 0deg)`;
    } else {
      this.reloadRing.style.opacity = '0';
    }

    if (!explore) {
      this.weaponLabel.textContent = state.weaponName;
    }

    if (state.bossLabel) {
      this.bossHealthLabel.textContent = state.bossLabel;
    }

    if (state.bossHpRatio != null && state.bossHpRatio >= 0) {
      const bossPct = Math.max(0, Math.min(100, state.bossHpRatio * 100));
      this.bossHealth.style.display = 'block';
      this.bossHealthFill.style.width = `${bossPct.toFixed(1)}%`;
    } else {
      this.bossHealth.style.display = 'none';
      this.bossHealthFill.style.width = '0%';
    }
  }

  flashDamage(): void {
    this.damageFlash.classList.remove('wa-flash-active');
    void this.damageFlash.offsetWidth;
    this.damageFlash.classList.add('wa-flash-active');
  }

  /** White camera-bulb flash (paparazzi / Flaşör Babaanne). */
  flashCamera(): void {
    this.cameraFlash.classList.remove('wa-camera-flash-active');
    void this.cameraFlash.offsetWidth;
    this.cameraFlash.classList.add('wa-camera-flash-active');
  }

  setCrosshairVisible(visible: boolean): void {
    this.crosshair.style.display = visible ? 'block' : 'none';
    this.crosshair.style.opacity = visible ? '1' : '0';
  }

  setInteractPrompt(text: string | null): void {
    if (!text) {
      this.interactPrompt.style.display = 'none';
      this.interactPrompt.textContent = '';
      return;
    }
    this.interactPrompt.textContent = text;
    this.interactPrompt.style.display = 'block';
  }

  setSubtitle(lines: string[]): void {
    if (lines.length === 0) {
      this.subtitle.style.display = 'none';
      this.subtitle.innerHTML = '';
      return;
    }
    this.subtitle.innerHTML = lines.map((line) => `<p>${line}</p>`).join('');
    this.subtitle.style.display = 'block';
  }

  setMuted(muted: boolean): void {
    this.muteIndicator.hidden = !muted;
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
      .wa-boss-health {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: min(360px, 42vw);
        display: none;
        background: rgba(20, 10, 40, 0.65);
        padding: 10px 14px 12px;
        border-radius: 10px;
        border: 1px solid rgba(255, 80, 80, 0.35);
        backdrop-filter: blur(6px);
        text-align: center;
      }
      .wa-boss-health-label {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.6px;
        color: #ff8a8a;
        margin-bottom: 6px;
      }
      .wa-boss-health-bar {
        height: 14px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        overflow: hidden;
      }
      .wa-boss-health-fill {
        height: 100%;
        width: 100%;
        background: linear-gradient(90deg, #ff5555, #cc0000);
        transition: width 0.12s ease;
      }
      .wa-anxiety {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 240px;
        max-width: 340px;
        background: rgba(20, 10, 40, 0.6);
        padding: 10px 12px;
        border-radius: 12px;
        backdrop-filter: blur(6px);
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        transition: box-shadow 0.25s ease, border-color 0.25s ease;
      }
      .wa-anxiety--critical {
        border-color: rgba(255, 80, 100, 0.55);
        box-shadow: 0 0 18px rgba(255, 60, 90, 0.35);
        animation: wa-anxiety-pulse 1.1s ease-in-out infinite;
      }
      .wa-anxiety-icon {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.08);
        color: #ff8a9a;
      }
      .wa-anxiety-meter {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .wa-anxiety-bar {
        position: relative;
        flex: 1;
        height: 18px;
        background: rgba(255,255,255,0.12);
        border-radius: 6px;
        overflow: hidden;
      }
      .wa-anxiety-fill {
        height: 100%;
        width: 0;
        border-radius: 6px;
        transition: width 0.15s ease, background 0.3s ease;
      }
      .wa-anxiety-segments {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          linear-gradient(to right, transparent calc(25% - 0.5px), rgba(0, 0, 0, 0.3) calc(25% - 0.5px), rgba(0, 0, 0, 0.3) calc(25% + 0.5px), transparent calc(25% + 0.5px)),
          linear-gradient(to right, transparent calc(50% - 0.5px), rgba(0, 0, 0, 0.3) calc(50% - 0.5px), rgba(0, 0, 0, 0.3) calc(50% + 0.5px), transparent calc(50% + 0.5px)),
          linear-gradient(to right, transparent calc(75% - 0.5px), rgba(0, 0, 0, 0.3) calc(75% - 0.5px), rgba(0, 0, 0, 0.3) calc(75% + 0.5px), transparent calc(75% + 0.5px));
      }
      .wa-anxiety-pct {
        flex: 0 0 auto;
        min-width: 34px;
        text-align: right;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.3px;
        color: rgba(244, 236, 255, 0.85);
        font-variant-numeric: tabular-nums;
      }
      .wa-stats-panel {
        min-width: 150px;
        background: rgba(20, 10, 40, 0.6);
        padding: 10px 14px 12px;
        border-radius: 12px;
        backdrop-filter: blur(6px);
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25);
        text-align: center;
      }
      .wa-stats-map {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.4px;
        color: #fff;
        line-height: 1.3;
      }
      .wa-stats-divider {
        height: 1px;
        margin: 8px 0 10px;
        background: rgba(255, 255, 255, 0.12);
      }
      .wa-stats-row {
        display: flex;
        justify-content: center;
        gap: 18px;
      }
      .wa-stat-cell {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-width: 48px;
      }
      .wa-stat-value {
        font-size: 18px;
        font-weight: 700;
        line-height: 1.1;
        color: #fff;
        font-variant-numeric: tabular-nums;
      }
      .wa-stat-label {
        font-size: 10px;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        color: rgba(244, 236, 255, 0.55);
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
      .wa-interact-prompt {
        display: none;
        position: absolute;
        left: 50%;
        bottom: 72px;
        transform: translateX(-50%);
        padding: 10px 20px;
        background: rgba(20, 10, 40, 0.75);
        border: 1px solid rgba(255, 220, 140, 0.35);
        border-radius: 999px;
        font-size: 15px;
        font-weight: 600;
        color: #ffe9b8;
        letter-spacing: 0.3px;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.35);
      }
      .wa-subtitle {
        display: none;
        position: absolute;
        left: 50%;
        bottom: 120px;
        transform: translateX(-50%);
        max-width: min(680px, 90vw);
        text-align: center;
        pointer-events: none;
      }
      .wa-subtitle p {
        margin: 0 0 8px;
        padding: 8px 16px;
        background: rgba(0, 0, 0, 0.55);
        border-radius: 10px;
        color: #ffe566;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.45;
        text-shadow: 0 2px 6px rgba(0, 0, 0, 0.65);
      }
      .wa-subtitle p:last-child {
        margin-bottom: 0;
      }
      .wa-mute-indicator {
        position: absolute;
        left: 24px;
        bottom: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: rgba(20, 10, 40, 0.65);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #f4ecff;
        backdrop-filter: blur(6px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
      }
      .wa-mute-indicator[hidden] {
        display: none !important;
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
      .wa-camera-flash {
        position: absolute;
        inset: 0;
        background: radial-gradient(circle at center, rgba(255, 255, 240, 0.92) 0%, rgba(255, 250, 220, 0.55) 35%, rgba(255, 255, 240, 0) 70%);
        opacity: 0;
        pointer-events: none;
        z-index: 6;
      }
      .wa-camera-flash.wa-camera-flash-active {
        animation: wa-camera-flash 0.28s ease-out;
      }
      @keyframes wa-flash {
        0% { opacity: 0; }
        30% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes wa-camera-flash {
        0% { opacity: 0; }
        12% { opacity: 1; }
        100% { opacity: 0; }
      }
      @keyframes wa-anxiety-pulse {
        0%, 100% { box-shadow: 0 0 12px rgba(255, 60, 90, 0.25); }
        50% { box-shadow: 0 0 22px rgba(255, 60, 90, 0.5); }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}
