import { describe, it, expect } from 'vitest';
import {
  scoreSelection,
  scoreForFaceCount,
  hasAnyScore,
  isValidSelection,
  detectStraight,
} from '../src/lib/game/scoring';
import { createDice, rollDice, weightedRoll } from '../src/lib/game/dice';
import { getSpecialDice, getDiceByCategory, CATEGORY_LABELS } from '../src/lib/game/diceRegistry';
import type { DieFace } from '../src/lib/game/types';

// 辅助：快速构造 DieFace 数组
const d = (...faces: number[]): DieFace[] => faces as DieFace[];

// ─────────────────────────────────────────────
//  单枚得分
// ─────────────────────────────────────────────
describe('单枚得分', () => {
  it('单个 1 = 100', () => {
    expect(scoreForFaceCount(1, 1)).toBe(100);
  });
  it('两个 1 = 200', () => {
    expect(scoreForFaceCount(1, 2)).toBe(200);
  });
  it('单个 5 = 50', () => {
    expect(scoreForFaceCount(5, 1)).toBe(50);
  });
  it('两个 5 = 100', () => {
    expect(scoreForFaceCount(5, 2)).toBe(100);
  });
  it('单个 2/3/4/6 不得分', () => {
    expect(scoreForFaceCount(2, 1)).toBe(0);
    expect(scoreForFaceCount(3, 1)).toBe(0);
    expect(scoreForFaceCount(4, 1)).toBe(0);
    expect(scoreForFaceCount(6, 1)).toBe(0);
  });
});

// ─────────────────────────────────────────────
//  三连基础分
// ─────────────────────────────────────────────
describe('三连基础分', () => {
  it('三个 1 = 1000', () => expect(scoreForFaceCount(1, 3)).toBe(1000));
  it('三个 2 = 200',  () => expect(scoreForFaceCount(2, 3)).toBe(200));
  it('三个 3 = 300',  () => expect(scoreForFaceCount(3, 3)).toBe(300));
  it('三个 4 = 400',  () => expect(scoreForFaceCount(4, 3)).toBe(400));
  it('三个 5 = 500',  () => expect(scoreForFaceCount(5, 3)).toBe(500));
  it('三个 6 = 600',  () => expect(scoreForFaceCount(6, 3)).toBe(600));
});

// ─────────────────────────────────────────────
//  多连翻倍
// ─────────────────────────────────────────────
describe('多连翻倍', () => {
  it('四个 2 = 400',   () => expect(scoreForFaceCount(2, 4)).toBe(400));
  it('五个 2 = 800',   () => expect(scoreForFaceCount(2, 5)).toBe(800));
  it('六个 2 = 1600',  () => expect(scoreForFaceCount(2, 6)).toBe(1600));
  it('四个 1 = 2000',  () => expect(scoreForFaceCount(1, 4)).toBe(2000));
  it('五个 1 = 4000',  () => expect(scoreForFaceCount(1, 5)).toBe(4000));
  it('六个 1 = 8000',  () => expect(scoreForFaceCount(1, 6)).toBe(8000));
  it('四个 6 = 1200',  () => expect(scoreForFaceCount(6, 4)).toBe(1200));
});

// ─────────────────────────────────────────────
//  顺子
// ─────────────────────────────────────────────
describe('顺子', () => {
  it('1-5 小顺子 = 500',     () => expect(detectStraight(d(1,2,3,4,5))).toBe(500));
  it('2-6 中顺子 = 750',     () => expect(detectStraight(d(2,3,4,5,6))).toBe(750));
  it('1-6 大顺子 = 1500',    () => expect(detectStraight(d(1,2,3,4,5,6))).toBe(1500));
  it('顺序打乱仍识别',        () => expect(detectStraight(d(3,1,5,2,4))).toBe(500));
  it('恶魔百搭补 1 构成小顺子 = 500', () => expect(detectStraight(d(0,2,3,4,5))).toBe(500));
  it('恶魔百搭补 6 构成大顺子 = 1500', () => expect(detectStraight(d(1,2,3,4,5,0))).toBe(1500));
  it('恶魔百搭补 2 构成中顺子 = 750', () => expect(detectStraight(d(0,3,4,5,6))).toBe(750));
  it('重复点数不能靠百搭凑顺子', () => expect(detectStraight(d(0,1,1,3,4,5))).toBe(0));
  it('重复元素不构成顺子',    () => expect(detectStraight(d(1,1,3,4,5))).toBe(0));
});

// ─────────────────────────────────────────────
//  组合得分（scoreSelection）
// ─────────────────────────────────────────────
describe('scoreSelection 组合', () => {
  it('三个1 + 单个5 = 1050', () => {
    expect(scoreSelection(d(1,1,1,5)).score).toBe(1050);
  });
  it('三个3 + 两个1 = 500',  () => {
    expect(scoreSelection(d(3,3,3,1,1)).score).toBe(500);
  });
  it('大顺子', () => {
    expect(scoreSelection(d(1,2,3,4,5,6))).toEqual({ score: 1500, valid: true });
  });
  it('全是 2/3/4/6 无分 = 0', () => {
    expect(scoreSelection(d(2,3,4,6))).toEqual({ score: 0, valid: false });
  });
  it('空数组 = 0', () => {
    expect(scoreSelection(d())).toEqual({ score: 0, valid: false });
  });
  it('单个1 = 100',    () => expect(scoreSelection(d(1)).score).toBe(100));
  it('单个5 = 50',     () => expect(scoreSelection(d(5)).score).toBe(50));

  // ── 混合得分/非得分骰子 → 无效 ──
  it('1+4 含非得分骰子 → 无效', () => {
    expect(scoreSelection(d(1,4))).toEqual({ score: 0, valid: false });
  });
  it('1+5+2 含非得分骰子 → 无效', () => {
    expect(scoreSelection(d(1,5,2))).toEqual({ score: 0, valid: false });
  });
  it('三个2+4 含非得分骰子 → 无效', () => {
    expect(scoreSelection(d(2,2,2,4))).toEqual({ score: 0, valid: false });
  });
  it('1+1 全部得分 → 有效 200', () => {
    expect(scoreSelection(d(1,1))).toEqual({ score: 200, valid: true });
  });
  it('5+5 全部得分 → 有效 100', () => {
    expect(scoreSelection(d(5,5))).toEqual({ score: 100, valid: true });
  });
  it('1+5 全部得分 → 有效 150', () => {
    expect(scoreSelection(d(1,5))).toEqual({ score: 150, valid: true });
  });

  // ── 顺子 + 单只复合组合 ──
  it('小顺子(1-5) + 单1 = 600', () => {
    expect(scoreSelection(d(1,2,3,4,5,1))).toEqual({ score: 600, valid: true });
  });
  it('小顺子(1-5) + 单5 = 550', () => {
    expect(scoreSelection(d(1,2,3,4,5,5))).toEqual({ score: 550, valid: true });
  });
  it('中顺子(2-6) + 单1 实为大顺子 = 1500', () => {
    // {2,3,4,5,6,1} 恰好包含1-6全部面值，识别为大顺子
    expect(scoreSelection(d(2,3,4,5,6,1))).toEqual({ score: 1500, valid: true });
  });
  it('中顺子(2-6) + 单5 = 800', () => {
    expect(scoreSelection(d(2,3,4,5,6,5))).toEqual({ score: 800, valid: true });
  });
  it('小顺子(1-5) + 单2 → 无效（2不得分）', () => {
    expect(scoreSelection(d(1,2,3,4,5,2))).toEqual({ score: 0, valid: false });
  });
  it('中顺子(2-6) + 单3 → 无效（3不得分）', () => {
    expect(scoreSelection(d(2,3,4,5,6,3))).toEqual({ score: 0, valid: false });
  });
});

// ─────────────────────────────────────────────
//  恶魔头（百搭）
// ─────────────────────────────────────────────
describe('恶魔头百搭', () => {
  it('恶魔头单枚视为最优：补成1 = 100', () => {
    // 单枚恶魔头，最优是等效面值1得100分
    expect(scoreSelection(d(0)).score).toBe(100);
  });
  it('恶魔头 + 2个1 凑三个1 = 1000', () => {
    expect(scoreSelection(d(0,1,1)).score).toBe(1000);
  });
  it('恶魔头 + 两个3 凑三个3 = 300', () => {
    expect(scoreSelection(d(0,3,3)).score).toBe(300);
  });
  it('恶魔头 + 三个6 凑四个6 = 1200', () => {
    expect(scoreSelection(d(0,6,6,6)).score).toBe(1200);
  });
  it('两个恶魔头 + 三个2 = 四个2翻倍 = 400', () => {
    // 2个joker补成2个2，凑成5个2 = 800
    expect(scoreSelection(d(0,0,2,2,2)).score).toBe(800);
  });
  it('恶魔头 + 2-3-4-5 小顺子 = 500', () => {
    expect(scoreSelection(d(0,2,3,4,5))).toEqual({ score: 500, valid: true });
  });
  it('恶魔头 + 1-2-3-4-5 大顺子 = 1500', () => {
    expect(scoreSelection(d(0,1,2,3,4,5))).toEqual({ score: 1500, valid: true });
  });
  it('恶魔头 + 3-4-5-6 中顺子 = 750', () => {
    expect(scoreSelection(d(0,3,4,5,6))).toEqual({ score: 750, valid: true });
  });
  it('小顺子(百搭补1) + 单1 全选时优先大顺子 1500', () => {
    expect(scoreSelection(d(0,2,3,4,5,1))).toEqual({ score: 1500, valid: true });
  });
  it('两个恶魔头凑大顺子 1-6 = 1500', () => {
    expect(scoreSelection(d(0,0,1,2,3,4))).toEqual({ score: 1500, valid: true });
  });
});

// ─────────────────────────────────────────────
//  爆点检测（hasAnyScore）
// ─────────────────────────────────────────────
describe('hasAnyScore（爆点检测）', () => {
  it('含1必得分',              () => expect(hasAnyScore(d(2,3,4,1))).toBe(true));
  it('含5必得分',              () => expect(hasAnyScore(d(2,3,4,5))).toBe(true));
  it('有三连必得分',           () => expect(hasAnyScore(d(2,2,2,4))).toBe(true));
  it('含恶魔头必得分',         () => expect(hasAnyScore(d(0,2,3))).toBe(true));
  it('2446 无得分组合',        () => expect(hasAnyScore(d(2,4,4,6))).toBe(false));
  it('2346 无得分组合',        () => expect(hasAnyScore(d(2,3,4,6))).toBe(false));
  it('空数组无得分',           () => expect(hasAnyScore(d())).toBe(false));
  it('顺子1-5有得分',          () => expect(hasAnyScore(d(1,2,3,4,5))).toBe(true));
});

// ─────────────────────────────────────────────
//  isValidSelection
// ─────────────────────────────────────────────
describe('isValidSelection', () => {
  it('选单个1 合法',   () => expect(isValidSelection(d(1))).toBe(true));
  it('选单个3 不合法', () => expect(isValidSelection(d(3))).toBe(false));
  it('选三个4 合法',   () => expect(isValidSelection(d(4,4,4))).toBe(true));
  it('选两个2 不合法', () => expect(isValidSelection(d(2,2))).toBe(false));
});

// ─────────────────────────────────────────────
//  恶魔骰子系统
// ─────────────────────────────────────────────
describe('特殊骰子（createDice）', () => {
  it('无特殊骰子 → 全部为 NormalDie', () => {
    const dice = createDice([]);
    expect(dice).toHaveLength(6);
    expect(dice.every(d => d.type === 'NormalDie')).toBe(true);
  });
  it('1枚 DevilDie → 第一枚为 DevilDie', () => {
    const dice = createDice(['DevilDie']);
    expect(dice[0].type).toBe('DevilDie');
    expect(dice[1].type).toBe('NormalDie');
    expect(dice[5].type).toBe('NormalDie');
  });
  it('2枚 DevilDie → 前两枚为 DevilDie', () => {
    const dice = createDice(['DevilDie', 'DevilDie']);
    expect(dice[0].type).toBe('DevilDie');
    expect(dice[1].type).toBe('DevilDie');
    expect(dice[2].type).toBe('NormalDie');
  });
});

describe('特殊骰子掷骰（rollDice）', () => {
  it('普通骰子不会出现 face=0', () => {
    const dice = createDice([]);
    for (let seed = 0; seed < 100; seed++) {
      const rolled = rollDice(dice, seed);
      for (const die of rolled) {
        expect(die.value).toBeGreaterThanOrEqual(1);
        expect(die.value).toBeLessThanOrEqual(6);
      }
    }
  });

  it('DevilDie 掷出百搭面时 value=0', () => {
    const dice = createDice(['DevilDie', 'DevilDie']);
    let foundDevil = false;
    for (let seed = 0; seed < 200; seed++) {
      const rolled = rollDice(dice, seed);
      for (const die of rolled) {
        if (die.type === 'DevilDie' && die.value === 0) foundDevil = true;
        if (die.type === 'NormalDie') expect(die.value).not.toBe(0);
      }
    }
    expect(foundDevil).toBe(true);
  });

  it('DevilDie 不会掷出 face=1', () => {
    const dice = createDice(['DevilDie']);
    for (let seed = 0; seed < 100; seed++) {
      const rolled = rollDice(dice, seed);
      const devilDie = rolled[0];
      expect(devilDie.value).not.toBe(1);
    }
  });

  it('DevilDie 能掷出 2-6 的普通值', () => {
    const dice = createDice(['DevilDie']);
    let foundNonDevil = false;
    for (let seed = 0; seed < 100; seed++) {
      const rolled = rollDice(dice, seed);
      const devilDie = rolled[0];
      if (devilDie.value >= 2 && devilDie.value <= 6) foundNonDevil = true;
    }
    expect(foundNonDevil).toBe(true);
  });
});

describe('爆点与恶魔骰子', () => {
  it('恶魔面（face=0）作为百搭不会爆', () => {
    expect(hasAnyScore(d(0, 2, 3, 4))).toBe(true);
    expect(hasAnyScore(d(0, 6, 6))).toBe(true);
  });
});

// ─────────────────────────────────────────────
//  Phase 2: 加权掷骰测试
// ─────────────────────────────────────────────

describe('weightedRoll 单元测试', () => {
  it('均匀权重覆盖所有面', () => {
    const uniform: [number, number, number, number, number, number] = [17, 17, 17, 17, 17, 17];
    const seen = new Set<number>();
    for (let r = 0; r < 200; r++) {
      seen.add(weightedRoll(r, uniform));
    }
    expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('权重全集中在面3 → 始终掷出3', () => {
    const only3: [number, number, number, number, number, number] = [0, 0, 100, 0, 0, 0];
    for (let r = 0; r < 100; r++) {
      expect(weightedRoll(r, only3)).toBe(3);
    }
  });

  it('权重全集中在面6 → 始终掷出6', () => {
    const only6: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 100];
    for (let r = 0; r < 100; r++) {
      expect(weightedRoll(r, only6)).toBe(6);
    }
  });

  it('权重全为0时安全回退为1', () => {
    const zero: [number, number, number, number, number, number] = [0, 0, 0, 0, 0, 0];
    expect(weightedRoll(42, zero)).toBe(1);
  });
});

describe('StAntiochDie（圣安提阿克斯）权重 [3,1,6,1,1,3]', () => {
  it('500 次掷骰中 3 为最高频', () => {
    const dice = createDice(['StAntiochDie']);
    const counts = new Map<number, number>();
    const N = 500;
    for (let seed = 0; seed < N; seed++) {
      const v = rollDice(dice, seed)[0].value;
      counts.set(v, (counts.get(v) ?? 0) + 1);
    }
    let maxFace = 1;
    let maxCount = 0;
    for (const [face, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        maxFace = face;
      }
    }
    expect(maxFace).toBe(3);
    expect((counts.get(3) ?? 0) / N).toBeGreaterThan(0.25);
  });

  it('可掷出 1 与 6，且并非只有 3', () => {
    const dice = createDice(['StAntiochDie']);
    let saw1 = false;
    let saw6 = false;
    let sawNon3 = false;
    for (let seed = 0; seed < 300; seed++) {
      const v = rollDice(dice, seed)[0].value;
      if (v === 1) saw1 = true;
      if (v === 6) saw6 = true;
      if (v !== 3) sawNon3 = true;
    }
    expect(saw1).toBe(true);
    expect(saw6).toBe(true);
    expect(sawNon3).toBe(true);
  });
});

describe('WeightedDie（灌铅骰子）强烈偏向1', () => {
  it('高比例掷出1', () => {
    const dice = createDice(['WeightedDie']);
    let ones = 0;
    const N = 500;
    for (let seed = 0; seed < N; seed++) {
      const rolled = rollDice(dice, seed);
      if (rolled[0].value === 1) ones++;
    }
    // 期望约67%掷出1，允许较宽范围
    expect(ones / N).toBeGreaterThan(0.5);
  });
});

describe('混合特殊骰子创建', () => {
  it('不同类型特殊骰子可混搭', () => {
    const dice = createDice(['LuckyDie1', 'DevilDie', 'StAntiochDie']);
    expect(dice).toHaveLength(6);
    expect(dice[0].type).toBe('LuckyDie1');
    expect(dice[1].type).toBe('DevilDie');
    expect(dice[2].type).toBe('StAntiochDie');
    expect(dice[3].type).toBe('NormalDie');
    expect(dice[4].type).toBe('NormalDie');
    expect(dice[5].type).toBe('NormalDie');
  });

  it('混搭骰子各自独立掷骰', () => {
    const dice = createDice(['StAntiochDie', 'DevilDie']);
    for (let seed = 0; seed < 100; seed++) {
      const rolled = rollDice(dice, seed);
      expect(rolled[0].value).toBeGreaterThanOrEqual(1);
      expect(rolled[0].value).toBeLessThanOrEqual(6);
      // DevilDie 不会掷出 1（变为百搭0）
      expect(rolled[1].value).not.toBe(1);
    }
  });
});

describe('百搭面仅限 DevilDie', () => {
  it('StAntiochDie 不会产生 face=0', () => {
    const dice = createDice(['StAntiochDie']);
    for (let seed = 0; seed < 100; seed++) {
      const rolled = rollDice(dice, seed);
      expect(rolled[0].value).not.toBe(0);
    }
  });

  it('LuckyDie1 不会产生 face=0', () => {
    const dice = createDice(['LuckyDie1']);
    for (let seed = 0; seed < 200; seed++) {
      const rolled = rollDice(dice, seed);
      expect(rolled[0].value).not.toBe(0);
    }
  });

  it('NormalDie 不会产生 face=0', () => {
    const dice = createDice([]);
    for (let seed = 0; seed < 200; seed++) {
      const rolled = rollDice(dice, seed);
      for (const die of rolled) {
        expect(die.value).not.toBe(0);
      }
    }
  });
});

// ─────────────────────────────────────────────
//  骰子注册表函数
// ─────────────────────────────────────────────
describe('骰子注册表', () => {
  it('getSpecialDice 返回所有非普通骰子', () => {
    const specials = getSpecialDice();
    expect(Array.isArray(specials)).toBe(true);
    expect(specials.length).toBeGreaterThan(0);
    expect(specials.every((d: any) => d.id !== 'NormalDie')).toBe(true);
  });

  it('getDiceByCategory 返回指定分类的数组', () => {
    for (const cat of ['lucky', 'evil', 'holy', 'trick', 'special'] as const) {
      const result = getDiceByCategory(cat);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((d: any) => d.category === cat)).toBe(true);
    }
  });

  it('DiceSelector grouped 逻辑正确', () => {
    const categories = ['lucky', 'evil', 'holy', 'trick', 'special'] as const;
    const grouped = categories
      .map(cat => ({ cat, label: CATEGORY_LABELS[cat], dice: getDiceByCategory(cat) }))
      .filter(g => g.dice.length > 0);
    expect(grouped.length).toBe(5);
    expect(grouped[0].cat).toBe('lucky');
    expect(grouped[0].dice.length).toBeGreaterThan(0);
  });
});
