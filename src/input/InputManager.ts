export type KeyBinding =
  | 'forward'
  | 'back'
  | 'left'
  | 'right'
  | 'jump'
  | 'sprint';

const KEY_MAP: Record<string, KeyBinding> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'jump',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
};

export class InputManager {
  private readonly keys = new Set<KeyBinding>();
  private mouseDx = 0;
  private mouseDy = 0;
  private firePressed = false;
  private pointerLocked = false;
  private readonly target: HTMLElement;
  private readonly listeners = new Set<() => void>();

  constructor(target: HTMLElement) {
    this.target = target;
    this.attach();
  }

  private attach(): void {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('blur', this.clearAll);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('blur', this.clearAll);
  }

  private clearAll = (): void => {
    this.keys.clear();
    this.mouseDx = 0;
    this.mouseDy = 0;
    this.firePressed = false;
  };

  private onKeyDown = (event: KeyboardEvent): void => {
    const binding = KEY_MAP[event.code];
    if (binding) {
      this.keys.add(binding);
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    const binding = KEY_MAP[event.code];
    if (binding) {
      this.keys.delete(binding);
      event.preventDefault();
    }
  };

  private onMouseMove = (event: MouseEvent): void => {
    if (!this.pointerLocked) return;
    this.mouseDx += event.movementX;
    this.mouseDy += event.movementY;
  };

  private onMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) return;
    if (!this.pointerLocked) return;
    this.firePressed = true;
  };

  private onPointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.target;
    if (!this.pointerLocked) {
      this.clearAll();
    }
    for (const cb of this.listeners) cb();
  };

  onLockChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  requestPointerLock(): void {
    if (this.pointerLocked) return;
    try {
      this.target.requestPointerLock();
    } catch {
      // ignore
    }
  }

  releasePointerLock(): void {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  isLocked(): boolean {
    return this.pointerLocked;
  }

  isDown(binding: KeyBinding): boolean {
    return this.keys.has(binding);
  }

  consumeMouseDelta(): { dx: number; dy: number } {
    const delta = { dx: this.mouseDx, dy: this.mouseDy };
    this.mouseDx = 0;
    this.mouseDy = 0;
    return delta;
  }

  consumeFire(): boolean {
    const fired = this.firePressed;
    this.firePressed = false;
    return fired;
  }
}
