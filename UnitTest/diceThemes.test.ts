import { describe, expect, it } from 'vitest';
import { DIE_REGISTRY } from '../src/lib/game/diceRegistry';
import { assertThemesCoverRegistry, DICE_THEMES, getDiceTheme } from '../src/lib/assets/diceThemes';

describe('diceThemes', () => {
  it('covers every die in registry', () => {
    expect(() => assertThemesCoverRegistry()).not.toThrow();
    expect(Object.keys(DICE_THEMES).length).toBeGreaterThanOrEqual(Object.keys(DIE_REGISTRY).length);
  });

  it('falls back to NormalDie for unknown types', () => {
    expect(getDiceTheme('UnknownDie').icon).toBe('crown');
  });

  it('DevilDie uses devil icon', () => {
    expect(getDiceTheme('DevilDie').icon).toBe('devil');
  });

  it('TengriDie uses wheel icon', () => {
    expect(getDiceTheme('TengriDie').icon).toBe('wheel');
  });

  it('PearlDie uses star icon', () => {
    expect(getDiceTheme('PearlDie').icon).toBe('star');
  });

  it('FriarDie uses cross icon', () => {
    expect(getDiceTheme('FriarDie').icon).toBe('cross');
  });
});
