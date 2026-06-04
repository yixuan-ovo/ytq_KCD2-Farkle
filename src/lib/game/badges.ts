import type { Badge, BadgeId, GameState } from './types';

// ─────────────────────────────────────────────
//  徽章注册表（预留接口）
// ─────────────────────────────────────────────
//
//  要添加新徽章：
//  1. 在 types.ts 的 BadgeId 联合类型中添加新 id
//  2. 在此文件的 BADGE_REGISTRY 中注册实现
//  3. 在 RulesConfig.svelte 中添加 UI 开关
//
// ─────────────────────────────────────────────

export const BADGE_REGISTRY: Record<BadgeId, Badge> = {
  fortune: {
    id: 'fortune',
    name: '好运徽章',
    description: '每局游戏允许重新掷最多两枚骰子',
    apply(state: GameState): GameState {
      // TODO: Phase 5 实现 — 在 selecting 阶段提供 reroll 机会
      return state;
    },
  },
  might: {
    id: 'might',
    name: '力量徽章',
    description: '允许在掷骰子时增加一枚额外的骰子',
    apply(state: GameState): GameState {
      // TODO: Phase 5 实现 — 将骰子数量扩展至 7
      return state;
    },
  },
};

/** 根据 id 获取徽章 */
export function getBadge(id: BadgeId): Badge {
  return BADGE_REGISTRY[id];
}

/** 按顺序应用所有激活的徽章效果 */
export function applyBadges(state: GameState): GameState {
  if (!state.config.badgesEnabled) return state;
  return state.config.activeBadges.reduce(
    (s, id) => BADGE_REGISTRY[id].apply(s),
    state
  );
}
