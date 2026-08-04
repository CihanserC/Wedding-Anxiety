const COLORS = ['#ff4466', '#ffd166', '#ff85a2', '#ffe566', '#a8e6cf', '#88c8ff', '#f5c542'];

interface ConfettiPiece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  color: string;
  rot: number;
  rotV: number;
}

export class ConfettiOverlay {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private active = false;
  private pieces: ConfettiPiece[] = [];

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'wa-confetti-canvas';
    this.canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:25;display:none;';
    container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
    ConfettiOverlay.ensureStyles();
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  show(): void {
    this.active = true;
    this.canvas.style.display = 'block';
    this.resize();
    this.spawnBurst(120);
  }

  hide(): void {
    this.active = false;
    this.canvas.style.display = 'none';
    this.pieces = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  update(dt: number): void {
    if (!this.active) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    if (this.pieces.length < 80 && Math.random() < 0.35) {
      this.spawnBurst(8);
    }

    for (const p of this.pieces) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
      p.rot += p.rotV * dt;
    }

    this.pieces = this.pieces.filter((p) => p.y < h + 40 && p.x > -40 && p.x < w + 40);

    this.ctx.clearRect(0, 0, w, h);
    for (const p of this.pieces) {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rot);
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
    }
  }

  private resize(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.canvas.width = parent.clientWidth;
    this.canvas.height = parent.clientHeight;
  }

  private spawnBurst(count: number): void {
    const w = this.canvas.width;
    const h = this.canvas.height;
    for (let i = 0; i < count; i++) {
      this.pieces.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: -20 - Math.random() * h * 0.25,
        vx: (Math.random() - 0.5) * 220,
        vy: 80 + Math.random() * 160,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rot: Math.random() * Math.PI,
        rotV: (Math.random() - 0.5) * 8,
      });
    }
  }

  private static stylesInjected = false;
  private static ensureStyles(): void {
    if (ConfettiOverlay.stylesInjected) return;
    ConfettiOverlay.stylesInjected = true;
  }
}
