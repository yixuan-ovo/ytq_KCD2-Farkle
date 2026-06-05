import type { GameConfig, GameState, PlayerId } from '../game/types';

/** 客户端 → 服务器 */
export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'start'; config?: Partial<GameConfig> }
  | { type: 'pickDice'; diceIds: string[] }
  | { type: 'roll' }
  | { type: 'keep'; dieIds: number[] }
  | { type: 'bank'; dieIds?: number[] }
  | { type: 'selectDice'; dieIds: number[] }
  | { type: 'ackTurnOrder' }
  | { type: 'leave' };

/** 下发给客户端的状态（选骰阶段隐藏对手具体选择） */
export type ClientGameState = GameState & {
  opponentDiceReady: boolean;
  opponentAway: boolean;
  opponentAwayUntil: number | null;
};

function opponentOf(you: PlayerId): PlayerId {
  return you === 'host' ? 'guest' : 'host';
}

export function toClientGameState(state: GameState, you: PlayerId | null): ClientGameState {
  const n = state.config.specialDiceCount;
  const opponentReady =
    you === 'host'
      ? state.guestDice.length >= n
      : you === 'guest'
        ? state.hostDice.length >= n
        : false;

  const now = Date.now();
  const opp = you ? opponentOf(you) : null;
  const until = opp ? (state.awayUntil[opp] ?? null) : null;
  const opponentAway = until != null && until > now;

  const awayFields = {
    opponentAway,
    opponentAwayUntil: opponentAway ? until : null,
  };

  if (state.phase !== 'dice_selection' || !you) {
    return { ...state, opponentDiceReady: opponentReady, ...awayFields };
  }

  return {
    ...state,
    hostDice: you === 'host' ? state.hostDice : [],
    guestDice: you === 'guest' ? state.guestDice : [],
    opponentDiceReady: opponentReady,
    ...awayFields,
  };
}

/** 服务器 → 客户端 */
export type ServerMessage =
  | { type: 'state'; state: ClientGameState; you: PlayerId | null }
  | { type: 'error'; message: string };

export function parseClientMessage(raw: string): ClientMessage | null {
  try {
    const data = JSON.parse(raw) as ClientMessage;
    if (!data || typeof data !== 'object' || !('type' in data)) return null;
    return data;
  } catch {
    return null;
  }
}

export function serializeServerMessage(msg: ServerMessage): string {
  return JSON.stringify(msg);
}
