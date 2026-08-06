import {
  CODEX_CHARACTERS,
  CODEX_ENEMIES,
  CODEX_GUIDE_PAGES,
  CODEX_MAPS,
  CODEX_WEAPONS,
  type CodexEntry,
  type CodexPageId,
} from '../data/codex';
import { LOSE_MESSAGES, START_MESSAGES, WIN_MESSAGES } from '../data/messages';

type MenuKind = 'start' | 'win' | 'lose';
type StartPage = 'home' | CodexPageId;

export interface MenuCallbacks {
  onStart: () => void;
  onRestart: () => void;
  onInteract?: () => void;
  onClick?: () => void;
}


export class MenuScreen {
  private readonly root: HTMLDivElement;
  private readonly coverFrame: HTMLDivElement;
  private readonly panel: HTMLDivElement;
  private readonly callbacks: MenuCallbacks;
  private currentKind: MenuKind | null = null;
  private continuePlayingHandler: (() => void) | null = null;
  private currentPage: StartPage = 'home';
  private finalScoreHint: number | undefined;

  constructor(container: HTMLElement, callbacks: MenuCallbacks) {
    this.callbacks = callbacks;
    this.root = document.createElement('div');
    this.root.className = 'wa-menu-overlay';

    this.coverFrame = document.createElement('div');
    this.coverFrame.className = 'wa-menu-cover-frame';
    this.coverFrame.setAttribute('aria-hidden', 'true');

    this.panel = document.createElement('div');
    this.panel.className = 'wa-menu-panel';

    // Cover is a full-bleed background layer; panel always stays on top of it.
    this.root.append(this.coverFrame, this.panel);
    container.appendChild(this.root);
    MenuScreen.ensureStyles();
    this.hide();
  }

  showStart(finalScore?: number): void {
    this.currentKind = 'start';
    this.finalScoreHint = finalScore;
    this.currentPage = 'home';
    MenuScreen.ensureStyles();
    this.setCoverBackground(true);
    this.renderStart();
    this.root.style.display = 'grid';
  }

  showWin(
    finalScore: number,
    stagesCleared: number,
    totalStages: number,
    options?: { onContinuePlaying?: () => void; message?: string },
  ): void {
    this.currentKind = 'win';
    this.setCoverBackground(false);
    const winPhoto = `${import.meta.env.BASE_URL}game_won.JPG`;
    const message = options?.message ?? WIN_MESSAGES.body;
    const continueButton = options?.onContinuePlaying
      ? `<button class="wa-button wa-button-secondary" data-action="continue-playing">${WIN_MESSAGES.continuePlayingButton}</button>`
      : '';
    this.panel.className = 'wa-menu-panel wa-menu-panel--simple';
    this.panel.innerHTML = `
      <div class="wa-badge wa-badge-win">Kazandın!</div>
      <p class="wa-body wa-win-message">${message}</p>
      <img class="wa-win-photo" src="${winPhoto}" alt="Hilal & Cihanser" />
      <div class="wa-final">
        <div><span>Skor</span><strong>${finalScore}</strong></div>
        <div><span>Aşama</span><strong>${stagesCleared}/${totalStages}</strong></div>
      </div>
      <div class="wa-button-row">
        <button class="wa-button" data-action="restart">${WIN_MESSAGES.button}</button>
        ${continueButton}
      </div>
    `;
    this.continuePlayingHandler = options?.onContinuePlaying ?? null;
    this.bindButtons();
    this.root.style.display = 'flex';
  }

  showLose(finalScore: number, stagesCleared: number, mapName: string): void {
    this.currentKind = 'lose';
    this.setCoverBackground(false);
    this.panel.className = 'wa-menu-panel wa-menu-panel--simple';
    this.panel.innerHTML = `
      <div class="wa-badge wa-badge-lose">Nefes Al</div>
      <h1 class="wa-title">${LOSE_MESSAGES.title}</h1>
      <p class="wa-body">${LOSE_MESSAGES.body}</p>
      <div class="wa-final">
        <div><span>Skor</span><strong>${finalScore}</strong></div>
        <div><span>Kalan Yerde</span><strong>${mapName}</strong></div>
        <div><span>Aşama</span><strong>${stagesCleared}</strong></div>
      </div>
      <button class="wa-button" data-action="restart">${LOSE_MESSAGES.button}</button>
    `;
    this.bindButtons();
    this.root.style.display = 'flex';
  }

  hide(): void {
    this.root.style.display = 'none';
    this.currentKind = null;
    this.continuePlayingHandler = null;
    this.setCoverBackground(false);
  }

  private setCoverBackground(enabled: boolean): void {
    this.root.classList.toggle('wa-menu-overlay--cover', enabled);
    let coverImg = this.coverFrame.querySelector<HTMLImageElement>('.wa-menu-cover-img');
    if (enabled) {
      const coverUrl = `${import.meta.env.BASE_URL}wedding-anxiety-cover2.png`;
      if (!coverImg) {
        coverImg = document.createElement('img');
        coverImg.className = 'wa-menu-cover-img';
        coverImg.alt = '';
        coverImg.decoding = 'async';
        this.coverFrame.appendChild(coverImg);
      }
      coverImg.src = coverUrl;
      this.coverFrame.hidden = false;
    } else {
      this.coverFrame.hidden = true;
      if (coverImg) coverImg.remove();
    }
  }

  isVisible(): boolean {
    return this.currentKind !== null;
  }

  private renderStart(): void {
    if (this.currentPage === 'home') {
      this.panel.className = 'wa-menu-panel wa-menu-panel--game';
      this.panel.innerHTML = this.buildHomePage();
    } else if (this.currentPage === 'guide') {
      this.panel.className = 'wa-menu-panel wa-menu-panel--content';
      this.panel.innerHTML = this.buildGuidePage();
    } else {
      this.panel.className = 'wa-menu-panel wa-menu-panel--content';
      this.panel.innerHTML = this.buildSubPage(this.currentPage);
    }
    this.bindStartInteractions();
  }

  private buildHomePage(): string {
    const score =
      this.finalScoreHint !== undefined
        ? `<p class="wa-score">${this.finalScoreHint} skor</p>`
        : '';

    return `
      <div class="wa-page wa-page-home">
        <h1 class="wa-sr-only">${START_MESSAGES.title}</h1>
        ${score}
        <nav class="wa-game-menu" aria-label="Ana menü">
          <button type="button" class="wa-menu-btn" data-action="start">${START_MESSAGES.startButton}</button>
          <button type="button" class="wa-menu-btn" data-page="guide">Oyun Rehberi</button>
          <button type="button" class="wa-menu-btn" data-page="controls">Kontroller</button>
        </nav>
      </div>
    `;
  }

  private buildGuidePage(): string {
    const links = CODEX_GUIDE_PAGES.map(
      (page) => `
        <button type="button" class="wa-menu-btn wa-menu-btn--sub" data-page="${page.id}">
          ${page.label}
        </button>
      `,
    ).join('');

    return `
      <div class="wa-page wa-page-sub">
        ${this.buildBackButton('home')}
        <header class="wa-page-header wa-page-header--center">
          <h2>Oyun Rehberi</h2>
        </header>
        <nav class="wa-game-menu" aria-label="Oyun rehberi">${links}</nav>
      </div>
    `;
  }

  private buildBackButton(target: 'home' | 'guide'): string {
    return `
      <button type="button" class="wa-back-btn" data-action="back" data-back="${target}">
        <span aria-hidden="true">←</span> Geri
      </button>
    `;
  }

  private buildSubPage(page: Exclude<CodexPageId, 'guide'>): string {
    const meta = CODEX_GUIDE_PAGES.find((p) => p.id === page);
    const backTarget = page === 'controls' ? 'home' : 'guide';

    let body = '';
    switch (page) {
      case 'characters':
        body = this.buildCodexBody(meta?.label ?? 'Karakterler', CODEX_CHARACTERS);
        break;
      case 'enemies':
        body = this.buildCodexBody(meta?.label ?? 'Düşmanlar', CODEX_ENEMIES);
        break;
      case 'weapons':
        body = this.buildCodexBody(meta?.label ?? 'Silahlar', CODEX_WEAPONS);
        break;
      case 'maps':
        body = this.buildCodexBody(meta?.label ?? 'Haritalar', CODEX_MAPS);
        break;
      case 'controls':
        body = this.buildControlsBody();
        break;
    }

    return `
      <div class="wa-page wa-page-sub">
        ${this.buildBackButton(backTarget)}
        ${body}
      </div>
    `;
  }

  private buildCodexBody(title: string, entries: CodexEntry[]): string {
    const cards = entries
      .map((entry) => {
        const tags = (entry.tags ?? [])
          .map((t) => `<span class="wa-tag">${t}</span>`)
          .join('');
        return `
          <article class="wa-codex-card">
            <header class="wa-codex-head">
              <h3>${entry.name}</h3>
              <span class="wa-codex-role">${entry.role}</span>
            </header>
            <p>${entry.blurb}</p>
            ${tags ? `<div class="wa-codex-tags">${tags}</div>` : ''}
          </article>
        `;
      })
      .join('');

    return `
      <header class="wa-page-header wa-page-header--center">
        <h2>${title}</h2>
      </header>
      <div class="wa-codex-grid">${cards}</div>
    `;
  }

  private buildControlsBody(): string {
    const rows = START_MESSAGES.controls
      .map((line) => {
        const sep = line.indexOf(' - ');
        if (sep < 0) return `<li><span>${line}</span></li>`;
        const key = line.slice(0, sep);
        const action = line.slice(sep + 3);
        return `<li><kbd>${key}</kbd><span>${action}</span></li>`;
      })
      .join('');

    return `
      <header class="wa-page-header wa-page-header--center">
        <h2>${START_MESSAGES.controlsTitle}</h2>
      </header>
      <ul class="wa-controls-list">${rows}</ul>
    `;
  }

  private bindStartInteractions(): void {
    this.bindButtons();

    const pageLinks = this.panel.querySelectorAll<HTMLButtonElement>('button[data-page]');
    for (const btn of Array.from(pageLinks)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.onMenuButtonPress();
        const id = btn.dataset.page as CodexPageId | undefined;
        if (!id) return;
        this.currentPage = id;
        this.renderStart();
      });
    }
  }

  private bindButtons(): void {
    const buttons = this.panel.querySelectorAll<HTMLButtonElement>('button[data-action]');
    for (const btn of Array.from(buttons)) {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.onMenuButtonPress();
        const action = btn.dataset.action;
        if (action === 'start') this.callbacks.onStart();
        if (action === 'restart') this.callbacks.onRestart();
        if (action === 'continue-playing') this.continuePlayingHandler?.();
        if (action === 'back') {
          const target = btn.dataset.back;
          this.currentPage = target === 'guide' ? 'guide' : 'home';
          this.renderStart();
        }
      });
    }
  }

  private onMenuButtonPress(): void {
    this.callbacks.onClick?.();
    this.callbacks.onInteract?.();
  }

  private static ensureStyles(): void {
    const STYLE_ID = 'wa-menu-styles';
    const existing = document.getElementById(STYLE_ID);
    if (existing) existing.remove();

    if (!document.getElementById('wa-menu-fonts')) {
      const link = document.createElement('link');
      link.id = 'wa-menu-fonts';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Outfit:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }

    const css = `
      .wa-menu-overlay {
        position: absolute;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        background:
          radial-gradient(ellipse 80% 60% at 20% 10%, rgba(120, 60, 140, 0.45), transparent 55%),
          radial-gradient(ellipse 70% 50% at 85% 80%, rgba(40, 90, 140, 0.35), transparent 50%),
          linear-gradient(165deg, #12081c 0%, #1a0f2e 45%, #0c0814 100%);
        z-index: 20;
        padding: 20px;
      }
      .wa-menu-overlay--cover {
        display: grid;
        grid-template: 1fr / 1fr;
        place-items: center;
        background: #0a0612;
        padding: 0;
        overflow: hidden;
      }
      .wa-menu-overlay--cover > * {
        grid-area: 1 / 1;
      }
      .wa-menu-cover-frame {
        position: relative;
        z-index: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        pointer-events: none;
        justify-self: stretch;
        align-self: stretch;
      }
      .wa-menu-cover-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
        user-select: none;
      }
      .wa-menu-panel {
        position: relative;
        z-index: 2;
        pointer-events: auto;
        color: #f4ecff;
        font-family: 'Outfit', 'Segoe UI', sans-serif;
        text-align: center;
      }
      .wa-menu-panel--simple {
        max-width: 560px;
        width: 100%;
        background: linear-gradient(160deg, rgba(40, 20, 80, 0.95), rgba(20, 10, 40, 0.95));
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 18px;
        padding: 28px 32px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(180, 120, 255, 0.25) inset;
      }
      .wa-menu-overlay--cover .wa-menu-panel--game {
        position: absolute;
        left: 10%;
        top: 57%;
        transform: translateY(-50%);
        justify-self: start;
        align-self: start;
        width: min(260px, 24vw);
        min-width: 180px;
        max-width: 260px;
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0;
        container-type: inline-size;
      }
      .wa-menu-panel--content {
        position: relative;
        z-index: 3;
        width: min(720px, calc(100vw - 40px));
        max-height: min(720px, 88vh);
        overflow: auto;
        text-align: left;
        background: rgba(14, 8, 26, 0.92);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        padding: 24px 26px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45);
      }
      .wa-menu-overlay--cover .wa-menu-panel--content {
        justify-self: center;
        align-self: center;
      }
      .wa-sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
      .wa-game-menu {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 0.55em;
        width: 100%;
      }
      .wa-menu-btn {
        pointer-events: auto;
        cursor: pointer;
        width: min(300px, 78vw);
        padding: 14px 22px;
        border: 2px solid rgba(255, 255, 255, 0.22);
        border-radius: 6px;
        background: #6b3fad;
        color: #ffffff;
        font: inherit;
        font-size: 17px;
        font-weight: 600;
        letter-spacing: 0.6px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
        box-shadow: 0 8px 0 #4a2878, 0 12px 24px rgba(0, 0, 0, 0.35);
        transition: transform 0.12s ease, background 0.12s ease, box-shadow 0.12s ease;
      }
      .wa-menu-overlay--cover .wa-game-menu {
        gap: 0.7em;
      }
      .wa-menu-overlay--cover .wa-menu-btn {
        width: 100%;
        max-width: none;
        padding: 0.7em 1em;
        font-size: clamp(14px, 3.8cqw, 17px);
        letter-spacing: 0.05em;
        border-width: 2px;
        box-shadow: 0 0.32em 0 #4a2878, 0 0.5em 0.9em rgba(0, 0, 0, 0.32);
      }
      .wa-menu-overlay--cover .wa-menu-btn:hover {
        box-shadow: 0 0.38em 0 #4a2878, 0 0.65em 1.05em rgba(0, 0, 0, 0.38);
      }
      .wa-menu-overlay--cover .wa-menu-btn:active {
        box-shadow: 0 0.18em 0 #4a2878, 0 0.32em 0.55em rgba(0, 0, 0, 0.28);
      }
      .wa-menu-btn:hover {
        background: #7d52c4;
        transform: translateY(-2px);
        box-shadow: 0 10px 0 #4a2878, 0 16px 28px rgba(0, 0, 0, 0.4);
      }
      .wa-menu-btn:active {
        transform: translateY(3px);
        box-shadow: 0 4px 0 #4a2878, 0 8px 16px rgba(0, 0, 0, 0.3);
      }
      .wa-menu-btn--sub {
        width: min(260px, 100%);
        font-size: 15px;
        box-shadow: 0 5px 0 #4a2878, 0 8px 16px rgba(0, 0, 0, 0.28);
      }
      .wa-menu-btn--sub:hover {
        box-shadow: 0 7px 0 #4a2878, 0 12px 20px rgba(0, 0, 0, 0.35);
      }
      .wa-page-home .wa-score {
        margin: 0 0 16px;
        text-align: center;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7);
      }
      .wa-page-sub {
        min-height: 160px;
      }
      .wa-back-btn {
        pointer-events: auto;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: #6b3fad;
        color: #ffffff;
        font: inherit;
        font-size: 13px;
        font-weight: 600;
        padding: 8px 14px;
        border-radius: 6px;
        margin-bottom: 16px;
        box-shadow: 0 4px 0 #4a2878;
        transition: background 0.12s ease, transform 0.12s ease;
      }
      .wa-back-btn:hover {
        background: #7d52c4;
        transform: translateY(-1px);
      }
      .wa-page-header h2 {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 28px;
        margin: 0 0 6px;
        font-weight: 700;
        color: #fff;
      }
      .wa-page-header--center {
        text-align: center;
      }
      .wa-page-header--center h2 {
        margin-bottom: 18px;
      }
      .wa-page-header p {
        margin: 0 0 18px;
        color: rgba(244, 236, 255, 0.7);
        font-size: 14px;
        line-height: 1.5;
      }
      .wa-codex-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 12px;
      }
      .wa-codex-card {
        text-align: left;
        padding: 14px 15px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(255, 255, 255, 0.04);
      }
      .wa-codex-head {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin-bottom: 8px;
      }
      .wa-codex-head h3 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #fff;
      }
      .wa-codex-role {
        font-size: 11px;
        letter-spacing: 0.6px;
        text-transform: uppercase;
        color: #d4b3ff;
      }
      .wa-codex-card p {
        margin: 0;
        font-size: 13px;
        line-height: 1.5;
        color: rgba(244, 236, 255, 0.82);
      }
      .wa-codex-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }
      .wa-tag {
        font-size: 10px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        padding: 3px 8px;
        border-radius: 999px;
        background: rgba(140, 100, 220, 0.2);
        color: rgba(230, 210, 255, 0.95);
        border: 1px solid rgba(180, 140, 255, 0.25);
      }
      .wa-controls-list {
        list-style: none;
        margin: 0 0 16px;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .wa-controls-list li {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px 12px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.06);
      }
      .wa-controls-list kbd {
        flex: 0 0 200px;
        font-family: inherit;
        font-size: 12px;
        font-weight: 600;
        color: #e0c8ff;
        letter-spacing: 0.3px;
      }
      .wa-controls-list span {
        font-size: 13px;
        color: rgba(244, 236, 255, 0.85);
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
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 30px;
        margin: 6px 0 4px;
        font-weight: 700;
      }
      .wa-body {
        line-height: 1.55;
        font-size: 15px;
        margin: 12px 0 18px;
        color: rgba(244, 236, 255, 0.9);
      }
      .wa-win-photo {
        display: block;
        width: 100%;
        max-width: 420px;
        margin: 0 auto 18px;
        border-radius: 12px;
        border: 2px solid rgba(245, 197, 66, 0.45);
        box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
        object-fit: cover;
      }
      .wa-win-message {
        font-size: 18px;
        font-weight: 600;
        margin: 8px 0 16px;
      }
      .wa-tip {
        font-size: 12px;
        color: rgba(244, 236, 255, 0.65);
        font-style: italic;
        margin: 0 0 18px;
      }
      .wa-score {
        font-size: 13px;
        color: rgba(255, 220, 130, 0.95);
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
        border-radius: 6px;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: #6b3fad;
        color: white;
        box-shadow: 0 6px 0 #4a2878, 0 10px 20px rgba(0, 0, 0, 0.3);
        transition: transform 0.12s ease, box-shadow 0.12s ease, background 0.12s ease;
        font-family: inherit;
      }
      .wa-button:hover {
        background: #7d52c4;
        transform: translateY(-2px);
        box-shadow: 0 8px 0 #4a2878, 0 14px 24px rgba(0, 0, 0, 0.35);
      }
      .wa-button:active {
        transform: translateY(2px);
        box-shadow: 0 3px 0 #4a2878, 0 6px 12px rgba(0, 0, 0, 0.28);
      }
      .wa-button-row {
        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .wa-button-secondary {
        background: #5a4ab0;
        box-shadow: 0 6px 0 #3a2f78, 0 10px 20px rgba(0, 0, 0, 0.3);
      }
      .wa-button-secondary:hover {
        background: #6b5bc4;
        box-shadow: 0 8px 0 #3a2f78, 0 14px 24px rgba(0, 0, 0, 0.35);
      }
      @media (max-width: 560px) {
        .wa-controls-list li {
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
        .wa-controls-list kbd { flex-basis: auto; }
      }
    `;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }
}
