<script lang="ts">
  import { onMount } from 'svelte';
  import TavernQuoteBar from '../layout/TavernQuoteBar.svelte';
  import OrnamentalDivider from '../layout/OrnamentalDivider.svelte';
  import { createMenuQuoteController } from '$lib/ui/useTavernQuote.svelte';

  interface Props {
    onStart?: () => void;
    onCollection?: () => void;
    onRules?: () => void;
    onSettings?: () => void;
  }

  let { onStart, onCollection, onRules, onSettings }: Props = $props();

  const menuQuotes = createMenuQuoteController();

  onMount(() => {
    menuQuotes.start();
    const onPointer = () => menuQuotes.onActivity();
    window.addEventListener('pointerdown', onPointer);
    return () => {
      menuQuotes.stop();
      window.removeEventListener('pointerdown', onPointer);
    };
  });
</script>

<nav class="main-menu" aria-label="主菜单">
  <div class="main-menu__header">
    <div class="main-menu__crown" aria-hidden="true">🎲</div>
    <h1 class="main-menu__title">亨利的骰桌</h1>
    <OrnamentalDivider glyph="✦" />
    <p class="main-menu__subtitle">天国拯救2 · 特罗斯基，1403年</p>
  </div>

  <div class="main-menu__quote">
    <TavernQuoteBar quote={menuQuotes.quote} compact />
  </div>

  <div class="main-menu__board">
    <button type="button" class="menu-btn menu-btn--hero" onclick={onStart}>
      <span class="menu-btn__frame">
        <span class="menu-btn__inner">
          <span class="menu-btn__icon" aria-hidden="true">🎲</span>
          <span class="menu-btn__text">
            <span class="menu-btn__title">进入酒馆</span>
            <span class="menu-btn__sub">开始你的骰子对决</span>
          </span>
        </span>
      </span>
    </button>

    <div class="main-menu__pair">
      <button type="button" class="menu-btn menu-btn--tile" onclick={onCollection}>
        <span class="menu-btn__frame">
          <span class="menu-btn__inner menu-btn__inner--tile">
            <span class="menu-btn__icon menu-btn__icon--tile" aria-hidden="true">📖</span>
            <span class="menu-btn__text">
              <span class="menu-btn__title">骰子图鉴</span>
              <span class="menu-btn__sub">查看所有骰子组合</span>
            </span>
          </span>
        </span>
      </button>

      <button type="button" class="menu-btn menu-btn--tile" onclick={onRules}>
        <span class="menu-btn__frame">
          <span class="menu-btn__inner menu-btn__inner--tile">
            <span class="menu-btn__icon menu-btn__icon--tile" aria-hidden="true">📜</span>
            <span class="menu-btn__text">
              <span class="menu-btn__title">规则说明</span>
              <span class="menu-btn__sub">了解游戏规则</span>
            </span>
          </span>
        </span>
      </button>
    </div>

    <button type="button" class="menu-btn menu-btn--settings" onclick={onSettings}>
      <span class="menu-btn__settings-icon" aria-hidden="true">⚙</span>
      <span class="menu-btn__settings-label">设置</span>
    </button>
  </div>
</nav>

<style>
  .main-menu {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: min(440px, 100%);
    animation: menuIn 0.5s var(--ease-out);
  }

  .main-menu__header {
    text-align: center;
    margin-bottom: var(--space-3);
  }

  .main-menu__quote {
    width: 100%;
    margin-bottom: var(--space-3);
    opacity: 0.92;
  }

  .main-menu__crown {
    font-size: 1.75rem;
    color: var(--color-gold-bright);
    margin-bottom: var(--space-2);
    text-shadow: 0 0 16px rgba(212, 175, 55, 0.45);
  }

  .main-menu__title {
    font-family: var(--font-display);
    font-size: clamp(2.35rem, 10vw, 3.35rem);
    font-weight: 400;
    line-height: 1.1;
    letter-spacing: 0.02em;
    margin-bottom: 0;
    color: #ffe9a8;
    text-shadow:
      0 2px 0 rgba(120, 72, 18, 0.55),
      0 0 22px rgba(255, 210, 100, 0.45);
  }

  .main-menu__subtitle {
    font-family: var(--font-caption);
    font-size: 0.875rem;
    font-weight: 400;
    color: rgba(245, 235, 210, 0.88);
    letter-spacing: 0.05em;
    margin-top: var(--space-1);
  }

  .main-menu__board {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    width: 100%;
  }

  .main-menu__pair {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);
    width: 100%;
  }

  /* ── 菜单按钮基类 ── */
  .menu-btn {
    display: block;
    width: 100%;
    padding: 0;
    text-align: left;
    color: inherit;
    transition: transform var(--duration-fast) var(--ease-out);
  }

  .menu-btn:not(:disabled):active {
    transform: scale(0.98);
  }

  .menu-btn:not(:disabled):hover .menu-btn__frame {
    box-shadow:
      0 0 28px rgba(212, 175, 55, 0.35),
      inset 0 0 0 1px rgba(255, 220, 140, 0.15);
  }

  .menu-btn:not(:disabled):hover .menu-btn__inner {
    filter: brightness(1.08);
  }

  /* 烫金外框 */
  .menu-btn__frame {
    display: block;
    position: relative;
    padding: 2px;
    border-radius: 6px;
    background: linear-gradient(
      145deg,
      #f0d78a 0%,
      #b8860b 22%,
      #8b6914 50%,
      #d4af37 78%,
      #f5e6b8 100%
    );
    box-shadow:
      0 0 18px rgba(212, 175, 55, 0.22),
      0 4px 14px rgba(0, 0, 0, 0.45);
    transition: box-shadow var(--duration-normal) var(--ease-out);
  }

  .menu-btn__frame::before,
  .menu-btn__frame::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    border: 1px solid rgba(255, 235, 180, 0.55);
    pointer-events: none;
    z-index: 1;
  }

  .menu-btn__frame::before {
    top: 4px;
    left: 4px;
    border-right: none;
    border-bottom: none;
  }

  .menu-btn__frame::after {
    bottom: 4px;
    right: 4px;
    border-left: none;
    border-top: none;
  }

  .menu-btn--hero .menu-btn__frame::before,
  .menu-btn--hero .menu-btn__frame::after {
    width: 10px;
    height: 10px;
  }

  .menu-btn--hero .menu-btn__frame {
    padding: 3px;
    box-shadow:
      0 0 32px rgba(212, 175, 55, 0.32),
      0 6px 20px rgba(0, 0, 0, 0.5);
  }

  .menu-btn__inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    width: 100%;
    min-height: 4.25rem;
    padding: var(--space-3) var(--space-4);
    text-align: center;
    border-radius: 4px;
    background: linear-gradient(
      180deg,
      rgba(61, 42, 26, 0.98) 0%,
      rgba(26, 18, 11, 0.99) 55%,
      rgba(15, 10, 7, 1) 100%
    );
    box-shadow:
      inset 0 1px 0 rgba(255, 220, 160, 0.12),
      inset 0 -8px 24px rgba(0, 0, 0, 0.35);
    transition: filter var(--duration-normal) var(--ease-out);
  }

  .menu-btn--hero .menu-btn__inner {
    min-height: 4.75rem;
  }

  .menu-btn__inner--tile {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 5.5rem;
    padding: var(--space-3);
  }

  .menu-btn__icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    font-size: 1.5rem;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
  }

  .menu-btn--hero .menu-btn__icon {
    width: 3rem;
    height: 3rem;
    font-size: 1.75rem;
  }

  .menu-btn__icon--tile {
    width: auto;
    height: auto;
    font-size: 1.375rem;
    opacity: 0.95;
  }

  .menu-btn__text {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    min-width: 0;
    text-align: center;
  }

  .menu-btn__title {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 400;
    color: var(--color-gold-bright);
    letter-spacing: 0.06em;
    line-height: 1.25;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  }

  .menu-btn--hero .menu-btn__title {
    font-size: 1.25rem;
  }

  .menu-btn__sub {
    font-size: 0.6875rem;
    font-weight: 400;
    color: var(--color-text-soft);
    letter-spacing: 0.04em;
    line-height: 1.35;
  }

  .menu-btn__inner--tile .menu-btn__sub {
    font-size: 0.625rem;
    line-height: 1.3;
  }

  /* 设置：细框小按钮 */
  .menu-btn--settings {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    width: auto;
    min-width: 7rem;
    margin-top: var(--space-2);
    padding: 0.5rem 1.5rem;
    border: 1px solid rgba(201, 168, 106, 0.45);
    border-radius: var(--radius-pill);
    background: rgba(0, 0, 0, 0.25);
    color: var(--color-gold);
    font-family: var(--font-serif);
    font-size: 0.9375rem;
    letter-spacing: 0.12em;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    transition:
      background var(--duration-fast) var(--ease-out),
      border-color var(--duration-fast) var(--ease-out),
      box-shadow var(--duration-fast) var(--ease-out);
  }

  .menu-btn--settings:not(:disabled):hover {
    background: var(--color-gold-wash);
    border-color: var(--color-gold);
    box-shadow: 0 0 12px rgba(212, 175, 55, 0.2);
  }

  .menu-btn__settings-icon {
    font-size: 1rem;
    line-height: 1;
    opacity: 0.9;
  }

  .menu-btn__settings-label {
    font-weight: 600;
  }

  @media (max-width: 380px) {
    .main-menu__pair {
      grid-template-columns: 1fr;
    }
  }

  @keyframes menuIn {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>
