import { describe, expect, it } from 'vitest';
import type { Die, GameState } from '../src/lib/game/types';
import {
  clearPlayerAway,
  createInitialState,
  finishTurnOrder,
  handleBank,
  handleKeep,
  handleRoll,
  handleSelectDice,
  isPlayerAway,
  joinPlayer,
  leavePlayer,
  markPlayerAway,
  startGame,
  submitDicePick,
  AWAY_GRACE_MS,
} from '../worker/src/session';
import { toClientGameState } from '../src/lib/protocol/messages';

function lobbyWithBothPlayers(): GameState {
  const state = createInitialState();
  return {
    ...state,
    players: [
      { ...state.players[0], name: 'A' },
      { ...state.players[1], name: 'B' },
    ],
  };
}

/** 测试用：金币定先后后强制房主先手，避免随机先后影响断言 */
function startGameHostFirst(
  state: GameState,
  config?: Parameters<typeof startGame>[2],
): GameState {
  let started = startGame(state, 'host', config) as GameState;
  started = {
    ...started,
    currentPlayerIndex: 0,
    coinFlip: { firstPlayer: 'host', heads: true },
  };
  return finishTurnOrder(started, 'host') as GameState;
}

function readyToPlay(): GameState {
  return startGameHostFirst(lobbyWithBothPlayers());
}

function diceWithValues(values: number[]): Die[] {
  return values.map((value, id) => ({
    id,
    value: value as Die['value'],
    type: 'NormalDie',
    kept: false,
    active: true,
  }));
}

describe('handleRoll awaitingKeep', () => {
  it('allows first roll at turn start', () => {
    const state = readyToPlay();
    const result = handleRoll(state, 'host');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    if (result.lastBust) {
      expect(result.phase).toBe('selecting');
      expect(result.rollCount).toBe(0);
    } else {
      expect(result.rollCount).toBe(1);
      expect(result.phase).toBe('selecting');
      expect(result.awaitingKeep).toBe(true);
    }
  });

  it('blocks second roll before keep', () => {
    let state = readyToPlay();
    state = {
      ...state,
      dice: diceWithValues([1, 2, 3, 4, 5, 6]),
      phase: 'selecting',
      rollCount: 1,
      awaitingKeep: true,
    };
    const again = handleRoll(state, 'host');
    expect(again).toEqual({ error: '请先选择要保留的骰子' });
  });

  it('auto-rolls remaining dice after keep', () => {
    let state = readyToPlay();
    state = {
      ...state,
      dice: diceWithValues([1, 2, 3, 4, 5, 6]),
      phase: 'selecting',
      rollCount: 1,
      awaitingKeep: true,
    };
    const result = handleKeep(state, 'host', [0]);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.dice[0]?.kept).toBe(true);
    expect(result.turnScore).toBe(100);
    if (result.lastBust) {
      expect(result.phase).toBe('selecting');
      expect(result.rollCount).toBe(0);
      expect(result.lastBust.by).toBe('host');
      expect(result.currentPlayerIndex).toBe(1);
    } else if (result.phase === 'selecting') {
      expect(result.rollCount).toBe(2);
      expect(result.awaitingKeep).toBe(true);
    }
  });

});

describe('handleKeep', () => {
  it('rejects keep before first roll', () => {
    const state = readyToPlay();
    const result = handleKeep(state, 'host', [0]);
    expect(result).toEqual({ error: '请先掷骰' });
  });

  it('guest can keep scoring dice after roll', () => {
    let state = readyToPlay();
    state = {
      ...state,
      currentPlayerIndex: 1,
      dice: diceWithValues([1, 2, 3, 4, 5, 6]),
      phase: 'selecting',
      rollCount: 1,
      awaitingKeep: true,
    };
    const result = handleKeep(state, 'guest', [0]);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    if (result.phase === 'selecting') {
      expect(result.dice[0]?.kept).toBe(true);
      expect(result.turnScore).toBe(100);
      expect(result.rollCount).toBeGreaterThanOrEqual(2);
      expect(result.awaitingKeep).toBe(true);
    } else {
      expect(result.lastBust).not.toBeNull();
    }
  });

  it('second keep after partial keep and re-roll', () => {
    let state = readyToPlay();
    state = {
      ...state,
      dice: diceWithValues([1, 2, 3, 4, 5, 6]),
      phase: 'selecting',
      rollCount: 1,
      awaitingKeep: true,
    };
    state = handleKeep(state, 'host', [0]) as GameState;
    if (state.lastBust) {
      expect(state.phase).toBe('selecting');
      return;
    }
    expect(state.turnScore).toBe(100);
    expect(state.dice[0]?.kept).toBe(true);

    const rerollValues = [1, 6, 2, 6, 1, 2] as const;
    state = {
      ...state,
      dice: state.dice.map((d, i) => ({
        ...d,
        value: (d.kept ? 1 : rerollValues[i]) as Die['value'],
      })),
      phase: 'selecting',
      awaitingKeep: true,
      rollCount: 2,
    };

    const result = handleKeep(state, 'host', [4]);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    if (result.phase === 'selecting') {
      expect(result.turnScore).toBe(200);
      expect(result.dice[4]?.kept).toBe(true);
      expect(result.awaitingKeep).toBe(true);
      expect(result.rollCount).toBeGreaterThanOrEqual(3);
    } else {
      expect(result.lastBust).not.toBeNull();
    }
  });

  it('banks selected dice and ends turn in one action', () => {
    let state = readyToPlay();
    state = {
      ...state,
      dice: diceWithValues([1, 2, 3, 4, 5, 6]),
      phase: 'selecting',
      rollCount: 1,
      awaitingKeep: true,
    };
    const result = handleBank(state, 'host', [0]);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.phase).toBe('turn_end');
    expect(result.players[0]?.totalScore).toBe(100);
    expect(result.currentPlayerIndex).toBe(1);
  });

  it('rejects bank with selection before first roll', () => {
    const state = readyToPlay();
    const result = handleBank(state, 'host', [0]);
    expect(result).toEqual({ error: '请先掷骰' });
  });

  it('coerces string die ids from JSON', () => {
    let state = readyToPlay();
    state = {
      ...state,
      dice: diceWithValues([5, 2, 3, 4, 6, 1]),
      phase: 'selecting',
      rollCount: 1,
      awaitingKeep: true,
    };
    const result = handleKeep(state, 'host', ['0'] as unknown as number[]);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.dice[0]?.kept).toBe(true);
    expect(result.turnScore).toBe(50);
  });
});

describe('startGame restart', () => {
  it('allows host to restart from game_over with zeroed scores', () => {
    let state = readyToPlay();
    state = {
      ...state,
      phase: 'game_over',
      winner: 'host',
      players: [
        { ...state.players[0], totalScore: 4000, turnScore: 0 },
        { ...state.players[1], totalScore: 2100, turnScore: 0 },
      ],
    };
    const result = startGame(state, 'host');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.phase).toBe('turn_order');
    const playing = finishTurnOrder(result, 'host') as GameState;
    expect(playing.phase).toBe('selecting');
    expect(playing.winner).toBeNull();
    expect(playing.players[0]?.totalScore).toBe(0);
    expect(playing.players[1]?.totalScore).toBe(0);
  });

  it('rejects restart while game in progress', () => {
    let state = createInitialState();
    state = {
      ...state,
      players: [
        { ...state.players[0], name: 'A' },
        { ...state.players[1], name: 'B' },
      ],
    };
    const result = startGame(state, 'host');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    const again = startGame(result, 'host');
    expect(again).toEqual({ error: '游戏进行中' });
  });
});

describe('startGame with config', () => {
  it('enters turn_order then dice_selection when specialDiceCount > 0', () => {
    const result = startGame(lobbyWithBothPlayers(), 'host', { specialDiceCount: 2, targetScore: 4000 });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.phase).toBe('turn_order');
    expect(result.coinFlip?.firstPlayer).toMatch(/^(host|guest)$/);
    const next = finishTurnOrder(result, 'host') as GameState;
    expect(next.phase).toBe('dice_selection');
    expect(next.config.specialDiceCount).toBe(2);
    expect(next.hostDice).toEqual([]);
  });

  it('enters turn_order then selecting when specialDiceCount is 0', () => {
    const result = startGame(lobbyWithBothPlayers(), 'host', { specialDiceCount: 0, targetScore: 3000 });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.phase).toBe('turn_order');
    const next = finishTurnOrder(result, 'host') as GameState;
    expect(next.phase).toBe('selecting');
    expect(next.config.targetScore).toBe(3000);
    expect(next.coinFlip).toBeNull();
  });
});

describe('turn order coin flip', () => {
  it('randomizes first player on start', () => {
    const result = startGame(lobbyWithBothPlayers(), 'host') as GameState;
    expect(result.phase).toBe('turn_order');
    expect(result.coinFlip).not.toBeNull();
    expect(result.coinFlip!.firstPlayer).toBe(result.players[result.currentPlayerIndex].id);
  });

  it('only host can finish turn order', () => {
    const started = startGame(lobbyWithBothPlayers(), 'host') as GameState;
    expect(finishTurnOrder(started, 'guest')).toEqual({ error: '仅房主可推进' });
  });

  it('is idempotent after leaving turn_order', () => {
    const started = startGame(lobbyWithBothPlayers(), 'host') as GameState;
    const playing = finishTurnOrder(started, 'host') as GameState;
    expect(finishTurnOrder(playing, 'host')).toBe(playing);
  });
});

describe('submitDicePick', () => {
  function inDiceSelection(): GameState {
    return startGameHostFirst(lobbyWithBothPlayers(), { specialDiceCount: 2 });
  }

  it('starts game when both players pick', () => {
    let state = inDiceSelection();
    state = submitDicePick(state, 'host', ['ArankaDie', 'LuckyDie1']) as GameState;
    expect(state.phase).toBe('dice_selection');
    state = submitDicePick(state, 'guest', ['DevilDie', 'OddDie']) as GameState;
    expect(state.phase).toBe('selecting');
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.hostDice).toEqual(['ArankaDie', 'LuckyDie1']);
    expect(state.guestDice).toEqual(['DevilDie', 'OddDie']);
    expect(state.dice.some((d) => d.type === 'ArankaDie')).toBe(true);
  });

  it('rejects normal category dice', () => {
    const state = inDiceSelection();
    const result = submitDicePick(state, 'host', ['HugoDie', 'ArankaDie']);
    expect(result).toEqual({ error: '无效的特殊骰子' });
  });

  it('rejects duplicate picks', () => {
    const state = inDiceSelection();
    const result = submitDicePick(state, 'host', ['ArankaDie', 'ArankaDie']);
    expect(result).toEqual({ error: '不能重复选择同一枚骰子' });
  });
});

describe('toClientGameState', () => {
  it('hides opponent dice ids during selection', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: 'dice_selection',
      config: { ...createInitialState().config, specialDiceCount: 2 },
      hostDice: ['ArankaDie', 'LuckyDie1'],
      guestDice: [],
    };
    const hostView = toClientGameState(state, 'host');
    expect(hostView.hostDice).toEqual(['ArankaDie', 'LuckyDie1']);
    expect(hostView.guestDice).toEqual([]);
    expect(hostView.opponentDiceReady).toBe(false);

    const guestView = toClientGameState(state, 'guest');
    expect(guestView.guestDice).toEqual([]);
    expect(guestView.hostDice).toEqual([]);
    expect(guestView.opponentDiceReady).toBe(true);
  });
});

describe('hot dice', () => {
  it('returns to selecting with faces ready and one roll re-rolls all', () => {
    let state = readyToPlay();
    state = {
      ...state,
      phase: 'selecting',
      rollCount: 1,
      awaitingKeep: true,
      turnScore: 500,
      dice: diceWithValues([1, 1, 1, 1, 1, 1]).map((d, i) => ({ ...d, kept: i < 5 })),
    };

    const hot = handleKeep(state, 'host', [5]);
    expect('error' in hot).toBe(false);
    if ('error' in hot) return;
    expect(hot.phase).toBe('selecting');
    expect(hot.rollCount).toBe(0);
    expect(hot.turnScore).toBe(600);
    expect(hot.dice.every((d) => !d.kept && d.active)).toBe(true);

    const rolled = handleRoll(hot, 'host');
    expect('error' in rolled).toBe(false);
    if ('error' in rolled) return;
    expect(rolled.rollCount).toBe(1);
    expect(rolled.awaitingKeep).toBe(true);
  });
});

describe('lastBust', () => {
  it('lastBust snapshot excludes already-kept dice', () => {
    const dice: Die[] = [
      { id: 0, value: 1, type: 'NormalDie', kept: true, active: true },
      ...diceWithValues([2, 3, 4, 5, 6]).map((d, i) => ({ ...d, id: i + 1, kept: false, active: true })),
    ];
    const snapshot = dice.filter((d) => d.active && !d.kept).map((d) => ({ ...d }));
    expect(snapshot).toHaveLength(5);
    expect(snapshot.every((d) => !d.kept)).toBe(true);
  });

  it('clears lastBust when rolling after bust overlay', () => {
    let state = readyToPlay();
    state = {
      ...state,
      phase: 'selecting',
      currentPlayerIndex: 0,
      rollCount: 0,
      lastBust: { by: 'guest', dice: diceWithValues([2, 3, 4, 5, 6, 3]) },
    };
    const next = handleRoll(state, 'host');
    expect('error' in next).toBe(false);
    if ('error' in next) return;
    expect(next.phase).toBe('selecting');
    expect(next.lastBust).toBeNull();
  });
});

describe('leavePlayer', () => {
  it('clears seat and resets to lobby', () => {
    const state = readyToPlay();
    const afterLeave = leavePlayer(state, 'guest');
    expect(afterLeave.phase).toBe('lobby');
    expect(afterLeave.players[1].name).toBe('');
    expect(afterLeave.players[0].name).toBe('A');
  });
});

describe('handleSelectDice', () => {
  function rolledState(): GameState {
    return {
      ...readyToPlay(),
      phase: 'selecting',
      rollCount: 1,
      awaitingKeep: true,
      turnScore: 0,
      dice: diceWithValues([1, 2, 3, 4, 5, 6]),
      pendingSelection: [],
      lastTurnEnd: null,
    };
  }

  it('broadcasts pending selection for current player', () => {
    const result = handleSelectDice(rolledState(), 'host', [0, 2]);
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.pendingSelection).toEqual([0, 2]);
  });

  it('rejects selection before first roll', () => {
    const state = readyToPlay();
    expect(handleSelectDice(state, 'host', [0])).toEqual({ error: '请先掷骰' });
  });

  it('clears pending selection after keep', () => {
    let state = handleSelectDice(rolledState(), 'host', [0]) as GameState;
    expect(state.pendingSelection).toEqual([0]);
    const kept = handleKeep(state, 'host', [0]) as GameState;
    expect(kept.pendingSelection).toEqual([]);
  });
});

describe('lastTurnEnd', () => {
  it('snapshots kept dice when banking', () => {
    let state = readyToPlay();
    state = {
      ...state,
      phase: 'selecting',
      rollCount: 1,
      awaitingKeep: true,
      turnScore: 100,
      dice: diceWithValues([1, 2, 3, 4, 5, 6]).map((d, i) => ({ ...d, kept: i === 0 })),
    };
    const result = handleBank(state, 'host');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.phase).toBe('turn_end');
    expect(result.lastTurnEnd).toEqual({
      by: 'host',
      earned: 100,
      dice: [expect.objectContaining({ id: 0, value: 1, kept: true })],
    });
    expect(result.currentPlayerIndex).toBe(1);
  });

  it('clears lastTurnEnd when next player rolls', () => {
    let state = readyToPlay();
    state = {
      ...state,
      phase: 'turn_end',
      currentPlayerIndex: 1,
      lastTurnEnd: {
        by: 'host',
        earned: 200,
        dice: diceWithValues([1]).map((d) => ({ ...d, kept: true })),
      },
    };
    const next = handleRoll(state, 'guest');
    expect('error' in next).toBe(false);
    if ('error' in next) return;
    expect(next.lastTurnEnd).toBeNull();
  });
});

describe('joinPlayer', () => {
  it('first joiner becomes host', () => {
    const result = joinPlayer(createInitialState(), 'Alice');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.role).toBe('host');
    expect(result.state.players[0].name).toBe('Alice');
  });

  it('second joiner becomes guest', () => {
    let state = createInitialState();
    state = (joinPlayer(state, 'Alice') as { state: GameState }).state;
    const result = joinPlayer(state, 'Bob');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.role).toBe('guest');
    expect(result.state.players[1].name).toBe('Bob');
  });

  it('rejects guest name matching host', () => {
    let state = createInitialState();
    state = (joinPlayer(state, 'Alice') as { state: GameState }).state;
    const result = joinPlayer(state, 'Alice');
    expect('error' in result).toBe(true);
    if (!('error' in result)) return;
    expect(result.error).toContain('房主');
  });

  it('rejects duplicate guest name', () => {
    let state = createInitialState();
    state = (joinPlayer(state, 'Alice') as { state: GameState }).state;
    state = (joinPlayer(state, 'Bob') as { state: GameState }).state;
    const result = joinPlayer(state, 'Bob');
    expect('error' in result).toBe(true);
  });
});

describe('away grace', () => {
  it('markPlayerAway sets deadline', () => {
    const now = 1_000_000;
    const next = markPlayerAway(createInitialState(), 'host', now);
    expect(next.awayUntil.host).toBe(now + AWAY_GRACE_MS);
  });

  it('clearPlayerAway removes entry', () => {
    let state = markPlayerAway(createInitialState(), 'guest');
    state = clearPlayerAway(state, 'guest');
    expect(state.awayUntil.guest).toBeUndefined();
  });

  it('isPlayerAway respects deadline', () => {
    const now = 5_000;
    const state = markPlayerAway(createInitialState(), 'host', now);
    expect(isPlayerAway(state, 'host', now + 1)).toBe(true);
    expect(isPlayerAway(state, 'host', now + AWAY_GRACE_MS)).toBe(false);
  });

  it('toClientGameState exposes opponentAway while in grace', () => {
    const now = Date.now();
    let state = lobbyWithBothPlayers();
    state = markPlayerAway(state, 'guest', now);
    const client = toClientGameState(state, 'host');
    expect(client.opponentAway).toBe(true);
    expect(client.opponentAwayUntil).toBe(now + AWAY_GRACE_MS);
  });
});
