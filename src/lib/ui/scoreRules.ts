/** 标准 Farkle 得分表（UI 展示） */

export interface ScoreRuleRow {
  dice: string;
  points: number;
}

export const SCORE_RULES: ScoreRuleRow[] = [
  { dice: '1', points: 100 },
  { dice: '5', points: 50 },
  { dice: '三个 1', points: 1000 },
  { dice: '三个 2', points: 200 },
  { dice: '三个 3', points: 300 },
  { dice: '三个 4', points: 400 },
  { dice: '三个 5', points: 500 },
  { dice: '三个 6', points: 600 },
  { dice: '1-2-3-4-5', points: 500 },
  { dice: '2-3-4-5-6', points: 750 },
  { dice: '1-2-3-4-5-6', points: 1500 },
];
