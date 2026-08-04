import type { GameSettings } from '../game/GameSettings';

export interface PauseCallbacks {
  onResume: () => void;
  onMainMenu: () => void;
  onSettingsChange: (settings: GameSettings) => void;
}

export class PauseScreen {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly callbacks: PauseCallbacks;
  private settings: GameSettings;

  constructor(container: HTMLElement, settings: GameSettings, callbacks: PauseCallbacks) {
    this.settings = { ...settings };
    this.callbacks = callbacks;
    this.root = document.createElement('div');
    this.root.className = 'wa-pause-overlay';
    this.root.innerHTML = `<div class="wa-pause-panel"></div>`;
    container.appendChild(this.root);
    this.panel = this.root.querySelector('.wa-pause-panel') as HTMLDivElement;
    PauseScreen.ensureStyles();
    this.hide();
  }

  getSettings(): GameSettings {
    return { ...this.settings };
  }

  show(settings: GameSettings): void {
    this.settings = { ...settings };
    this.render();
    this.root.style.display = 'flex';
  }

  hide(): void {
    this.root.style.display = 'none';
  }

  isVisible(): boolean {
    return this.root.style.display === 'flex';
  }

  private render(): void {
    const s = this.settings;
    this.panel.innerHTML = `
      <h2 class="wa-pause-title">Duraklatıldı</h2>
      <div class="wa-pause-settings">
        <label class="wa-pause-row">
          <span>Fare Hassasiyeti</span>
          <input type="range" data-setting="mouseSensitivity" min="0.8" max="6" step="0.1" value="${(s.mouseSensitivity / 0.0004).toFixed(1)}" />
        </label>
        <label class="wa-pause-row">
          <span>Ses Efektleri</span>
          <input type="range" data-setting="sfxVolume" min="0" max="100" step="1" value="${Math.round(s.sfxVolume * 100)}" />
        </label>
        <label class="wa-pause-row">
          <span>Müzik</span>
          <input type="range" data-setting="musicVolume" min="0" max="100" step="1" value="${Math.round(s.musicVolume * 100)}" />
        </label>
        <label class="wa-pause-row wa-pause-toggle">
          <span>Sessiz (M)</span>
          <input type="checkbox" data-setting="muted" ${s.muted ? 'checked' : ''} />
        </label>
      </div>
      <div class="wa-pause-actions">
        <button class="wa-button" data-action="resume">Devam Et</button>
        <button class="wa-button wa-button-secondary" data-action="menu">Ana Menü</button>
      </div>
      <p class="wa-pause-hint">Esc - Devam · M - Sessiz</p>
    `;
    this.bindEvents();
  }

  private bindEvents(): void {
    const sliders = this.panel.querySelectorAll<HTMLInputElement>('input[data-setting]');
    for (const input of Array.from(sliders)) {
      input.addEventListener('input', () => this.applyInput(input));
    }

    const buttons = this.panel.querySelectorAll<HTMLButtonElement>('button[data-action]');
    for (const btn of Array.from(buttons)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        if (action === 'resume') this.callbacks.onResume();
        if (action === 'menu') this.callbacks.onMainMenu();
      });
    }
  }

  private applyInput(input: HTMLInputElement): void {
    const key = input.dataset.setting as keyof GameSettings;
    if (key === 'mouseSensitivity') {
      this.settings.mouseSensitivity = parseFloat(input.value) * 0.0004;
    } else if (key === 'sfxVolume') {
      this.settings.sfxVolume = parseInt(input.value, 10) / 100;
    } else if (key === 'musicVolume') {
      this.settings.musicVolume = parseInt(input.value, 10) / 100;
    } else if (key === 'muted') {
      this.settings.muted = input.checked;
    }
    this.callbacks.onSettingsChange({ ...this.settings });
  }

  private static stylesInjected = false;
  static ensureStyles(): void {
    if (PauseScreen.stylesInjected) return;
    PauseScreen.stylesInjected = true;
    const css = `
      .wa-pause-overlay {
        position: absolute;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(10, 5, 25, 0.72);
        backdrop-filter: blur(4px);
        z-index: 25;
        padding: 24px;
      }
      .wa-pause-panel {
        pointer-events: auto;
        max-width: 420px;
        width: 100%;
        background: linear-gradient(160deg, rgba(40, 20, 80, 0.96), rgba(20, 10, 40, 0.96));
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 16px;
        padding: 24px 28px;
        color: #f4ecff;
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        text-align: center;
        box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
      }
      .wa-pause-title {
        margin: 0 0 18px;
        font-size: 24px;
        font-weight: 700;
      }
      .wa-pause-settings {
        text-align: left;
        margin-bottom: 20px;
      }
      .wa-pause-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
        font-size: 13px;
        color: rgba(244, 236, 255, 0.9);
      }
      .wa-pause-row input[type="range"] {
        flex: 1;
        max-width: 180px;
        accent-color: #c879ff;
      }
      .wa-pause-toggle input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: #c879ff;
      }
      .wa-pause-actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .wa-button-secondary {
        background: rgba(255, 255, 255, 0.08) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        box-shadow: none !important;
      }
      .wa-pause-hint {
        margin: 14px 0 0;
        font-size: 11px;
        color: rgba(244, 236, 255, 0.55);
        font-style: italic;
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}
