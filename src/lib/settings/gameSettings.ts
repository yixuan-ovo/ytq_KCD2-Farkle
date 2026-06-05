const STORAGE_KEY = 'kcd2-farkle-settings';

export interface GameSettings {
  sfx: boolean;
  music: boolean;
  sfxVolume: number;
  musicVolume: number;
  /** 掷骰物理动画（Pixi + Matter） */
  physicsEnabled: boolean;
}

const DEFAULTS: GameSettings = {
  sfx: true,
  music: true,
  sfxVolume: 80,
  musicVolume: 60,
  physicsEnabled: true,
};

export function loadGameSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<GameSettings>;
    return { ...DEFAULTS, ...parsed };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveGameSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export function isPhysicsEnabled(): boolean {
  return loadGameSettings().physicsEnabled;
}
