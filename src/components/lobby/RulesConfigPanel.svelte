<script lang="ts">
  import { DEFAULT_CONFIG, type GameConfig } from '$lib/game/types';
  import { validateConfig } from '$lib/game/rules';

  interface Props {
    starting?: boolean;
    onConfirm?: (config: Pick<GameConfig, 'targetScore' | 'specialDiceCount'>) => void;
    onBack?: () => void;
  }

  let { starting = false, onConfirm, onBack }: Props = $props();

  let targetScore = $state(DEFAULT_CONFIG.targetScore);
  let specialDiceCount = $state<0 | 1 | 2 | 3>(DEFAULT_CONFIG.specialDiceCount);
  let validationError = $state('');

  const countOptions: { value: 0 | 1 | 2 | 3; label: string }[] = [
    { value: 0, label: '不使用' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
  ];

  function handleConfirm(): void {
    const errors = validateConfig({ targetScore, specialDiceCount });
    if (errors.length > 0) {
      validationError = errors[0]!;
      return;
    }
    validationError = '';
    onConfirm?.({ targetScore, specialDiceCount });
  }
</script>

<div class="rules-config card">
  <button type="button" class="rules-config__back" onclick={onBack} disabled={starting}>← 返回</button>

  <h2 class="rules-config__title">游戏规则设置</h2>

  <div class="rules-config__field">
    <label class="rules-config__label" for="target-score">目标分数</label>
    <input
      id="target-score"
      type="number"
      class="rules-config__input"
      min="500"
      max="10000"
      step="100"
      bind:value={targetScore}
      disabled={starting}
    />
  </div>

  <div class="rules-config__field">
    <span class="rules-config__label">特殊骰子数量</span>
    <div class="rules-config__segmented" role="group" aria-label="特殊骰子数量">
      {#each countOptions as opt (opt.value)}
        <button
          type="button"
          class="rules-config__seg-btn"
          class:rules-config__seg-btn--active={specialDiceCount === opt.value}
          disabled={starting}
          onclick={() => (specialDiceCount = opt.value)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
    <p class="rules-config__hint">每人可选择的特殊骰子上限</p>
  </div>

  {#if validationError}
    <p class="rules-config__error" role="alert">{validationError}</p>
  {/if}

  <button
    type="button"
    class="btn btn-gilded btn-full rules-config__confirm"
    disabled={starting}
    onclick={handleConfirm}
  >
    {starting ? '正在开局…' : '确认规则，开始游戏'}
  </button>
</div>

<style>
  .rules-config {
    width: 100%;
    max-width: 420px;
    margin-inline: auto;
    padding: var(--space-4);
    animation: fadeUp 0.3s var(--ease-out);
  }

  .rules-config__back {
    background: none;
    border: none;
    color: var(--color-text-soft);
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0;
    margin-bottom: var(--space-3);
  }

  .rules-config__back:hover {
    color: var(--color-gold);
  }

  .rules-config__title {
    font-family: var(--font-serif);
    font-size: 1.375rem;
    color: var(--color-gold-bright);
    text-align: center;
    margin-bottom: var(--space-4);
  }

  .rules-config__field {
    margin-bottom: var(--space-4);
  }

  .rules-config__label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-soft);
    margin-bottom: var(--space-2);
  }

  .rules-config__input {
    width: 100%;
    padding: var(--space-3);
    border: 1px solid var(--color-border-gold);
    border-radius: 8px;
    background: var(--color-surface-elevated);
    font-size: 1rem;
    color: var(--color-text-on-dark);
  }

  .rules-config__segmented {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
  }

  .rules-config__seg-btn {
    min-height: 44px;
    border: 1px solid var(--color-border-gold);
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.2);
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: background var(--duration-normal), border-color var(--duration-normal);
  }

  .rules-config__seg-btn--active {
    background: var(--color-gold-wash);
    border-color: var(--color-gold);
    color: var(--color-gold-bright);
  }

  .rules-config__hint {
    margin-top: var(--space-2);
    font-size: 0.75rem;
    color: var(--color-text-soft);
  }

  .rules-config__error {
    color: var(--color-danger);
    font-size: 0.875rem;
    margin-bottom: var(--space-2);
    text-align: center;
  }

  .rules-config__confirm {
    margin-top: var(--space-2);
    min-height: 48px;
  }

  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
