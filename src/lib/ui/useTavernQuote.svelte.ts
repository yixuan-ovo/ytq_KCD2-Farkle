import { pickTavernQuote, type QuoteTrigger, type TavernQuote } from './tavernQuotes';

const MENU_ROTATE_MS = 28_000;
const IDLE_MS = 20_000;

/** 主菜单语录：首句 + 28s 轮播 + 20s 无操作 idle */
export function createMenuQuoteController() {
  let quote = $state<TavernQuote | null>(null);
  let rotateTimer: ReturnType<typeof setInterval> | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  function show(trigger: QuoteTrigger = 'menu'): void {
    quote = pickTavernQuote(trigger);
  }

  function resetIdle(): void {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => show('idle'), IDLE_MS);
  }

  function start(): void {
    show('menu');
    resetIdle();
    rotateTimer = setInterval(() => show('menu'), MENU_ROTATE_MS);
  }

  function stop(): void {
    if (rotateTimer) clearInterval(rotateTimer);
    if (idleTimer) clearTimeout(idleTimer);
    rotateTimer = null;
    idleTimer = null;
  }

  function onActivity(): void {
    resetIdle();
  }

  return {
    get quote() {
      return quote;
    },
    start,
    stop,
    onActivity,
  };
}

/** 对局语录：由 GameView 按事件调用 show */
export function createGameQuoteController() {
  let quote = $state<TavernQuote | null>(null);
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let gameStartShown = false;
  let lastBigScorePreview = false;
  let lastBustQuoteKey = '';
  let shownGameOverQuote = false;

  function show(trigger: QuoteTrigger): void {
    const picked = pickTavernQuote(trigger);
    if (picked) quote = picked;
  }

  function resetIdle(active: boolean): void {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = null;
    if (!active) return;
    idleTimer = setTimeout(() => show('idle'), IDLE_MS);
  }

  function onActivity(active: boolean): void {
    resetIdle(active);
  }

  function stop(): void {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = null;
    gameStartShown = false;
    lastBigScorePreview = false;
    lastBustQuoteKey = '';
    shownGameOverQuote = false;
    quote = null;
  }

  /** 进入对局页：首句语录（仅首次） */
  function onGameEnter(): void {
    if (!gameStartShown) {
      gameStartShown = true;
      show('game_start');
    } else if (!quote) {
      show('idle');
    }
  }

  function handlePhaseChange(
    phase: string | undefined,
    rollCount: number,
  ): void {
    const p = phase ?? null;
    if (p === 'selecting' && rollCount === 0 && !gameStartShown) {
      gameStartShown = true;
      show('game_start');
    }
  }

  function handlePreview(preview: number, isMyTurn: boolean): void {
    const big = preview >= 1000;
    if (isMyTurn && big && !lastBigScorePreview) {
      show('big_score');
    }
    lastBigScorePreview = big;
  }

  function handleTurnScoreDelta(delta: number, isMyTurn: boolean): void {
    if (isMyTurn && delta >= 1000) {
      show('big_score');
    }
  }

  function handleCombo(hasCombo: boolean): void {
    if (hasCombo) show('combo');
  }

  function handlePhaseQuote(
    phase: string | undefined,
    isWinner: boolean,
    lastBust?: { by: string; dice: { id: number }[] } | null,
  ): void {
    if (lastBust) {
      const key = `${lastBust.by}:${lastBust.dice.map((d) => d.id).join(',')}`;
      if (key === lastBustQuoteKey) return;
      lastBustQuoteKey = key;
      show('bust');
      return;
    }
    lastBustQuoteKey = '';
    if (phase === 'game_over') {
      if (shownGameOverQuote) return;
      shownGameOverQuote = true;
      show(isWinner ? 'win' : 'lose');
      return;
    }
    shownGameOverQuote = false;
  }

  return {
    get quote() {
      return quote;
    },
    show,
    resetIdle,
    onActivity,
    stop,
    onGameEnter,
    handlePhaseChange,
    handlePreview,
    handleTurnScoreDelta,
    handleCombo,
    handlePhaseQuote,
  };
}
