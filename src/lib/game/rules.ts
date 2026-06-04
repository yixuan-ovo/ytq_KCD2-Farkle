import type { GameConfig } from './types';
import { DEFAULT_CONFIG } from './types';

export type { GameConfig };
export { DEFAULT_CONFIG } from './types';

// ─────────────────────────────────────────────
//  规则校验
// ─────────────────────────────────────────────

const MIN_TARGET = 500;
const MAX_TARGET = 10000;
const VALID_SPECIAL_COUNTS = [0, 1, 2, 3] as const;
const VALID_SELECTION_MODES = ['free', 'draft'] as const;

export function validateConfig(config: Partial<GameConfig>): string[] {
  const errors: string[] = [];

  if (config.targetScore !== undefined) {
    if (!Number.isInteger(config.targetScore)) {
      errors.push('目标分数必须为整数');
    } else if (config.targetScore < MIN_TARGET || config.targetScore > MAX_TARGET) {
      errors.push(`目标分数须在 ${MIN_TARGET} 到 ${MAX_TARGET} 之间`);
    }
  }

  if (config.specialDiceCount !== undefined) {
    if (!(VALID_SPECIAL_COUNTS as readonly number[]).includes(config.specialDiceCount)) {
      errors.push('特殊骰子数量须为 0、1、2 或 3');
    }
  }

  if (config.selectionMode !== undefined) {
    if (!(VALID_SELECTION_MODES as readonly string[]).includes(config.selectionMode)) {
      errors.push('选骰模式须为 free 或 draft');
    }
  }

  return errors;
}

/** 合并用户配置与默认配置，返回完整 GameConfig */
export function buildConfig(partial: Partial<GameConfig>): GameConfig {
  return { ...DEFAULT_CONFIG, ...partial };
}
