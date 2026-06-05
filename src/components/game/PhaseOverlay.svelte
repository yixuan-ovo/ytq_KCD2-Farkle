<script lang="ts">
  import { scale } from 'svelte/transition';
  import type { BustSnapshot, GamePhase, PlayerId, TurnEndSnapshot } from '$lib/game/types';
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
    canRestart?: boolean;
    onLeave?: () => void;
    onRestart?: () => void;
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
    canRestart = false,
    onLeave,
    onRestart,
  }: Props = $props();

  let dismissedKey = $state('');

  let dismissTimer: ReturnType<typeof setTimeout> | undefined;
  let scheduledKey = '';

  const COMPACT_WITH_DICE_MS = 2800;
  const COMPACT_BRIEF_MS = 2200;

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

  let title = $derived.by(() => {
    if (phase === 'game_over') {
      return isWinner ? '你赢了！' : '胜局已定';
    }
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
    if (phase === 'game_over') {
      if (isWinner) return '恭喜计分达标';
      return winnerName ? `${winnerName} 赢了` : '对局结束';
    }
    if (toastMode === 'bust') {
      const who = bustPlayerName || opponentName;
      return isMyTurn ? `${who} 爆点，该你掷骰了` : '以下骰面无法得分，本回合清零';
    }
    if (toastMode === 'turn_end' && lastTurnEnd) {
      const who = turnEndPlayerName || opponentName;
      if (lastTurnEnd.by === you) return `+${lastTurnEnd.earned} 分已入账`;
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
    if (phase === 'lobby' || phase === 'turn_order' || phase === 'game_over') {
      dismissedKey = '';
      if (dismissTimer) clearTimeout(dismissTimer);
      dismissTimer = undefined;
      scheduledKey = '';
    }
  });

  /** 仅随 eventKey 变化排期关闭，避免标题/回合方变化反复 clearTimeout */
  $effect(() => {
    const key = eventKey;
    if (!key || key === dismissedKey) return;
    scheduleDismiss(key);
  });
</script>

{#if toastVisible && toastMode}
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
{:else if phase === 'game_over'}
  <div
    class="phase-overlay phase-overlay--win"
    role="dialog"
    aria-modal="true"
    aria-labelledby="phase-overlay-title"
  >
    <div class="phase-overlay__card" in:scale={{ start: 0.98, duration: 220 }}>
      <h2 id="phase-overlay-title" class="phase-overlay__title">{title}</h2>
      <p class="phase-overlay__subtitle">{subtitle}</p>
      <div class="phase-overlay__actions">
        <button type="button" class="btn btn-secondary phase-overlay__btn" onclick={onLeave}>
          离开房间
        </button>
        {#if canRestart}
          <button type="button" class="btn btn-gilded phase-overlay__btn" onclick={onRestart}>
            再来一局
          </button>
        {:else}
          <p class="phase-overlay__hint">等待房主重开…</p>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* 底部 toast：嵌入主布局、紧贴操作栏上方，不遮挡状态栏 */
  .phase-toast {
    position: relative;
    width: 100%;
    display: flex;
    justify-content: center;
    padding: var(--space-1) 0 var(--space-2);
    pointer-events: none;
  }

  .phase-toast__card {
    width: 100%;
    max-width: min(320px, 100%);
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
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    animation: overlayIn 0.22s var(--ease-out);
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
    width: 100%;
    max-width: 360px;
    text-align: center;
    background: rgba(45, 30, 19, 0.94);
    color: var(--color-text-on-dark);
    padding: var(--space-5) var(--space-4);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-fab);
    border: 1px solid var(--color-border-gold);
    backdrop-filter: blur(6px);
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
    margin-bottom: var(--space-4);
    line-height: 1.5;
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

  @keyframes overlayIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
