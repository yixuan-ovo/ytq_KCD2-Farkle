<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { scale } from 'svelte/transition';
  import type { Die } from '$lib/game/types';
  import { getDieDefinition } from '$lib/game/diceRegistry';
  import { getDieFaceUrl } from '$lib/assets/diceTextures';
  import { playDiceRollAnimation } from '$lib/ui/playDiceRollAnimation';
  import DicePiece from './DicePiece.svelte';

  function specialLabel(typeId: string): string | null {
    if (typeId === 'NormalDie') return null;
    return getDieDefinition(typeId).shortName;
  }

  function labelColor(typeId: string): string {
    return getDieDefinition(typeId).color;
  }

  interface Props {
    dice: Die[];
    selectedIds?: number[];
    rolling?: boolean;
    physicsRolling?: boolean;
    rollCount?: number;
    turnScore?: number;
    onToggle?: (id: number) => void;
    onPhysicsComplete?: () => void;
  }

  let {
    dice,
    selectedIds = [],
    rolling = false,
    physicsRolling = false,
    rollCount = 0,
    turnScore = 0,
    onToggle,
    onPhysicsComplete,
  }: Props = $props();

  let activeWrapEl: HTMLDivElement | undefined = $state();

  /** 仅本回合第一次掷骰前显示背面；Hot Dice 后 turnScore>0 仍显示上一轮的点数 */
  function showPlaceholder(die: Die): boolean {
    return rollCount === 0 && turnScore === 0 && die.active && !die.kept;
  }

  let keptDice = $derived(dice.filter((d) => d.kept));
  let activeDice = $derived(dice.filter((d) => !d.kept));
  let hotDiceReady = $derived(turnScore > 0 && rollCount === 0 && activeDice.length > 0);
  let cssRolling = $derived(rolling && !physicsRolling);

  /** 随 physicsRolling + rollCount + activeWrapEl 触发；骰面列表用 untrack 避免中途 kill */
  $effect(() => {
    const rolling = physicsRolling;
    const rc = rollCount;
    const wrap = activeWrapEl;
    if (!rolling || rc === 0 || !wrap) return;

    let animKill: (() => void) | null = null;
    let cancelled = false;

    void (async () => {
      await tick();
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      if (cancelled) return;

      const snapshot = untrack(() => activeDice);
      if (snapshot.length === 0) {
        onPhysicsComplete?.();
        return;
      }

      const dies = snapshot
        .map((die) => {
          const element = wrap.querySelector<HTMLElement>(
            `.dice-board__active [data-die-id="${die.id}"] .dice-piece__body`,
          );
          if (!element) return null;
          return {
            dieId: die.id,
            dieType: die.type,
            element,
            faceUrl: getDieFaceUrl(die),
          };
        })
        .filter((d): d is NonNullable<typeof d> => d != null);

      if (dies.length === 0) {
        onPhysicsComplete?.();
        return;
      }

      const { kill } = playDiceRollAnimation({
        boardEl: wrap!,
        dies,
        onComplete: () => {
          if (!cancelled) onPhysicsComplete?.();
        },
      });
      animKill = kill;
    })();

    return () => {
      cancelled = true;
      animKill?.();
    };
  });
</script>

<div class="dice-board">
  {#if keptDice.length > 0}
    <div class="dice-board__kept" role="group" aria-label="已保留骰子">
      <span class="dice-board__kept-label">已保留</span>
      <div class="dice-board__kept-row">
        {#each keptDice as die (die.id)}
          {@const label = specialLabel(die.type)}
          <div class="dice-board__die-slot" in:scale={{ start: 0.4, duration: 250 }}>
            <DicePiece {die} placeholder={showPlaceholder(die)} />
            {#if label}
              <span class="dice-board__label" style:--label-color={labelColor(die.type)}>{label}</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    <hr class="dice-board__divider" aria-hidden="true" />
  {/if}

  <div class="dice-board__active-wrap" bind:this={activeWrapEl}>
    {#if hotDiceReady && !cssRolling}
      <p class="dice-board__hot-hint" role="status">六枚全胜 · 点击掷骰</p>
    {:else if cssRolling}
      <p class="dice-board__rolling-hint" aria-live="polite">命运旋转中…</p>
    {/if}

    <div
      class="dice-board__active"
      class:dice-board__active--rolling={cssRolling}
      role="group"
      aria-label="骰盘"
    >
      {#each activeDice as die (die.id)}
        {@const label = specialLabel(die.type)}
        <div class="dice-board__die-slot">
          <DicePiece
            {die}
            rolling={cssRolling}
            hidden={physicsRolling}
            placeholder={showPlaceholder(die)}
            selected={selectedIds.includes(die.id)}
            onclick={onToggle ? () => onToggle(die.id) : undefined}
          />
          {#if label}
            <span class="dice-board__label" style:--label-color={labelColor(die.type)}>{label}</span>
          {/if}
        </div>
      {/each}
      {#if dice.length === 0}
        <p class="dice-board__empty">等待掷骰…</p>
      {:else if activeDice.length === 0 && keptDice.length > 0 && !rolling}
        <p class="dice-board__empty dice-board__empty--hot">全部得分 — 可再掷全部六枚</p>
      {/if}
    </div>
  </div>
</div>

<style>
  .dice-board {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
  }

  .dice-board__kept {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding: var(--space-2);
    background: rgba(0, 0, 0, 0.18);
    border-radius: var(--radius-die);
  }

  .dice-board__kept-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-gold);
    text-align: center;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    font-family: var(--font-serif);
  }

  .dice-board__kept-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--die-gap);
  }

  .dice-board__divider {
    border: 0;
    height: 1px;
    margin: 0;
    background: linear-gradient(
      to right,
      transparent,
      rgba(201, 168, 106, 0.25),
      transparent
    );
  }

  .dice-board__active-wrap {
    position: relative;
    min-height: calc(var(--die-size) * 2 + var(--die-gap) + var(--space-4) + 1rem);
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .dice-board__hot-hint {
    position: absolute;
    top: var(--space-1);
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    margin: 0;
    padding: 0.2rem 0.65rem;
    font-family: var(--font-serif);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--color-gold);
    background: rgba(18, 12, 8, 0.5);
    border: 1px solid rgba(201, 168, 106, 0.28);
    border-radius: var(--radius-pill);
    white-space: nowrap;
    pointer-events: none;
    backdrop-filter: blur(4px);
  }

  .dice-board__rolling-hint {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: 3;
    margin: 0;
    font-family: var(--font-serif);
    font-size: 1rem;
    color: var(--color-gold-bright);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.9);
    letter-spacing: 0.06em;
    pointer-events: none;
  }

  .dice-board__active {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--die-gap);
    justify-items: center;
    align-content: center;
    width: 100%;
    max-width: 100%;
    min-height: calc(var(--die-size) * 2 + var(--die-gap));
    padding: var(--space-3) var(--space-2);
    margin-inline: auto;
    transition: filter var(--duration-normal) var(--ease-out);
  }

  @media (min-width: 768px) {
    .dice-board__active-wrap {
      min-height: calc(var(--die-size) + var(--space-4) + 1.25rem);
    }

    .dice-board__active {
      grid-template-columns: repeat(6, minmax(0, 1fr));
      min-height: calc(var(--die-size) + var(--space-2));
      max-width: min(640px, 100%);
    }

    .dice-board__label {
      font-size: 0.8125rem;
    }
  }

  .dice-board__active--rolling {
    filter: blur(0.4px);
  }

  .dice-board__die-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    min-width: 0;
  }

  .dice-board__label {
    font-family: var(--font-sans);
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    line-height: 1.25;
    text-align: center;
    max-width: calc(var(--die-size) + 12px);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--label-color, var(--color-gold));
    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
    pointer-events: none;
  }

  .dice-board__empty {
    grid-column: 1 / -1;
    text-align: center;
    color: var(--color-text-soft);
    font-size: 0.875rem;
    padding: var(--space-4);
  }

  .dice-board__empty--hot {
    font-family: var(--font-serif);
    color: var(--color-gold-bright);
    text-shadow: 0 0 10px rgba(201, 168, 106, 0.35);
    animation: hotDicePulse 2s ease-in-out infinite;
  }

  @keyframes hotDicePulse {
    0%,
    100% {
      opacity: 0.85;
    }
    50% {
      opacity: 1;
      transform: scale(1.02);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .dice-board__empty--hot {
      animation: none;
    }
    .dice-board__active--rolling {
      filter: none;
    }
  }
</style>
