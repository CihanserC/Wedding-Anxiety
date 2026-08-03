import { WAVE_TRANSITION_LABELS } from '../data/messages';

export interface DialogueOptions {
  title: string;
  body: string;
  continueLabel?: string;
  onContinue: () => void;
  autoCloseMs?: number;
}

export class DialogueBox {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private autoCloseTimer: number | null = null;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'wa-dialogue-overlay';
    this.root.innerHTML = `<div class="wa-dialogue-panel"></div>`;
    container.appendChild(this.root);
    this.panel = this.root.querySelector('.wa-dialogue-panel') as HTMLDivElement;
    DialogueBox.ensureStyles();
    this.hide();
  }

  show(options: DialogueOptions): void {
    const label = options.continueLabel ?? WAVE_TRANSITION_LABELS.continueButton;
    this.panel.innerHTML = `
      <div class="wa-dialogue-badge">${WAVE_TRANSITION_LABELS.breather}</div>
      <h2 class="wa-dialogue-title">${options.title}</h2>
      <p class="wa-dialogue-body">${options.body}</p>
      <button class="wa-dialogue-button">${label}</button>
    `;
    const btn = this.panel.querySelector('button') as HTMLButtonElement;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      this.hide();
      options.onContinue();
    });
    this.root.style.display = 'flex';
    if (options.autoCloseMs) {
      this.autoCloseTimer = window.setTimeout(() => {
        this.hide();
        options.onContinue();
      }, options.autoCloseMs);
    }
  }

  hide(): void {
    if (this.autoCloseTimer !== null) {
      window.clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
    this.root.style.display = 'none';
  }

  isVisible(): boolean {
    return this.root.style.display !== 'none';
  }

  private static stylesInjected = false;
  static ensureStyles(): void {
    if (DialogueBox.stylesInjected) return;
    DialogueBox.stylesInjected = true;
    const css = `
      .wa-dialogue-overlay {
        position: absolute;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: rgba(10, 5, 25, 0.55);
        backdrop-filter: blur(4px);
        z-index: 15;
        padding: 24px;
      }
      .wa-dialogue-panel {
        pointer-events: auto;
        max-width: 520px;
        background: linear-gradient(160deg, rgba(60, 30, 100, 0.95), rgba(30, 15, 60, 0.95));
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 16px;
        padding: 24px 30px;
        color: #f4ecff;
        text-align: center;
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
      }
      .wa-dialogue-badge {
        display: inline-block;
        background: rgba(180, 220, 255, 0.15);
        border: 1px solid rgba(180, 220, 255, 0.35);
        color: #d5eaff;
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 11px;
        letter-spacing: 1.2px;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      .wa-dialogue-title {
        font-size: 22px;
        margin: 4px 0 10px;
      }
      .wa-dialogue-body {
        font-size: 15px;
        line-height: 1.55;
        color: rgba(244, 236, 255, 0.9);
        margin: 0 0 18px;
      }
      .wa-dialogue-button {
        pointer-events: auto;
        cursor: pointer;
        font-size: 15px;
        font-weight: 600;
        padding: 10px 24px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(135deg, #7dd3ff, #a879ff);
        color: white;
        box-shadow: 0 8px 18px rgba(120, 180, 255, 0.35);
        transition: transform 0.15s ease;
      }
      .wa-dialogue-button:hover { transform: translateY(-2px); }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}
