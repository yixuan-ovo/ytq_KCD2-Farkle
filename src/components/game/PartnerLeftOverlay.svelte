<script lang="ts">
  import { scale } from 'svelte/transition';
  import { clearPartnerLeftNotice, session } from '$lib/client/gameSession.svelte';
  import type { PartnerLeftNotice } from '$lib/client/gameSession.svelte';

  interface Props {
    onDismiss?: (notice: PartnerLeftNotice) => void;
  }

  let { onDismiss }: Props = $props();

  const AUTO_DISMISS_MS = 3200;

  let notice = $derived(session.partnerLeftNotice);

  let title = $derived.by(() => {
    const n = notice;
    if (!n) return '';
    return n.hostLeft ? '房主已离席' : '对手已离席';
  });

  let subtitle = $derived.by(() => {
    const n = notice;
    if (!n) return '';
    if (n.hostLeft) {
      return n.wasInGame
        ? `${n.name} 离开了酒馆，本局已结束`
        : `${n.name} 离开了酒馆，牌桌已解散`;
    }
    return n.wasInGame
      ? `${n.name} 离开了酒馆，本局已结束`
      : `${n.name} 离开了酒馆`;
  });

  let footerHint = $derived.by(() => {
    const n = notice;
    if (!n) return '';
    if (n.hostLeft) return '即将返回主菜单…';
    return n.youAreHost ? '牌桌回到等待状态…' : '即将返回等待大厅…';
  });

  let yourLabel = $derived(notice?.youAreHost ? '你（房主）' : '你');
  let opponentLabel = $derived(notice?.youAreHost ? '对手' : '房主');

  let dismissTimer: ReturnType<typeof setTimeout> | undefined;

  $effect(() => {
    const n = notice;
    if (!n) return;
    if (dismissTimer) clearTimeout(dismissTimer);
    dismissTimer = setTimeout(() => {
      dismissTimer = undefined;
      onDismiss?.(n);
      clearPartnerLeftNotice();
    }, AUTO_DISMISS_MS);
    return () => {
      if (dismissTimer) clearTimeout(dismissTimer);
      dismissTimer = undefined;
    };
  });
</script>

{#if notice}
  {@const n = notice as PartnerLeftNotice}
  <div
    class="partner-left-overlay"
    role="status"
    aria-live="polite"
    aria-labelledby="partner-left-title"
  >
    <div class="partner-left-overlay__card" in:scale={{ start: 0.98, duration: 200 }}>
      <h2 id="partner-left-title" class="partner-left-overlay__title">{title}</h2>
      <p class="partner-left-overlay__subtitle">{subtitle}</p>

      {#if n.wasInGame}
        <section class="partner-left-overlay__scores" aria-label="对局比分">
          <div class="partner-left-overlay__score-row">
            <span class="partner-left-overlay__score-name">{yourLabel}</span>
            <span class="partner-left-overlay__score-value">{n.yourScore}</span>
          </div>
          <div class="partner-left-overlay__score-row partner-left-overlay__score-row--muted">
            <span class="partner-left-overlay__score-name">{opponentLabel} · {n.name}</span>
            <span class="partner-left-overlay__score-value">{n.opponentScore}</span>
          </div>
        </section>
      {/if}

      <p class="partner-left-overlay__hint">{footerHint}</p>
      <div class="partner-left-overlay__progress" aria-hidden="true">
        <div class="partner-left-overlay__progress-bar"></div>
      </div>
    </div>
  </div>
{/if}

<style>
  .partner-left-overlay {
    position: fixed;
    inset: 0;
    z-index: 1550;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-4);
    pointer-events: none;
    background: rgba(8, 5, 4, 0.55);
  }

  .partner-left-overlay__card {
    width: 100%;
    max-width: min(380px, 100%);
    text-align: center;
    background: rgba(45, 30, 19, 0.96);
    color: var(--color-text-on-dark);
    padding: var(--space-4);
    border-radius: var(--radius-card);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(201, 168, 106, 0.35);
    backdrop-filter: blur(6px);
    pointer-events: none;
  }

  .partner-left-overlay__title {
    font-family: var(--font-serif);
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text-on-dark);
    margin: 0 0 var(--space-2);
  }

  .partner-left-overlay__subtitle {
    font-size: 0.875rem;
    color: var(--color-text-on-dark-soft);
    margin: 0 0 var(--space-3);
    line-height: 1.5;
  }

  .partner-left-overlay__scores {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-bottom: var(--space-3);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-card);
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(201, 168, 106, 0.12);
  }

  .partner-left-overlay__score-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    font-size: 0.875rem;
    color: var(--color-gold-bright);
    font-weight: 600;
  }

  .partner-left-overlay__score-row--muted {
    color: var(--color-text-on-dark-soft);
    font-weight: 500;
  }

  .partner-left-overlay__score-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .partner-left-overlay__score-value {
    font-variant-numeric: tabular-nums;
  }

  .partner-left-overlay__hint {
    margin: 0 0 var(--space-2);
    font-size: 0.75rem;
    color: var(--color-text-soft);
    line-height: 1.4;
  }

  .partner-left-overlay__progress {
    height: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.08);
    overflow: hidden;
  }

  .partner-left-overlay__progress-bar {
    height: 100%;
    width: 100%;
    background: var(--color-gold);
    transform-origin: left center;
    animation: partnerLeftProgress 3.2s linear forwards;
  }

  @keyframes partnerLeftProgress {
    from {
      transform: scaleX(1);
    }
    to {
      transform: scaleX(0);
    }
  }
</style>
