<script lang="ts">
  import { comboLabel } from '$lib/ui/scoringLabels';
  import type { ComboType } from '$lib/ui/comboDetect';
  import { COMBO_BANNER_MS, SCORE_SPARK_OFFSETS } from '$lib/ui/animation';

  interface Props {
    combo?: ComboType;
    visible?: boolean;
    onDone?: () => void;
  }

  let { combo = null, visible = false, onDone }: Props = $props();

  let label = $derived(comboLabel(combo));

  $effect(() => {
    if (!visible || !combo) return;
    const t = setTimeout(() => onDone?.(), COMBO_BANNER_MS);
    return () => clearTimeout(t);
  });
</script>

{#if visible && label}
  <div class="combo-banner" role="status">
    <div class="combo-banner__burst" aria-hidden="true">
      {#each SCORE_SPARK_OFFSETS as spark, i (i)}
        <span
          class="combo-banner__spark"
          style="--spark-x: {spark.x * 1.8}px; --spark-y: {spark.y * 1.8}px; --spark-delay: {i * 50}ms"
        ></span>
      {/each}
    </div>
    <span class="combo-banner__text">{label}</span>
  </div>
{/if}

<style>
  .combo-banner {
    position: fixed;
    inset: 0;
    z-index: 400;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    animation: bannerIn 0.25s var(--ease-out);
  }

  .combo-banner__burst {
    position: absolute;
    width: 0;
    height: 0;
  }

  .combo-banner__spark {
    position: absolute;
    width: 6px;
    height: 6px;
    margin: -3px 0 0 -3px;
    border-radius: 50%;
    background: var(--color-gold-bright);
    box-shadow: 0 0 8px rgba(212, 175, 55, 0.85);
    animation: comboSpark 0.75s var(--ease-out) forwards;
    animation-delay: var(--spark-delay);
    opacity: 0;
  }

  .combo-banner__text {
    position: relative;
    z-index: 1;
    font-family: var(--font-serif);
    font-size: clamp(1.5rem, 6vw, 2.25rem);
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--color-gold-bright);
    text-shadow:
      0 0 24px rgba(212, 175, 55, 0.6),
      0 4px 12px rgba(0, 0, 0, 0.8);
    padding: var(--space-3) var(--space-5);
    border: 2px solid var(--color-gold);
    border-radius: var(--radius-card);
    background: rgba(26, 18, 11, 0.85);
    animation: bannerPulse 0.8s var(--ease-out);
  }

  @keyframes bannerIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes bannerPulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.04);
    }
  }

  @keyframes comboSpark {
    0% {
      opacity: 0;
      transform: translate(0, 0) scale(0.4);
    }
    30% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(var(--spark-x), var(--spark-y)) scale(0.15);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .combo-banner__spark {
      display: none;
    }
  }
</style>
