import { describe, expect, it } from 'vitest';
import {
  getFaceWeightPercents,
  getFaceWeightVisuals,
  getWeightTiers,
} from '../src/lib/game/weightTiers';

describe('getWeightTiers', () => {
  it('marks highest and second-highest weight tiers for Alanka pattern', () => {
    const tiers = getWeightTiers([29, 5, 29, 5, 29, 5]);
    expect(tiers).toEqual(['high', 'mid', 'high', 'mid', 'high', 'mid']);
  });

  it('treats zero weights as low', () => {
    const tiers = getWeightTiers([46, 8, 23, 23, 0, 0]);
    expect(tiers[4]).toBe('low');
    expect(tiers[5]).toBe('low');
    expect(tiers[0]).toBe('high');
  });

  it('handles weighted die with one dominant face', () => {
    const tiers = getWeightTiers([67, 7, 7, 7, 7, 7]);
    expect(tiers[0]).toBe('high');
    expect(tiers.slice(1).every((t) => t === 'mid')).toBe(true);
  });
});

describe('getFaceWeightVisuals', () => {
  it('marks zero weight as blocked and dominant as boost', () => {
    const visuals = getFaceWeightVisuals([46, 8, 23, 23, 0, 0]);
    expect(visuals[0]).toBe('boost');
    expect(visuals[4]).toBe('blocked');
    expect(visuals[5]).toBe('blocked');
  });
});

describe('getFaceWeightPercents', () => {
  it('sums to 100 for PieDie pattern', () => {
    const p = getFaceWeightPercents([46, 8, 23, 23, 0, 0]);
    expect(p.reduce((a, b) => a + b, 0)).toBe(100);
    expect(p[4]).toBe(0);
  });
});
