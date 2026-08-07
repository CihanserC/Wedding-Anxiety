import {
  BIOME_LABELS,
  DISPOSITION_LABELS,
  PLANETS,
  type PlanetDefinition,
} from '../data/planets';

export interface GalaxyMapCallbacks {
  onSelectPlanet: (planet: PlanetDefinition) => void;
  onClose: () => void;
}

/**
 * Full-screen 2D tactical galaxy map overlay (Star Wars style).
 * Opens with Tab during space flight.
 */
export class GalaxyMapOverlay {
  private readonly root: HTMLDivElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly info: HTMLDivElement;
  private visible = false;
  private shipGalaxy = { x: 50, y: 50 };
  private hovered: PlanetDefinition | null = null;
  private readonly onKeyDown: (e: KeyboardEvent) => void;

  constructor(
    container: HTMLElement,
    private readonly callbacks: GalaxyMapCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.className = 'wa-galaxy-overlay';
    this.root.innerHTML = `
      <div class="wa-galaxy-panel">
        <div class="wa-galaxy-header">
          <h2>Galaksi Haritası</h2>
          <p>Gezegen seç · Tab veya Esc ile kapat</p>
        </div>
        <canvas class="wa-galaxy-canvas" width="640" height="420"></canvas>
        <div class="wa-galaxy-info"></div>
        <button type="button" class="wa-galaxy-close">Kapat</button>
      </div>
    `;
    container.appendChild(this.root);
    this.canvas = this.root.querySelector('.wa-galaxy-canvas') as HTMLCanvasElement;
    this.info = this.root.querySelector('.wa-galaxy-info') as HTMLDivElement;
    GalaxyMapOverlay.ensureStyles();

    this.root.querySelector('.wa-galaxy-close')!.addEventListener('click', () => {
      this.callbacks.onClose();
    });
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this.onClick(e));
    this.onKeyDown = (e: KeyboardEvent) => {
      if (!this.visible) return;
      if (e.code === 'Escape' || e.code === 'Tab') {
        e.preventDefault();
        this.callbacks.onClose();
      }
    };
    window.addEventListener('keydown', this.onKeyDown);
    this.hide();
  }

  show(shipGalaxyPos?: { x: number; y: number }): void {
    if (shipGalaxyPos) this.shipGalaxy = shipGalaxyPos;
    this.visible = true;
    this.root.style.display = 'flex';
    this.draw();
  }

  hide(): void {
    this.visible = false;
    this.root.style.display = 'none';
    this.hovered = null;
  }

  isVisible(): boolean {
    return this.visible;
  }

  setShipPosition(pos: { x: number; y: number }): void {
    this.shipGalaxy = pos;
    if (this.visible) this.draw();
  }

  private planetAt(mx: number, my: number): PlanetDefinition | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((mx - rect.left) / rect.width) * this.canvas.width;
    const y = ((my - rect.top) / rect.height) * this.canvas.height;
    for (const p of PLANETS) {
      const px = (p.galaxyPosition.x / 100) * this.canvas.width;
      const py = (p.galaxyPosition.y / 100) * this.canvas.height;
      if (Math.hypot(px - x, py - y) < 18) return p;
    }
    return null;
  }

  private onMouseMove(e: MouseEvent): void {
    this.hovered = this.planetAt(e.clientX, e.clientY);
    this.canvas.style.cursor = this.hovered ? 'pointer' : 'default';
    this.updateInfo();
    this.draw();
  }

  private onClick(e: MouseEvent): void {
    const planet = this.planetAt(e.clientX, e.clientY);
    if (planet) this.callbacks.onSelectPlanet(planet);
  }

  private updateInfo(): void {
    if (!this.hovered) {
      this.info.innerHTML = '<span class="wa-galaxy-hint">Bir gezegene tıkla</span>';
      return;
    }
    const p = this.hovered;
    this.info.innerHTML = `
      <strong>${p.name}</strong>
      <span>${BIOME_LABELS[p.biome]} · ${DISPOSITION_LABELS[p.disposition]}</span>
      <em>${p.blurb}</em>
    `;
  }

  private draw(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const grad = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.5, w * 0.7);
    grad.addColorStop(0, '#1a1030');
    grad.addColorStop(0.5, '#0a0818');
    grad.addColorStop(1, '#020208');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 120; i++) {
      const sx = ((i * 97) % w) + (i % 7);
      const sy = ((i * 53) % h) + (i % 11);
      ctx.globalAlpha = 0.25 + (i % 5) * 0.12;
      ctx.fillRect(sx, sy, 1.5, 1.5);
    }
    ctx.globalAlpha = 1;

    // Routes
    ctx.strokeStyle = 'rgba(120,160,220,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < PLANETS.length - 1; i++) {
      const a = PLANETS[i];
      const b = PLANETS[i + 1];
      ctx.moveTo((a.galaxyPosition.x / 100) * w, (a.galaxyPosition.y / 100) * h);
      ctx.lineTo((b.galaxyPosition.x / 100) * w, (b.galaxyPosition.y / 100) * h);
    }
    ctx.stroke();

    for (const p of PLANETS) {
      const px = (p.galaxyPosition.x / 100) * w;
      const py = (p.galaxyPosition.y / 100) * h;
      const r = p === this.hovered ? 14 : 10;
      const color = `#${p.tint.toString(16).padStart(6, '0')}`;

      ctx.beginPath();
      ctx.arc(px, py, r + 4, 0, Math.PI * 2);
      ctx.fillStyle = p.disposition === 'hostile' ? 'rgba(255,60,40,0.25)' : 'rgba(100,200,255,0.15)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = p === this.hovered ? '#fff' : 'rgba(255,255,255,0.4)';
      ctx.lineWidth = p === this.hovered ? 2 : 1;
      ctx.stroke();

      ctx.fillStyle = '#e8e4f0';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, px, py + r + 14);
    }

    // Ship marker
    const sx = (this.shipGalaxy.x / 100) * w;
    const sy = (this.shipGalaxy.y / 100) * h;
    ctx.fillStyle = '#66ffe0';
    ctx.beginPath();
    ctx.moveTo(sx, sy - 8);
    ctx.lineTo(sx + 6, sy + 6);
    ctx.lineTo(sx - 6, sy + 6);
    ctx.closePath();
    ctx.fill();
  }

  private static stylesAdded = false;
  private static ensureStyles(): void {
    if (GalaxyMapOverlay.stylesAdded) return;
    GalaxyMapOverlay.stylesAdded = true;
    const style = document.createElement('style');
    style.textContent = `
      .wa-galaxy-overlay {
        position: absolute; inset: 0; z-index: 40;
        display: none; align-items: center; justify-content: center;
        background: rgba(2, 4, 12, 0.72);
        font-family: "Segoe UI", system-ui, sans-serif;
      }
      .wa-galaxy-panel {
        background: linear-gradient(160deg, #12182a 0%, #0a0e18 100%);
        border: 1px solid rgba(120, 160, 220, 0.35);
        border-radius: 12px;
        padding: 18px 20px 16px;
        max-width: 92vw;
        box-shadow: 0 20px 60px rgba(0,0,0,0.55);
      }
      .wa-galaxy-header h2 {
        margin: 0; color: #e8f0ff; font-size: 1.25rem; letter-spacing: 0.04em;
      }
      .wa-galaxy-header p {
        margin: 4px 0 12px; color: #8898b8; font-size: 0.85rem;
      }
      .wa-galaxy-canvas {
        display: block; width: min(640px, 86vw); height: auto;
        border-radius: 8px; border: 1px solid rgba(80,100,140,0.4);
        background: #050810;
      }
      .wa-galaxy-info {
        min-height: 3.2rem; margin-top: 10px; color: #c8d4e8; font-size: 0.9rem;
        display: flex; flex-direction: column; gap: 2px;
      }
      .wa-galaxy-info strong { color: #fff; font-size: 1rem; }
      .wa-galaxy-info em { color: #98a8c0; font-style: normal; font-size: 0.82rem; }
      .wa-galaxy-hint { color: #7080a0; }
      .wa-galaxy-close {
        margin-top: 10px; padding: 8px 18px;
        background: rgba(80,120,180,0.25); color: #d0e0ff;
        border: 1px solid rgba(120,160,220,0.4); border-radius: 6px;
        cursor: pointer; font-size: 0.9rem;
      }
      .wa-galaxy-close:hover { background: rgba(100,140,200,0.4); }
    `;
    document.head.appendChild(style);
  }
}
