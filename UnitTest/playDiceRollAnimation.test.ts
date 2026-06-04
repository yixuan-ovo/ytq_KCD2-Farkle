import { describe, expect, it } from 'vitest';
import {
  ROLL_DURATION_MS,
  ROLL_FLY_MS,
  ROLL_GATHER_MS,
  ROLL_SETTLE_MS,
  randomFlyOffset,
  randomRotation,
} from '../src/lib/ui/animation';

describe('roll animation constants', () => {
  it('total duration equals sum of stages', () => {
    expect(ROLL_DURATION_MS).toBe(ROLL_GATHER_MS + ROLL_FLY_MS + ROLL_SETTLE_MS);
    expect(ROLL_DURATION_MS).toBe(850);
  });
});

describe('randomFlyOffset', () => {
  it('stays within desktop range of slot center', () => {
    const slotX = 100;
    const slotY = 80;
    for (let i = 0; i < 40; i++) {
      const { x, y } = randomFlyOffset(slotX, slotY, false);
      expect(x).toBeGreaterThanOrEqual(slotX - 75);
      expect(x).toBeLessThanOrEqual(slotX + 75);
      expect(y).toBeGreaterThanOrEqual(slotY - 75);
      expect(y).toBeLessThanOrEqual(slotY + 75);
    }
  });

  it('uses smaller range on mobile', () => {
    const slotX = 50;
    const slotY = 50;
    let maxDx = 0;
    let maxDy = 0;
    for (let i = 0; i < 40; i++) {
      const { x, y } = randomFlyOffset(slotX, slotY, true);
      maxDx = Math.max(maxDx, Math.abs(x - slotX));
      maxDy = Math.max(maxDy, Math.abs(y - slotY));
    }
    expect(maxDx).toBeLessThanOrEqual(30);
    expect(maxDy).toBeLessThanOrEqual(30);
  });
});

describe('randomRotation', () => {
  it('returns degrees between 720 and 1440', () => {
    for (let i = 0; i < 20; i++) {
      const r = randomRotation();
      expect(r).toBeGreaterThanOrEqual(720);
      expect(r).toBeLessThan(1440);
    }
  });
});
