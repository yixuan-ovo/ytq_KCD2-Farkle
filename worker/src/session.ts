import { createDice, isBust, isHotDice, keepDice, resetDiceForHotDice, rollDice } from '../../src/lib/game/dice';
import { DIE_REGISTRY } from '../../src/lib/game/diceRegistry';
import { buildConfig, validateConfig } from '../../src/lib/game/rules';
import { DEFAULT_CONFIG, type GameConfig, type GameState, type PlayerId } from '../../src/lib/game/types';

export function createInitialState(): GameState {
  return {
    phase: 'lobby',
    config: { ...DEFAULT_CONFIG, specialDiceCount: 0 },
    players: [
      { id: 'host', name: '', totalScore: 0, turnScore: 0 },
      { id: 'guest', name: '', totalScore: 0, turnScore: 0 },
    ],
    currentPlayerIndex: 0,
    dice: createDice([]),
    turnScore: 0,
    rollCount: 0,
    awaitingKeep: false,
    winner: null,
    hostDice: [],
    guestDice: [],
    lastBust: null,
    pendingSelection: [],
    lastTurnEnd: null,
    coinFlip: null,
    awayUntil: {},
  };
}

/** 断线后保留对局的宽限时间 */
export const AWAY_GRACE_MS = 2 * 60 * 1000;

export function markPlayerAway(
  state: GameState,
  who: PlayerId,
  now = Date.now(),
): GameState {
  return {
    ...state,
    awayUntil: { ...state.awayUntil, [who]: now + AWAY_GRACE_MS },
  };
}

export function clearPlayerAway(state: GameState, who: PlayerId): GameState {
  if (state.awayUntil[who] == null) return state;
  const awayUntil = { ...state.awayUntil };
  delete awayUntil[who];
  return { ...state, awayUntil };
}

export function isPlayerAway(state: GameState, who: PlayerId, now = Date.now()): boolean {
  const until = state.awayUntil[who];
  return until != null && until > now;
}

export function joinPlayer(state: GameState, name: string): { state: GameState; role: PlayerId } | { error: string } {
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) return { error: '昵称不能为空' };

  const hostName = state.players[0].name;
  const guestName = state.players[1].name;

  if (hostName && trimmed === hostName) {
    return { error: '与房主昵称相同，请换一个' };
  }
  if (guestName && trimmed === guestName) {
    return { error: '该昵称已被使用，请换一个' };
  }

  if (!hostName) {
    return {
      role: 'host',
      state: {
        ...state,
        players: [{ ...state.players[0], name: trimmed }, state.players[1]],
      },
    };
  }

  if (!guestName) {
    return {
      role: 'guest',
      state: {
        ...state,
        players: [state.players[0], { ...state.players[1], name: trimmed }],
      },
    };
  }

  return { error: '房间已满' };
}

function isPickableDieId(id: string): boolean {
  const def = DIE_REGISTRY[id];
  return def != null && def.id !== 'NormalDie' && def.category !== 'normal';
}

export function buildDiceForPlayer(state: GameState, playerId: PlayerId) {
  const ids = playerId === 'host' ? state.hostDice : state.guestDice;
  return createDice(ids);
}

export function startGame(
  state: GameState,
  by: PlayerId,
  partial?: Partial<GameConfig>,
): GameState | { error: string } {
  if (by !== 'host') return { error: '仅房主可开始游戏' };
  if (state.phase !== 'lobby' && state.phase !== 'game_over') {
    return { error: '游戏进行中' };
  }
  if (!state.players[0].name || !state.players[1].name) return { error: '等待第二名玩家加入' };

  const mergedConfig = buildConfig({
    ...state.config,
    ...partial,
    selectionMode: 'free',
    badgesEnabled: false,
  });
  const configErrors = validateConfig(mergedConfig);
  if (configErrors.length > 0) return { error: configErrors[0]! };

  const base = {
    ...state,
    config: mergedConfig,
    turnScore: 0,
    rollCount: 0,
    awaitingKeep: false,
    winner: null,
    hostDice: [] as string[],
    guestDice: [] as string[],
    lastBust: null,
    pendingSelection: [],
    lastTurnEnd: null,
    coinFlip: null,
    awayUntil: {},
    players: [
      { ...state.players[0], totalScore: 0, turnScore: 0 },
      { ...state.players[1], totalScore: 0, turnScore: 0 },
    ] as GameState['players'],
  };

  if (mergedConfig.specialDiceCount > 0) {
    return {
      ...base,
      phase: 'dice_selection',
      dice: createDice([]),
    };
  }

  const firstIndex = (randomSeed() % 2) as 0 | 1;
  const firstPlayer = state.players[firstIndex].id;
  const heads = randomSeed() % 2 === 0;

  return {
    ...base,
    phase: 'turn_order',
    currentPlayerIndex: firstIndex,
    coinFlip: { firstPlayer, heads },
    dice: createDice([]),
  };
}

export function finishTurnOrder(
  state: GameState,
  by: PlayerId,
): GameState | { error: string } {
  if (by !== 'host') return { error: '仅房主可推进' };
  if (state.phase !== 'turn_order') return state;

  const firstPlayer = state.players[state.currentPlayerIndex].id;
  const base: GameState = { ...state, coinFlip: null };

  return {
    ...base,
    phase: 'selecting',
    dice: buildDiceForPlayer(base, firstPlayer),
    turnScore: 0,
    rollCount: 0,
    awaitingKeep: false,
  };
}

export function submitDicePick(
  state: GameState,
  who: PlayerId,
  diceIds: string[],
): GameState | { error: string } {
  if (state.phase !== 'dice_selection') return { error: '当前不能选骰' };

  const n = state.config.specialDiceCount;
  if (n === 0) return { error: '本局不使用特殊骰子' };
  if (diceIds.length !== n) return { error: `请选择 ${n} 枚特殊骰子` };
  if (new Set(diceIds).size !== diceIds.length) return { error: '不能重复选择同一枚骰子' };

  for (const id of diceIds) {
    if (!isPickableDieId(id)) return { error: '无效的特殊骰子' };
  }

  const alreadyPicked = who === 'host' ? state.hostDice.length >= n : state.guestDice.length >= n;
  if (alreadyPicked) return { error: '你已确认选骰' };

  const next: GameState = {
    ...state,
    hostDice: who === 'host' ? [...diceIds] : state.hostDice,
    guestDice: who === 'guest' ? [...diceIds] : state.guestDice,
  };

  if (next.hostDice.length >= n && next.guestDice.length >= n) {
    const firstIndex = (randomSeed() % 2) as 0 | 1;
    const firstPlayer = next.players[firstIndex].id;
    const heads = randomSeed() % 2 === 0;
    return {
      ...next,
      phase: 'turn_order',
      currentPlayerIndex: firstIndex,
      coinFlip: { firstPlayer, heads },
      dice: createDice([]),
    };
  }

  return next;
}

function currentPlayerId(state: GameState): PlayerId {
  return state.players[state.currentPlayerIndex].id;
}

function randomSeed(): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0]!;
}

function clearEphemeral(state: GameState): GameState {
  return { ...state, pendingSelection: [], lastTurnEnd: null, lastBust: null };
}

function endTurn(state: GameState): GameState {
  const idx = state.currentPlayerIndex;
  const bustedBy = currentPlayerId(state);
  const players = [...state.players] as GameState['players'];
  players[idx] = { ...players[idx], turnScore: 0 };

  const nextIndex = (idx === 0 ? 1 : 0) as 0 | 1;
  const nextPlayerId = players[nextIndex].id;
  return {
    ...state,
    phase: 'selecting',
    players,
    currentPlayerIndex: nextIndex,
    dice: buildDiceForPlayer(state, nextPlayerId),
    turnScore: 0,
    rollCount: 0,
    awaitingKeep: false,
    pendingSelection: [],
    lastTurnEnd: null,
    lastBust: {
      by: bustedBy,
      dice: state.dice.filter((d) => d.active && !d.kept).map((d) => ({ ...d })),
    },
  };
}

function afterRoll(state: GameState): GameState {
  if (isBust(state.dice)) {
    return endTurn(state);
  }
  return { ...state, phase: 'selecting' };
}

function rollUnkeptDice(state: GameState): GameState {
  const seed = randomSeed();
  const dice = rollDice(state.dice, seed);
  return afterRoll({
    ...state,
    dice,
    rollCount: state.rollCount + 1,
    awaitingKeep: true,
    pendingSelection: [],
  });
}

export function handleRoll(state: GameState, by: PlayerId): GameState | { error: string } {
  if (currentPlayerId(state) !== by) return { error: '还没轮到你' };
  state = normalizeTurnPhase(state);
  if (state.phase !== 'selecting' && state.phase !== 'turn_end' && state.phase !== 'hot_dice') {
    return { error: '当前不能掷骰' };
  }
  if (state.phase === 'turn_end' || state.phase === 'hot_dice') {
    state = clearEphemeral({ ...state, phase: 'selecting' });
  }
  if (state.rollCount === 0 && state.lastBust) {
    state = clearEphemeral(state);
  }

  if (state.awaitingKeep) return { error: '请先选择要保留的骰子' };

  const canRollDice = state.dice.some((d) => d.active && !d.kept);
  if (!canRollDice) return { error: '没有可掷的骰子' };

  return rollUnkeptDice(state);
}

function normalizeDieIds(dieIds: number[]): number[] {
  return dieIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id >= 0);
}

/** 保留得分骰，不自动续掷（供收分结束回合使用） */
function applyKeepOnly(
  state: GameState,
  dieIds: number[],
): GameState | { error: string } {
  const ids = normalizeDieIds(dieIds);
  if (ids.length === 0) return { error: '请选择至少一枚骰子' };

  const next = keepDice(state, ids);
  if (next.turnScore === state.turnScore) return { error: '无效选择' };

  return { ...next, awaitingKeep: false };
}

/** Hot Dice：六枚全保留后留在选骰阶段，保留点数与回合分，可直接再掷 */
function hotDiceFromKeep(state: GameState): GameState {
  return {
    ...state,
    phase: 'selecting',
    dice: resetDiceForHotDice(state.dice),
    rollCount: 0,
    awaitingKeep: false,
    pendingSelection: [],
  };
}

export function handleKeep(
  state: GameState,
  by: PlayerId,
  dieIds: number[],
): GameState | { error: string } {
  state = normalizeTurnPhase(state);
  if (currentPlayerId(state) !== by) return { error: '还没轮到你' };
  if (state.phase !== 'selecting') return { error: '当前不能选骰' };
  if (state.rollCount === 0) return { error: '请先掷骰' };

  const kept = applyKeepOnly(state, dieIds);
  if ('error' in kept) return kept;

  if (isHotDice(kept.dice)) {
    return hotDiceFromKeep(kept);
  }

  const hasUnkept = kept.dice.some((d) => d.active && !d.kept);
  if (!hasUnkept) return { ...kept, pendingSelection: [] };

  return rollUnkeptDice({ ...kept, pendingSelection: [] });
}

export function handleSelectDice(
  state: GameState,
  by: PlayerId,
  dieIds: number[],
): GameState | { error: string } {
  state = normalizeTurnPhase(state);
  if (currentPlayerId(state) !== by) return { error: '还没轮到你' };
  if (state.phase !== 'selecting') return { error: '当前不能选骰' };
  if (state.rollCount === 0) return { error: '请先掷骰' };

  const ids = [...new Set(normalizeDieIds(dieIds))];
  const selectable = new Set(state.dice.filter((d) => d.active && !d.kept).map((d) => d.id));
  if (!ids.every((id) => selectable.has(id))) return { error: '无效的选骰' };

  return { ...state, pendingSelection: ids };
}

export function handleBank(
  state: GameState,
  by: PlayerId,
  dieIds?: number[],
): GameState | { error: string } {
  state = normalizeTurnPhase(state);
  if (currentPlayerId(state) !== by) return { error: '还没轮到你' };
  if (state.phase !== 'selecting') return { error: '当前不能收分' };

  let working = state;

  if (dieIds && dieIds.length > 0) {
    if (working.rollCount === 0) return { error: '请先掷骰' };
    const kept = applyKeepOnly(working, dieIds);
    if ('error' in kept) return kept;
    working = kept;
    if (isHotDice(working.dice)) {
      return hotDiceFromKeep(working);
    }
  }

  if (working.turnScore <= 0) return { error: '本回合还没有得分' };

  const idx = working.currentPlayerIndex;
  const players = [...working.players] as GameState['players'];
  const earned = working.turnScore;
  const bankingBy = currentPlayerId(working);
  const keptSnapshot = working.dice.filter((d) => d.kept).map((d) => ({ ...d }));
  const newTotal = players[idx].totalScore + earned;
  players[idx] = { ...players[idx], totalScore: newTotal, turnScore: 0 };

  if (newTotal >= working.config.targetScore) {
    return {
      ...working,
      phase: 'game_over',
      players,
      turnScore: 0,
      awaitingKeep: false,
      winner: players[idx].id,
      lastBust: null,
      pendingSelection: [],
      lastTurnEnd: {
        by: bankingBy,
        earned,
        dice: keptSnapshot,
      },
    };
  }

  const nextIndex = (idx === 0 ? 1 : 0) as 0 | 1;
  const nextPlayerId = players[nextIndex].id;
  return {
    ...working,
    phase: 'turn_end',
    players,
    currentPlayerIndex: nextIndex,
    dice: buildDiceForPlayer(working, nextPlayerId),
    turnScore: 0,
    rollCount: 0,
    awaitingKeep: false,
    lastBust: null,
    pendingSelection: [],
    lastTurnEnd: {
      by: bankingBy,
      earned,
      dice: keptSnapshot,
    },
  };
}

export function normalizeTurnPhase(state: GameState): GameState {
  if (
    state.phase === 'bust' ||
    state.phase === 'turn_end' ||
    state.phase === 'hot_dice' ||
    state.phase === 'rolling'
  ) {
    return clearEphemeral({ ...state, phase: 'selecting' });
  }
  return state;
}

/** 玩家离开：清空其座位并重置为牌桌等待（可重新拉人） */
export function leavePlayer(state: GameState, who: PlayerId): GameState {
  const idx = who === 'host' ? 0 : 1;
  const players = [...state.players] as GameState['players'];
  players[idx] = { ...players[idx], name: '', totalScore: 0, turnScore: 0 };

  return {
    ...state,
    phase: 'lobby',
    players,
    currentPlayerIndex: 0,
    dice: createDice([]),
    turnScore: 0,
    rollCount: 0,
    awaitingKeep: false,
    winner: null,
    hostDice: [],
    guestDice: [],
    lastBust: null,
    pendingSelection: [],
    lastTurnEnd: null,
    coinFlip: null,
    awayUntil: {},
  };
}
