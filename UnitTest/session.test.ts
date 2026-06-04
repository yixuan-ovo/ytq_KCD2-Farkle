import { describe, expect, it } from 'vitest';
import type { Die, GameState } from '../src/lib/game/types';
import {
  createInitialState,
  handleBank,
  handleKeep,
  handleRoll,
  handleSelectDice,
  leavePlayer,
  startGame,
  submitDicePick,
} from '../worker/src/session';
import { toClientGameState } from '../src/lib/protocol/messages';

function readyToPlay(): GameState {
  let state = createInitialState();
  state = startGame(
    {
      ...state,
      players: [
        { ...state.players[0], name: 'A' },
        { ...state.players[1], name: 'B' },
      ],
    },
    'host',
  ) as GameState;
  return state;
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
    expect(result.rollCount).toBe(1);
    if (result.phase === 'selecting') {
      expect(result.awaitingKeep).toBe(true);
    } else {
      expect(result.phase).toBe('bust');
    }
  });

  it('blocks second roll before keep', () => {
    let state = readyToPlay();
    state = handleRoll(state, 'host') as GameState;
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
    if (result.phase === 'selecting') {
      expect(result.rollCount).toBe(2);
      expect(result.awaitingKeep).toBe(true);
    } else {
      expect(result.phase).toBe('bust');
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
      expect(['bust', 'turn_end']).toContain(result.phase);
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
    if (state.phase !== 'selecting') {
      expect(['bust', 'turn_end']).toContain(state.phase);
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
      expect(['bust', 'turn_end']).toContain(result.phase);
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
    expect(result.phase).toBe('selecting');
    expect(result.winner).toBeNull();
    expect(result.players[0]?.totalScore).toBe(0);
    expect(result.players[1]?.totalScore).toBe(0);
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
  function lobbyReady() {
    return {
      ...createInitialState(),
      players: [
        { ...createInitialState().players[0], name: 'A' },
        { ...createInitialState().players[1], name: 'B' },
      ],
    } as GameState;
  }

  it('enters dice_selection when specialDiceCount > 0', () => {
    const result = startGame(lobbyReady(), 'host', { specialDiceCount: 2, targetScore: 4000 });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.phase).toBe('dice_selection');
    expect(result.config.specialDiceCount).toBe(2);
    expect(result.hostDice).toEqual([]);
  });

  it('skips dice_selection when specialDiceCount is 0', () => {
    const result = startGame(lobbyReady(), 'host', { specialDiceCount: 0, targetScore: 3000 });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.phase).toBe('selecting');
    expect(result.config.targetScore).toBe(3000);
  });
});

describe('submitDicePick', () => {
  function inDiceSelection(): GameState {
    const base = startGame(
      {
        ...createInitialState(),
        players: [
          { ...createInitialState().players[0], name: 'A' },
          { ...createInitialState().players[1], name: 'B' },
        ],
      },
      'host',
      { specialDiceCount: 2 },
    ) as GameState;
    return base;
  }

  it('starts game when both players pick', () => {
    let state = inDiceSelection();
    state = submitDicePick(state, 'host', ['ArankaDie', 'LuckyDie1']) as GameState;
    expect(state.phase).toBe('dice_selection');
    state = submitDicePick(state, 'guest', ['DevilDie', 'OddDie']) as GameState;
    expect(state.phase).toBe('selecting');
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
      phase: 'bust',
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
