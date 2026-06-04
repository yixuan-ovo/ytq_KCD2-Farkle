import type { DieFace } from '$lib/game/types';

/** 2D 俯视角：各面值对应的精灵旋转（弧度） */
const FACE_ROTATION: Record<DieFace, number> = {
  0: 0,
  1: 0,
  2: Math.PI / 3,
  3: (2 * Math.PI) / 3,
  4: Math.PI,
  5: (4 * Math.PI) / 3,
  6: (5 * Math.PI) / 3,
};

export function rotationForFace(face: DieFace): number {
  return FACE_ROTATION[face] ?? 0;
}

export function rotationForFaceDegrees(face: DieFace): number {
  return (rotationForFace(face) * 180) / Math.PI;
}
