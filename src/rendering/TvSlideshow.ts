import * as THREE from 'three';

/** Photos in `public/TV-Slides/` — shown in order when the Dubai villa TV is on. */
const TV_SLIDE_FILES = [
  'DSC00117.JPG',
  'DSC00143.JPG',
  'DSC00145.JPG',
  'DSC00166.JPG',
  'DSC00173.JPG',
  'DSC00187.JPG',
  'DSC00188.JPG',
  'DSC00193.JPG',
  'DSC00204.JPG',
  'DSC00214.JPG',
  'DSC00218.JPG',
  'DSC00243.JPG',
  'IMG_0088.JPG',
  'IMG_0341.JPG',
  'IMG_0379.JPG',
  'IMG_0386.JPG',
  'IMG_9300.JPG',
  'IMG_9643.JPG',
  'IMG_9920.JPG',
] as const;

const SLIDE_INTERVAL_SEC = 5;

/**
 * Cycles `public/TV-Slides` photos on the villa TV screen (5 s per slide).
 */
export class TvSlideshow {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly texture: THREE.CanvasTexture;
  private readonly onMaterial: THREE.MeshBasicMaterial;
  private images: HTMLImageElement[] = [];
  private loadPromise: Promise<void> | null = null;
  private slideIndex = 0;
  private elapsed = 0;
  private playing = false;
  private offMaterial: THREE.Material | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 576;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('TvSlideshow: 2D context unavailable');
    this.ctx = ctx;
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.onMaterial = new THREE.MeshBasicMaterial({ map: this.texture });
  }

  private loadImages(): Promise<void> {
    if (this.images.length > 0) return Promise.resolve();
    if (this.loadPromise) return this.loadPromise;

    const base = `${import.meta.env.BASE_URL}TV-Slides/`;
    this.loadPromise = Promise.all(
      TV_SLIDE_FILES.map(
        (file) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Failed to load TV slide: ${file}`));
            img.src = base + encodeURIComponent(file);
          }),
      ),
    )
      .then((loaded) => {
        this.images = loaded;
      })
      .catch((err) => {
        console.warn(err);
        this.images = [];
      });

    return this.loadPromise;
  }

  async start(screen: THREE.Mesh): Promise<void> {
    await this.loadImages();
    if (!this.offMaterial) {
      const current = screen.material;
      this.offMaterial = Array.isArray(current) ? current[0] : current;
    }
    this.playing = true;
    this.slideIndex = 0;
    this.elapsed = 0;
    this.drawCurrentSlide();
    screen.material = this.onMaterial;
  }

  stop(screen: THREE.Mesh): void {
    this.playing = false;
    this.elapsed = 0;
    if (this.offMaterial) {
      screen.material = this.offMaterial;
    }
  }

  update(dt: number): void {
    if (!this.playing || this.images.length === 0) return;
    this.elapsed += dt;
    if (this.elapsed < SLIDE_INTERVAL_SEC) return;
    this.elapsed -= SLIDE_INTERVAL_SEC;
    this.slideIndex = (this.slideIndex + 1) % this.images.length;
    this.drawCurrentSlide();
  }

  private drawCurrentSlide(): void {
    if (this.images.length === 0) return;
    const img = this.images[this.slideIndex];
    const cw = this.canvas.width;
    const ch = this.canvas.height;
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(0, 0, cw, ch);
    const scale = Math.min(cw / img.width, ch / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    this.ctx.drawImage(img, (cw - dw) * 0.5, (ch - dh) * 0.5, dw, dh);
    this.texture.needsUpdate = true;
  }

  dispose(): void {
    this.playing = false;
    this.texture.dispose();
    this.onMaterial.dispose();
    this.images = [];
    this.loadPromise = null;
    this.offMaterial = null;
  }
}
