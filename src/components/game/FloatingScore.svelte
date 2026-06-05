<script lang="ts">
  import { FLY_SCORE_DURATION_MS, SCORE_SPARK_OFFSETS } from '$lib/ui/animation';

  interface Props {
    show?: boolean;
    amount?: number;
    x?: number;
    y?: number;
  }

  let { show = false, amount = 0, x = 0, y = 0 }: Props = $props();
</script>

{#if show && amount > 0}
  <div
    class="floating-score"
    style="left: {x}px; top: {y}px; --fly-duration: {FLY_SCORE_DURATION_MS}ms"
    aria-live="polite"
  >
    {#each SCORE_SPARK_OFFSETS as spark, i (i)}
      <span
        class="floating-score__spark"
        style="--spark-x: {spark.x}px; --spark-y: {spark.y}px; --spark-delay: {i * 40}ms"
        aria-hidden="true"
      ></span>
    {/each}
    +{amount}
  </div>
{/if}

<style>
  .floating-score {
    position: fixed;
    z-index: 500;
    transform: translate(-50%, -50%);
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-gold-bright);
    text-shadow:
      0 0 12px rgba(212, 175, 55, 0.8),
      0 2px 4px rgba(0, 0, 0, 0.6);
    pointer-events: none;
    animation: flyScore var(--fly-duration) var(--ease-out) forwards;
  }

  .floating-score__spark {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 5px;
    height: 5px;
    margin: -2px 0 0 -2px;
    border-radius: 50%;
    background: var(--color-gold-bright);
    box-shadow: 0 0 6px rgba(212, 175, 55, 0.9);
    animation: sparkFly var(--fly-duration) var(--ease-out) forwards;
    animation-delay: var(--spark-delay);
    opacity: 0;
  }

  @keyframes flyScore {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.5);
    }
    20% {
      opacity: 1;
      transform: translate(-50%, -60%) scale(1.1);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, calc(-50% - 120px)) scale(1.2);
    }
  }

  @keyframes sparkFly {
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.3);
    }
    25% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translate(
          calc(-50% + var(--spark-x) * 2),
          calc(-50% + var(--spark-y) * 2 - 80px)
        )
        scale(0.2);
    }
  }
</style>
