<script lang="ts">
  import type { DieDefinition } from '$lib/game/diceRegistry';
  import { CATEGORY_LABELS } from '$lib/game/diceRegistry';
  import { getFaceWeightPercents, getFaceWeightVisuals } from '$lib/game/weightTiers';
  import { getFaceTextureUrl } from '$lib/assets/diceTextures';
  import type { DieFace } from '$lib/game/types';

  interface Props {
    die: DieDefinition;
    selected?: boolean;
    disabled?: boolean;
    /** 图鉴等只读场景：非 button，不套用「未可选」灰显 */
    readonly?: boolean;
    onclick?: () => void;
  }

  let { die, selected = false, disabled = false, readonly = false, onclick }: Props = $props();

  const tag = $derived(readonly ? 'article' : 'button');
  const isDisabled = $derived(!readonly && (disabled || !onclick));

  const faceValues = [1, 2, 3, 4, 5, 6] as const;

  let faceVisuals = $derived(getFaceWeightVisuals(die.weights));
  let facePercents = $derived(getFaceWeightPercents(die.weights));
  let categoryLabel = $derived(CATEGORY_LABELS[die.category] ?? die.category);
</script>

<svelte:element
  this={tag}
  type={readonly ? undefined : 'button'}
  class="dice-card"
  class:dice-card--selected={selected}
  class:dice-card--readonly={readonly}
  disabled={isDisabled}
  onclick={onclick}
  role={readonly && onclick ? 'button' : undefined}
  tabindex={readonly && onclick ? 0 : undefined}
  aria-pressed={!readonly && selected ? true : undefined}
  aria-current={readonly && selected ? 'true' : undefined}
>
  <div class="dice-card__head">
    <span class="dice-card__name">{die.name}</span>
    <span class="dice-card__tag" style:--tag-color={die.color}>{categoryLabel}</span>
  </div>

  <div class="dice-card__faces" aria-label="{die.name} 六面出率">
    {#each die.weights as w, i (i)}
      {@const face = faceValues[i] as DieFace}
      {@const visual = faceVisuals[i]}
      {@const pct = facePercents[i]}
      <span
        class="dice-card__face dice-card__face--{visual}"
        title={visual === 'blocked' ? `点数 ${face}：无法掷出` : `点数 ${face}：约 ${pct}%`}
      >
        <img
          class="dice-card__face-img"
          src={getFaceTextureUrl(face)}
          alt=""
          draggable="false"
        />
        {#if visual === 'blocked'}
          <span class="dice-card__scratch" aria-hidden="true"></span>
        {/if}
        <span class="dice-card__pct" class:dice-card__pct--blocked={visual === 'blocked'}>
          {visual === 'blocked' ? '—' : `${pct}%`}
        </span>
      </span>
    {/each}
  </div>
</svelte:element>

<style>
  .dice-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    width: 100%;
    padding: var(--space-2);
    background: #1f1610;
    border: 2px solid #3d2b1f;
    border-radius: var(--radius-card);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45);
    text-align: left;
    cursor: pointer;
    transition:
      border-color var(--duration-normal),
      transform var(--duration-fast),
      box-shadow var(--duration-normal);
    -webkit-tap-highlight-color: transparent;
  }

  .dice-card:not(:disabled):hover {
    border-color: #614632;
    transform: translateY(-2px);
  }

  .dice-card:disabled {
    cursor: default;
    opacity: 0.55;
  }

  .dice-card--readonly {
    cursor: default;
    opacity: 1;
  }

  .dice-card--readonly:not(.dice-card--selected):hover {
    border-color: #614632;
    transform: translateY(-1px);
  }

  .dice-card:not(:disabled):active {
    transform: scale(0.98);
  }

  .dice-card--selected {
    border-color: var(--color-gold);
    box-shadow:
      0 0 14px rgba(66, 135, 245, 0.35),
      inset 0 0 12px rgba(201, 168, 106, 0.08);
  }

  .dice-card__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-1);
    min-height: 2.5rem;
  }

  .dice-card__name {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--color-paper);
    line-height: 1.3;
  }

  .dice-card__tag {
    flex-shrink: 0;
    font-size: 0.625rem;
    font-weight: 600;
    padding: 0.1rem 0.4rem;
    border-radius: 3px;
    background: #422f25;
    color: var(--color-gold-bright);
    border: 1px solid #5c4131;
  }

  .dice-card__faces {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .dice-card__face {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    aspect-ratio: 1;
    min-height: 2.35rem;
    border-radius: 6px;
    overflow: hidden;
    background-color: #eae6db;
    border: 1px solid #2d1e15;
    box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.18);
  }

  .dice-card__face-img {
    width: 78%;
    height: 78%;
    object-fit: contain;
    display: block;
    pointer-events: none;
    transition: filter 0.2s ease;
  }

  /* 高权重：朱砂印 + 焦痕 */
  .dice-card__face--boost {
    background-color: #dfd5c0;
    border-color: #8a3a2b;
    box-shadow:
      inset 0 0 0 1px rgba(166, 58, 43, 0.35),
      inset 0 -2px 4px rgba(139, 69, 19, 0.25);
  }

  .dice-card__face--boost::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, rgba(139, 69, 19, 0.2) 0%, transparent 75%);
    pointer-events: none;
    border-radius: 6px;
  }

  .dice-card__face--boost .dice-card__face-img {
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35))
      invert(22%) sepia(59%) saturate(2250%) hue-rotate(345deg) brightness(85%) contrast(85%);
  }

  /* 低权重：褪色 */
  .dice-card__face--weak {
    background-color: #ece9e0;
    opacity: 0.55;
  }

  .dice-card__face--weak .dice-card__face-img {
    filter: grayscale(0.85) opacity(0.65);
  }

  /* 无法掷出 */
  .dice-card__face--blocked {
    opacity: 0.35;
    background-color: #e0ddd4;
  }

  .dice-card__face--blocked .dice-card__face-img {
    filter: grayscale(1) opacity(0.35);
  }

  .dice-card__scratch {
    position: absolute;
    width: 72%;
    height: 2px;
    background: rgba(43, 31, 19, 0.75);
    transform: rotate(-35deg);
    pointer-events: none;
    z-index: 2;
  }

  .dice-card__pct {
    position: absolute;
    right: 2px;
    bottom: 1px;
    z-index: 3;
    font-family: var(--font-mono);
    font-size: 0.5625rem;
    font-weight: 700;
    line-height: 1;
    padding: 1px 3px;
    border-radius: 2px;
    background: rgba(43, 31, 19, 0.82);
    color: #f5efe6;
    pointer-events: none;
  }

  .dice-card__face--boost .dice-card__pct {
    background: rgba(138, 58, 43, 0.9);
    color: #ffe8d8;
  }

  .dice-card__pct--blocked {
    background: rgba(43, 31, 19, 0.65);
    color: rgba(245, 239, 230, 0.7);
  }
</style>
