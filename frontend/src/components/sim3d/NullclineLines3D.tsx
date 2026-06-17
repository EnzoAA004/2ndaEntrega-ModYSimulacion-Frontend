import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { SimParams } from '../simulation3d/useODESolver';
import {
  getLandscapeHeight,
  computeRefSpeed,
  toSceneX,
  toSceneZ,
  fromSceneX,
  fromSceneZ,
  SCENE_HALF,
} from './landscape';

const SAMPLES = 80;
const LIFT = 0.15;

interface Props {
  params: SimParams;
  vMax: number;
}

export function NullclineLines3D({ params, vMax }: Props) {
  const refSpeed = useMemo(() => computeRefSpeed(params), [params]);
  const hasEndemic = params.beta > params.gamma;
  const Istar = hasEndemic ? params.K * (1 - params.gamma / params.beta) : null;

  // V-nullcline: V = αI/(k+d) — sampled along I axis
  const vNullPoints = useMemo<THREE.Vector3[]>(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const I = (i / SAMPLES) * params.K;
      const V = (params.alpha / (params.k + params.d)) * I;
      if (V > vMax * 1.02) break;
      const x = toSceneX(I, params.K);
      const z = toSceneZ(V, vMax);
      const y = getLandscapeHeight(I, V, params, refSpeed) + LIFT;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [params, vMax, refSpeed]);

  // I-nullcline at I = 0: left edge of terrain, sampled along V axis
  const iNull0Points = useMemo<THREE.Vector3[]>(() => {
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j <= SAMPLES; j++) {
      const V = (j / SAMPLES) * vMax;
      const I = 0;
      const x = toSceneX(I, params.K);
      const z = toSceneZ(V, vMax);
      const y = getLandscapeHeight(I, V, params, refSpeed) + LIFT;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [params, vMax, refSpeed]);

  // I-nullcline at I = I* (vertical slice)
  const iNullStarPoints = useMemo<THREE.Vector3[] | null>(() => {
    if (!Istar || Istar > params.K * 1.01) return null;
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j <= SAMPLES; j++) {
      const V = (j / SAMPLES) * vMax;
      const I = Istar;
      const x = toSceneX(I, params.K);
      const z = toSceneZ(V, vMax);
      const y = getLandscapeHeight(I, V, params, refSpeed) + LIFT;
      pts.push(new THREE.Vector3(x, y, z));
    }
    return pts;
  }, [Istar, params, vMax, refSpeed]);

  const blueColor = new THREE.Color(0x44aaff);
  const greenColor = new THREE.Color(0x22ee88);

  return (
    <group>
      {/* V-nullcline (blue) */}
      {vNullPoints.length >= 2 && (
        <Line points={vNullPoints} color={blueColor} lineWidth={2.5} />
      )}

      {/* I-nullcline at I=0 (green, dim) */}
      {iNull0Points.length >= 2 && (
        <Line points={iNull0Points} color={greenColor} lineWidth={1.5} transparent opacity={0.5} />
      )}

      {/* I-nullcline at I=I* (green, bright) */}
      {iNullStarPoints && iNullStarPoints.length >= 2 && (
        <Line points={iNullStarPoints} color={greenColor} lineWidth={2.5} />
      )}
    </group>
  );
}
