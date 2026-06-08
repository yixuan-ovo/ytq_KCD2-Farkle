<script lang="ts">
  import { getDieDefinition } from '$lib/game/diceRegistry';
  import DiceCard from './DiceCard.svelte';

  interface Props {
    title: string;
    pickIds: string[];
    variant?: 'yours' | 'opponent';
  }

  let { title, pickIds, variant = 'yours' }: Props = $props();
</script>

{#if pickIds.length > 0}
  <section
    class="pick-summary"
    class:pick-summary--opponent={variant === 'opponent'}
    aria-label={title}
  >
    <h4 class="pick-summary__title">{title}</h4>
    <div class="pick-summary__row">
      {#each pickIds as id (id)}
        {@const die = getDieDefinition(id)}
        <div class="pick-summary__item">
          <DiceCard {die} readonly compact selected={variant === 'yours'} opponentPick={variant === 'opponent'} />
        </div>
      {/each}
    </div>
  </section>
{/if}

<style>
  .pick-summary {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2);
    background: rgba(0, 0, 0, 0.22);
    border: 1px solid var(--color-border-gold);
    border-radius: var(--radius-card);
  }

  .pick-summary--opponent {
    border-style: dashed;
    background: rgba(201, 168, 106, 0.06);
  }

  .pick-summary__title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-gold-bright);
    margin: 0;
  }

  .pick-summary--opponent .pick-summary__title {
    color: var(--color-gold);
  }

  .pick-summary__row {
    display: flex;
    gap: var(--space-2);
    overflow-x: auto;
    padding-bottom: var(--space-1);
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;
  }

  .pick-summary__item {
    flex: 0 0 min(168px, 72vw);
    min-width: 0;
  }
</style>
