import { describe, expect, it } from 'vitest';
import {
  getDieFaceUrl,
  getPlaceholderFaceUrl,
  getThemedFaceUrl,
} from '../src/lib/assets/diceTextures';

describe('themed dice textures', () => {
  it('resolves placeholder hidden face per die type', () => {
    expect(getPlaceholderFaceUrl('ArankaDie')).toContain('dice/ArankaDie/face-hidden.svg');
    expect(getPlaceholderFaceUrl('MolarDie')).toContain('dice/MolarDie/face-hidden.svg');
  });

  it('resolves numbered faces per die type', () => {
    expect(getThemedFaceUrl('GrozavLuckyDie', 2)).toContain('dice/GrozavLuckyDie/face-2.svg');
  });

  it('resolves devil face for value 0', () => {
    expect(getDieFaceUrl({ value: 0, type: 'DevilDie' })).toContain('dice/DevilDie/face-devil.svg');
  });

  it('falls back to NormalDie for unknown type', () => {
    expect(getDieFaceUrl({ value: 3, type: 'NotADie' })).toContain('dice/NormalDie/face-3.svg');
  });
});
