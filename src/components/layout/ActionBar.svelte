<script lang="ts">
  interface Props {
    canRoll?: boolean;
    canKeep?: boolean;
    canBank?: boolean;
    isMyTurn?: boolean;
    turnScore?: number;
    inLobby?: boolean;
    inDiceSelection?: boolean;
    lobbyWaitText?: string;
    dicePickWaitText?: string;
    opponentWaitName?: string;
    opponentSelecting?: boolean;
    onRoll?: () => void;
    onKeep?: () => void;
    onBank?: () => void;
  }

  let {
    canRoll = false,
    canKeep = false,
    canBank = false,
    isMyTurn = false,
    turnScore = 0,
    inLobby = false,
    inDiceSelection = false,
    lobbyWaitText = '',
    dicePickWaitText = '',
    opponentWaitName = '对手',
    opponentSelecting = false,
    onRoll,
    onKeep,
    onBank,
  }: Props = $props();

  let showRollOnly = $derived(isMyTurn && canRoll);
</script>

<footer class="action-bar">
  {#if inDiceSelection}
    {#if dicePickWaitText}
      <p class="action-bar__wait">{dicePickWaitText}</p>
    {/if}
  {:else if inLobby}
    {#if lobbyWaitText}
      <p class="action-bar__wait">{lobbyWaitText}</p>
    {/if}
  {:else if !isMyTurn}
    <p class="action-bar__wait action-bar__wait--opponent">
      <span class="action-bar__hourglass" aria-hidden="true">⏳</span>
      {#if opponentSelecting}
        等待 <strong class="action-bar__opponent-name">{opponentWaitName}</strong> 选骰…
      {:else}
        等待 <strong class="action-bar__opponent-name">{opponentWaitName}</strong> 掷骰…
      {/if}
    </p>
  {:else if showRollOnly}
    <div class="action-bar__buttons action-bar__buttons--single">
      <button type="button" class="btn btn-gilded action-bar__roll" onclick={onRoll}>
        <span class="action-bar__short">开骰</span>
        <span class="action-bar__full">掷骰</span>
      </button>
    </div>
  {:else}
    <div class="action-bar__buttons action-bar__buttons--pair">
      <button type="button" class="btn btn-secondary" disabled={!canKeep} onclick={onKeep}>
        <span class="action-bar__short">计分并继续</span>
        <span class="action-bar__full">计分并继续投</span>
      </button>
      <button type="button" class="btn btn-secondary" disabled={!canBank} onclick={onBank}>
        <span class="action-bar__short">计分并结束</span>
        <span class="action-bar__full">计分并结束</span>
      </button>
    </div>
  {/if}
</footer>

<style>
  .action-bar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(0deg, var(--wood-dark) 0%, var(--wood-mid) 100%);
    border-top: 1px solid rgba(201, 168, 106, 0.25);
    padding: var(--space-3) var(--layout-gutter);
    padding-bottom: calc(var(--space-3) + var(--safe-bottom));
    z-index: 100;
    box-shadow: 0 -8px 24px rgba(0, 0, 0, 0.45);
    min-height: calc(var(--action-bar-height) + var(--safe-bottom));
  }

  @media (min-width: 1024px) {
    .action-bar {
      position: sticky;
      bottom: var(--space-4);
      border-radius: var(--radius-card);
      margin-top: var(--space-3);
      margin-bottom: calc(var(--space-3) + var(--safe-bottom));
      min-height: var(--action-bar-height);
    }
  }

  .action-bar__buttons {
    display: grid;
    gap: var(--space-2);
    max-width: min(640px, 100%);
    margin-inline: auto;
    width: 100%;
  }

  .action-bar__buttons--single {
    grid-template-columns: 1fr;
  }

  .action-bar__buttons--pair {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-bar__buttons .btn {
    min-height: 44px;
    padding-inline: var(--space-2);
    font-size: 0.875rem;
  }

  .action-bar__roll:not(:disabled) {
    color: var(--wood-dark);
    border-color: var(--color-gold-bright);
    background: linear-gradient(to bottom, var(--color-gold-bright), var(--color-gold));
    text-shadow: none;
    box-shadow:
      0 4px 8px rgba(0, 0, 0, 0.35),
      0 0 10px rgba(201, 168, 106, 0.25);
  }

  .action-bar__roll:not(:disabled):hover {
    background: linear-gradient(to bottom, #f5e6c8, var(--color-gold-bright));
    border-color: #fff;
    box-shadow: 0 0 14px rgba(212, 175, 55, 0.45);
  }

  .action-bar__buttons .btn-secondary:not(:disabled) {
    color: var(--color-text-on-dark);
    border-color: rgba(201, 168, 106, 0.35);
    background: rgba(0, 0, 0, 0.25);
  }

  .action-bar__buttons .btn-secondary:not(:disabled):hover {
    border-color: var(--color-gold);
    background: rgba(201, 168, 106, 0.1);
  }

  .action-bar__wait {
    text-align: center;
    color: var(--color-text-on-dark-soft);
    font-size: 0.875rem;
    padding: var(--space-2);
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
  }

  .action-bar__wait--opponent {
    font-style: italic;
    letter-spacing: 0.04em;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }

  .action-bar__opponent-name {
    color: var(--color-gold-bright);
    font-weight: 700;
    font-style: normal;
  }

  .action-bar__hourglass {
    display: inline-block;
    animation: flipHourglass 2s ease-in-out infinite;
  }

  @keyframes flipHourglass {
    0%,
    100% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(180deg);
    }
  }

  .action-bar__short {
    display: inline;
  }

  .action-bar__full {
    display: none;
  }

  @media (min-width: 640px) {
    .action-bar__short {
      display: none;
    }

    .action-bar__full {
      display: inline;
    }

    .action-bar__buttons .btn {
      font-size: 0.9375rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .action-bar__hourglass {
      animation: none;
    }
  }
</style>
