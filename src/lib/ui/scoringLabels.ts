import type { ComboType } from './comboDetect';

const LABELS: Record<NonNullable<ComboType>, string> = {
  straight: '顺子!',
  full_house: '葫芦!',
  three_of_a_kind: '三个骰子相同!',
  four_of_a_kind: '四个骰子相同!',
  five_of_a_kind: '五个骰子相同!',
  six_of_a_kind: '六个骰子相同!',
};

export function comboLabel(combo: ComboType): string {
  if (!combo) return '';
  return LABELS[combo];
}
