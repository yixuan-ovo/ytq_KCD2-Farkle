<script lang="ts">
  import type { GameState, PlayerId } from '$lib/game/types';

  interface Props {
    state: GameState;
    you: PlayerId | null;
  }

  let { state, you }: Props = $props();

  let targetScore = $derived(state.config.targetScore);
  let youPlayer = $derived(state.players.find((p) => p.id === you));
  let opponent = $derived(state.players.find((p) => p.id !== you));
  let currentId = $derived(state.players[state.currentPlayerIndex].id);

  const AVATAR_YOU = '/avatars/hud-you.jpg';
  const AVATAR_OPPONENT = '/avatars/hud-opponent.jpg';
</script>

<header class="game-hud">
  <div class="game-hud__player game-hud__player--you" class:game-hud__player--active={currentId === you}>
    <img
      class="game-hud__avatar game-hud__avatar--you"
      src={AVATAR_YOU}
      alt=""
      width="48"
      height="48"
      decoding="async"
    />
    <div class="game-hud__info">
      <span class="game-hud__label">你</span>
      <span class="game-hud__name-row">
        {#if currentId === you}
          <span class="game-hud__crown" aria-hidden="true">♛</span>
        {/if}
        <span class="game-hud__name">{youPlayer?.name || '—'}</span>
      </span>
      <span class="game-hud__score game-hud__score--gold">{youPlayer?.totalScore ?? 0}</span>
    </div>
  </div>

  <div class="game-hud__target">
    <span class="game-hud__target-label">目标</span>
    <span class="game-hud__target-value">{targetScore}</span>
  </div>

  <div
    class="game-hud__player game-hud__player--opponent"
    class:game-hud__player--active={currentId === opponent?.id}
  >
    <div class="game-hud__info game-hud__info--right">
      <span class="game-hud__label">对手</span>
      <span class="game-hud__name-row game-hud__name-row--right">
        {#if currentId === opponent?.id}
          <span class="game-hud__crown" aria-hidden="true">♛</span>
        {/if}
        <span class="game-hud__name">{opponent?.name || '等待加入…'}</span>
      </span>
      <span class="game-hud__score">{opponent?.totalScore ?? 0}</span>
    </div>
    <img
      class="game-hud__avatar"
      src={AVATAR_OPPONENT}
      alt=""
      width="48"
      height="48"
      decoding="async"
    />
  </div>
</header>

<style>
  .game-hud {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) 0 var(--space-3);
    flex: none;
    width: 100%;
    max-width: min(720px, 100%);
    margin-inline: auto;
  }

  .game-hud__player {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    opacity: 0.72;
    transition: opacity var(--duration-normal);
  }

  .game-hud__player--active {
    opacity: 1;
  }

  .game-hud__player--opponent {
    justify-content: flex-end;
  }

  .game-hud__avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 2px solid var(--color-border-gold);
    object-fit: cover;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    background: var(--wood-light);
  }

  .game-hud__info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 0.1rem;
  }

  .game-hud__info--right {
    align-items: flex-end;
    text-align: right;
  }

  .game-hud__label {
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    color: var(--color-text-soft);
  }

  .game-hud__name-row {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    max-width: 100%;
    min-width: 0;
    overflow: hidden;
  }

  .game-hud__name-row--right {
    flex-direction: row-reverse;
  }

  .game-hud__crown {
    font-size: 0.75rem;
    color: var(--color-gold-bright);
    line-height: 1;
    flex-shrink: 0;
  }

  .game-hud__name {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-on-dark);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
    max-width: 100%;
    flex: 1 1 0;
  }

  .game-hud__score {
    font-family: var(--font-mono);
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--color-text-on-dark);
    line-height: 1.15;
  }

  .game-hud__score--gold {
    color: var(--color-gold-bright);
    text-shadow: 0 0 12px rgba(212, 175, 55, 0.25);
  }

  .game-hud__target {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-2) var(--space-4);
    min-width: 5.5rem;
    border: 1px solid rgba(201, 168, 106, 0.35);
    border-radius: var(--radius-pill);
    background: rgba(0, 0, 0, 0.32);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }

  .game-hud__target-label {
    font-size: 0.75rem;
    color: var(--color-text-soft);
    letter-spacing: 0.08em;
  }

  .game-hud__target-value {
    font-family: var(--font-mono);
    font-size: clamp(1.25rem, 4vw, 1.75rem);
    font-weight: 700;
    color: var(--color-gold-bright);
    line-height: 1.1;
    text-shadow: 0 0 14px rgba(212, 175, 55, 0.2);
  }

  @media (min-width: 640px) {
    .game-hud__avatar {
      width: 52px;
      height: 52px;
    }

    .game-hud__name {
      font-size: 1rem;
    }

    .game-hud__score {
      font-size: 1.625rem;
    }
  }
</style>
