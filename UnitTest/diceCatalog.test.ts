import { describe, expect, it } from 'vitest';
import { DICE_DESCRIPTIONS, getDieDescription } from '../src/lib/game/diceDescriptions';
import { DIE_REGISTRY, getAllDice } from '../src/lib/game/diceRegistry';
import { getFaceWeightPercents } from '../src/lib/game/weightTiers';

function rawFacePercent(weights: readonly number[], faceIdx: number): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  return (weights[faceIdx]! / sum) * 100;
}

describe('dice catalog', () => {
  it('registry has 39 dice types', () => {
    expect(Object.keys(DIE_REGISTRY)).toHaveLength(39);
    expect(getAllDice()).toHaveLength(39);
  });

  it('every registry die has a description', () => {
    for (const die of getAllDice()) {
      expect(DICE_DESCRIPTIONS[die.id], `${die.id} missing description`).toBeTruthy();
      expect(getDieDescription(die.id).length).toBeGreaterThan(0);
    }
  });

  it('descriptions map has no orphan keys', () => {
    for (const id of Object.keys(DICE_DESCRIPTIONS)) {
      expect(DIE_REGISTRY[id], `orphan description key ${id}`).toBeDefined();
    }
  });

  it('includes new dice FriarDie, PearlDie, TengriDie', () => {
    expect(DIE_REGISTRY.FriarDie?.name).toBe('修士骰子');
    expect(DIE_REGISTRY.PearlDie?.name).toBe('珍珠母骰子');
    expect(DIE_REGISTRY.TengriDie?.name).toBe('腾格里骰子');
  });

  it('EvilOneDie face 6 is about 28.6%', () => {
    expect(rawFacePercent(DIE_REGISTRY.EvilOneDie.weights, 5)).toBeCloseTo(28.6, 0);
  });

  it('HolyTrinityDie face 3 is about 36.8%', () => {
    expect(rawFacePercent(DIE_REGISTRY.HolyTrinityDie.weights, 2)).toBeCloseTo(36.8, 0);
  });

  it('StAntiochDie face 3 is about 40%', () => {
    expect(rawFacePercent(DIE_REGISTRY.StAntiochDie.weights, 2)).toBeCloseTo(40, 0);
  });

  it('GrozavLuckyDie face 2 is about 66.7%', () => {
    expect(rawFacePercent(DIE_REGISTRY.GrozavLuckyDie.weights, 1)).toBeCloseTo(66.7, 0);
  });

  it('WeightedDie face 1 is about 66.7%', () => {
    expect(rawFacePercent(DIE_REGISTRY.WeightedDie.weights, 0)).toBeCloseTo(66.7, 0);
  });

  it('display percents sum to 100', () => {
    for (const die of getAllDice()) {
      const pct = getFaceWeightPercents(die.weights);
      expect(pct.reduce((a, b) => a + b, 0)).toBe(100);
    }
  });
});
