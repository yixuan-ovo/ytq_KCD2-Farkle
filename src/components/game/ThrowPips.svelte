<script lang="ts">
  interface Props {
    /** 本回合已掷次数（UI 推导，最多显示 3 格） */
    used?: number;
    max?: number;
  }

  let { used = 0, max = 3 }: Props = $props();
</script>

<div class="throw-pips" aria-label="本回合掷骰 {used} / {max}">
  <span class="throw-pips__label">剩余次数</span>
  <div class="throw-pips__dots">
    {#each Array(max) as _, i (i)}
      <span class="throw-pips__dot" class:throw-pips__dot--used={i < used}></span>
    {/each}
  </div>
</div>

<style>
  .throw-pips {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
  }

  .throw-pips__label {
    font-size: 0.625rem;
    color: var(--color-text-soft);
    letter-spacing: 0.06em;
  }

  .throw-pips__dots {
    display: flex;
    gap: 0.35rem;
  }

  .throw-pips__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-gold);
    box-shadow: 0 0 6px rgba(212, 175, 55, 0.4);
  }

  .throw-pips__dot--used {
    background: var(--color-text-soft);
    box-shadow: none;
    opacity: 0.35;
  }
</style>
