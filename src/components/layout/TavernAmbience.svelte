<script lang="ts">
  import { onMount } from 'svelte';
  import { getFaceTextureUrl } from '$lib/assets/diceTextures';
  import { prefersReducedMotion } from '$lib/ui/animation';
  import type { DieFace } from '$lib/game/types';

  /** 深色酒馆烛光氛围 + 低对比 emoji + 悬浮骰 1–6 依次发光 */

  const GLYPHS = [
    { id: 'g1', glyph: '🎲', x: '9%', y: '14%', r: -14, drift: '20s' },
    { id: 'g2', glyph: '⚔️', x: '84%', y: '18%', r: 22, drift: '22s' },
    { id: 'g3', glyph: '🍺', x: '78%', y: '76%', r: -8, drift: '18s' },
    { id: 'g4', glyph: '🪙', x: '12%', y: '68%', r: 16, drift: '24s' },
    { id: 'g5', glyph: '🎲', x: '52%', y: '88%', r: -32, drift: '21s' },
  ] as const;

  const FLOAT_DICE: {
    id: string;
    face: DieFace;
    x: string;
    y: string;
    r: number;
    bobDelay: string;
  }[] = [
    /* 左侧：与按钮区中部齐平，三点略分散 */
    { id: 'd1', face: 1, x: '5%', y: '38%', r: -11, bobDelay: '0s' },
    { id: 'd2', face: 2, x: '17%', y: '46%', r: 8, bobDelay: '0.7s' },
    { id: 'd3', face: 3, x: '7%', y: '56%', r: -6, bobDelay: '1.4s' },
    /* 右侧：偏下靠外，三点略分散 */
    { id: 'd4', face: 4, x: '71%', y: '42%', r: 10, bobDelay: '0.35s' },
    { id: 'd5', face: 5, x: '86%', y: '50%', r: -8, bobDelay: '1.05s' },
    { id: 'd6', face: 6, x: '76%', y: '60%', r: 6, bobDelay: '1.75s' },
  ];

  const GLOW_STEP_MS = 850;

  let litIndex = $state(0);
  let bobOk = $state(true);

  onMount(() => {
    bobOk = !prefersReducedMotion();
    let step = 0;
    const intervalMs = bobOk ? GLOW_STEP_MS : GLOW_STEP_MS * 1.4;

    const timer = window.setInterval(() => {
      step = (step + 1) % FLOAT_DICE.length;
      litIndex = step;
    }, intervalMs);

    return () => clearInterval(timer);
  });
</script>

<div class="tavern-ambience" aria-hidden="true">
  <div class="tavern-ambience__base"></div>
  <div class="tavern-ambience__candle"></div>

  <div class="tavern-ambience__glyphs">
    {#each GLYPHS as g (g.id)}
      <span
        class="tavern-ambience__glyph"
        style="--x: {g.x}; --y: {g.y}; --r: {g.r}deg; --drift-duration: {g.drift}"
      >{g.glyph}</span>
    {/each}
  </div>

  <div class="tavern-ambience__grain"></div>
  <div class="tavern-ambience__vignette"></div>

  <!-- 置于暗角之上，否则发光几乎看不见 -->
  <div class="tavern-ambience__float-dice">
    {#each FLOAT_DICE as d, i (d.id)}
      <div
        class="tavern-ambience__float-die"
        class:tavern-ambience__float-die--lit={i === litIndex}
        style="--die-x: {d.x}; --die-y: {d.y}; --die-r: {d.r}deg; --bob-delay: {d.bobDelay}"
      >
        <span class="tavern-ambience__float-die-halo"></span>
        <img
          class="tavern-ambience__float-die-img"
          src={getFaceTextureUrl(d.face)}
          alt=""
          width="64"
          height="64"
          draggable="false"
        />
      </div>
    {/each}
  </div>
</div>

<style>
  .tavern-ambience {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: var(--wood-dark);
    overflow: hidden;
  }

  .tavern-ambience__base {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 120% 80% at 50% 100%, var(--wood-mid) 0%, var(--wood-dark) 55%);
  }

  .tavern-ambience__candle {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(ellipse 45% 35% at 50% 35%, rgba(201, 168, 106, 0.18), transparent 60%),
      radial-gradient(ellipse 25% 20% at 20% 70%, rgba(139, 46, 46, 0.08), transparent 50%),
      radial-gradient(ellipse 25% 20% at 80% 65%, rgba(201, 168, 106, 0.06), transparent 50%);
    animation: candleFlicker 7s ease-in-out infinite;
  }

  .tavern-ambience__glyphs {
    position: absolute;
    inset: 0;
    z-index: 0;
  }

  .tavern-ambience__glyph {
    position: absolute;
    left: var(--x);
    top: var(--y);
    font-size: clamp(3rem, 8vw, 5rem);
    line-height: 1;
    opacity: 0.06;
    transform: rotate(var(--r));
    user-select: none;
    animation: glyphDrift var(--drift-duration, 20s) ease-in-out infinite;
  }

  .tavern-ambience__grain,
  .tavern-ambience__vignette {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .tavern-ambience__grain {
    opacity: 0.06;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }

  .tavern-ambience__vignette {
    background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 0, 0, 0.55) 100%);
  }

  .tavern-ambience__float-dice {
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  .tavern-ambience__float-die {
    position: absolute;
    left: var(--die-x);
    top: var(--die-y);
    width: clamp(52px, 13vw, 68px);
    rotate: var(--die-r);
    animation: dieBob 4.5s ease-in-out infinite;
    animation-delay: var(--bob-delay);
  }

  @media (prefers-reduced-motion: reduce) {
    .tavern-ambience__float-die {
      animation: none;
    }
  }

  .tavern-ambience__float-die-halo {
    position: absolute;
    inset: -18%;
    border-radius: 22%;
    background: radial-gradient(
      circle at center,
      rgba(212, 175, 55, 0.55) 0%,
      rgba(201, 168, 106, 0.2) 45%,
      transparent 72%
    );
    opacity: 0;
    transform: scale(0.85);
    transition:
      opacity 0.35s var(--ease-out),
      transform 0.35s var(--ease-out);
  }

  .tavern-ambience__float-die-img {
    position: relative;
    z-index: 1;
    display: block;
    width: 100%;
    height: auto;
    border-radius: 14%;
    opacity: 0.42;
    filter: brightness(0.82);
    transition:
      opacity 0.35s var(--ease-out),
      transform 0.35s var(--ease-out),
      filter 0.35s var(--ease-out);
  }

  .tavern-ambience__float-die--lit .tavern-ambience__float-die-halo {
    opacity: 1;
    transform: scale(1.12);
  }

  .tavern-ambience__float-die--lit .tavern-ambience__float-die-img {
    opacity: 1;
    filter: brightness(1.15);
    transform: scale(1.1);
    box-shadow:
      0 0 28px rgba(212, 175, 55, 0.75),
      0 8px 20px rgba(0, 0, 0, 0.45);
  }

  @keyframes candleFlicker {
    0%,
    100% {
      opacity: 0.88;
      transform: scale(1);
      filter: blur(0);
    }
    25%,
    75% {
      opacity: 0.92;
      transform: scale(0.98);
    }
    50% {
      opacity: 1;
      transform: scale(1.03);
      filter: blur(1px);
    }
  }

  @keyframes glyphDrift {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -6px;
    }
  }

  @keyframes dieBob {
    0%,
    100% {
      translate: 0 0;
    }
    50% {
      translate: 0 -12px;
    }
  }

  @media (max-width: 640px) {
    .tavern-ambience__float-die {
      width: clamp(44px, 15vw, 56px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .tavern-ambience__candle {
      animation: none;
      opacity: 0.94;
    }

    .tavern-ambience__glyph {
      animation: none;
    }

    .tavern-ambience__float-die-img {
      opacity: 0.5;
    }

    .tavern-ambience__float-die--lit .tavern-ambience__float-die-img {
      opacity: 0.65;
    }
  }
</style>
