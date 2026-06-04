<script lang="ts">
  import { SCORE_RULES } from '$lib/ui/scoreRules';

  interface Props {
    onClose?: () => void;
  }

  let { onClose }: Props = $props();
</script>

<div class="rules-sheet" role="dialog" aria-labelledby="rules-title">
  <div class="rules-sheet__panel panel-parchment">
    <header class="rules-sheet__header">
      <h2 id="rules-title" class="rules-sheet__title">规则说明</h2>
      {#if onClose}
        <button type="button" class="rules-sheet__close" onclick={onClose} aria-label="关闭">×</button>
      {/if}
    </header>
    <p class="rules-sheet__lead">
      轮流掷骰、计分并保留组合，可继续再掷或计分并跳过。先达到目标分数者胜。
    </p>
    <ul class="rules-sheet__list">
      <li>1 → 100 分，5 → 50 分</li>
      <li>三个以上相同点数、至少五个顺子有额外加分</li>
      <li>无得分骰即本轮作废，本回合得分清零</li>
      <li>六枚皆可计分时为全部得分，可再掷一轮</li>
    </ul>
    <h3 class="rules-sheet__subtitle">得分表</h3>
    <table class="rules-sheet__table">
      <tbody>
        {#each SCORE_RULES as row (row.dice)}
          <tr>
            <td>{row.dice}</td>
            <td>{row.points}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .rules-sheet {
    position: fixed;
    inset: 0;
    z-index: 210;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--layout-gutter);
    background: rgba(0, 0, 0, 0.65);
  }

  .rules-sheet__panel {
    max-width: 400px;
    width: 100%;
    max-height: 85vh;
    overflow-y: auto;
  }

  .rules-sheet__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
  }

  .rules-sheet__title {
    font-family: var(--font-serif);
    font-size: 1.25rem;
    color: var(--color-text-on-paper);
  }

  .rules-sheet__close {
    font-size: 1.5rem;
    line-height: 1;
    color: var(--color-text-on-paper);
    opacity: 0.6;
    padding: 0.25rem;
  }

  .rules-sheet__close:hover {
    opacity: 1;
  }

  .rules-sheet__lead {
    font-size: 0.9375rem;
    line-height: 1.6;
    margin-bottom: var(--space-3);
    color: var(--color-text-on-paper);
  }

  .rules-sheet__list {
    padding-left: 1.2rem;
    font-size: 0.875rem;
    margin-bottom: var(--space-4);
    color: rgba(44, 24, 16, 0.85);
  }

  .rules-sheet__list li {
    margin-bottom: var(--space-1);
  }

  .rules-sheet__subtitle {
    font-size: 0.9375rem;
    margin-bottom: var(--space-2);
    color: var(--color-text-on-paper);
  }

  .rules-sheet__table {
    width: 100%;
    font-size: 0.8125rem;
    border-collapse: collapse;
  }

  .rules-sheet__table td {
    padding: 0.35rem 0;
    border-bottom: 1px solid rgba(44, 24, 16, 0.08);
  }

  .rules-sheet__table td:last-child {
    text-align: right;
    font-family: var(--font-mono);
    font-weight: 600;
  }
</style>
