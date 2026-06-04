<script lang="ts">
  import {
    CATEGORY_LABELS,
    getDiceByCategory,
    type DieCategory,
  } from '$lib/game/diceRegistry';
  import DiceCard from './DiceCard.svelte';
  import DiceWeightLegend from './DiceWeightLegend.svelte';
  import {
    session,
    togglePickDie,
    submitDicePick,
    getDicePickWaitText,
    getIsPickPending,
  } from '$lib/client/gameSession.svelte';

  interface Props {
    onConfirm?: () => void;
  }

  let { onConfirm }: Props = $props();

  const pickCategories: DieCategory[] = ['lucky', 'evil', 'holy', 'trick', 'special'];

  let specialCount = $derived(session.state?.config.specialDiceCount ?? 0);
  let diceByCategory = $derived(getDiceByCategory());
  let selectedIds = $derived.by(() => [...session.selectedPickIds]);
  let confirmedIds = $derived.by(() => {
    if (!session.state || !session.you) return [] as string[];
    return session.you === 'host' ? [...session.state.hostDice] : [...session.state.guestDice];
  });
  let hasConfirmed = $derived(confirmedIds.length >= specialCount && specialCount > 0);
  let isSubmitting = $derived(getIsPickPending());
  let canSubmit = $derived(!isSubmitting && selectedIds.length === specialCount && specialCount > 0);
  let waitText = $derived(getDicePickWaitText());

  let displaySelected = $derived(hasConfirmed ? confirmedIds : selectedIds);

  function isSelected(id: string): boolean {
    return displaySelected.includes(id);
  }

  function isDisabled(id: string): boolean {
    if (hasConfirmed || isSubmitting) return true;
    if (isSelected(id)) return false;
    return selectedIds.length >= specialCount;
  }

  function handleConfirm(): void {
    submitDicePick();
    onConfirm?.();
  }
</script>

<div class="dice-selector">
  <header class="dice-selector__header">
    <h2 class="dice-selector__title">选择特殊骰子</h2>
    <p class="dice-selector__hint">请选择 {specialCount} 枚（对手不可见）</p>
    <DiceWeightLegend />
    <div class="dice-selector__status">
      已选 {displaySelected.length} / {specialCount}
      {#if hasConfirmed}
        · 已确认
      {:else if displaySelected.length === 0}
        ：未选择
      {/if}
    </div>
  </header>

  <div class="dice-selector__scroll">
    {#each pickCategories as cat (cat)}
      {@const dice = diceByCategory[cat]}
      {#if dice.length > 0}
        <section class="dice-selector__section">
          <h3 class="dice-selector__section-title">{CATEGORY_LABELS[cat]}</h3>
          <div class="dice-selector__grid">
            {#each dice as die (die.id)}
              <DiceCard
                {die}
                selected={isSelected(die.id)}
                disabled={isDisabled(die.id)}
                onclick={() => togglePickDie(die.id)}
              />
            {/each}
          </div>
        </section>
      {/if}
    {/each}
  </div>

  {#if hasConfirmed}
    <footer class="dice-selector__footer">
      <p class="dice-selector__waiting" role="status">{waitText || '等待对手选骰…'}</p>
    </footer>
  {:else if isSubmitting}
    <footer class="dice-selector__footer">
      <button type="button" class="btn btn-gilded btn-full" disabled>
        提交中…
      </button>
    </footer>
  {:else}
    <footer class="dice-selector__footer">
      <button
        type="button"
        class="btn btn-gilded btn-full"
        disabled={!canSubmit}
        onclick={handleConfirm}
      >
        确认选择（{selectedIds.length}/{specialCount}）
      </button>
    </footer>
  {/if}
</div>

<style>
  .dice-selector {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: var(--space-3);
  }

  .dice-selector__header {
    text-align: center;
  }

  .dice-selector__title {
    font-family: var(--font-serif);
    font-size: 1.375rem;
    color: var(--color-gold-bright);
    margin-bottom: var(--space-1);
  }

  .dice-selector__hint {
    font-size: 0.875rem;
    color: var(--color-text-soft);
    margin-bottom: var(--space-2);
  }

  .dice-selector :global(.dice-weight-legend) {
    margin-bottom: var(--space-2);
  }

  .dice-selector__status {
    display: inline-block;
    padding: var(--space-2) var(--space-3);
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid var(--color-border-gold);
    border-radius: var(--radius-card);
    font-size: 0.875rem;
    color: var(--color-text);
  }

  .dice-selector__scroll {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding-bottom: var(--space-2);
  }

  .dice-selector__section-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-gold);
    margin-bottom: var(--space-2);
    padding-left: var(--space-1);
  }

  .dice-selector__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
  }

  @media (min-width: 640px) {
    .dice-selector__grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .dice-selector__footer {
    flex: none;
    padding-top: var(--space-2);
  }

  .dice-selector__waiting {
    text-align: center;
    padding: var(--space-3);
    background: var(--color-gold-wash);
    border: 1px solid var(--color-border-gold);
    border-radius: var(--radius-card);
    color: var(--color-gold-bright);
    font-size: 0.9375rem;
    font-weight: 500;
  }
</style>
