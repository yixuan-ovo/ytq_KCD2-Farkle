/** UI 动效工具（DOM + transform，无 Canvas） */

/** 四段掷骰：收拢 / 飞散 / 回槽 */
export const ROLL_GATHER_MS = 150;
export const ROLL_FLY_MS = 450;
export const ROLL_SETTLE_MS = 250;
/** CSS 掷骰与 GSAP 分段动画共用总时长 */
export const ROLL_DURATION_MS = ROLL_GATHER_MS + ROLL_FLY_MS + ROLL_SETTLE_MS;
/** @deprecated 物理层已移除，保留别名避免外部引用断裂 */
export const PHYSICS_SETTLE_MS = ROLL_SETTLE_MS;
export const FLY_SCORE_DURATION_MS = 900;
export const COMBO_BANNER_MS = 800;

/** 金色微粒散开（CSS） */
export const SCORE_SPARK_OFFSETS = [
  { x: -28, y: -18 },
  { x: 22, y: -24 },
  { x: 32, y: 8 },
  { x: -18, y: 20 },
  { x: 8, y: -32 },
  { x: -36, y: 4 },
  { x: 14, y: 26 },
  { x: -8, y: -12 },
] as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export interface Point {
  x: number;
  y: number;
}

export function centerOf(el: HTMLElement | null): Point | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** 贝塞尔 ease-out cubic */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

const MOBILE_ROLL_MAX_WIDTH = 640;
const MOBILE_ROLL_CONTAINER_MAX = 480;
const DESKTOP_FLY_RANGE = 150;
const MOBILE_FLY_RANGE = 60;

export function isMobileRollViewport(containerWidth?: number): boolean {
  if (typeof window !== 'undefined') {
    if (window.matchMedia(`(max-width: ${MOBILE_ROLL_MAX_WIDTH}px)`).matches) return true;
  }
  if (containerWidth != null && containerWidth < MOBILE_ROLL_CONTAINER_MAX) return true;
  return false;
}

/** 飞散目标相对槽位中心的偏移（文档 randomFly） */
export function randomFlyOffset(
  slotX: number,
  slotY: number,
  isMobile: boolean,
): { x: number; y: number } {
  const range = isMobile ? MOBILE_FLY_RANGE : DESKTOP_FLY_RANGE;
  return {
    x: slotX + (Math.random() - 0.5) * range,
    y: slotY + (Math.random() - 0.5) * range,
  };
}

/** 每骰独立 2–4 圈 */
export function randomRotation(): number {
  return 720 + Math.random() * 720;
}
