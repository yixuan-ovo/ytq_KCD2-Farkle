import { describe, expect, it } from 'vitest';
import { getPlaceholderFaceUrl } from '../src/lib/assets/diceTextures';

describe('getPlaceholderFaceUrl', () => {
  it('returns themed hidden SVG per die type', () => {
    expect(getPlaceholderFaceUrl('NormalDie')).toMatch(/dice\/NormalDie\/face-hidden\.svg$/);
    expect(getPlaceholderFaceUrl('DevilDie')).toMatch(/dice\/DevilDie\/face-hidden\.svg$/);
    expect(getPlaceholderFaceUrl('RollThreeDie')).toMatch(/dice\/RollThreeDie\/face-hidden\.svg$/);
  });
});
