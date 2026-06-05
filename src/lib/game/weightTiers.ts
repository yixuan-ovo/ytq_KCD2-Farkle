import type { DieDefinition } from './diceRegistry';

export type WeightTier = 'high' | 'mid' | 'low';

/** 选骰界面六面视觉档位（相对权重 + 0 权重） */
export type FaceWeightVisual = 'blocked' | 'boost' | 'normal' | 'weak';

/** 六面权重 → 每面概率档位（最高 / 次高 / 其余） */
export function getWeightTiers(weights: readonly number[]): WeightTier[] {
  const unique = [...new Set(weights)].filter((w) => w > 0).sort((a, b) => b - a);
  const highVal = unique[0];
  const midVal = unique[1];

  return weights.map((w) => {
    if (w <= 0) return 'low';
    if (highVal !== undefined && w === highVal) return 'high';
    if (midVal !== undefined && w === midVal) return 'mid';
    return 'low';
  });
}

function parseHex(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[clamp(r), clamp(g), clamp(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** 基于骰子主题色生成三档面色 */
export function shadeColor(baseHex: string, tier: WeightTier): string {
  const [r, g, b] = parseHex(baseHex);
  switch (tier) {
    case 'high':
      return toHex(r + (255 - r) * 0.35, g + (255 - g) * 0.35, b + (255 - b) * 0.35);
    case 'mid':
      return toHex(r, g, b);
    case 'low':
      return toHex(r * 0.55, g * 0.55, b * 0.55);
  }
}

export function getFaceColors(def: DieDefinition): string[] {
  const tiers = getWeightTiers(def.weights);
  return tiers.map((tier) => shadeColor(def.color, tier));
}

export function getFaceWeightVisuals(weights: readonly number[]): FaceWeightVisual[] {
  const tiers = getWeightTiers(weights);
  return weights.map((w, i) => {
    if (w <= 0) return 'blocked';
    const tier = tiers[i]!;
    if (tier === 'high') return 'boost';
    if (tier === 'low') return 'weak';
    return 'normal';
  });
}

/** 格式化为图鉴用的一位小数百分比（与 docs/dice/骰子概率+描述.md 对齐） */
export function formatFaceWeightPercent(weights: readonly number[], idx: number): string {
  const w = weights[idx];
  if (w == null || w <= 0) return '—';
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return '0%';
  const p = Math.round((w / sum) * 1000) / 10;
  return Number.isInteger(p) ? `${p}%` : `${p.toFixed(1)}%`;
}

/** 六面相对出率（整数百分比，最大余数法分配，总和 100） */
export function getFaceWeightPercents(weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  const raw = weights.map((w) => (w / sum) * 100);
  const floors = raw.map((p) => Math.floor(p));
  let remaining = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw
    .map((p, i) => ({ i, frac: p - Math.floor(p) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  const result = [...floors];
  for (let k = 0; k < remaining; k++) {
    const idx = order[k]?.i;
    if (idx === undefined) break;
    result[idx] = (result[idx] ?? 0) + 1;
  }
  return result;
}
