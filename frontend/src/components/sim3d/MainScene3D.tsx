import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useSim3DStore } from '../../store/sim3dStore';
import { getEquilibria } from '../simulation3d/useODESolver';
import { getLandscapeHeight, computeRefSpeed, toSceneX, toSceneZ } from './landscape';
import { Landscape3D } from './Landscape3D';
import { Particles3D } from './Particles3D';
import { Trajectory3D } from './Trajectory3D';
import { NullclineLines3D } from './NullclineLines3D';
import { EquilibriumViz } from './EquilibriumViz';
import { SceneAxes3D } from './SceneAxes3D';
import { R0Indicator3D } from './R0Indicator3D';
import { MultiIcTrajectories3D } from './MultiIcTrajectories3D';

import type { SimParams } from '../simulation3d/useODESolver';

function EndemicLight({ params, vMax }: { params: SimParams; vMax: number }) {
  const lightRef = useRef<THREE.PointLight>(null!);
  const eq = getEquilibria(params);
  const refSpeed = computeRefSpeed(params);

  useFrame(({ clock }) => {
    if (!lightRef.current || !eq.endemic) return;
    lightRef.current.intensity = 3 + 2 * Math.sin(clock.elapsedTime * 2.5);
  });

  if (!eq.endemic) return null;

  const x = toSceneX(eq.endemic.I, params.K);
  const z = toSceneZ(eq.endemic.V, vMax);
  const y = getLandscapeHeight(eq.endemic.I, eq.endemic.V, params, refSpeed);

  return <pointLight ref={lightRef} position={[x, y + 1, z]} color={0xffcc00} distance={7} decay={2} />;
}

function SceneContent() {
  const {
    params,
    trajectory,
    vMax,
    tMax,
    currentTime,
    speed,
    I0,
    V0,
    showParticles,
    showLandscape,
    showNullclines,
    showMultiIC,
    showEquilibria,
  } = useSim3DStore();

  const R0 = params.beta / params.gamma;

  return (
    <>
      <ambientLight intensity={0.18} />
      <directionalLight
        position={[12, 18, 10]}
        intensity={0.55}
        castShadow
      />

      <EndemicLight params={params} vMax={vMax} />

      <Stars radius={65} depth={28} count={2500} factor={4.5} saturation={0.35} fade speed={0.35} />

      <OrbitControls
        makeDefault
        target={[0, 1.5, 0]}
        minDistance={7}
        maxDistance={45}
        autoRotate
        autoRotateSpeed={0.42}
        enablePan
        enableZoom
      />

      {showLandscape && <Landscape3D params={params} vMax={vMax} />}

      {showParticles && <Particles3D params={params} vMax={vMax} speed={speed} />}

      <Trajectory3D
        trajectory={trajectory}
        params={params}
        vMax={vMax}
        tMax={tMax}
        currentTime={currentTime}
      />

      {showMultiIC && (
        <MultiIcTrajectories3D params={params} I0={I0} V0={V0} vMax={vMax} tMax={tMax} />
      )}

      {showNullclines && <NullclineLines3D params={params} vMax={vMax} />}

      {showEquilibria && <EquilibriumViz params={params} vMax={vMax} />}

      <SceneAxes3D K={params.K} vMax={vMax} />

      <R0Indicator3D R0={R0} />

      <EffectComposer>
        <Bloom
          intensity={1.9}
          luminanceThreshold={0.07}
          luminanceSmoothing={0.82}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export function MainScene3D() {
  return (
    <Canvas
      camera={{ position: [16, 12, 16], fov: 50 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      shadows
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(0x050a1a));
        gl.shadowMap.enabled = true;
      }}
      className="w-full h-full"
    >
      <SceneContent />
    </Canvas>
  );
}
