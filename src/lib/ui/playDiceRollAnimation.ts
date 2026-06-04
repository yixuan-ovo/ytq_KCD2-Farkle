import gsap from 'gsap';
import { getThemedFaceUrl } from '$lib/assets/diceTextures';
import {
  isMobileRollViewport,
  prefersReducedMotion,
  randomFlyOffset,
  randomRotation,
  ROLL_FLY_MS,
  ROLL_GATHER_MS,
  ROLL_SETTLE_MS,
} from '$lib/ui/animation';

export interface RollAnimDie {
  dieId: number;
  dieType: string;
  /** 槽位内用于测量的元素（如 .dice-piece__body） */
  element: HTMLElement;
  faceUrl: string;
}

export interface PlayDiceRollAnimationOptions {
  boardEl: HTMLElement;
  dies: RollAnimDie[];
  isMobile?: boolean;
  onComplete?: () => void;
}

interface DieLayout {
  die: RollAnimDie;
  slotX: number;
  slotY: number;
  width: number;
  height: number;
  flyX: number;
  flyY: number;
  rotation: number;
  clone: HTMLDivElement;
}

function centerOfRect(
  rect: DOMRect,
  boardRect: DOMRect,
): { x: number; y: number; w: number; h: number } {
  const w = rect.width;
  const h = rect.height;
  return {
    x: rect.left - boardRect.left + w / 2,
    y: rect.top - boardRect.top + h / 2,
    w,
    h,
  };
}

function createClone(source: HTMLElement, layout: DieLayout, boardRect: DOMRect): HTMLDivElement {
  const srcRect = source.getBoundingClientRect();
  const { x, y, w, h } = centerOfRect(srcRect, boardRect);

  const clone = document.createElement('div');
  clone.className = 'dice-roll-clone';
  clone.style.cssText = [
    'position:absolute',
    'left:0',
    'top:0',
    'pointer-events:none',
    'will-change:transform',
    `width:${w}px`,
    `height:${h}px`,
    `margin-left:${-w / 2}px`,
    `margin-top:${-h / 2}px`,
  ].join(';');

  const inner = document.createElement('div');
  inner.className = 'dice-roll-clone__body';
  const computed = getComputedStyle(source);
  inner.style.cssText = [
    'width:100%',
    'height:100%',
    'border-radius:' + (computed.borderRadius || '8px'),
    'border:' + (computed.border || '2px solid rgba(61,43,31,0.9)'),
    'background:' + (computed.background || computed.backgroundColor || '#e8dcc8'),
    'box-shadow:' + (computed.boxShadow || '0 4px 8px rgba(0,0,0,0.4)'),
    'display:flex',
    'align-items:center',
    'justify-content:center',
    'overflow:hidden',
  ].join(';');

  const img = source.querySelector('img');
  if (img) {
    const cloneImg = document.createElement('img');
    cloneImg.src = getThemedFaceUrl(layout.die.dieType, 'hidden');
    cloneImg.alt = '';
    cloneImg.draggable = false;
    cloneImg.style.cssText = 'width:80%;height:80%;object-fit:contain;display:block';
    inner.appendChild(cloneImg);
  } else {
    const glyph = source.querySelector('.dice-piece__glyph');
    const span = document.createElement('span');
    span.textContent = glyph?.textContent ?? '·';
    span.style.cssText =
      'font-family:var(--font-serif);font-size:1.25rem;font-weight:700;color:var(--color-gold-bright)';
    inner.appendChild(span);
  }

  clone.appendChild(inner);
  gsap.set(clone, { x, y, rotation: 0, scale: 1, transformOrigin: '50% 50%' });
  layout.clone = clone;
  return clone;
}

function waitFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let n = 0;
    const step = () => {
      n += 1;
      if (n >= count) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

export function playDiceRollAnimation(
  opts: PlayDiceRollAnimationOptions,
): { kill: () => void } {
  const { boardEl, dies, onComplete } = opts;
  const isMobile = opts.isMobile ?? isMobileRollViewport(boardEl.clientWidth);

  let killed = false;
  let timeline: gsap.core.Timeline | null = null;
  let overlay: HTMLDivElement | null = null;

  const finish = () => {
    if (killed) return;
    killed = true;
    timeline?.kill();
    timeline = null;
    overlay?.remove();
    overlay = null;
    onComplete?.();
  };

  const kill = () => {
    if (killed) return;
    killed = true;
    timeline?.kill();
    timeline = null;
    overlay?.remove();
    overlay = null;
  };

  if (dies.length === 0) {
    onComplete?.();
    return { kill };
  }

  if (prefersReducedMotion()) {
    onComplete?.();
    return { kill };
  }

  void (async () => {
    await waitFrames(2);
    if (killed) return;

    const boardRect = boardEl.getBoundingClientRect();
    const centerX = boardRect.width / 2;
    const centerY = boardRect.height / 2;

    overlay = document.createElement('div');
    overlay.className = 'dice-roll-overlay';
    overlay.style.cssText =
      'position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden';
    boardEl.appendChild(overlay);

    const layouts: DieLayout[] = dies.map((die) => {
      const srcRect = die.element.getBoundingClientRect();
      const { x: slotX, y: slotY } = centerOfRect(srcRect, boardRect);
      const fly = randomFlyOffset(slotX, slotY, isMobile);
      return {
        die,
        slotX,
        slotY,
        width: srcRect.width,
        height: srcRect.height,
        flyX: fly.x,
        flyY: fly.y,
        rotation: randomRotation(),
        clone: null as unknown as HTMLDivElement,
      };
    });

    for (const layout of layouts) {
      const clone = createClone(layout.die.element, layout, boardRect);
      overlay!.appendChild(clone);
    }

    timeline = gsap.timeline({
      onComplete: () => {
        for (const layout of layouts) {
          const img = layout.clone.querySelector('img');
          if (img) img.src = layout.die.faceUrl;
        }
        finish();
      },
    });

    const gatherDur = ROLL_GATHER_MS / 1000;
    const flyDur = ROLL_FLY_MS / 1000;
    const settleDur = ROLL_SETTLE_MS / 1000;

    for (const layout of layouts) {
      const { clone, slotX, slotY, flyX, flyY, rotation } = layout;
      timeline.to(
        clone,
        {
          x: centerX,
          y: centerY,
          scale: 1.12,
          duration: gatherDur,
          ease: 'power2.in',
        },
        0,
      );
      timeline.to(
        clone,
        {
          x: flyX,
          y: flyY,
          rotation,
          scale: 1.05,
          filter: 'blur(2px) drop-shadow(0 0 8px rgba(201,168,106,0.55))',
          duration: flyDur,
          ease: 'power2.out',
        },
        gatherDur,
      );
      timeline.to(
        clone,
        {
          x: slotX,
          y: slotY,
          rotation: 0,
          scale: 1,
          filter: 'blur(0px) drop-shadow(0 0 0px transparent)',
          duration: settleDur,
          ease: 'back.out(1.2)',
          onComplete: () => {
            const img = clone.querySelector('img');
            if (img) img.src = layout.die.faceUrl;
          },
        },
        gatherDur + flyDur,
      );
    }
  })();

  return { kill };
}
