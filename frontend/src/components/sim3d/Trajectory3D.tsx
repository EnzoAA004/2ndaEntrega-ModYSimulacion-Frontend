import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { ODEPoint, SimParams } from '../simulation3d/useODESolver';
import {
  getLandscapeHeight,
  computeRefSpeed,
  toSceneX,
  toSceneZ,
} from './landscape';

const GRADIENT = [
  new THREE.Color(0x0033ee),
  new THREE.Color(0x0099ff),
  new THREE.Color(0x00ffaa),
  new THREE.Color(0xffdd00),
  new THREE.Color(0xff3300),
];

function gradColor(u: number): THREE.Color {
  u = Math.max(0, Math.min(1, u));
  const n = GRADIENT.length - 1;
  const i = Math.floor(u * n);
  const f = u * n - i;
  return GRADIENT[Math.min(i, n - 1)].clone().lerp(GRADIENT[Math.min(i + 1, n)], f);
}

interface Props {
  trajectory: ODEPoint[];
  params: SimParams;
  vMax: number;
  tMax: number;
  currentTime: number;
}

export function Trajectory3D({ trajectory, params, vMax, tMax, currentTime }: Props) {
  const probeRef = useRef<THREE.Mesh>(null!);
  const probeMat = useRef<THREE.MeshStandardMaterial>(null!);
  const probeLightRef = useRef<THREE.PointLight>(null!);

  const refSpeed = useMemo(() => computeRefSpeed(params), [params]);

  // Full landscape points for entire trajectory
  const allPoints = useMemo<THREE.Vector3[]>(
    () =>
      trajectory.map((pt) => {
        const x = toSceneX(pt.I, params.K);
        const z = toSceneZ(pt.V, vMax);
        const y = getLandscapeHeight(pt.I, pt.V, params, refSpeed) + 0.22;
        return new THREE.Vector3(x, y, z);
      }),
    [trajectory, params, vMax, refSpeed],
  );

  const allColors = useMemo<THREE.Color[]>(
    () => trajectory.map((_, i) => gradColor(i / Math.max(1, trajectory.length - 1))),
    [trajectory],
  );

  // Shadow points (projected on floor)
  const shadowPoints = useMemo<THREE.Vector3[]>(
    () =>
      trajectory.map((pt) =>
        new THREE.Vector3(toSceneX(pt.I, params.K), 0.03, toSceneZ(pt.V, vMax)),
      ),
    [trajectory, params, vMax],
  );

  // Revealed slice based on currentTime
  const revealIdx = useMemo(() => {
    if (tMax <= 0) return trajectory.length;
    const ratio = currentTime / tMax;
    return Math.max(2, Math.floor(ratio * trajectory.length));
  }, [currentTime, tMax, trajectory.length]);

  const visPoints = useMemo(() => allPoints.slice(0, revealIdx), [allPoints, revealIdx]);
  const visColors = useMemo(() => allColors.slice(0, revealIdx), [allColors, revealIdx]);
  const visShadow = useMemo(() => shadowPoints.slice(0, revealIdx), [shadowPoints, revealIdx]);

  // Animate probe (sphere at tip)
  useFrame(({ clock }) => {
    const tip = allPoints[Math.min(revealIdx - 1, allPoints.length - 1)];
    if (probeRef.current && tip) {
      probeRef.current.position.copy(tip);
    }
    if (probeLightRef.current && tip) {
      probeLightRef.current.position.copy(tip);
    }
    if (probeMat.current) {
      probeMat.current.emissiveIntensity = 4 + 3 * Math.abs(Math.sin(clock.elapsedTime * 4));
    }
  });

  const tipColor = allColors[Math.min(revealIdx - 1, allColors.length - 1)] ?? new THREE.Color(0xffffff);

  return (
    <group>
      {/* Shadow on floor */}
      {visShadow.length >= 2 && (
        <Line points={visShadow} color={0xffffff} lineWidth={1} transparent opacity={0.18} />
      )}

      {/* Main trajectory */}
      {visPoints.length >= 2 && (
        <Line points={visPoints} vertexColors={visColors} lineWidth={5} />
      )}

      {/* Probe sphere */}
      <mesh ref={probeRef}>
        <sphereGeometry args={[0.28, 20, 20]} />
        <meshStandardMaterial
          ref={probeMat}
          color={tipColor}
          emissive={tipColor}
          emissiveIntensity={5}
          roughness={0.1}
          metalness={0.5}
        />
      </mesh>
      <pointLight ref={probeLightRef} color={tipColor} intensity={8} distance={5} decay={2} />
    </group>
  );
}
