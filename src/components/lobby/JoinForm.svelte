<script lang="ts">
  import { slide } from 'svelte/transition';
  import { generateRoomId } from '$lib/client/config';

  type Tab = 'create' | 'join';

  interface Props {
    initialRoomId?: string;
    initialName?: string;
    initialTab?: Tab;
    /** 来自邀请链接时锁定加入流程，禁止误开新桌 */
    joinOnly?: boolean;
    onEnter?: (roomId: string, name: string) => void;
  }

  let {
    initialRoomId = '',
    initialName = '',
    initialTab = 'create',
    joinOnly = false,
    onEnter,
  }: Props = $props();

  let tab = $state<Tab>(joinOnly ? 'join' : initialTab);
  let name = $state(initialName);
  let roomId = $state(
    joinOnly || initialTab === 'join'
      ? initialRoomId
        ? initialRoomId.toUpperCase()
        : ''
      : generateRoomId(),
  );
  let submitting = $state(false);
  let localError = $state('');
  let rulesOpen = $state(false);

  function switchTab(next: Tab): void {
    if (joinOnly && next === 'create') return;
    tab = next;
    localError = '';
    if (next === 'join') {
      roomId = initialRoomId ? initialRoomId.toUpperCase() : '';
    } else {
      roomId = generateRoomId();
    }
  }

  function resolveRoomId(): string {
    if (tab === 'join' || joinOnly) {
      const fromField = roomId.trim().toUpperCase();
      if (fromField) return fromField;
      if (initialRoomId) return initialRoomId.trim().toUpperCase();
      return '';
    }
    if (!roomId.trim()) roomId = generateRoomId();
    return roomId.trim().toUpperCase();
  }

  async function handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    localError = '';

    if (!name.trim()) {
      localError = '请输入昵称';
      return;
    }

    const id = resolveRoomId();
    if (!id) {
      localError = '请输入房间暗号';
      return;
    }

    submitting = true;
    onEnter?.(id, name.trim());
    submitting = false;
  }
</script>

<article class="tavern-card card">
  <div class="tavern-card__tabs" role="tablist">
    {#if !joinOnly}
      <button
        type="button"
        role="tab"
        class="tavern-card__tab"
        class:tavern-card__tab--active={tab === 'create'}
        aria-selected={tab === 'create'}
        onclick={() => switchTab('create')}
      >
        新开一桌
      </button>
    {/if}
    <button
      type="button"
      role="tab"
      class="tavern-card__tab"
      class:tavern-card__tab--active={tab === 'join'}
      class:tavern-card__tab--solo={joinOnly}
      aria-selected={tab === 'join'}
      onclick={() => switchTab('join')}
    >
      {joinOnly ? '加入骰局' : '加入骰局'}
    </button>
    {#if !joinOnly}
      <span class="tavern-card__tab-indicator" class:tavern-card__tab-indicator--join={tab === 'join'}></span>
    {/if}
  </div>

  <form class="tavern-card__form" onsubmit={handleSubmit}>
    <div class="form-group">
      <label class="form-label" for="player-name">旅人昵称</label>
      <input
        id="player-name"
        class="form-input"
        type="text"
        maxlength="24"
        placeholder="随便写,不保存"
        bind:value={name}
        autocomplete="nickname"
      />
    </div>

    {#if tab === 'join' || joinOnly}
      <div class="form-group">
        <label class="form-label" for="room-id">房间暗号</label>
        <input
          id="room-id"
          class="form-input tavern-card__room-input"
          type="text"
          maxlength="12"
          placeholder="6 位房间码"
          bind:value={roomId}
          style="text-transform: uppercase"
        />
      </div>
    {:else}
      <p class="tavern-card__auto-hint">进入时自动分配房间暗号，无需手动填写。</p>
    {/if}

    {#if localError}
      <p class="tavern-card__error" role="alert" transition:slide={{ duration: 200 }}>{localError}</p>
    {/if}

    <button type="submit" class="btn btn-gilded btn-full" disabled={submitting}>
      {submitting ? '推门中…' : '进入酒馆'}
    </button>
  </form>

  <div class="tavern-card__rules">
    <button
      type="button"
      class="tavern-card__rules-toggle"
      aria-expanded={rulesOpen}
      onclick={() => (rulesOpen = !rulesOpen)}
    >
      {rulesOpen ? '收起规则' : '怎么玩？'}
    </button>
    {#if rulesOpen}
      <div class="tavern-card__rules-body" transition:slide={{ duration: 220 }}>
        <p>轮流掷骰、计分并保留组合，可继续再掷或计分并跳过。先至 目标分数 者胜。</p>
        <ul>
          <li>1 → 100 分，5 → 50 分</li>
          <li>三个及以上相同点数、至少五个顺子有额外加分</li>
          <li>无得分骰即本轮作废，本回合得分清零</li>
          <li>六枚皆可计分时为全部得分，可再掷一轮</li>
        </ul>
      </div>
    {/if}
  </div>
</article>

<style>
  .tavern-card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 420px;
    flex-shrink: 0;
    padding: 0;
    overflow: hidden;
    animation: cardEnter 0.45s var(--ease-out);
  }

  .tavern-card__tabs {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    background: rgba(0, 0, 0, 0.2);
    border-bottom: 1px solid rgba(201, 168, 106, 0.15);
  }

  .tavern-card__tab {
    padding: var(--space-3);
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--color-text-soft);
    transition: color var(--duration-fast);
    z-index: 1;
  }

  .tavern-card__tab--active {
    color: var(--color-gold-bright);
  }

  .tavern-card__tab--solo {
    grid-column: 1 / -1;
  }

  .tavern-card__tabs:has(.tavern-card__tab--solo) {
    grid-template-columns: 1fr;
  }

  .tavern-card__tab-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 50%;
    height: 3px;
    background: var(--color-gold);
    border-radius: 3px 3px 0 0;
    transition: transform var(--duration-normal) var(--ease-out);
  }

  .tavern-card__tab-indicator--join {
    transform: translateX(100%);
  }

  .tavern-card__form {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .tavern-card__room-input {
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.1em;
    font-weight: 600;
  }

  .tavern-card__auto-hint {
    font-size: 0.8125rem;
    color: var(--color-text-soft);
    line-height: 1.5;
    padding: var(--space-2) var(--space-3);
    background: var(--color-canvas-alt);
    border-radius: 8px;
  }

  .tavern-card__error {
    color: var(--color-danger);
    font-size: 0.875rem;
    padding: var(--space-2);
    background: var(--color-danger-tint);
    border-radius: 8px;
  }

  .tavern-card__rules {
    border-top: 1px solid rgba(201, 168, 106, 0.12);
    padding: var(--space-3) var(--space-4);
    background: rgba(0, 0, 0, 0.15);
  }

  .tavern-card__rules-toggle {
    width: 100%;
    text-align: center;
    font-size: 0.875rem;
    color: var(--color-gold);
    font-weight: 500;
    padding: var(--space-1);
  }

  .tavern-card__rules-body {
    margin-top: var(--space-3);
    font-size: 0.875rem;
    color: var(--color-text-soft);
    line-height: 1.6;
  }

  .tavern-card__rules-body ul {
    margin-top: var(--space-2);
    padding-left: 1.2rem;
  }

  .tavern-card__rules-body li {
    margin-bottom: var(--space-1);
  }

  @keyframes cardEnter {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
