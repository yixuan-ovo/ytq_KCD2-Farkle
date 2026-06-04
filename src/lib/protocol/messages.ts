import type { GameConfig, GameState, PlayerId } from '../game/types';

/** 客户端 → 服务器 */
export type ClientMessage =
  | { type: 'join'; name: string }
  | { type: 'start'; config?: Partial<GameConfig> }
  | { type: 'pickDice'; diceIds: string[] }
  | { type: 'roll' }
  | { type: 'keep'; dieIds: number[] }
  | { type: 'bank'; dieIds?: number[] }
  | { type: 'leave' };

/** 下发给客户端的状态（选骰阶段隐藏对手具体选择） */
export type ClientGameState = GameState & {
  opponentDiceReady: boolean;
};

/** 服务器 → 客户端 */
export type ServerMessage =
  | { type: 'state'; state: ClientGameState; you: PlayerId | null }
  | { type: 'error'; message: string };

export function toClientGameState(state: GameState, you: PlayerId | null): ClientGameState {
  const n = state.config.specialDiceCount;
  const opponentReady =
    you === 'host'
      ? state.guestDice.length >= n
      : you === 'guest'
        ? state.hostDice.length >= n
        : false;

  if (state.phase !== 'dice_selection' || !you) {
    return { ...state, opponentDiceReady: opponentReady };
  }

  return {
    ...state,
    hostDice: you === 'host' ? state.hostDice : [],
    guestDice: you === 'guest' ? state.guestDice : [],
    opponentDiceReady: opponentReady,
  };
}

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
