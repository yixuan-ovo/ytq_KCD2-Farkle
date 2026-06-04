import { DIE_REGISTRY } from '$lib/game/diceRegistry';
import type { DieFace } from '$lib/game/types';
import { getDiceTheme } from '$lib/assets/diceThemes';

export type DiceSkinId = 'ivory';

const DEFAULT_SKIN: DiceSkinId = 'ivory';

export interface DieSkinStyle {
  skinId: DiceSkinId;
  borderColor: string;
  glowColor: string;
}

function assetBase(): string {
  const base = import.meta.env.BASE_URL ?? '/';
  return base.endsWith('/') ? base : `${base}/`;
}

function resolveDieType(dieType: string): string {
  if (dieType in DIE_REGISTRY) return dieType;
  return 'NormalDie';
}

/** Map DieFace to public asset filename (without path). */
export function faceToAssetName(face: DieFace): string {
  if (face === 0) return 'face-devil';
  return `face-${face}`;
}

/** 通用 ivory 面（大厅装饰、图鉴六面预览） */
export function getFaceTextureUrl(
  face: DieFace,
  skinId: DiceSkinId = DEFAULT_SKIN,
): string {
  return `${assetBase()}dice/${skinId}/${faceToAssetName(face)}.svg`;
}

export function getDieSkin(dieType: string): DieSkinStyle {
  const theme = getDiceTheme(dieType);
  const def = DIE_REGISTRY[dieType];
  const color = def?.color ?? theme.border;
  return {
    skinId: DEFAULT_SKIN,
    borderColor: color,
    glowColor: color,
  };
}

export type ThemedFace = DieFace | 'hidden';

export function getThemedFaceUrl(dieType: string, face: ThemedFace): string {
  const id = resolveDieType(dieType);
  const base = assetBase();
  if (face === 'hidden') return `${base}dice/${id}/face-hidden.svg`;
  if (face === 0) return `${base}dice/${id}/face-devil.svg`;
  return `${base}dice/${id}/face-${face}.svg`;
}

export function getDieFaceUrl(die: { value: DieFace; type: string }): string {
  return getThemedFaceUrl(die.type, die.value);
}

/** 首掷前占位：各骰主题的 hidden 面（中心 icon） */
export function getPlaceholderFaceUrl(dieType: string): string {
  return getThemedFaceUrl(dieType, 'hidden');
}
