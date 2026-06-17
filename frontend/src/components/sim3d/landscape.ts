import { SimParams } from '../simulation3d/useODESolver';

export const HEIGHT_SCALE = 2.8;
export const SCENE_HALF = 6; // scene spans -6..6 on x and z

export function computeRefSpeed(p: SimParams): number {
  return Math.max(p.beta * p.K / 4, p.alpha * p.K / 10, 1);
}

export function getLandscapeHeight(
  I: number,
  V: number,
  p: SimParams,
  refSpeed: number,
): number {
  const dI = p.beta * I * (1 - I / p.K) - p.gamma * I;
  const dV = p.alpha * I - (p.k + p.d) * V;
  const mag = Math.sqrt(dI * dI + dV * dV);
  return Math.log(1 + mag / Math.max(refSpeed, 1)) * HEIGHT_SCALE;
}

export function getLandscapeHeightScene(
  sceneX: number,
  sceneZ: number,
  p: SimParams,
  K: number,
  vMax: number,
  refSpeed: number,
): number {
  const I = ((sceneX + SCENE_HALF) / (2 * SCENE_HALF)) * K;
  const V = ((sceneZ + SCENE_HALF) / (2 * SCENE_HALF)) * vMax;
  return getLandscapeHeight(I, V, p, refSpeed);
}

export function toSceneX(I: number, K: number): number {
  return (I / K) * 2 * SCENE_HALF - SCENE_HALF;
}

export function toSceneZ(V: number, vMax: number): number {
  return (V / vMax) * 2 * SCENE_HALF - SCENE_HALF;
}

export function fromSceneX(x: number, K: number): number {
  return ((x + SCENE_HALF) / (2 * SCENE_HALF)) * K;
}

export function fromSceneZ(z: number, vMax: number): number {
  return ((z + SCENE_HALF) / (2 * SCENE_HALF)) * vMax;
}
