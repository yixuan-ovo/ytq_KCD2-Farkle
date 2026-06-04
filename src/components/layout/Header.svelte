<script lang="ts">
  interface Props {
    roomId?: string | null;
    connected?: boolean;
    connecting?: boolean;
    onLeave?: () => void;
  }

  let { roomId = null, connected = false, connecting = false, onLeave }: Props = $props();
</script>

<header class="header">
  <div class="header__brand">
    <span class="header__logo" aria-hidden="true">♛</span>
    <span class="header__title">骰子酒馆</span>
  </div>
  <div class="header__meta">
    {#if roomId}
      <span class="header__room" title={roomId}>{roomId}</span>
    {/if}
    <span
      class="header__status"
      class:header__status--connected={connected}
      class:header__status--connecting={connecting}
    >
      <span class="header__dot"></span>
      {#if connecting}
        连接中
      {:else if connected}
        已连接
      {:else}
        未连接
      {/if}
    </span>
    {#if onLeave}
      <button type="button" class="header__leave" onclick={onLeave}>离开</button>
    {/if}
  </div>
</header>

<style>
  .header {
    position: relative;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height);
    padding: 0 var(--layout-gutter);
    background: linear-gradient(180deg, var(--wood-mid) 0%, var(--wood-dark) 100%);
    color: var(--color-text-on-dark);
    flex-shrink: 0;
    gap: var(--space-3);
    border-bottom: 1px solid rgba(201, 168, 106, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  }

  .header__brand {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }

  .header__logo {
    font-size: 1.125rem;
    line-height: 1;
    color: var(--color-gold);
  }

  .header__title {
    font-family: var(--font-serif);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--color-gold-bright);
    white-space: nowrap;
  }

  @media (min-width: 640px) {
    .header__title {
      font-size: 1.125rem;
    }
  }

  .header__meta {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    min-width: 0;
    font-size: 0.75rem;
    color: var(--color-text-on-dark-soft);
  }

  .header__room {
    font-family: var(--font-mono);
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--color-gold);
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header__status {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    white-space: nowrap;
  }

  .header__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-text-on-dark-soft);
    flex-shrink: 0;
  }

  .header__status--connected .header__dot {
    background: var(--color-success);
    box-shadow: 0 0 6px var(--color-success);
  }

  .header__status--connecting .header__dot {
    background: var(--color-warning);
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.4;
    }
  }

  @media (min-width: 640px) {
    .header__room {
      max-width: 120px;
    }
  }

  .header__leave {
    flex-shrink: 0;
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-gold);
    background: rgba(201, 168, 106, 0.1);
    border: 1px solid var(--color-border-gold);
    border-radius: var(--radius-pill);
    transition: background var(--duration-fast);
  }

  .header__leave:hover {
    background: rgba(201, 168, 106, 0.2);
  }
</style>
