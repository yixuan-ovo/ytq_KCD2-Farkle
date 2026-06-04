<script lang="ts">
  import {
    loadGameSettings,
    saveGameSettings,
    type GameSettings,
  } from '$lib/settings/gameSettings';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();

  let settings = $state<GameSettings>(loadGameSettings());

  $effect(() => {
    saveGameSettings(settings);
  });
</script>

<div class="settings-panel" role="dialog" aria-labelledby="settings-title">
  <div class="settings-panel__inner card">
    <header class="settings-panel__header">
      <h2 id="settings-title" class="settings-panel__title">设置</h2>
      {#if onClose}
        <button type="button" class="settings-panel__close" onclick={onClose} aria-label="关闭">×</button>
      {/if}
    </header>

    <label class="settings-panel__row">
      <span>掷骰飞散动画</span>
      <input type="checkbox" bind:checked={settings.physicsEnabled} />
    </label>
    <p class="settings-panel__hint">开启后骰子收拢、飞散再落回槽位（约 0.85 秒）；关闭则用轻量 CSS 旋转。系统「减少动态效果」也会自动跳过。</p>

    <p class="settings-panel__note">音效与背景音乐将在后续版本接入。</p>
  </div>
</div>

<style>
  .settings-panel {
    position: fixed;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--layout-gutter);
    background: rgba(0, 0, 0, 0.65);
  }

  .settings-panel__inner {
    max-width: 360px;
    width: 100%;
  }

  .settings-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-4);
  }

  .settings-panel__title {
    font-family: var(--font-serif);
    font-size: 1.25rem;
    color: var(--color-gold);
  }

  .settings-panel__close {
    font-size: 1.5rem;
    color: var(--color-text-on-dark);
    opacity: 0.7;
  }

  .settings-panel__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
    font-size: 0.9375rem;
    color: var(--color-text);
  }

  .settings-panel__hint {
    font-size: 0.75rem;
    color: var(--color-text-soft);
    margin: calc(-1 * var(--space-2)) 0 var(--space-3);
    line-height: 1.45;
  }

  .settings-panel__note {
    font-size: 0.75rem;
    color: var(--color-text-soft);
    margin-top: var(--space-2);
    line-height: 1.45;
  }
</style>
