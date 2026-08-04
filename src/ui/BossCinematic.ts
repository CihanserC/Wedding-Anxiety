export class BossCinematic {
  private readonly root: HTMLDivElement;
  private readonly title: HTMLDivElement;
  private onComplete: (() => void) | null = null;
  private timer = 0;
  private duration = 0;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'wa-boss-cinematic';
    this.root.innerHTML = `<div class="wa-boss-cinematic-text"></div>`;
    container.appendChild(this.root);
    this.title = this.root.querySelector('.wa-boss-cinematic-text') as HTMLDivElement;
    BossCinematic.ensureStyles();
    this.hide();
  }

  show(text: string, durationMs: number, onComplete: () => void): void {
    this.title.textContent = text;
    this.duration = durationMs / 1000;
    this.timer = 0;
    this.onComplete = onComplete;
    this.root.style.display = 'flex';
    this.root.classList.remove('wa-boss-cinematic-active');
    void this.root.offsetWidth;
    this.root.classList.add('wa-boss-cinematic-active');
  }

  update(dt: number): void {
    if (this.root.style.display !== 'flex') return;
    this.timer += dt;
    if (this.timer >= this.duration) {
      const done = this.onComplete;
      this.onComplete = null;
      this.hide();
      done?.();
    }
  }

  hide(): void {
    this.root.style.display = 'none';
    this.root.classList.remove('wa-boss-cinematic-active');
    this.onComplete = null;
    this.timer = 0;
  }

  isVisible(): boolean {
    return this.root.style.display === 'flex';
  }

  private static stylesInjected = false;
  static ensureStyles(): void {
    if (BossCinematic.stylesInjected) return;
    BossCinematic.stylesInjected = true;
    const css = `
      .wa-boss-cinematic {
        position: absolute;
        inset: 0;
        display: none;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        z-index: 18;
        background: radial-gradient(circle at center, rgba(80, 0, 0, 0.15) 0%, rgba(20, 0, 0, 0.55) 100%);
      }
      .wa-boss-cinematic-text {
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-size: clamp(28px, 5vw, 52px);
        font-weight: 900;
        letter-spacing: 2px;
        text-transform: uppercase;
        color: #ff1a1a;
        text-shadow:
          0 0 12px rgba(255, 40, 40, 0.95),
          0 0 28px rgba(255, 0, 0, 0.7),
          0 2px 0 #660000,
          0 4px 12px rgba(0, 0, 0, 0.6);
        opacity: 0;
        transform: scale(0.6);
      }
      .wa-boss-cinematic-active .wa-boss-cinematic-text {
        animation: wa-boss-rage-in 2.4s ease-out forwards;
      }
      @keyframes wa-boss-rage-in {
        0% { opacity: 0; transform: scale(0.5); }
        18% { opacity: 1; transform: scale(1.12); }
        30% { transform: scale(1); }
        70% { opacity: 1; transform: scale(1.04); }
        100% { opacity: 0.92; transform: scale(1.08); }
      }
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
}
