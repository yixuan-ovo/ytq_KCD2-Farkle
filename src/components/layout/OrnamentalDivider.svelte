<script lang="ts">
  interface Props {
    /** 中央纹样：默认 ✦ */
    glyph?: string;
    /** 默认 medium；narrow 用于顶栏等窄位 */
    size?: 'medium' | 'narrow';
  }

  let { glyph = '✦', size = 'medium' }: Props = $props();
</script>

<div
  class="ornament"
  class:ornament--narrow={size === 'narrow'}
  role="presentation"
  aria-hidden="true"
>
  <span class="ornament__curl ornament__curl--left"></span>
  <span class="ornament__line"></span>
  <span class="ornament__gem">
    <span class="ornament__glyph">{glyph}</span>
  </span>
  <span class="ornament__line"></span>
  <span class="ornament__curl ornament__curl--right"></span>
</div>

<style>
  .ornament {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    width: min(280px, 88%);
    margin: var(--space-2) auto;
    opacity: 0.92;
  }

  .ornament--narrow {
    width: min(200px, 72%);
    gap: 0.5rem;
    margin: var(--space-1) auto;
  }

  .ornament__line {
    flex: 1;
    height: 1px;
    min-width: 1.5rem;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(201, 168, 106, 0.25) 15%,
      rgba(212, 175, 55, 0.85) 50%,
      rgba(201, 168, 106, 0.25) 85%,
      transparent 100%
    );
    position: relative;
  }

  .ornament__line::after {
    content: '';
    position: absolute;
    inset: -1px 20% auto;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 235, 180, 0.35),
      transparent
    );
  }

  .ornament__gem {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.35rem;
    height: 1.35rem;
    font-size: 0.7rem;
    line-height: 1;
    color: var(--color-gold-bright);
    text-shadow: 0 0 10px rgba(212, 175, 55, 0.65);
    border: 1px solid rgba(201, 168, 106, 0.45);
    border-radius: 2px;
    transform: rotate(45deg);
    background: radial-gradient(circle at 30% 25%, rgba(255, 235, 180, 0.35), rgba(26, 18, 11, 0.85));
    box-shadow:
      0 0 12px rgba(212, 175, 55, 0.25),
      inset 0 0 6px rgba(0, 0, 0, 0.35);
  }

  .ornament__glyph {
    display: block;
    transform: rotate(-45deg);
    line-height: 1;
  }

  .ornament--narrow .ornament__gem {
    width: 1.1rem;
    height: 1.1rem;
    font-size: 0.55rem;
  }

  /* 旋转容器内的字正过来 */
  .ornament__gem {
    font-family: var(--font-serif);
  }

  .ornament__curl {
    flex-shrink: 0;
    width: 0.55rem;
    height: 0.55rem;
    border: 1px solid rgba(201, 168, 106, 0.4);
    opacity: 0.75;
  }

  .ornament__curl--left {
    border-right: none;
    border-bottom: none;
    border-radius: 4px 0 0 0;
    margin-right: -0.35rem;
  }

  .ornament__curl--right {
    border-left: none;
    border-top: none;
    border-radius: 0 0 4px 0;
    margin-left: -0.35rem;
  }

  .ornament--narrow .ornament__curl {
    display: none;
  }
</style>
