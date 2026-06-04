import type { DieFace } from './types';

// ─────────────────────────────────────────────
//  内部工具
// ─────────────────────────────────────────────

/** 统计各面值出现次数，face=0（恶魔头）单独处理 */
function countFaces(values: DieFace[]): Map<DieFace, number> {
  const map = new Map<DieFace, number>();
  for (const v of values) {
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return map;
}

// ─────────────────────────────────────────────
//  顺子检测
// ─────────────────────────────────────────────

const STRAIGHT_PATTERNS: { pattern: DieFace[]; score: number }[] = [
  { pattern: [1, 2, 3, 4, 5, 6], score: 1500 },
  { pattern: [1, 2, 3, 4, 5], score: 500 },
  { pattern: [2, 3, 4, 5, 6], score: 750 },
];

/**
 * 判断 values 能否用明确点数 + 恶魔百搭(0) 凑成指定顺子（枚数须一致）。
 */
function canFormStraight(values: DieFace[], pattern: DieFace[]): boolean {
  if (values.length !== pattern.length) return false;

  const pool = [...values];
  for (const face of pattern) {
    const exactIdx = pool.indexOf(face);
    if (exactIdx !== -1) {
      pool.splice(exactIdx, 1);
      continue;
    }
    const jokerIdx = pool.indexOf(0);
    if (jokerIdx !== -1) {
      pool.splice(jokerIdx, 1);
      continue;
    }
    return false;
  }
  return pool.length === 0;
}

/** 全部骰子恰好构成一种顺子时返回分数，否则 0 */
function scoreStraightIfExact(values: DieFace[]): number {
  for (const { pattern, score } of STRAIGHT_PATTERNS) {
    if (values.length === pattern.length && canFormStraight(values, pattern)) {
      return score;
    }
  }
  return 0;
}

/**
 * 检测是否构成顺子（恶魔百搭可代替顺子中缺失的点数）。
 * 返回顺子分数，或 0（不构成顺子）。
 *
 * 规则：
 *   1-2-3-4-5       = 500
 *   2-3-4-5-6       = 750
 *   1-2-3-4-5-6     = 1500
 */
export function detectStraight(values: DieFace[]): number {
  return scoreStraightIfExact(values);
}

// ─────────────────────────────────────────────
//  核心计分函数
// ─────────────────────────────────────────────

/**
 * 计算一组骰子（已选中）的得分。
 *
 * 恶魔头（face=0）作为百搭，可凑三连/单枚 1·5，也可代替顺子 1-5 / 2-6 / 1-6 中的缺失点数。
 * 返回 { score, valid }：
 *   - score: 该组合得分
 *   - valid: 是否为有效得分组合（至少得 1 分）
 */
export function scoreSelection(values: DieFace[]): { score: number; valid: boolean } {
  if (values.length === 0) return { score: 0, valid: false };

  // 先尝试整组顺子（5 或 6 枚全部参与）
  if (values.length === 5 || values.length === 6) {
    const straightScore = detectStraight(values);
    if (straightScore > 0) return { score: straightScore, valid: true };
  }

  // 将恶魔头分开
  const jokers = values.filter(v => v === 0).length;
  const normals = values.filter(v => v !== 0) as Exclude<DieFace, 0>[];

  const score = computeScore(normals, jokers);
  return { score, valid: score > 0 };
}

/**
 * 在已知普通骰值和恶魔头数量的情况下，计算最优得分。
 * 恶魔头贪心策略：优先顺子，再凑三连/多连，其次凑单枚 1 或 5。
 */
function computeScore(normals: Exclude<DieFace, 0>[], jokers: number): number {
  if (jokers === 0) return computeScoreNoJokers(normals);

  const values: DieFace[] = [
    ...normals,
    ...Array(jokers).fill(0 as DieFace),
  ];

  if (values.length >= 5) {
    const straight = scoreStraightIfExact(values);
    if (straight > 0) return straight;
  }

  if (values.length === 6) {
    const extracted = tryExtractFiveStraightScore(values);
    if (extracted > 0) return extracted;
  }

  // 递归尝试：将 joker 当作每种可能的面值，取最大分
  let best = 0;
  for (const face of [1, 2, 3, 4, 5, 6] as Exclude<DieFace, 0>[]) {
    const score = computeScore([...normals, face], jokers - 1);
    if (score > best) best = score;
  }
  return best;
}

/** 无恶魔头时的纯计分逻辑 */
function computeScoreNoJokers(values: Exclude<DieFace, 0>[]): number {
  if (values.length === 0) return 0;

  // 5枚及以上：先整体尝试顺子
  if (values.length >= 5) {
    const straight = detectStraight(values as DieFace[]);
    if (straight > 0) return straight;
  }

  // ── 关键修复 ────────────────────────────────────────────────────────────
  // 当选中 6 枚骰子时，可能是"5枚顺子 + 1枚单只"的复合组合。
  // 例如 {1,1,2,3,4,5} = 顺子(1-2-3-4-5)500 + 单1(100) = 600。
  // 若不做此处理，下方面值计数循环会因为 face=2/3/4 单独得分为0而整体拒绝。
  if (values.length === 6) {
    const extracted = tryExtractFiveStraightScore(values as DieFace[]);
    if (extracted > 0) return extracted;
  }
  // ────────────────────────────────────────────────────────────────────────

  const counts = countFaces(values as DieFace[]);
  let score = 0;

  for (const [face, count] of counts.entries()) {
    if (face === 0) continue; // 不应出现
    const faceScore = scoreForFaceCount(face as Exclude<DieFace, 0>, count);
    // 所有选中的骰子都必须参与得分，不能包含不得分的骰子
    if (faceScore === 0) return 0;
    score += faceScore;
  }
  return score;
}

/**
 * 尝试从 6 枚骰子中提取一个 5 连顺子，剩余 1 枚单独计分。
 * 若成立返回总分，否则返回 0。
 *
 * 处理场景：
 *   {1,1,2,3,4,5} = 顺子(1-2-3-4-5) 500 + 单1 100 = 600
 *   {1,2,3,4,5,5} = 顺子(1-2-3-4-5) 500 + 单5  50 = 550
 *   {1,2,3,4,5,6} 已在 detectStraight 中处理（1500），不会到达此处
 */
function tryExtractFiveStraightScore(values: DieFace[]): number {
  const PATTERNS: [DieFace[], number][] = [
    [[1, 2, 3, 4, 5], 500],
    [[2, 3, 4, 5, 6], 750],
  ];

  for (const [pattern, patternScore] of PATTERNS) {
    const remainder = consumeStraightPattern([...values], pattern);
    if (!remainder || remainder.length !== 1) continue;

    const remScore = scoreSelection(remainder).score;
    if (remScore > 0) return patternScore + remScore;
  }
  return 0;
}

/**
 * 从 pool 中消耗顺子 pattern（明确点数优先，不足用恶魔百搭 0 补位）。
 * 成功返回剩余骰子，失败返回 null。
 */
function consumeStraightPattern(pool: DieFace[], pattern: DieFace[]): DieFace[] | null {
  const remaining = [...pool];
  for (const face of pattern) {
    const exactIdx = remaining.indexOf(face);
    if (exactIdx !== -1) {
      remaining.splice(exactIdx, 1);
      continue;
    }
    const jokerIdx = remaining.indexOf(0);
    if (jokerIdx !== -1) {
      remaining.splice(jokerIdx, 1);
      continue;
    }
    return null;
  }
  return remaining;
}

/**
 * 单种面值在给定数量下的得分：
 *   < 3：单枚规则（只有 1 和 5 得分）
 *   = 3：三连基础分
 *   > 3：三连基础分 × 2^(count-3)
 */
export function scoreForFaceCount(face: Exclude<DieFace, 0>, count: number): number {
  if (count <= 0) return 0;

  if (count < 3) {
    // 单枚只有 1(100分) 和 5(50分) 得分
    if (face === 1) return 100 * count;
    if (face === 5) return 50 * count;
    return 0;
  }

  // 三连基础分
  const base = face === 1 ? 1000 : face * 100;
  // 每多一枚翻倍：三连=base, 四连=base*2, 五连=base*4, 六连=base*8
  return base * Math.pow(2, count - 3);
}

// ─────────────────────────────────────────────
//  整组骰子的全部有效得分子集（用于验证选择合法性）
// ─────────────────────────────────────────────

/**
 * 判断一组骰子中是否存在至少一个有效得分组合。
 * 用于爆点检测（掷出的骰子完全无法得分）。
 */
export function hasAnyScore(values: DieFace[]): boolean {
  if (values.length === 0) return false;

  // 有 1 或 5 直接得分
  if (values.includes(1) || values.includes(5)) return true;

  // 检查是否有三连以上
  const counts = countFaces(values);
  for (const count of counts.values()) {
    if (count >= 3) return true;
  }

  // 检查顺子（含恶魔百搭）
  if (detectStraight(values) > 0) return true;

  if (values.includes(0)) {
    // 恶魔头可单独计分（百搭作 1 或 5），需检查非空子集
    const n = values.length;
    for (let mask = 1; mask < 1 << n; mask++) {
      const subset: DieFace[] = [];
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) subset.push(values[i]!);
      }
      if (scoreSelection(subset).valid) return true;
    }
  }

  return false;
}

/**
 * 验证玩家的选择是否合法（选中的骰子必须构成有效得分组合）。
 */
export function isValidSelection(selectedValues: DieFace[]): boolean {
  return scoreSelection(selectedValues).valid;
}
