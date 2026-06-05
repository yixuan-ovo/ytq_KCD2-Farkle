<script lang="ts">
  import { scale } from 'svelte/transition';
  import type { CoinFlipSnapshot } from '$lib/game/types';

  interface Props {
    coinFlip?: CoinFlipSnapshot | null;
    firstPlayerName?: string;
    onComplete?: () => void;
  }

  let { coinFlip = null, firstPlayerName = '', onComplete }: Props = $props();

  let spinning = $state(true);
  let showResult = $state(false);

  $effect(() => {
    if (!coinFlip) return;

    spinning = true;
    showResult = false;

    const revealTimer = setTimeout(() => {
      spinning = false;
      showResult = true;
    }, 1200);

    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  });
</script>

{#if coinFlip}
  <div
    class="coin-overlay"
    role="dialog"
    aria-modal="true"
    aria-live="polite"
    aria-labelledby="coin-overlay-title"
  >
    <div class="coin-overlay__card" in:scale={{ start: 0.96, duration: 220 }}>
      <p class="coin-overlay__eyebrow">金币一掷</p>
      <h2 id="coin-overlay-title" class="coin-overlay__title">定先后手</h2>

      <div class="coin-overlay__stage" aria-hidden="true">
        <div
          class="coin-flip"
          class:coin-flip--spinning={spinning}
          class:coin-flip--tails={!coinFlip.heads}
        >
          <div class="coin-flip__inner">
            <div class="coin-flip__face coin-flip__face--heads">
              <div class="coin-flip__mark">
                <span class="coin-flip__sigil" aria-hidden="true">👑</span>
                <span class="coin-flip__label">正</span>
              </div>
            </div>
            <div class="coin-flip__face coin-flip__face--tails">
              <div class="coin-flip__mark">
                <span class="coin-flip__sigil coin-flip__sigil--tails" aria-hidden="true">⭐</span>
                <span class="coin-flip__label">反</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p class="coin-overlay__subtitle" class:coin-overlay__subtitle--result={showResult}>
        {#if showResult}
          <strong class="coin-overlay__winner">{firstPlayerName || '先手玩家'}</strong> 掷得先手
        {:else}
          金币飞旋中…
        {/if}
      </p>
    </div>
  </div>
{/if}

<style>
  .coin-overlay {
    position: fixed;
    inset: 0;
    z-index: 210;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    background:
      radial-gradient(ellipse 60% 45% at 50% 40%, rgba(201, 168, 106, 0.12), transparent 70%),
      rgba(8, 5, 4, 0.82);
    animation: coinOverlayIn 0.24s var(--ease-out);
  }

  .coin-overlay__card {
    width: 100%;
    max-width: 340px;
    text-align: center;
    background: rgba(45, 30, 19, 0.96);
    color: var(--color-text-on-dark);
    padding: var(--space-5) var(--space-4);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-fab);
    border: 1px solid var(--color-border-gold);
    backdrop-filter: blur(6px);
  }

  .coin-overlay__eyebrow {
    font-size: 0.75rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-gold);
    margin-bottom: var(--space-1);
  }

  .coin-overlay__title {
    font-family: var(--font-serif);
    font-size: 1.625rem;
    font-weight: 600;
    color: var(--color-gold-bright);
    margin-bottom: var(--space-4);
  }

  .coin-overlay__stage {
    display: flex;
    justify-content: center;
    margin-bottom: var(--space-4);
    perspective: 600px;
  }

  .coin-flip {
    width: 120px;
    height: 120px;
  }

  .coin-flip__inner {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transform: rotateY(0deg);
  }

  .coin-flip--spinning:not(.coin-flip--tails) .coin-flip__inner {
    animation: coinSpinHeads 1.1s cubic-bezier(0.45, 0.05, 0.25, 1) forwards;
  }

  .coin-flip--spinning.coin-flip--tails .coin-flip__inner {
    animation: coinSpinTails 1.1s cubic-bezier(0.45, 0.05, 0.25, 1) forwards;
  }

  .coin-flip--tails:not(.coin-flip--spinning) .coin-flip__inner {
    transform: rotateY(180deg);
  }

  .coin-flip__face {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    backface-visibility: hidden;
    border: 4px solid rgba(201, 168, 106, 0.75);
    box-shadow:
      inset 0 2px 10px rgba(255, 235, 190, 0.4),
      inset 0 -5px 12px rgba(0, 0, 0, 0.38),
      0 8px 22px rgba(0, 0, 0, 0.48);
  }

  .coin-flip__face::before {
    content: '';
    position: absolute;
    inset: 10px;
    border-radius: 50%;
    border: 2px solid rgba(45, 30, 19, 0.22);
    pointer-events: none;
  }

  .coin-flip__face--heads {
    background: radial-gradient(circle at 38% 32%, #fff0c8 0%, #e8c878 38%, #b8860b 72%, #6b4e0a 100%);
    transform: rotateY(0deg);
  }

  .coin-flip__face--heads::after {
    content: '';
    position: absolute;
    inset: 18px;
    border-radius: 50%;
    border: 1px dashed rgba(45, 30, 19, 0.28);
    pointer-events: none;
  }

  .coin-flip__face--tails {
    background: radial-gradient(circle at 38% 32%, #d8ccb0 0%, #9a8458 42%, #5c4a28 78%, #2a2010 100%);
    transform: rotateY(180deg);
    border-color: rgba(120, 98, 62, 0.85);
  }

  .coin-flip__face--tails::after {
    content: '';
    position: absolute;
    inset: 18px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(0, 0, 0, 0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .coin-flip__mark {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.125rem;
    width: 72%;
    height: 72%;
    border-radius: 50%;
  }

  .coin-flip__face--heads .coin-flip__mark {
    background: radial-gradient(circle at 50% 40%, rgba(255, 248, 220, 0.55) 0%, transparent 68%);
  }

  .coin-flip__face--tails .coin-flip__mark {
    background: radial-gradient(circle at 50% 40%, rgba(255, 255, 255, 0.08) 0%, transparent 68%);
    border: 2px solid rgba(30, 22, 12, 0.35);
  }

  .coin-flip__sigil {
    font-size: 2.75rem;
    line-height: 1;
    color: rgba(45, 30, 19, 0.88);
    text-shadow:
      0 1px 0 rgba(255, 255, 255, 0.45),
      0 2px 6px rgba(0, 0, 0, 0.25);
  }

  .coin-flip__sigil--tails {
    font-size: 2.5rem;
    color: rgba(255, 235, 190, 0.92);
    text-shadow:
      0 0 10px rgba(201, 168, 106, 0.35),
      0 2px 4px rgba(0, 0, 0, 0.45);
  }

  .coin-flip__label {
    font-family: var(--font-serif);
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-indent: 0.2em;
    line-height: 1;
  }

  .coin-flip__face--heads .coin-flip__label {
    color: rgba(45, 30, 19, 0.82);
  }

  .coin-flip__face--tails .coin-flip__label {
    color: rgba(255, 235, 190, 0.88);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }

  .coin-overlay__subtitle {
    font-size: 0.9375rem;
    color: var(--color-text-on-dark-soft);
    min-height: 1.5em;
    transition: opacity 0.25s ease;
  }

  .coin-overlay__subtitle--result {
    color: var(--color-text-on-dark);
  }

  .coin-overlay__winner {
    color: var(--color-gold-bright);
    font-weight: 600;
  }

  @keyframes coinOverlayIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes coinSpinHeads {
    0% {
      transform: rotateY(0deg);
    }
    100% {
      transform: rotateY(1080deg);
    }
  }

  @keyframes coinSpinTails {
    0% {
      transform: rotateY(0deg);
    }
    100% {
      transform: rotateY(1260deg);
    }
  }
</style>
