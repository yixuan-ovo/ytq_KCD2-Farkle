<script lang="ts">
  import { fade } from 'svelte/transition';
  import type { TavernQuote } from '$lib/ui/tavernQuotes';

  interface Props {
    quote: TavernQuote | null;
    compact?: boolean;
  }

  let { quote, compact = false }: Props = $props();

  let reduceMotion = $state(false);

  $effect(() => {
    reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
</script>

{#if quote}
  <aside
    class="tavern-quote"
    class:tavern-quote--compact={compact}
    role="status"
    aria-live="polite"
    aria-label="{quote.npc}：{quote.text}"
  >
    {#key quote.id}
      <div
        class="tavern-quote__bubble"
        in:fade={{ duration: reduceMotion ? 0 : 200 }}
      >
        <p class="tavern-quote__speaker">
          <span class="tavern-quote__npc">{quote.npc}</span>
          <span class="tavern-quote__role">· {quote.role}</span>
        </p>
        <p class="tavern-quote__text">「{quote.text}」</p>
      </div>
    {/key}
  </aside>
{/if}

<style>
  .tavern-quote {
    width: 100%;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }

  .tavern-quote__bubble {
    position: relative;
    max-width: min(420px, 100%);
    padding: var(--space-2) var(--space-3);
    border-radius: 14px;
    background: rgba(12, 9, 6, 0.42);
    border: 1px solid rgba(201, 168, 106, 0.22);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  }

  .tavern-quote__bubble::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -6px;
    transform: translateX(-50%) rotate(45deg);
    width: 10px;
    height: 10px;
    background: rgba(12, 9, 6, 0.42);
    border-right: 1px solid rgba(201, 168, 106, 0.22);
    border-bottom: 1px solid rgba(201, 168, 106, 0.22);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .tavern-quote--compact .tavern-quote__bubble {
    padding: 0.4rem 0.75rem;
    border-radius: 12px;
  }

  .tavern-quote--compact .tavern-quote__bubble::after {
    width: 8px;
    height: 8px;
    bottom: -5px;
  }

  .tavern-quote__speaker {
    margin: 0 0 0.2rem;
    font-size: 0.6875rem;
    line-height: 1.3;
    color: rgba(201, 168, 106, 0.75);
  }

  .tavern-quote__npc {
    font-weight: 600;
    color: rgba(201, 168, 106, 0.9);
  }

  .tavern-quote__role {
    font-weight: 400;
    opacity: 0.85;
  }

  .tavern-quote__text {
    margin: 0;
    font-size: 0.8125rem;
    line-height: 1.45;
    color: rgba(242, 232, 210, 0.88);
    font-style: normal;
  }

  .tavern-quote--compact .tavern-quote__text {
    font-size: 0.75rem;
  }

  @media (prefers-reduced-motion: reduce) {
    .tavern-quote__bubble {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    .tavern-quote__bubble::after {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
  }
</style>
