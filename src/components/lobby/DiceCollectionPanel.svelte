<script lang="ts">
  import {
    CATEGORY_LABELS,
    getDiceByCategory,
    getDieDescription,
    type DieCategory,
    type DieDefinition,
  } from '$lib/game/diceRegistry';
  import DiceCard from '../selection/DiceCard.svelte';
  import DiceWeightLegend from '../selection/DiceWeightLegend.svelte';

  type CodexFilter = 'all' | DieCategory;

  const CATEGORY_ORDER: DieCategory[] = ['normal', 'lucky', 'evil', 'holy', 'trick', 'special'];

  const FILTER_TABS: { id: CodexFilter; label: string }[] = [
    { id: 'all', label: '全部' },
    ...CATEGORY_ORDER.map((cat) => ({ id: cat as CodexFilter, label: CATEGORY_LABELS[cat] })),
  ];

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();

  let filter = $state<CodexFilter>('all');
  let selectedId = $state<string>('NormalDie');
  let mobileDetailOpen = $state(false);

  let diceByCategory = $derived(getDiceByCategory());

  let sections = $derived.by(() => {
    if (filter === 'all') {
      return CATEGORY_ORDER.map((cat) => ({
        cat,
        title: CATEGORY_LABELS[cat],
        dice: diceByCategory[cat],
      })).filter((s) => s.dice.length > 0);
    }
    return [
      {
        cat: filter,
        title: CATEGORY_LABELS[filter],
        dice: diceByCategory[filter],
      },
    ];
  });

  let selectedDie = $derived(
    Object.values(diceByCategory)
      .flat()
      .find((d) => d.id === selectedId) ?? diceByCategory.normal[0],
  );

  let selectedDescription = $derived(
    selectedDie ? getDieDescription(selectedDie.id) : '',
  );

  let totalCount = $derived(Object.values(diceByCategory).flat().length);

  function selectDie(die: DieDefinition): void {
    selectedId = die.id;
    mobileDetailOpen = true;
  }

  function closeMobileDetail(): void {
    mobileDetailOpen = false;
  }

  function wildcardNote(die: DieDefinition): string | null {
    if (!die.wildcardFace) return null;
    return `掷出 ${die.wildcardFace} 点时变为恶魔之首（百搭），可参与任意组合计分。`;
  }
</script>

<div class="codex" role="dialog" aria-labelledby="codex-title">
  <div class="codex__inner card">
    <header class="codex__header">
      <div>
        <h2 id="codex-title" class="codex__title">骰子图鉴</h2>
        <p class="codex__subtitle">共 {totalCount} 种 · 点击骰子查看详情</p>
      </div>
      {#if onClose}
        <button type="button" class="codex__close" onclick={onClose} aria-label="关闭">×</button>
      {/if}
    </header>

    <DiceWeightLegend />

    <div class="codex__tabs" role="tablist" aria-label="分类筛选">
      {#each FILTER_TABS as tab (tab.id)}
        <button
          type="button"
          role="tab"
          class="codex__tab"
          class:codex__tab--active={filter === tab.id}
          aria-selected={filter === tab.id}
          onclick={() => (filter = tab.id)}
        >
          {tab.label}
        </button>
      {/each}
    </div>

    <div class="codex__body">
      <div class="codex__scroll">
        {#each sections as section (section.cat)}
          <section class="codex__section">
            <h3 class="codex__section-title">{section.title}</h3>
            <div class="codex__grid">
              {#each section.dice as die (die.id)}
                <DiceCard
                  {die}
                  readonly
                  compact
                  selected={selectedId === die.id}
                  onclick={() => selectDie(die)}
                />
              {/each}
            </div>
          </section>
        {/each}
      </div>

      {#if selectedDie}
        <aside
          class="codex__detail panel-parchment"
          class:codex__detail--open={mobileDetailOpen}
          aria-live="polite"
        >
          <div class="codex__detail-toolbar">
            <h3 class="codex__detail-name">{selectedDie.name}</h3>
            <button
              type="button"
              class="codex__detail-close"
              onclick={closeMobileDetail}
              aria-label="收起详情"
            >
              收起
            </button>
          </div>
          <p class="codex__detail-meta">
            <span>缩写「{selectedDie.shortName}」</span>
            <span class="codex__detail-dot" aria-hidden="true">·</span>
            <span>{CATEGORY_LABELS[selectedDie.category]}</span>
          </p>
          {#if wildcardNote(selectedDie)}
            <p class="codex__detail-note">{wildcardNote(selectedDie)}</p>
          {/if}
          {#if selectedDescription}
            <div class="codex__detail-desc">
              {#each selectedDescription.split('\n\n') as para, i (i)}
                <p>{para}</p>
              {/each}
            </div>
          {/if}
        </aside>
      {/if}
    </div>
  </div>
</div>

<style>
  .codex {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: stretch;
    justify-content: center;
    padding: 0;
    background: rgba(0, 0, 0, 0.65);
  }

  .codex__inner {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    max-width: min(920px, 100%);
    width: 100%;
    max-height: 100dvh;
    height: 100dvh;
    padding: var(--space-3);
    border-radius: 0;
  }

  .codex__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-2);
  }

  .codex__title {
    font-family: var(--font-serif);
    font-size: 1.375rem;
    color: var(--color-gold-bright);
    margin-bottom: var(--space-1);
  }

  .codex__subtitle {
    font-size: 0.8125rem;
    color: var(--color-text-soft);
  }

  .codex__close {
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-text-on-dark);
    opacity: 0.7;
    padding: 0.25rem;
  }

  .codex__close:hover {
    opacity: 1;
  }

  .codex :global(.dice-weight-legend) {
    flex: none;
  }

  .codex__tabs {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--space-1);
    flex: none;
    overflow-x: auto;
    padding-bottom: var(--space-1);
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .codex__tabs::-webkit-scrollbar {
    display: none;
  }

  .codex__tab {
    flex: 0 0 auto;
    padding: 0.3rem 0.65rem;
    font-size: 0.75rem;
    border: 1px solid rgba(201, 168, 106, 0.25);
    border-radius: var(--radius-pill);
    color: var(--color-text-soft);
    transition:
      background var(--duration-fast),
      color var(--duration-fast);
  }

  .codex__tab--active {
    color: var(--color-gold-bright);
    background: var(--color-gold-wash);
    border-color: var(--color-border-gold);
  }

  .codex__body {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 0;
    flex: 1;
  }

  .codex__scroll {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    padding-right: var(--space-1);
  }

  .codex__section-title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-gold);
    margin-bottom: var(--space-2);
    padding-left: var(--space-1);
  }

  .codex__grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-2);
  }

  .codex__detail {
    display: none;
  }

  .codex__detail--open {
    display: block;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 5;
    max-height: min(48dvh, 440px);
    overflow-y: auto;
    margin: 0;
    padding: var(--space-3);
    padding-bottom: calc(var(--space-3) + env(safe-area-inset-bottom, 0px));
    border-radius: var(--radius-card) var(--radius-card) 0 0;
    box-shadow: 0 -10px 28px rgba(0, 0, 0, 0.45);
  }

  .codex__detail-toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }

  .codex__detail-toolbar .codex__detail-name {
    margin-bottom: 0;
  }

  .codex__detail-close {
    flex: none;
    font-size: 0.75rem;
    padding: 0.25rem 0.6rem;
    border-radius: var(--radius-pill);
    border: 1px solid rgba(92, 69, 46, 0.35);
    background: rgba(255, 255, 255, 0.35);
    color: var(--color-text-on-paper);
  }

  @media (min-width: 520px) {
    .codex {
      align-items: center;
      padding: var(--layout-gutter);
    }

    .codex__inner {
      max-height: 90vh;
      height: auto;
      padding: var(--space-4);
      border-radius: var(--radius-card);
    }

    .codex__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 768px) {
    .codex__body {
      flex-direction: row;
      align-items: stretch;
    }

    .codex__scroll {
      flex: 1;
      min-width: 0;
    }

    .codex__tabs {
      flex-wrap: wrap;
      overflow: visible;
    }

    .codex__grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .codex__detail {
      display: block;
      position: sticky;
      top: 0;
      flex: 0 0 min(240px, 32%);
      align-self: flex-start;
      max-height: none;
      overflow: visible;
      padding: var(--space-3);
      border-radius: var(--radius-card);
      box-shadow: none;
    }

    .codex__detail-toolbar {
      display: block;
      margin-bottom: 0;
    }

    .codex__detail-close {
      display: none;
    }
  }

  @media (min-width: 960px) {
    .codex__grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .codex__detail-name {
    font-family: var(--font-serif);
    font-size: 1.0625rem;
    color: var(--color-text-on-paper);
    margin-bottom: var(--space-2);
  }

  .codex__detail-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    font-size: 0.8125rem;
    color: rgba(44, 24, 16, 0.75);
    margin-bottom: var(--space-2);
  }

  .codex__detail-dot {
    opacity: 0.5;
  }

  .codex__detail-note {
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--color-wine-deep);
    margin-bottom: var(--space-2);
    padding: var(--space-2);
    background: rgba(139, 46, 46, 0.08);
    border-radius: 6px;
    border-left: 3px solid var(--color-wine);
  }

  .codex__detail-desc {
    font-size: 0.8125rem;
    line-height: 1.55;
    color: rgba(44, 24, 16, 0.85);
    margin-bottom: var(--space-2);
  }

  .codex__detail-desc p {
    margin: 0 0 var(--space-2);
  }

  .codex__detail-desc p:last-child {
    margin-bottom: 0;
  }
</style>
