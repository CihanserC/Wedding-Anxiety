import { LOSE_MESSAGES, START_MESSAGES, WIN_MESSAGES } from '../data/messages';

type MenuKind = 'start' | 'win' | 'lose';

export interface MenuCallbacks {
  onStart: () => void;
  onRestart: () => void;
}

export class MenuScreen {
  private readonly root: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly callbacks: MenuCallbacks;
  private currentKind: MenuKind | null = null;

  constructor(container: HTMLElement, callbacks: MenuCallbacks) {
    this.callbacks = callbacks;
    this.root = document.createElement('div');
    this.root.className = 'wa-menu-overlay';
    this.root.innerHTML = `<div class="wa-menu-panel"></div>`;
    container.appendChild(this.root);
    this.panel = this.root.querySelector('.wa-menu-panel') as HTMLDivElement;
    MenuScreen.ensureStyles();
    this.hide();
  }

  showStart(finalScore?: number): void {
    this.currentKind = 'start';
    const controls = START_MESSAGES.controls.map((c) => `<li>${c}</li>`).join('');
    this.panel.innerHTML = `
      <div class="wa-badge">Hilal'e Özel</div>
      <h1 class="wa-title">${START_MESSAGES.title}</h1>
      <p class="wa-subtitle">${START_MESSAGES.subtitle}</p>
      <p class="wa-body">${START_MESSAGES.intro}</p>
      ${finalScore !== undefined ? `<p class="wa-score">Önceki skor: ${finalScore}</p>` : ''}
      <div class="wa-controls">
        <div class="wa-controls-title">${START_MESSAGES.controlsTitle}</div>
        <ul>${controls}</ul>
      </div>
      <p class="wa-tip">${START_MESSAGES.tip}</p>
      <button class="wa-button" data-action="start">${START_MESSAGES.startButton}</button>
    `;
    this.bindButtons();
    this.root.style.display = 'flex';
  }

  showWin(finalScore: number, waveReached: number): void {
    this.currentKind = 'win';
    this.panel.innerHTML = `
      <div class="wa-badge wa-badge-win">Kazandın!</div>
      <h1 class="wa-title">${WIN_MESSAGES.title}</h1>
      <p class="wa-body">${WIN_MESSAGES.body}</p>
      <div class="wa-final">
        <div><span>Skor</span><strong>${finalScore}</strong></div>
        <div><span>Ulaşılan Dalga</span><strong>${waveReached}</strong></div>
      </div>
      <button class="wa-button" data-action="restart">${WIN_MESSAGES.button}</button>
    `;
    this.bindButtons();
    this.root.style.display = 'flex';
  }

  showLose(finalScore: number, waveReached: number): void {
    this.currentKind = 'lose';
    this.panel.innerHTML = `
      <div class="wa-badge wa-badge-lose">Nefes Al</div>
      <h1 class="wa-title">${LOSE_MESSAGES.title}</h1>
      <p class="wa-body">${LOSE_MESSAGES.body}</p>
      <div class="wa-final">
        <div><span>Skor</span><strong>${finalScore}</strong></div>
        <div><span>Ulaşılan Dalga</span><strong>${waveReached}</strong></div>
      </div>
      <button class="wa-button" data-action="restart">${LOSE_MESSAGES.button}</button>
    `;
    this.bindButtons();
    this.root.style.display = 'flex';
  }

  hide(): void {
    this.root.style.display = 'none';
    this.currentKind = null;
  }

  isVisible(): boolean {
    return this.currentKind !== null;
  }

  private bindButtons(): void {
    const buttons = this.panel.querySelectorAll<HTMLButtonElement>('button[data-action]');
    for (const btn of Array.from(buttons)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        if (action === 'start') this.callbacks.onStart();
        if (action === 'restart') this.callbacks.onRestart();
      });
    }
  }

  private static stylesInjected = false;
  static ensureStyles(): void {
    if (MenuScreen.stylesInjected) return;
    MenuScreen.stylesInjected = true;
    const css = `
      .wa-menu-overlay {
        position: absolute;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle at 50% 30%, rgba(80, 40, 140, 0.85), rgba(10, 5, 25, 0.95));
        z-index: 20;
        padding: 24px;
      }
      .wa-menu-panel {
        pointer-events: auto;
        max-width: 560px;
        width: 100%;
        background: linear-gradient(160deg, rgba(40, 20, 80, 0.95), rgba(20, 10, 40, 0.95));
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 18px;
        padding: 28px 32px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(180, 120, 255, 0.25) inset;
        color: #f4ecff;
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        text-align: center;
      }
      .wa-badge {
        display: inline-block;
        background: rgba(255, 180, 230, 0.18);
        border: 1px solid rgba(255, 180, 230, 0.35);
        color: #ffcbe6;
        padding: 4px 12px;
        border-radius: 999px;
        font-size: 12px;
        letter-spacing: 1px;
        margin-bottom: 10px;
        text-transform: uppercase;
      }
      .wa-badge-win { background: rgba(120, 255, 180, 0.15); border-color: rgba(120,255,180,0.4); color: #d5ffe6; }
      .wa-badge-lose { background: rgba(255, 120, 140, 0.15); border-color: rgba(255,120,140,0.4); color: #ffd5df; }
      .wa-title {
        font-size: 30px;
        margin: 6px 0 4px;
        font-weight: 700;
      }
      .wa-subtitle {
        margin: 0 0 12px;
        color: rgba(244, 236, 255, 0.72);
        font-size: 14px;
      }
      .wa-body {
        line-height: 1.55;
        font-size: 15px;
        margin: 12px 0 18px;
        color: rgba(244, 236, 255, 0.9);
      }
      .wa-controls {
        text-align: left;
        background: rgba(0, 0, 0, 0.22);
        border-radius: 12px;
        padding: 12px 16px;
        margin: 10px 0 14px;
      }
      .wa-controls-title {
        font-weight: 600;
        margin-bottom: 6px;
        font-size: 13px;
        letter-spacing: 0.5px;
        color: #ffd6ef;
      }
      .wa-controls ul {
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
        color: rgba(244, 236, 255, 0.85);
      }
      .wa-tip {
        font-size: 12px;
        color: rgba(244, 236, 255, 0.65);
        font-style: italic;
        margin: 0 0 18px;
      }
      .wa-score {
        font-size: 13px;
        color: rgba(255, 220, 130, 0.9);
        margin: 0 0 10px;
      }
      .wa-final {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin: 12px 0 20px;
      }
      .wa-final div {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(0,0,0,0.22);
        padding: 8px 18px;
        border-radius: 10px;
      }
      .wa-final span {
        font-size: 11px;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: rgba(244,236,255,0.6);
      }
      .wa-final strong {
        font-size: 22px;
        color: #fff;
      }
      .wa-button {
        pointer-events: auto;
        cursor: pointer;
        font-size: 16px;
        font-weight: 600;
        padding: 12px 26px;
        border-radius: 999px;
        border: none;
        background: linear-gradient(135deg, #ff8ac6, #a879ff);
        color: white;
        box-shadow: 0 10px 20px rgba(200, 120, 255, 0.35);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .wa-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 14px 26px rgba(200, 120, 255, 0.45);
      }
      .wa-button:active {
        transform: translateY(0);
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}
