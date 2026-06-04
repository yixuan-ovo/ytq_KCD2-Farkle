import themesJson from './diceThemes.json';
import { DIE_REGISTRY } from '$lib/game/diceRegistry';

export type DiceIconName =
  | 'crown'
  | 'clover'
  | 'devil'
  | 'halo'
  | 'cross'
  | 'king'
  | 'tooth'
  | 'horse'
  | 'wheel'
  | 'skull'
  | 'star'
  | 'paint'
  | 'pie'
  | 'book'
  | 'coin'
  | 'strip'
  | 'scales'
  | 'weight'
  | 'arrowDown'
  | 'number3';

export interface DiceTheme {
  fill: string;
  border: string;
  pip: string;
  icon: DiceIconName;
}

export const DICE_THEMES = themesJson as Record<string, DiceTheme>;

export const DICE_THEME_IDS = Object.keys(DICE_THEMES);

export function getDiceTheme(dieType: string): DiceTheme {
  return DICE_THEMES[dieType] ?? DICE_THEMES['NormalDie']!;
}

/** registry 中每种骰子都应有主题 */
export function assertThemesCoverRegistry(): void {
  for (const id of Object.keys(DIE_REGISTRY)) {
    if (!DICE_THEMES[id]) {
      throw new Error(`Missing dice theme for ${id}`);
    }
  }
}
