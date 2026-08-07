export type KeyBinding =
  | 'forward'
  | 'back'
  | 'left'
  | 'right'
  | 'jump'
  | 'sprint'
  | 'descend';

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
  ControlLeft: 'descend',
  ControlRight: 'descend',
};

export class InputManager {
  private readonly keys = new Set<KeyBinding>();
  private mouseDx = 0;
  private mouseDy = 0;
  private firePressed = false;
  private weaponSelect: number | null = null;
  private weaponScroll = 0;
  private interactPressed = false;
  private pausePressed = false;
  private mutePressed = false;
  private cameraTogglePressed = false;
  private galaxyMapPressed = false;
  private boardShipPressed = false;
  private pointerLocked = false;
  /** Re-request lock after an in-flight unlock (release then request race). */
  private pendingPointerLock = false;
  /** True between exitPointerLock() and the matching pointerlockchange. */
  private releasingPointerLock = false;
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
    window.addEventListener('wheel', this.onWheel, { passive: false });
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('blur', this.clearAll);
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('wheel', this.onWheel);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('blur', this.clearAll);
  }

  private clearAll = (): void => {
    this.keys.clear();
    this.mouseDx = 0;
    this.mouseDy = 0;
    this.firePressed = false;
    this.weaponSelect = null;
    this.weaponScroll = 0;
    this.interactPressed = false;
    this.pausePressed = false;
    this.mutePressed = false;
    this.cameraTogglePressed = false;
    this.galaxyMapPressed = false;
    this.boardShipPressed = false;
  };

  private isTypingTarget(event: KeyboardEvent): boolean {
    const el = event.target;
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    if (this.isTypingTarget(event)) return;

    const binding = KEY_MAP[event.code];
    if (binding) {
      this.keys.add(binding);
      event.preventDefault();
      return;
    }
    if (event.code === 'Digit1') this.weaponSelect = 0;
    else if (event.code === 'Digit2') this.weaponSelect = 1;
    else if (event.code === 'Digit3') this.weaponSelect = 2;
    else if (event.code === 'Digit4') this.weaponSelect = 3;
    else if (event.code === 'KeyE') {
      this.interactPressed = true;
      event.preventDefault();
    } else if (event.code === 'Escape') {
      this.pausePressed = true;
    } else if (event.code === 'KeyM') {
      this.mutePressed = true;
    } else if (event.code === 'KeyV') {
      this.cameraTogglePressed = true;
    } else if (event.code === 'KeyF') {
      this.boardShipPressed = true;
      event.preventDefault();
    } else if (event.code === 'Tab') {
      this.galaxyMapPressed = true;
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent): void => {
    if (this.isTypingTarget(event)) return;

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

  private onWheel = (event: WheelEvent): void => {
    if (!this.pointerLocked) return;
    if (event.deltaY > 0) this.weaponScroll += 1;
    else if (event.deltaY < 0) this.weaponScroll -= 1;
    event.preventDefault();
  };

  private onPointerLockChange = (): void => {
    this.pointerLocked = document.pointerLockElement === this.target;
    this.releasingPointerLock = false;
    if (this.pointerLocked) {
      this.pendingPointerLock = false;
    } else {
      this.clearAll();
      if (this.pendingPointerLock) {
        this.pendingPointerLock = false;
        try {
          this.target.requestPointerLock();
        } catch {
          // ignore
        }
      }
    }
    for (const cb of this.listeners) cb();
  };

  onLockChange(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  requestPointerLock(): void {
    if (document.pointerLockElement === this.target) {
      this.pointerLocked = true;
      // release() may still be in flight — re-lock once unlock completes.
      this.pendingPointerLock = this.releasingPointerLock;
      return;
    }
    this.pendingPointerLock = true;
    if (this.pointerLocked) return;
    try {
      this.target.requestPointerLock();
    } catch {
      // ignore
    }
  }

  releasePointerLock(): void {
    this.pendingPointerLock = false;
    if (document.pointerLockElement) {
      this.releasingPointerLock = true;
      document.exitPointerLock();
    } else {
      this.releasingPointerLock = false;
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

  consumeWeaponSelect(): number | null {
    const s = this.weaponSelect;
    this.weaponSelect = null;
    return s;
  }

  consumeWeaponScroll(): number {
    const s = this.weaponScroll;
    this.weaponScroll = 0;
    return s;
  }

  consumeInteract(): boolean {
    const pressed = this.interactPressed;
    this.interactPressed = false;
    return pressed;
  }

  /** Drop a queued E press without acting on it (e.g. stale press before prompt was shown). */
  flushInteract(): void {
    this.interactPressed = false;
  }

  consumePause(): boolean {
    const pressed = this.pausePressed;
    this.pausePressed = false;
    return pressed;
  }

  consumeMute(): boolean {
    const pressed = this.mutePressed;
    this.mutePressed = false;
    return pressed;
  }

  consumeCameraToggle(): boolean {
    const pressed = this.cameraTogglePressed;
    this.cameraTogglePressed = false;
    return pressed;
  }

  consumeGalaxyMap(): boolean {
    const pressed = this.galaxyMapPressed;
    this.galaxyMapPressed = false;
    return pressed;
  }

  consumeBoardShip(): boolean {
    const pressed = this.boardShipPressed;
    this.boardShipPressed = false;
    return pressed;
  }
}
