import { describe, expect, it } from 'vitest';
import {
  getCatalogFaceUrl,
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

  it('maps DevilDie wildcard face 1 to devil asset', () => {
    expect(getThemedFaceUrl('DevilDie', 1)).toContain('dice/DevilDie/face-devil.svg');
    expect(getDieFaceUrl({ value: 1, type: 'DevilDie' })).toContain('dice/DevilDie/face-devil.svg');
  });

  it('catalog preview uses devil for DevilDie wildcard face', () => {
    expect(getCatalogFaceUrl('DevilDie', 1)).toContain('dice/DevilDie/face-devil.svg');
    expect(getCatalogFaceUrl('DevilDie', 2)).toContain('dice/ivory/face-2.svg');
  });

  it('falls back to NormalDie for unknown type', () => {
    expect(getDieFaceUrl({ value: 3, type: 'NotADie' })).toContain('dice/NormalDie/face-3.svg');
  });
});
