<script lang="ts">
  import type { Die } from '$lib/game/types';
  import { getDieFaceUrl, getDieSkin, getPlaceholderFaceUrl } from '$lib/assets/diceTextures';
  import { getDieDefinition } from '$lib/game/diceRegistry';

  interface Props {
    die: Die;
    selected?: boolean;
    remoteSelected?: boolean;
    rolling?: boolean;
    hidden?: boolean;
    placeholder?: boolean;
    onclick?: () => void;
  }

  let {
    die,
    selected = false,
    remoteSelected = false,
    rolling = false,
    hidden = false,
    placeholder = false,
    onclick,
  }: Props = $props();

  let faceUrl = $derived(getDieFaceUrl(die));
  let displayUrl = $derived(placeholder ? getPlaceholderFaceUrl(die.type) : faceUrl);
  let skin = $derived(getDieSkin(die.type));
  let dieName = $derived(getDieDefinition(die.type).name);

  let isDevil = $derived(!placeholder && die.value === 0);
  let isInactive = $derived(!die.active);
  let isKept = $derived(die.kept);
  let isRolling = $derived(rolling && die.active && !die.kept);
  let isClickable = $derived(
    !placeholder && die.active && !die.kept && onclick && !rolling && !hidden,
  );
</script>

<button
  type="button"
  class="dice-piece"
  class:dice-piece--selected={selected && !isKept}
  class:dice-piece--remote-selected={remoteSelected && !isKept && !selected}
  class:dice-piece--kept={isKept}
  class:dice-piece--inactive={isInactive}
  class:dice-piece--devil={isDevil}
  class:dice-piece--placeholder={placeholder}
  class:dice-piece--rolling={isRolling}
  class:dice-piece--hidden={hidden}
  style:--die-border={skin.borderColor}
  style:--die-glow={skin.glowColor}
  disabled={!isClickable}
  onclick={onclick}
  data-die-id={die.id}
  aria-label={placeholder ? `待掷 · ${dieName}` : isDevil ? '恶魔之首' : `骰子 ${die.value}`}
  aria-pressed={selected}
  aria-hidden={hidden}
>
  <span class="dice-piece__shadow" aria-hidden="true"></span>
  <span class="dice-piece__body">
    <img class="dice-piece__img" src={displayUrl} alt="" draggable="false" />
  </span>
</button>

<style>
  .dice-piece {
    position: relative;
    width: var(--die-size);
    height: var(--die-size);
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    user-select: none;
    transition: transform var(--duration-normal) var(--ease-out);
    -webkit-tap-highlight-color: transparent;
  }

  .dice-piece--hidden {
    visibility: hidden;
    pointer-events: none;
  }

  .dice-piece:disabled {
    cursor: default;
  }

  .dice-piece__shadow {
    position: absolute;
    bottom: -4px;
    left: 10%;
    width: 80%;
    height: 10px;
    background: radial-gradient(ellipse at center, rgba(0, 0, 0, 0.55) 0%, transparent 70%);
    z-index: 0;
    pointer-events: none;
    transition:
      transform var(--duration-normal) var(--ease-out),
      opacity var(--duration-normal) var(--ease-out),
      bottom var(--duration-normal) var(--ease-out);
  }

  .dice-piece__body {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-die-face);
    border-radius: var(--radius-die);
    border: 2px solid var(--die-border, rgba(61, 43, 31, 0.9));
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.35),
      inset 0 -3px 6px rgba(0, 0, 0, 0.25),
      0 4px 8px rgba(0, 0, 0, 0.4);
    overflow: hidden;
    transition:
      border-color var(--duration-normal) var(--ease-out),
      box-shadow var(--duration-normal) var(--ease-out),
      filter var(--duration-normal) var(--ease-out);
  }

  .dice-piece__img {
    width: 80%;
    height: 80%;
    object-fit: contain;
    display: block;
    pointer-events: none;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
  }

  .dice-piece--placeholder .dice-piece__body {
    background: transparent;
    border-color: transparent;
    box-shadow: none;
  }

  .dice-piece--placeholder .dice-piece__img {
    width: 100%;
    height: 100%;
    filter: none;
  }

  .dice-piece--placeholder:disabled {
    cursor: default;
    opacity: 1;
  }

  .dice-piece:not(:disabled):active:not(.dice-piece--selected) {
    transform: scale(var(--button-active-scale));
  }

  .dice-piece--rolling {
    animation: medievalRoll var(--duration-roll) var(--ease-roll) forwards;
  }

  .dice-piece--rolling .dice-piece__shadow {
    animation: diceShadowRoll var(--duration-roll) var(--ease-roll) forwards;
  }

  .dice-piece--selected {
    transform: translateY(-12px) scale(1.06);
  }

  .dice-piece--selected .dice-piece__body {
    border-color: var(--color-gold-bright);
    outline: 2px solid var(--color-die-select-ring);
    outline-offset: 2px;
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.4),
      inset 0 -2px 4px rgba(0, 0, 0, 0.15),
      0 15px 22px rgba(0, 0, 0, 0.55),
      0 0 20px 4px var(--color-die-select-glow),
      var(--shadow-glow-gold);
  }

  .dice-piece--selected .dice-piece__shadow {
    transform: scale(0.65);
    opacity: 0.35;
    bottom: -14px;
  }

  .dice-piece--remote-selected {
    transform: translateY(-6px) scale(1.03);
  }

  .dice-piece--remote-selected .dice-piece__body {
    border-color: rgba(201, 168, 106, 0.75);
    outline: 2px dashed rgba(201, 168, 106, 0.55);
    outline-offset: 2px;
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.35),
      inset 0 -2px 4px rgba(0, 0, 0, 0.15),
      0 8px 14px rgba(0, 0, 0, 0.45),
      0 0 12px 2px rgba(201, 168, 106, 0.2);
  }

  .dice-piece--kept {
    transform: scale(0.92);
  }

  .dice-piece--kept .dice-piece__body {
    background-color: #e2dacb;
    border-color: var(--color-die-kept-border);
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.2),
      0 2px 4px rgba(0, 0, 0, 0.35);
    filter: sepia(0.08);
  }

  .dice-piece--kept .dice-piece__shadow {
    bottom: -2px;
    opacity: 0.75;
  }

  .dice-piece--inactive .dice-piece__body {
    opacity: 0.45;
    filter: grayscale(0.45);
  }

  .dice-piece--devil .dice-piece__body {
    box-shadow:
      inset 0 2px 4px rgba(255, 255, 255, 0.2),
      inset 0 -3px 6px rgba(0, 0, 0, 0.35),
      0 4px 8px rgba(0, 0, 0, 0.45),
      0 0 10px var(--die-glow, #8b2e2e);
  }

  @keyframes medievalRoll {
    0% {
      transform: translateY(-40px) scale(0.7) rotate(0deg);
    }
    30% {
      transform: translateY(-10px) scale(1.1) rotate(180deg);
    }
    60% {
      transform: translateY(-15px) scale(0.95) rotate(270deg);
    }
    80% {
      transform: translateY(0) scale(1.02) rotate(340deg);
    }
    100% {
      transform: translateY(0) scale(1) rotate(360deg);
    }
  }

  @keyframes diceShadowRoll {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.75;
    }
    30%,
    60% {
      transform: scale(0.45);
      opacity: 0.2;
    }
  }

  @media (max-width: 767px) {
    .dice-piece--selected {
      transform: translateY(-4px) scale(1.02);
    }

    .dice-piece--selected .dice-piece__body {
      outline-width: 1px;
      outline-offset: 1px;
      box-shadow:
        inset 0 2px 4px rgba(255, 255, 255, 0.4),
        inset 0 -2px 4px rgba(0, 0, 0, 0.15),
        0 8px 14px rgba(0, 0, 0, 0.45),
        0 0 12px 2px var(--color-die-select-glow);
    }

    .dice-piece--selected .dice-piece__shadow {
      bottom: -8px;
    }

    .dice-piece--remote-selected {
      transform: translateY(-3px) scale(1.01);
    }
  }

  @media (hover: hover) {
    .dice-piece:not(:disabled):not(.dice-piece--kept):not(.dice-piece--selected):not(.dice-piece--hidden):hover {
      transform: translateY(-4px);
    }
    .dice-piece:not(:disabled):not(.dice-piece--kept):not(.dice-piece--selected):not(.dice-piece--hidden):hover
      .dice-piece__body {
      border-color: var(--color-gold);
    }
  }
</style>
