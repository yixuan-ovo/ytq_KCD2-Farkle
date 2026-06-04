// ─────────────────────────────────────────────
//  骰子注册表 — 35 种骰子定义
//  权重参考：docs/game/dice-weights.json（权威定义在本文件）
// ─────────────────────────────────────────────

import type { DieFace } from './types';

// ── 分类标签 ──────────────────────────────────────
export type DieCategory = 'normal' | 'lucky' | 'evil' | 'holy' | 'trick' | 'special';

// ── 骰子定义 ──────────────────────────────────────
export interface DieDefinition {
  /** 唯一标识（英文键名） */
  id: string;
  /** 中文显示名 */
  name: string;
  /** 缩写名（2-3 字，用于游戏内骰子下方标签） */
  shortName: string;
  /** 六面权重 [面1, 面2, 面3, 面4, 面5, 面6]，数值越大概率越高 */
  weights: [number, number, number, number, number, number];
  /** 百搭面：命中该面值时替换为 face=0（恶魔之首）。仅 DevilDie 有此属性 */
  wildcardFace?: DieFace;
  /** 主题色（HEX），用于边框/光晕/标签背景 */
  color: string;
  /** 分类 */
  category: DieCategory;
}

// ── 注册表 ────────────────────────────────────────

export const DIE_REGISTRY: Record<string, DieDefinition> = {
  // ─── 普通 (normal) ──────────────────────────────
  NormalDie: {
    id: 'NormalDie',
    name: '普通骰子',
    shortName: '普通',
    weights: [17, 17, 17, 17, 17, 17],
    color: '#c8b888',
    category: 'normal',
  },
  HugoDie: {
    id: 'HugoDie',
    name: '雨果的骰子',
    shortName: '雨果',
    weights: [17, 17, 17, 17, 17, 17],
    color: '#b0a080',
    category: 'normal',
  },
  MolarDie: {
    id: 'MolarDie',
    name: '臼齿骰子',
    shortName: '臼齿',
    weights: [17, 17, 17, 17, 17, 17],
    color: '#e0d8c0',
    category: 'normal',
  },
  PremolarDie: {
    id: 'PremolarDie',
    name: '前臼齿骰子',
    shortName: '前臼',
    weights: [17, 17, 17, 17, 17, 17],
    color: '#d8d0b8',
    category: 'normal',
  },
  WisdomToothDie: {
    id: 'WisdomToothDie',
    name: '智齿骰子',
    shortName: '智齿',
    weights: [17, 17, 17, 17, 17, 17],
    color: '#f0e8d0',
    category: 'normal',
  },
  StStephenDie: {
    id: 'StStephenDie',
    name: '圣斯蒂芬骰子',
    shortName: '圣斯',
    weights: [17, 17, 17, 17, 17, 17],
    color: '#a89868',
    category: 'normal',
  },

  // ─── 幸运 (lucky) ──────────────────────────────
  ArankaDie: {
    id: 'ArankaDie',
    name: '阿兰卡的骰子',
    shortName: '阿兰',
    weights: [29, 5, 29, 5, 29, 5],
    color: '#50c878',
    category: 'lucky',
  },
  LuckyDie1: {
    id: 'LuckyDie1',
    name: '幸运骰子(版本A)',
    shortName: '幸A',
    weights: [33, 0, 6, 6, 33, 22],
    color: '#7dcea0',
    category: 'lucky',
  },
  LuckyDie2: {
    id: 'LuckyDie2',
    name: '幸运骰子(版本B)',
    shortName: '幸B',
    weights: [27, 5, 9, 14, 18, 27],
    color: '#58d68d',
    category: 'lucky',
  },
  GrozavLuckyDie: {
    id: 'GrozavLuckyDie',
    name: '格罗扎夫的幸运骰子',
    shortName: '格罗',
    weights: [7, 67, 7, 7, 7, 7],
    color: '#2ecc71',
    category: 'lucky',
  },
  HeavenlyDie: {
    id: 'HeavenlyDie',
    name: '天国骰',
    shortName: '天国',
    weights: [37, 11, 11, 11, 11, 21],
    color: '#85c1e9',
    category: 'lucky',
  },
  WeightedDie: {
    id: 'WeightedDie',
    name: '灌铅骰子',
    shortName: '灌铅',
    weights: [67, 7, 7, 7, 7, 7],
    color: '#aab7b8',
    category: 'lucky',
  },
  OddDie: {
    id: 'OddDie',
    name: '奇数骰子',
    shortName: '奇数',
    weights: [27, 7, 27, 7, 27, 7],
    color: '#45b39d',
    category: 'lucky',
  },

  // ─── 邪恶 (evil) ───────────────────────────────
  DevilDie: {
    id: 'DevilDie',
    name: '魔鬼骰子',
    shortName: '魔鬼',
    weights: [17, 17, 17, 17, 17, 17],
    wildcardFace: 1,
    color: '#c0392b',
    category: 'evil',
  },
  EvilOneDie: {
    id: 'EvilOneDie',
    name: '恶一骰',
    shortName: '恶一',
    weights: [13, 13, 13, 13, 13, 35],
    color: '#922b21',
    category: 'evil',
  },
  EvilTwoDie: {
    id: 'EvilTwoDie',
    name: '恶二骰',
    shortName: '恶二',
    weights: [13, 13, 13, 13, 13, 35],
    color: '#a93226',
    category: 'evil',
  },
  EvilThreeDie: {
    id: 'EvilThreeDie',
    name: '恶三骰',
    shortName: '恶三',
    weights: [13, 13, 13, 13, 13, 35],
    color: '#b03a2e',
    category: 'evil',
  },
  BadLuckDie: {
    id: 'BadLuckDie',
    name: '厄运骰',
    shortName: '厄运',
    weights: [5, 23, 23, 23, 23, 5],
    color: '#7b241c',
    category: 'evil',
  },
  BadDie: {
    id: 'BadDie',
    name: '坏骰子',
    shortName: '坏骰',
    weights: [6, 31, 6, 6, 44, 6],
    color: '#943126',
    category: 'evil',
  },
  UnluckyDie: {
    id: 'UnluckyDie',
    name: '倒霉骰子',
    shortName: '倒霉',
    weights: [9, 27, 18, 18, 18, 9],
    color: '#cb4335',
    category: 'evil',
  },
  LowRollDie: {
    id: 'LowRollDie',
    name: '低出目骰子',
    shortName: '低目',
    weights: [22, 11, 11, 11, 11, 33],
    color: '#d35400',
    category: 'evil',
  },

  // ─── 神圣 (holy) ───────────────────────────────
  HolyTrinityDie: {
    id: 'HolyTrinityDie',
    name: '圣三一骰子',
    shortName: '圣三',
    weights: [18, 23, 45, 5, 5, 5],
    color: '#f4d03f',
    category: 'holy',
  },
  StAntiochDie: {
    id: 'StAntiochDie',
    name: '圣安提阿克斯的骰子',
    shortName: '圣安',
    weights: [3, 1, 6, 1, 1, 3],
    color: '#f7dc6f',
    category: 'holy',
  },

  // ─── 诡计 (trick) ──────────────────────────────
  CautiousCheatDie: {
    id: 'CautiousCheatDie',
    name: '谨慎骗子的骰子',
    shortName: '骗子',
    weights: [24, 14, 10, 14, 24, 14],
    color: '#af7ac5',
    category: 'trick',
  },
  GreasyDie: {
    id: 'GreasyDie',
    name: '油腻骰子',
    shortName: '油腻',
    weights: [18, 12, 18, 12, 18, 24],
    color: '#a569bd',
    category: 'trick',
  },
  PaintedDie: {
    id: 'PaintedDie',
    name: '涂漆骰子',
    shortName: '涂漆',
    weights: [19, 6, 6, 6, 44, 19],
    color: '#8e44ad',
    category: 'trick',
  },
  StripDie: {
    id: 'StripDie',
    name: '脱衣骰子',
    shortName: '脱衣',
    weights: [25, 13, 13, 13, 19, 19],
    color: '#d2b4de',
    category: 'trick',
  },
  UnbalancedDie: {
    id: 'UnbalancedDie',
    name: '失衡骰子',
    shortName: '失衡',
    weights: [25, 33, 8, 8, 17, 8],
    color: '#bb8fce',
    category: 'trick',
  },
  LousyDie: {
    id: 'LousyDie',
    name: '蹩脚骰子',
    shortName: '蹩脚',
    weights: [10, 15, 10, 15, 35, 15],
    color: '#9b59b6',
    category: 'trick',
  },
  SadGlazerDie: {
    id: 'SadGlazerDie',
    name: '悲伤格雷泽的骰子',
    shortName: '悲伤',
    weights: [26, 26, 4, 4, 26, 13],
    color: '#7d3c98',
    category: 'trick',
  },

  // ─── 特殊 (special) ────────────────────────────
  EvenDie: {
    id: 'EvenDie',
    name: '偶数骰子',
    shortName: '偶数',
    weights: [7, 27, 7, 27, 7, 27],
    color: '#2980b9',
    category: 'special',
  },
  KingDie: {
    id: 'KingDie',
    name: '国王骰子',
    shortName: '国王',
    weights: [13, 19, 22, 25, 13, 9],
    color: '#d4a843',
    category: 'special',
  },
  MathematicianDie: {
    id: 'MathematicianDie',
    name: '数学家的骰子',
    shortName: '数学',
    weights: [17, 21, 25, 29, 4, 4],
    color: '#5dade2',
    category: 'special',
  },
  PieDie: {
    id: 'PieDie',
    name: '派骰子',
    shortName: '派骰',
    weights: [46, 8, 23, 23, 0, 0],
    color: '#e67e22',
    category: 'special',
  },
  RollThreeDie: {
    id: 'RollThreeDie',
    name: '出三骰',
    shortName: '出三',
    weights: [13, 6, 56, 6, 13, 6],
    color: '#1abc9c',
    category: 'special',
  },
  CharioteerDie: {
    id: 'CharioteerDie',
    name: '战车御者的骰子',
    shortName: '战车',
    weights: [6, 28, 33, 11, 11, 11],
    color: '#e74c3c',
    category: 'special',
  },
};

// ── 查询工具函数 ──────────────────────────────────

/** 根据 ID 获取骰子定义 */
export function getDieDefinition(id: string): DieDefinition {
  const def = DIE_REGISTRY[id];
  if (!def) return DIE_REGISTRY['NormalDie'];
  return def;
}

/** 获取普通骰子定义 */
export function getNormalDie(): DieDefinition {
  return DIE_REGISTRY['NormalDie'];
}

/** 获取所有骰子定义列表 */
export function getAllDice(): DieDefinition[] {
  return Object.values(DIE_REGISTRY);
}

/** 获取所有可选的特殊骰子（排除 NormalDie） */
export function getSpecialDice(): DieDefinition[] {
  return Object.values(DIE_REGISTRY).filter(d => d.id !== 'NormalDie');
}

/** 按分类获取骰子。传入分类返回该分类数组，不传返回全部分类 Record */
export function getDiceByCategory(cat: DieCategory): DieDefinition[];
export function getDiceByCategory(): Record<DieCategory, DieDefinition[]>;
export function getDiceByCategory(cat?: DieCategory): DieDefinition[] | Record<DieCategory, DieDefinition[]> {
  const result: Record<DieCategory, DieDefinition[]> = {
    normal: [], lucky: [], evil: [], holy: [], trick: [], special: [],
  };
  for (const die of Object.values(DIE_REGISTRY)) {
    result[die.category].push(die);
  }
  if (cat !== undefined) return result[cat];
  return result;
}

/** 分类的中文标签 */
export const CATEGORY_LABELS: Record<DieCategory, string> = {
  normal: '普通',
  lucky: '幸运',
  evil: '邪恶',
  holy: '神圣',
  trick: '诡计',
  special: '特殊',
};
