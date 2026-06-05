<script lang="ts">
  interface Props {
    score?: number;
    preview?: number;
  }

  let { score = 0, preview = 0 }: Props = $props();

  let prevScore = $state(0);
  let pulsing = $state(false);

  let showPreview = $derived(preview > 0);

  $effect(() => {
    const s = score;
    if (s > prevScore && s > 0) {
      pulsing = true;
      const t = setTimeout(() => {
        pulsing = false;
      }, 500);
      prevScore = s;
      return () => clearTimeout(t);
    }
    prevScore = s;
  });
</script>

<div class="turn-scores" data-turn-score-anchor>
  <div class="turn-score panel-parchment">
    <div class="turn-score__inner">
      <span class="turn-score__label">本轮累计</span>
      <span
        class="turn-score__value"
        class:turn-score__value--preview={showPreview}
      >
        {showPreview ? `+${preview}` : preview}
      </span>
    </div>
  </div>

  <div class="turn-score panel-parchment">
    <div class="turn-score__inner">
      <span class="turn-score__label">当前回合累积</span>
      <span
        class="turn-score__value"
        class:turn-score__value--gold={score > 0}
        class:turn-score__value--pulse={pulsing}
      >
        {score}
      </span>
    </div>
  </div>
</div>

<style>
  .turn-scores {
    display: flex;
    align-items: stretch;
    justify-content: center;
    gap: var(--space-2);
    width: 100%;
    max-width: min(420px, 96vw);
  }

  .turn-score {
    flex: 1;
    min-width: 0;
    max-width: 200px;
    box-shadow:
      inset 0 0 20px rgba(43, 31, 19, 0.12),
      var(--shadow-card);
  }

  .turn-score__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 4.25rem;
    padding: var(--space-1) var(--space-2);
    border: 1px dashed rgba(92, 69, 46, 0.35);
    border-radius: calc(var(--radius-card) - 4px);
  }

  .turn-score__label {
    font-family: var(--font-serif);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: rgba(44, 24, 16, 0.65);
    margin-bottom: var(--space-1);
    text-align: center;
    line-height: 1.25;
  }

  .turn-score__value {
    font-family: var(--font-mono);
    font-size: clamp(1.375rem, 6vw, 2.5rem);
    font-weight: 700;
    color: var(--color-wine-deep);
    line-height: 1;
    transition: color var(--duration-normal) var(--ease-out);
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.35);
  }

  .turn-score__value--preview {
    color: #3d6a9e;
    text-shadow: 0 0 12px rgba(61, 106, 158, 0.35);
  }

  .turn-score__value--gold {
    color: #a47624;
    text-shadow: 0 0 10px rgba(212, 175, 55, 0.25);
  }

  .turn-score__value--pulse {
    animation: scoreGlowPulse 0.5s var(--ease-out) forwards;
  }

  @keyframes scoreGlowPulse {
    0% {
      transform: scale(1);
      color: var(--color-wine-deep);
    }
    50% {
      transform: scale(1.12);
      color: var(--color-gold-bright);
      filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.75));
    }
    100% {
      transform: scale(1);
      color: #a47624;
      filter: none;
    }
  }

  @media (min-width: 768px) {
    .turn-scores {
      gap: var(--space-3);
    }

    .turn-score__inner {
      min-height: 5.5rem;
      padding: var(--space-2) var(--space-3);
    }

    .turn-score__label {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      margin-bottom: var(--space-2);
      line-height: 1.3;
    }

    .turn-score__value {
      font-size: clamp(1.75rem, 7vw, 2.5rem);
    }
  }
</style>
