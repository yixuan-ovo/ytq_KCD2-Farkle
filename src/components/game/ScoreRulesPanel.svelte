<script lang="ts">
  import { SCORE_RULES } from '$lib/ui/scoreRules';

  interface Props {
    collapsed?: boolean;
    onToggle?: () => void;
  }

  let { collapsed = false, onToggle }: Props = $props();
</script>

<aside class="score-rules" class:score-rules--collapsed={collapsed}>
  {#if onToggle}
    <button type="button" class="score-rules__toggle" onclick={onToggle}>
      {collapsed ? '展开得分表' : '收起得分表'}
    </button>
  {/if}

  {#if !collapsed}
    <div class="score-rules__inner panel-parchment">
      <h3 class="score-rules__title">得分表</h3>
      <table class="score-rules__table">
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
  {/if}
</aside>

<style>
  .score-rules {
    width: 100%;
  }

  .score-rules__toggle {
    display: block;
    width: 100%;
    max-width: 360px;
    padding: var(--space-2);
    font-size: 0.8125rem;
    color: var(--color-gold);
    border: 1px solid var(--color-border-gold);
    border-radius: var(--radius-card);
    margin-bottom: var(--space-2);
    background: rgba(0, 0, 0, 0.2);
  }

  .score-rules--collapsed .score-rules__inner {
    display: none;
  }

  .score-rules__inner {
    max-height: 280px;
    overflow-y: auto;
  }

  .score-rules__title {
    font-family: var(--font-serif);
    font-size: 1rem;
    margin-bottom: var(--space-2);
    color: var(--color-text-on-paper);
    text-align: center;
  }

  .score-rules__table {
    width: 100%;
    font-size: 0.8125rem;
    border-collapse: collapse;
  }

  .score-rules__table td {
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid rgba(44, 24, 16, 0.08);
  }

  .score-rules__table td:last-child {
    text-align: right;
    font-family: var(--font-mono);
    font-weight: 600;
    color: var(--color-wine-deep);
  }

</style>
