<script lang="ts">
  import { scale } from 'svelte/transition';
  import type { BustSnapshot, GamePhase, PlayerId, TurnEndSnapshot } from '$lib/game/types';
  import { clearError, restartGame, session } from '$lib/client/gameSession.svelte';
  import DicePiece from './DicePiece.svelte';

  interface Props {
    phase: GamePhase | null;
    rollCount?: number;
    winnerName?: string;
    isMyTurn?: boolean;
    isWinner?: boolean;
    opponentName?: string;
    bustPlayerName?: string;
    lastBust?: BustSnapshot | null;
    lastTurnEnd?: TurnEndSnapshot | null;
    turnEndPlayerName?: string;
    you?: PlayerId | null;
    winner?: PlayerId | null;
    yourName?: string;
    yourScore?: number;
    opponentScore?: number;
    targetScore?: number;
    canRestart?: boolean;
    onLeave?: () => void;
  }

  let {
    phase,
    rollCount = 0,
    winnerName = '',
    isMyTurn = false,
    isWinner = false,
    opponentName = '对手',
    bustPlayerName = '',
    lastBust = null,
    lastTurnEnd = null,
    turnEndPlayerName = '',
    you = null,
    winner = null,
    yourName = '',
    yourScore = 0,
    opponentScore = 0,
    targetScore = 4000,
    canRestart = false,
    onLeave,
  }: Props = $props();

  function handleLeave(): void {
    onLeave?.();
  }

  let restartSending = $state(false);

  function handleRestart(): void {
    if (restartSending) return;
    restartSending = true;
    clearError();
    if (!restartGame()) {
      restartSending = false;
    }
  }

  let dismissedKey = $state('');

  let dismissTimer: ReturnType<typeof setTimeout> | undefined;
  let scheduledKey = '';

  const COMPACT_WITH_DICE_MS = 1200;
  const COMPACT_BRIEF_MS = 900;

  let restartError = $derived(restartSending ? session.lastError : null);

  let bustDice = $derived((lastBust?.dice ?? []).filter((d) => d.active && !d.kept));
  let turnEndDice = $derived(lastTurnEnd?.dice ?? []);

  let bustActive = $derived(lastBust != null && rollCount === 0);

  let eventKey = $derived.by(() => {
    if (lastBust && rollCount === 0) {
      const faces = lastBust.dice.map((d) => `${d.id}:${d.value}`).join(',');
      return `bust:${lastBust.by}:${faces}`;
    }
    if (phase === 'turn_end' && lastTurnEnd) {
      const kept = lastTurnEnd.dice.map((d) => d.id).join(',');
      return `turn:${lastTurnEnd.by}:${lastTurnEnd.earned}:${kept}`;
    }
    if (phase === 'hot_dice') return 'hot';
    return '';
  });

  let toastMode = $derived.by((): 'bust' | 'turn_end' | 'hot_dice' | null => {
    const key = eventKey;
    if (!key || key === dismissedKey) return null;
    if (bustActive) return 'bust';
    if (phase === 'turn_end' && lastTurnEnd) return 'turn_end';
    if (phase === 'hot_dice') return 'hot_dice';
    return null;
  });

  let toastVisible = $derived(toastMode != null);

  let showGameOver = $derived(phase === 'game_over');

  let decisiveName = $derived(turnEndPlayerName || winnerName || '胜者');
  let decisiveEarned = $derived(lastTurnEnd?.earned ?? 0);
  let winnerTotal = $derived(winner === you ? yourScore : opponentScore);

  let gameOverTitle = $derived(isWinner ? '你赢了！' : '胜局已定');

  let gameOverSubtitle = $derived.by(() => {
    if (lastTurnEnd && decisiveEarned > 0) {
      if (isWinner) {
        return `最后一手 +${decisiveEarned}，总分 ${winnerTotal} 达标`;
      }
      return `${decisiveName} 最后一手 +${decisiveEarned}，总分达到 ${targetScore}`;
    }
    if (isWinner) return '恭喜计分达标';
    return winnerName ? `${winnerName} 赢了` : '对局结束';
  });

  let title = $derived.by(() => {
    if (toastMode === 'bust') {
      return isMyTurn ? '轮到你了' : '本轮作废';
    }
    if (toastMode === 'turn_end' && lastTurnEnd) {
      if (lastTurnEnd.by === you) return '收分成功';
      return '对手收分';
    }
    if (toastMode === 'turn_end') {
      return isMyTurn ? '轮到你了' : '计分成功';
    }
    if (toastMode === 'hot_dice') return '全部得分';
    return '';
  });

  let subtitle = $derived.by(() => {
    if (toastMode === 'bust') {
      const who = bustPlayerName || opponentName;
      return isMyTurn ? `${who} 爆点，该你掷骰了` : '以下骰面无法得分，本回合清零';
    }
    if (toastMode === 'turn_end' && lastTurnEnd) {
      const who = turnEndPlayerName || opponentName;
      if (lastTurnEnd.by === you) return `+${lastTurnEnd.earned} 分已累计`;
      return `${who} 本回合 +${lastTurnEnd.earned}`;
    }
    if (toastMode === 'turn_end') {
      return isMyTurn ? '该你掷骰了' : `等待 ${opponentName} 掷骰`;
    }
    if (toastMode === 'hot_dice') return '六枚得分，再来一轮';
    return '';
  });

  function dismissDurationFor(key: string): number {
    if (key.startsWith('bust:')) {
      const faces = key.slice(key.indexOf(':', 5) + 1);
      return faces.length > 0 ? COMPACT_WITH_DICE_MS : COMPACT_BRIEF_MS;
    }
    if (key.startsWith('turn:')) {
      const kept = key.split(':')[3] ?? '';
      return kept.length > 0 ? COMPACT_WITH_DICE_MS : COMPACT_BRIEF_MS;
    }
    return COMPACT_BRIEF_MS;
  }

  function scheduleDismiss(key: string): void {
    if (!key || key === dismissedKey || scheduledKey === key) return;
    if (dismissTimer) clearTimeout(dismissTimer);
    scheduledKey = key;
    dismissTimer = setTimeout(() => {
      dismissTimer = undefined;
      scheduledKey = '';
      dismissedKey = key;
    }, dismissDurationFor(key));
  }

  $effect(() => {
    if (phase === 'game_over') {
      if (dismissTimer) clearTimeout(dismissTimer);
      dismissTimer = undefined;
      scheduledKey = '';
      dismissedKey = '__game_over__';
      return;
    }

    if (phase !== 'game_over') {
      restartSending = false;
    }
    if (phase === 'lobby' || phase === 'turn_order') {
      dismissedKey = '';
      if (dismissTimer) clearTimeout(dismissTimer);
      dismissTimer = undefined;
      scheduledKey = '';
    }
  });

  $effect(() => {
    if (restartSending && session.lastError) {
      restartSending = false;
    }
  });

  /** 仅随 eventKey 变化排期关闭，避免标题/回合方变化反复 clearTimeout */
  $effect(() => {
    if (showGameOver) return;
    const key = eventKey;
    if (!key || key === dismissedKey) return;
    scheduleDismiss(key);
  });
</script>

{#if showGameOver}
  <div
    class="phase-overlay phase-overlay--win"
    role="dialog"
    aria-modal="true"
    aria-labelledby="phase-overlay-title"
  >
    <div class="phase-overlay__card">
      <h2 id="phase-overlay-title" class="phase-overlay__title">{gameOverTitle}</h2>
      <p class="phase-overlay__subtitle">{gameOverSubtitle}</p>

      {#if lastTurnEnd && decisiveEarned > 0}
        <section class="phase-overlay__decisive" aria-label="决胜一击">
          <p class="phase-overlay__decisive-label">决胜一击 · {decisiveName}</p>
          <p class="phase-overlay__decisive-score">
            +{decisiveEarned} 分
            <span class="phase-overlay__decisive-arrow" aria-hidden="true">→</span>
            总分 {winnerTotal}
            <span class="phase-overlay__decisive-target">/ {targetScore}</span>
          </p>
          {#if turnEndDice.length > 0}
            <div class="phase-overlay__dice" role="group" aria-label="收分骰面">
              {#each turnEndDice as die (die.id)}
                <DicePiece {die} />
              {/each}
            </div>
          {/if}
        </section>
      {/if}

      <section class="phase-overlay__scores" aria-label="终局比分">
        <div
          class="phase-overlay__score-row"
          class:phase-overlay__score-row--winner={winner === you}
        >
          <span class="phase-overlay__score-name">
            {#if winner === you}<span class="phase-overlay__crown" aria-hidden="true">♛</span>{/if}
            {yourName || '你'}
          </span>
          <span class="phase-overlay__score-value">{yourScore}</span>
        </div>
        <div
          class="phase-overlay__score-row"
          class:phase-overlay__score-row--winner={winner != null && winner !== you}
        >
          <span class="phase-overlay__score-name">
            {#if winner != null && winner !== you}<span class="phase-overlay__crown" aria-hidden="true">♛</span>{/if}
            {opponentName}
          </span>
          <span class="phase-overlay__score-value">{opponentScore}</span>
        </div>
      </section>

      <div class="phase-overlay__actions">
        <button type="button" class="btn btn-secondary phase-overlay__btn" onclick={handleLeave}>
          离开房间
        </button>
        {#if canRestart}
          <button
            type="button"
            class="btn btn-gilded phase-overlay__btn"
            disabled={restartSending}
            onclick={handleRestart}
          >
            {restartSending ? '重开中…' : '再来一局'}
          </button>
          {#if restartError}
            <p class="phase-overlay__error" role="alert">{restartError}</p>
          {/if}
        {:else}
          <p class="phase-overlay__hint">等待房主重开…</p>
        {/if}
      </div>
    </div>
  </div>
{:else if toastVisible && toastMode}
  <div
    class="phase-toast"
    class:phase-toast--bust={toastMode === 'bust'}
    class:phase-toast--turn={toastMode === 'turn_end'}
    class:phase-toast--hot={toastMode === 'hot_dice'}
    role="status"
    aria-live="polite"
    aria-labelledby="phase-overlay-title"
  >
    <div class="phase-toast__card" in:scale={{ start: 0.98, duration: 180 }}>
      <h2
        id="phase-overlay-title"
        class="phase-toast__title"
        class:phase-toast__title--danger={toastMode === 'bust' && !isMyTurn}
        class:phase-toast__title--wine={toastMode === 'bust' && isMyTurn}
      >
        {title}
      </h2>
      <p class="phase-toast__subtitle">{subtitle}</p>

      {#if toastMode === 'bust' && bustDice.length > 0}
        <div class="phase-toast__dice" role="group" aria-label="爆点骰面">
          {#each bustDice as die (die.id)}
            <DicePiece {die} />
          {/each}
        </div>
      {/if}

      {#if toastMode === 'turn_end' && turnEndDice.length > 0}
        <div class="phase-toast__dice" role="group" aria-label="收分骰面">
          {#each turnEndDice as die (die.id)}
            <DicePiece {die} />
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  /* 居中卡片浮层：无全屏遮罩变暗，pointer-events:none 不挡底栏 */
  .phase-toast {
    position: fixed;
    inset: 0;
    z-index: 1500;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    pointer-events: none;
    background: transparent;
  }

  .phase-toast__card {
    width: 100%;
    max-width: min(360px, 100%);
    text-align: center;
    background: rgba(45, 30, 19, 0.96);
    color: var(--color-text-on-dark);
    padding: var(--space-3);
    border-radius: var(--radius-card);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
    border: 1px solid var(--color-border-gold);
    backdrop-filter: blur(6px);
    pointer-events: none;
  }

  .phase-toast--bust .phase-toast__card {
    border-color: rgba(185, 28, 28, 0.45);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45), 0 0 16px rgba(185, 28, 28, 0.12);
  }

  .phase-toast--hot .phase-toast__card {
    border-color: var(--color-gold);
  }

  .phase-toast__title {
    font-family: var(--font-serif);
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-gold-bright);
    margin-bottom: var(--space-1);
  }

  .phase-toast__title--danger {
    color: var(--color-danger);
  }

  .phase-toast__title--wine {
    color: var(--color-gold);
    text-shadow: var(--shadow-glow-gold);
  }

  .phase-toast__subtitle {
    font-size: 0.8125rem;
    color: var(--color-text-on-dark-soft);
    margin-bottom: var(--space-2);
    line-height: 1.45;
  }

  .phase-toast__dice {
    --die-size: 36px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    padding: var(--space-1) 0 0;
  }

  @media (min-width: 768px) {
    .phase-toast__dice {
      --die-size: 40px;
    }
  }

  .phase-overlay {
    position: fixed;
    inset: 0;
    z-index: 1600;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    pointer-events: auto;
  }

  .phase-overlay--win {
    background: linear-gradient(
      180deg,
      rgba(45, 30, 19, 0.95) 0%,
      rgba(18, 12, 8, 0.88) 50%,
      rgba(0, 0, 0, 0.82) 100%
    );
  }

  .phase-overlay__card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: min(400px, 100%);
    text-align: center;
    background: rgba(45, 30, 19, 0.94);
    color: var(--color-text-on-dark);
    padding: var(--space-4) var(--space-4) var(--space-5);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-fab);
    border: 1px solid var(--color-border-gold);
    backdrop-filter: blur(6px);
    pointer-events: auto;
  }

  .phase-overlay__title {
    font-family: var(--font-serif);
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-gold-bright);
    margin-bottom: var(--space-2);
  }

  .phase-overlay__subtitle {
    font-size: 0.9375rem;
    color: var(--color-text-on-dark-soft);
    margin-bottom: var(--space-3);
    line-height: 1.5;
  }

  .phase-overlay__decisive {
    margin-bottom: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-card);
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid rgba(201, 168, 106, 0.2);
  }

  .phase-overlay__decisive-label {
    margin: 0 0 var(--space-1);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(201, 168, 106, 0.85);
  }

  .phase-overlay__decisive-score {
    margin: 0 0 var(--space-2);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-gold-bright);
    line-height: 1.4;
  }

  .phase-overlay__decisive-arrow {
    margin: 0 0.2em;
    opacity: 0.7;
    font-weight: 400;
  }

  .phase-overlay__decisive-target {
    font-weight: 500;
    color: var(--color-text-on-dark-soft);
  }

  .phase-overlay__dice {
    --die-size: 36px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
  }

  @media (min-width: 768px) {
    .phase-overlay__dice {
      --die-size: 40px;
    }
  }

  .phase-overlay__scores {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-4);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-card);
    background: rgba(0, 0, 0, 0.18);
    border: 1px solid rgba(201, 168, 106, 0.12);
  }

  .phase-overlay__score-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-1) 0;
    font-size: 0.875rem;
    color: var(--color-text-on-dark-soft);
  }

  .phase-overlay__score-row--winner {
    color: var(--color-gold-bright);
    font-weight: 600;
  }

  .phase-overlay__score-row--winner .phase-overlay__score-value {
    color: var(--color-gold-bright);
  }

  .phase-overlay__score-name {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .phase-overlay__score-value {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    color: var(--color-text-on-dark);
  }

  .phase-overlay__crown {
    flex-shrink: 0;
    font-size: 0.875rem;
    color: var(--color-gold);
  }

  .phase-overlay__actions {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin-top: var(--space-2);
  }

  .phase-overlay__btn {
    min-height: 44px;
    width: 100%;
  }

  .phase-overlay__hint {
    font-size: 0.875rem;
    color: var(--color-text-soft);
    padding: var(--space-2);
  }

  .phase-overlay__error {
    font-size: 0.8125rem;
    color: var(--color-danger);
    margin: 0;
    padding: var(--space-1) var(--space-2);
    line-height: 1.4;
  }

  @keyframes overlayIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
