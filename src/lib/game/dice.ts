import type { Die, DieFace, GameState } from './types';
import { hasAnyScore, scoreSelection } from './scoring';
import { getDieDefinition } from './diceRegistry';

// ─────────────────────────────────────────────
//  初始化
// ─────────────────────────────────────────────

/**
 * 创建初始 6 枚骰子。
 * @param specialDiceIds 玩家选择的特殊骰子定义 ID 列表（长度 0-3），
 *                       剩余位置自动填充 NormalDie。
 */
export function createDice(specialDiceIds: string[] = []): Die[] {
  // 特殊骰子放前面，普通骰子补齐到 6 枚
  const diceTypes: string[] = [
    ...specialDiceIds,
    ...Array(6 - specialDiceIds.length).fill('NormalDie'),
  ];
  return diceTypes.map((typeId, i) => ({
    id: i,
    value: 1 as DieFace,
    type: typeId,
    kept: false,
    active: true,
  }));
}

// ─────────────────────────────────────────────
//  掷骰
// ─────────────────────────────────────────────

/**
 * 使用给定随机种子，为当前未 kept 且 active 的骰子生成新面值。
 * 种子通过 Commit-Reveal 协议由双方共同确定，保证公平。
 *
 * 恶魔骰子：掷出1时自动替换为恶魔之首(face=0)。
 * 普通骰子：永远只执1-6。
 */
export function rollDice(
  dice: Die[],
  seed: number,
): Die[] {
  let rng = seed >>> 0;

  return dice.map(die => {
    if (die.kept || !die.active) return die;

    rng = lcgNext(rng);
    const def = getDieDefinition(die.type);
    let value = weightedRoll(rng, def.weights);

    // 百搭面处理：若骰子定义有 wildcardFace 且掷出该面，替换为 face=0
    if (def.wildcardFace !== undefined && value === def.wildcardFace) {
      value = 0 as DieFace;
    }

    return { ...die, value };
  });
}

/**
 * 加权掷骰：根据六面权重随机选择一面。
 * weights[i] 对应面值 i+1 的相对概率。
 */
export function weightedRoll(rng: number, weights: [number, number, number, number, number, number]): DieFace {
  const total = weights.reduce((a, b) => a + b, 0);
  if (total <= 0) return 1 as DieFace; // 安全回退
  // 取 rng 的低位部分映射到 [0, total)
  const r = ((rng >>> 0) % total);
  let acc = 0;
  for (let i = 0; i < 6; i++) {
    acc += weights[i];
    if (r < acc) return (i + 1) as DieFace;
  }
  return 6 as DieFace; // 数值安全兜底
}

/** LCG 参数（Knuth MMIX） */
function lcgNext(state: number): number {
  // 使用 BigInt 避免 JS 整数溢出，然后截断到 32 位
  const s = BigInt(state >>> 0);
  const result = (s * 6364136223846793005n + 1442695040888963407n) & 0xFFFFFFFFn;
  return Number(result);
}

// ─────────────────────────────────────────────
//  爆点检测
// ─────────────────────────────────────────────

/**
 * 判断当前掷出结果是否爆点（Bust）。
 * 爆点条件：所有 active 且未 kept 的骰子均无法得分。
 */
export function isBust(dice: Die[]): boolean {
  const rolledValues = dice
    .filter(d => d.active && !d.kept)
    .map(d => d.value);
  return !hasAnyScore(rolledValues);
}

// ─────────────────────────────────────────────
//  满盘检测（Hot Dice）
// ─────────────────────────────────────────────

/**
 * 判断是否达成 Hot Dice（6枚骰子全部被 kept）。
 * 满足条件时，玩家可以重取全部 6 枚骰子继续掷。
 */
export function isHotDice(dice: Die[]): boolean {
  return dice.every(d => d.kept);
}

/**
 * Hot Dice 触发后重置骰子（全部 kept → active，清除 kept 状态）。
 * turnScore 继续叠加，不清零。
 */
export function resetDiceForHotDice(dice: Die[]): Die[] {
  return dice.map(d => ({ ...d, kept: false, active: true }));
}

// ─────────────────────────────────────────────
//  选择验证
// ─────────────────────────────────────────────

/**
 * 玩家选中一组骰子 id（toggleKeep），验证选择是否合法。
 * 返回选中骰子的得分。如果不合法返回 { valid: false, score: 0 }。
 */
export function evaluateSelection(
  dice: Die[],
  selectedIds: number[]
): { valid: boolean; score: number } {
  const selected = dice.filter(d => selectedIds.includes(d.id));
  const values = selected.map(d => d.value);
  const { score, valid } = scoreSelection(values);
  return { valid, score };
}

// ─────────────────────────────────────────────
//  回合操作
// ─────────────────────────────────────────────

/**
 * 将选中的骰子标记为 kept，累加 turnScore。
 */
export function keepDice(state: GameState, selectedIds: number[]): GameState {
  const ids = selectedIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id >= 0);
  if (ids.length === 0) return state;

  const pool = state.dice.filter((d) => d.active && !d.kept);
  const { valid, score } = evaluateSelection(pool, ids);
  if (!valid || score === 0) return state;

  const idSet = new Set(ids);
  const newDice = state.dice.map((d) => (idSet.has(d.id) ? { ...d, kept: true } : d));

  return {
    ...state,
    dice: newDice,
    turnScore: state.turnScore + score,
  };
}
