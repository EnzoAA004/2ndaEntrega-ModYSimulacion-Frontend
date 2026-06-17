import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { SimParams, solveODE } from '../simulation3d/useODESolver';
import { getLandscapeHeight, computeRefSpeed, toSceneX, toSceneZ } from './landscape';

const N = 16;
const STEPS = 160;

interface Props {
  params: SimParams;
  I0: number;
  V0: number;
  vMax: number;
  tMax: number;
}

export function MultiIcTrajectories3D({ params, I0, V0, vMax, tMax }: Props) {
  const refSpeed = useMemo(() => computeRefSpeed(params), [params]);

  const lines = useMemo(() => {
    return Array.from({ length: N }, (_, idx) => {
      const f = idx / (N - 1);
      const iInit = Math.max(1, f < 0.5
        ? params.K * (0.02 + f * 0.25)
        : params.K * (0.3 + (f - 0.5) * 0.6));
      const vInit = ((idx % 4) / 3) * vMax * 0.5;

      const pts = solveODE(iInit, vInit, tMax, STEPS, params);
      const points = pts.map((pt) => {
        const x = toSceneX(pt.I, params.K);
        const z = toSceneZ(pt.V, vMax);
        const y = getLandscapeHeight(pt.I, pt.V, params, refSpeed) + 0.1;
        return new THREE.Vector3(x, y, z);
      });

      const hue = 0.55 + f * 0.3;
      const color = new THREE.Color().setHSL(hue, 0.7, 0.52);
      return { points, color };
    });
  }, [params, vMax, tMax, refSpeed]);

  return (
    <>
      {lines.map(({ points, color }, i) =>
        points.length >= 2 ? (
          <Line
            key={i}
            points={points}
            color={color}
            lineWidth={0.9}
            transparent
            opacity={0.32}
          />
        ) : null,
      )}
    </>
  );
}
