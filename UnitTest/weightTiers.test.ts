import { describe, expect, it } from 'vitest';
import {
  formatFaceWeightPercent,
  getFaceWeightPercents,
  getFaceWeightVisuals,
  getWeightTiers,
} from '../src/lib/game/weightTiers';

describe('getWeightTiers', () => {
  it('marks highest and second-highest weight tiers for Alanka pattern', () => {
    const tiers = getWeightTiers([286, 48, 286, 48, 286, 48]);
    expect(tiers).toEqual(['high', 'mid', 'high', 'mid', 'high', 'mid']);
  });

  it('treats zero weights as low', () => {
    const tiers = getWeightTiers([462, 77, 231, 231, 0, 0]);
    expect(tiers[4]).toBe('low');
    expect(tiers[5]).toBe('low');
    expect(tiers[0]).toBe('high');
  });

  it('handles weighted die with one dominant face', () => {
    const tiers = getWeightTiers([667, 67, 67, 67, 67, 67]);
    expect(tiers[0]).toBe('high');
    expect(tiers.slice(1).every((t) => t === 'mid')).toBe(true);
  });
});

describe('getFaceWeightVisuals', () => {
  it('marks zero weight as blocked and dominant as boost', () => {
    const visuals = getFaceWeightVisuals([462, 77, 231, 231, 0, 0]);
    expect(visuals[0]).toBe('boost');
    expect(visuals[4]).toBe('blocked');
    expect(visuals[5]).toBe('blocked');
  });
});

describe('getFaceWeightPercents', () => {
  it('sums to 100 for PieDie pattern', () => {
    const p = getFaceWeightPercents([462, 77, 231, 231, 0, 0]);
    expect(p.reduce((a, b) => a + b, 0)).toBe(100);
    expect(p[4]).toBe(0);
  });

  it('distributes evenly for equal weights (no single-face drift)', () => {
    const p = getFaceWeightPercents([167, 167, 167, 167, 167, 167]);
    expect(p.every((v) => v === 16 || v === 17)).toBe(true);
    expect(p.reduce((a, b) => a + b, 0)).toBe(100);
  });
});

describe('formatFaceWeightPercent', () => {
  it('shows 16.7% for fair dice faces', () => {
    const w = [167, 167, 167, 167, 167, 167];
    for (let i = 0; i < 6; i++) {
      expect(formatFaceWeightPercent(w, i)).toBe('16.7%');
    }
  });

  it('shows integer percent without decimal when exact', () => {
    expect(formatFaceWeightPercent([400, 400, 50, 50, 50, 50], 0)).toBe('40%');
  });
});
