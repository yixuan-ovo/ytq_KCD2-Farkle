<script lang="ts">
  import { scale } from 'svelte/transition';
  import type { BustSnapshot, GamePhase } from '$lib/game/types';
  import DicePiece from './DicePiece.svelte';

  interface Props {
    phase: GamePhase | null;
    winnerName?: string;
    isMyTurn?: boolean;
    isWinner?: boolean;
    opponentName?: string;
    bustPlayerName?: string;
    lastBust?: BustSnapshot | null;
    canRestart?: boolean;
    onLeave?: () => void;
    onRestart?: () => void;
    onDismiss?: () => void;
  }

  let {
    phase,
    winnerName = '',
    isMyTurn = false,
    isWinner = false,
    opponentName = '对手',
    bustPlayerName = '',
    lastBust = null,
    canRestart = false,
    onLeave,
    onRestart,
    onDismiss,
  }: Props = $props();

  let visible = $state(false);
  let title = $state('');
  let subtitle = $state('');
  let autoDismiss = $state(false);

  let isCompact = $derived(
    phase === 'bust' || phase === 'turn_end' || phase === 'hot_dice',
  );

  /** 仅展示本次掷出、未保留的骰（已得分置旁的不再显示） */
  let bustDice = $derived((lastBust?.dice ?? []).filter((d) => d.active && !d.kept));

  $effect(() => {
    if (phase === 'bust') {
      visible = true;
      const who = bustPlayerName || opponentName;
      if (isMyTurn) {
        title = '轮到你了';
        subtitle = `${who} 爆点，该你掷骰了`;
      } else {
        title = '本轮作废';
        subtitle = '以下骰面无法得分，本回合清零';
      }
      autoDismiss = true;
    } else if (phase === 'hot_dice') {
      visible = true;
      title = '全部得分';
      subtitle = '六枚得分，再来一轮';
      autoDismiss = true;
    } else if (phase === 'game_over') {
      visible = true;
      if (isWinner) {
        title = '你赢了！';
        subtitle = '恭喜计分达标';
      } else {
        title = '胜局已定';
        subtitle = winnerName ? `${winnerName} 赢了` : '对局结束';
      }
      autoDismiss = false;
    } else if (phase === 'turn_end') {
      visible = true;
      if (isMyTurn) {
        title = '轮到你了';
        subtitle = '该你掷骰了';
      } else {
        title = '计分成功';
        subtitle = `等待 ${opponentName} 掷骰`;
      }
      autoDismiss = true;
    } else {
      visible = false;
    }
  });

  $effect(() => {
    if (!visible || !autoDismiss) return;
    const duration = phase === 'bust' && bustDice.length > 0 ? 3100 : 2100;
    const timer = setTimeout(() => {
      visible = false;
      onDismiss?.();
    }, duration);
    return () => clearTimeout(timer);
  });
</script>

{#if visible}
  <div
    class="phase-overlay"
    class:phase-overlay--compact={isCompact}
    class:phase-overlay--bust={phase === 'bust'}
    class:phase-overlay--hot={phase === 'hot_dice'}
    class:phase-overlay--win={phase === 'game_over'}
    class:phase-overlay--turn={phase === 'turn_end'}
    role={isCompact ? 'status' : 'dialog'}
    aria-modal={!isCompact}
    aria-live={isCompact ? 'polite' : undefined}
    aria-labelledby="phase-overlay-title"
  >
    <div class="phase-overlay__card" in:scale={{ start: 0.98, duration: 220 }}>
      <h2
        id="phase-overlay-title"
        class="phase-overlay__title"
        class:phase-overlay__title--gold={phase === 'hot_dice' || phase === 'game_over'}
        class:phase-overlay__title--danger={phase === 'bust' && !isMyTurn}
        class:phase-overlay__title--wine={phase === 'turn_end' && isMyTurn || (phase === 'bust' && isMyTurn)}
      >
        {title}
      </h2>
      <p class="phase-overlay__subtitle">{subtitle}</p>

      {#if phase === 'bust' && bustDice.length > 0}
        <div class="phase-overlay__dice" role="group" aria-label="爆点骰面">
          {#each bustDice as die (die.id)}
            <DicePiece {die} />
          {/each}
        </div>
      {/if}

      {#if phase === 'game_over'}
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
      {/if}
    </div>
  </div>
{/if}

<style>
  .phase-overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.72);
    padding: var(--space-4);
    animation: overlayIn 0.22s var(--ease-out);
  }

  .phase-overlay--compact {
    align-items: flex-end;
    justify-content: center;
    padding: 0 var(--space-3) calc(5.5rem + env(safe-area-inset-bottom, 0px));
    background: rgba(8, 5, 4, 0.32);
    pointer-events: none;
  }

  .phase-overlay--compact .phase-overlay__card {
    pointer-events: auto;
    max-width: min(300px, 94vw);
    padding: var(--space-3) var(--space-3);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  }

  .phase-overlay--compact .phase-overlay__title {
    font-size: 1.125rem;
    margin-bottom: var(--space-1);
  }

  .phase-overlay--compact .phase-overlay__subtitle {
    font-size: 0.8125rem;
    margin-bottom: var(--space-2);
  }

  .phase-overlay--bust {
    background:
      radial-gradient(ellipse 70% 40% at 50% 85%, rgba(185, 28, 28, 0.14), transparent 70%),
      rgba(8, 5, 4, 0.36);
  }

  .phase-overlay--bust.phase-overlay--compact {
    background:
      radial-gradient(ellipse 80% 50% at 50% 90%, rgba(185, 28, 28, 0.12), transparent 65%),
      rgba(8, 5, 4, 0.34);
  }

  .phase-overlay--hot {
    background:
      radial-gradient(ellipse 70% 50% at 50% 45%, var(--color-gold-wash), transparent 70%),
      rgba(18, 12, 8, 0.75);
    animation:
      overlayIn 0.22s var(--ease-out),
      goldWashPulse 1.6s ease-in-out 2;
  }

  .phase-overlay--win {
    background: linear-gradient(
      180deg,
      rgba(45, 30, 19, 0.95) 0%,
      rgba(18, 12, 8, 0.88) 50%,
      rgba(0, 0, 0, 0.82) 100%
    );
  }

  .phase-overlay--turn {
    background: rgba(0, 0, 0, 0.68);
  }

  .phase-overlay--turn.phase-overlay--compact {
    background: rgba(8, 5, 4, 0.3);
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

  .phase-overlay--bust .phase-overlay__card {
    border-color: rgba(185, 28, 28, 0.4);
  }

  .phase-overlay--hot .phase-overlay__card {
    border-color: var(--color-gold);
    box-shadow: var(--shadow-fab), 0 0 24px rgba(201, 168, 106, 0.25);
  }

  .phase-overlay__title {
    font-family: var(--font-serif);
    font-size: 1.75rem;
    font-weight: 600;
    color: var(--color-gold-bright);
    margin-bottom: var(--space-2);
  }

  .phase-overlay__title--gold {
    color: var(--color-gold-bright);
    text-shadow: var(--shadow-glow-gold);
  }

  .phase-overlay__title--danger {
    color: var(--color-danger);
  }

  .phase-overlay__title--wine {
    color: var(--color-gold);
    text-shadow: var(--shadow-glow-gold);
  }

  .phase-overlay__subtitle {
    font-size: 0.9375rem;
    color: var(--color-text-on-dark-soft);
    margin-bottom: var(--space-4);
    line-height: 1.5;
  }

  .phase-overlay__dice {
    --die-size: 44px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin: 0 auto var(--space-1);
    padding: var(--space-2);
    border-radius: var(--radius-die);
    background: rgba(0, 0, 0, 0.22);
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

  @keyframes goldWashPulse {
    0%,
    100% {
      filter: brightness(1);
    }
    50% {
      filter: brightness(1.12);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .phase-overlay--hot {
      animation: overlayIn 0.22s var(--ease-out);
    }
  }
</style>
