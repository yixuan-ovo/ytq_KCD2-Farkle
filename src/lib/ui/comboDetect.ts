import type { DieFace } from '$lib/game/types';
import { detectStraight } from '$lib/game/scoring';

export type ComboType =
  | 'straight'
  | 'full_house'
  | 'three_of_a_kind'
  | 'four_of_a_kind'
  | 'five_of_a_kind'
  | 'six_of_a_kind'
  | null;

function countNormals(values: DieFace[]): Map<Exclude<DieFace, 0>, number> {
  const map = new Map<Exclude<DieFace, 0>, number>();
  for (const v of values) {
    if (v === 0) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return map;
}

/**
 * 从当前选中骰子推断展示用组合类型（仅 UI，非权威计分）。
 */
export function detectCombo(values: DieFace[]): ComboType {
  if (values.length === 0) return null;

  if (values.length >= 5 && detectStraight(values) > 0) {
    return 'straight';
  }

  const jokers = values.filter((v) => v === 0).length;
  const normals = countNormals(values);
  const counts = [...normals.values()].sort((a, b) => b - a);
  const maxNormal = counts[0] ?? 0;

  if (values.length >= 5) {
    const canFullHouse =
      (maxNormal >= 3 && counts.includes(2)) ||
      (maxNormal >= 3 && jokers >= 2) ||
      (maxNormal >= 2 && jokers >= 1 && counts.length >= 2);
    if (canFullHouse && values.length === 5) return 'full_house';
  }

  const effectiveMax = maxNormal + jokers;
  if (effectiveMax >= 6) return 'six_of_a_kind';
  if (effectiveMax >= 5) return 'five_of_a_kind';
  if (effectiveMax >= 4) return 'four_of_a_kind';
  if (effectiveMax >= 3) return 'three_of_a_kind';

  return null;
}
