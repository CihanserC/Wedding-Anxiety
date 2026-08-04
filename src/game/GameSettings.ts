export interface GameSettings {
  mouseSensitivity: number;
  sfxVolume: number;
  musicVolume: number;
  muted: boolean;
}

const STORAGE_KEY = 'wa-settings-v1';

const DEFAULTS: GameSettings = {
  mouseSensitivity: 0.0022,
  sfxVolume: 0.35,
  musicVolume: 0.12,
  muted: false,
};

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return {
      mouseSensitivity: clamp(parsed.mouseSensitivity ?? DEFAULTS.mouseSensitivity, 0.0008, 0.006),
      sfxVolume: clamp(parsed.sfxVolume ?? DEFAULTS.sfxVolume, 0, 1),
      musicVolume: clamp(parsed.musicVolume ?? DEFAULTS.musicVolume, 0, 1),
      muted: parsed.muted ?? DEFAULTS.muted,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore quota / private mode
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
