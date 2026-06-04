import { describe, expect, it } from 'vitest';
import { rotationForFace, rotationForFaceDegrees } from '../src/lib/pixi/diceOrientation';

describe('diceOrientation', () => {
  it('assigns stable rotation per face', () => {
    expect(rotationForFace(1)).toBe(0);
    expect(rotationForFace(0)).toBe(rotationForFace(1));
    expect(rotationForFaceDegrees(3)).toBeCloseTo(120, 5);
  });
});
