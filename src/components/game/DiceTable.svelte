<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    children?: Snippet;
    title?: string;
    hint?: string;
    onRules?: () => void;
  }

  let { children, title = '摇出骰子', hint = '', onRules }: Props = $props();
</script>

<div class="dice-table">
  <div class="dice-table__surface">
    {#if onRules}
      <button type="button" class="dice-table__rules" onclick={onRules} aria-label="查看规则说明">
        <span class="dice-table__rules-icon" aria-hidden="true">📜</span>
        规则
      </button>
    {/if}

    <header class="dice-table__head">
      <span class="dice-table__ornament" aria-hidden="true"></span>
      <h2 class="dice-table__title">{title}</h2>
      <span class="dice-table__ornament dice-table__ornament--flip" aria-hidden="true"></span>
    </header>

    <div class="dice-table__play">
      {@render children?.()}
    </div>

    {#if hint}
      <p class="dice-table__hint">{hint}</p>
    {/if}
  </div>
</div>

<style>
  .dice-table {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .dice-table__surface {
    position: relative;
    width: 100%;
    max-width: min(640px, 100%);
    border-radius: var(--radius-table);
    background:
      radial-gradient(ellipse 90% 55% at 50% 0%, rgba(201, 168, 106, 0.08), transparent 55%),
      radial-gradient(ellipse 80% 70% at 50% 55%, var(--wood-light) 0%, var(--wood-mid) 52%, #14100c 100%);
    box-shadow:
      var(--shadow-inset-tray),
      0 12px 40px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(201, 168, 106, 0.18);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    padding: var(--space-3) var(--space-3) var(--space-2);
    gap: var(--space-2);
  }

  .dice-table__rules {
    position: absolute;
    top: var(--space-3);
    right: var(--space-3);
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.3rem 0.65rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    color: rgba(201, 168, 106, 0.9);
    background: rgba(12, 9, 6, 0.45);
    border: 1px solid rgba(201, 168, 106, 0.28);
    border-radius: var(--radius-pill);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    cursor: pointer;
    transition:
      background var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out);
  }

  .dice-table__rules:hover {
    background: rgba(12, 9, 6, 0.6);
    border-color: rgba(201, 168, 106, 0.45);
  }

  .dice-table__rules:active {
    transform: scale(0.97);
  }

  .dice-table__rules-icon {
    font-size: 0.875rem;
    line-height: 1;
  }

  .dice-table__head {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    flex: none;
  }

  .dice-table__ornament {
    flex: 1;
    max-width: 72px;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(201, 168, 106, 0.45) 40%,
      rgba(201, 168, 106, 0.15)
    );
  }

  .dice-table__ornament--flip {
    background: linear-gradient(
      to left,
      transparent,
      rgba(201, 168, 106, 0.45) 40%,
      rgba(201, 168, 106, 0.15)
    );
  }

  .dice-table__title {
    flex: none;
    font-family: var(--font-serif);
    font-size: clamp(1rem, 3.5vw, 1.25rem);
    font-weight: 600;
    letter-spacing: 0.2em;
    color: var(--color-gold-bright);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
    white-space: nowrap;
  }

  .dice-table__play {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(var(--die-size) * 2 + var(--die-gap) * 2 + var(--space-2));
    padding: 0;
  }

  .dice-table__hint {
    flex: none;
    margin: 0;
    text-align: center;
    font-size: 0.8125rem;
    color: var(--color-text-soft);
    letter-spacing: 0.04em;
  }

  @media (min-width: 768px) {
    .dice-table__surface {
      padding: var(--space-5) var(--space-5) var(--space-4);
      gap: var(--space-3);
    }

    .dice-table__play {
      min-height: calc(var(--die-size) + var(--space-6));
      padding: var(--space-1) 0;
    }

    .dice-table__ornament {
      max-width: 100px;
    }
  }
</style>
