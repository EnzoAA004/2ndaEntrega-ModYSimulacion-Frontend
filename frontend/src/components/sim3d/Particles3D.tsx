import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
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

const COUNT = 400;

interface Props {
  params: SimParams;
  vMax: number;
  speed: number;
}

export function Particles3D({ params, vMax, speed }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  // Particle state stored in refs to avoid re-renders
  const particleI = useRef<Float32Array>(null!);
  const particleV = useRef<Float32Array>(null!);

  // Initialize particle positions
  useEffect(() => {
    particleI.current = new Float32Array(COUNT);
    particleV.current = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      particleI.current[i] = Math.random() * params.K * 0.85;
      particleV.current[i] = Math.random() * vMax * 0.85;
    }
  }, []);  // Only init once

  const refSpeed = useMemo(() => computeRefSpeed(params), [params]);

  useFrame(({ clock }, delta) => {
    if (!meshRef.current || !particleI.current) return;

    const dt = Math.min(delta * 4 * speed, 0.5);

    for (let i = 0; i < COUNT; i++) {
      let I = particleI.current[i];
      let V = particleV.current[i];

      // Euler step
      const dI = params.beta * I * (1 - I / params.K) - params.gamma * I;
      const dV = params.alpha * I - (params.k + params.d) * V;
      I = Math.max(0, I + dt * dI);
      V = Math.max(0, V + dt * dV);

      // Clamp / teleport out-of-bounds
      if (I > params.K * 1.05 || V > vMax * 1.05 || I < 0 || V < 0) {
        I = Math.random() * params.K * 0.8 + params.K * 0.01;
        V = Math.random() * vMax * 0.8 + vMax * 0.01;
      }

      particleI.current[i] = I;
      particleV.current[i] = V;

      const sceneX = toSceneX(I, params.K);
      const sceneZ = toSceneZ(V, vMax);
      const h = getLandscapeHeight(I, V, params, refSpeed) + 0.12;

      // Pulsing size
      const pulseFactor = 0.06 + 0.015 * Math.sin(clock.elapsedTime * 3 + i * 0.4);
      dummy.position.set(sceneX, h, sceneZ);
      dummy.scale.setScalar(pulseFactor / 0.06);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      // Color by speed (blue=slow near eq, orange-red=fast far from eq)
      const mag = Math.sqrt(dI * dI + dV * dV);
      const relMag = Math.min(1, mag / (refSpeed * 0.8 + 1));
      // Blue (0.6) → cyan (0.5) → yellow (0.15) → red (0.0)
      const hue = 0.6 - relMag * 0.6;
      const lightness = 0.5 + relMag * 0.25;
      colorObj.setHSL(hue, 0.9, lightness);
      meshRef.current.setColorAt(i, colorObj);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.06, 8, 8]} />
      <meshStandardMaterial
        emissive={new THREE.Color(0xffffff)}
        emissiveIntensity={0.8}
        roughness={0.2}
        metalness={0.3}
      />
    </instancedMesh>
  );
}
