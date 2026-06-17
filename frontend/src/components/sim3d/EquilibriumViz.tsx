import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import { SimParams, getEquilibria } from '../simulation3d/useODESolver';
import {
  getLandscapeHeight,
  computeRefSpeed,
  toSceneX,
  toSceneZ,
} from './landscape';

interface Props {
  params: SimParams;
  vMax: number;
}

function PulsingRing({ position, color, radius }: {
  position: THREE.Vector3;
  color: THREE.Color;
  radius: number;
}) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    if (ref.current) {
      const s = 1 + 0.18 * Math.sin(clock.elapsedTime * 2.2);
      ref.current.scale.setScalar(s);
    }
  });
  const geom = useMemo(() => new THREE.RingGeometry(radius, radius + 0.12, 48), [radius]);
  return (
    <mesh ref={ref} position={position} rotation={[-Math.PI / 2, 0, 0]} geometry={geom}>
      <meshBasicMaterial color={color} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

export function EquilibriumViz({ params, vMax }: Props) {
  const eq = getEquilibria(params);
  const refSpeed = useMemo(() => computeRefSpeed(params), [params]);

  const dfRef = useRef<THREE.Mesh>(null!);
  const dfLightRef = useRef<THREE.PointLight>(null!);
  const enRef = useRef<THREE.Mesh>(null!);
  const enLightRef = useRef<THREE.PointLight>(null!);
  const coneRef = useRef<THREE.Mesh>(null!);

  // Disease-free position
  const dfX = toSceneX(0, params.K);
  const dfZ = toSceneZ(0, vMax);
  const dfY = getLandscapeHeight(0, 0, params, refSpeed) + 0.15;
  const dfPos = new THREE.Vector3(dfX, dfY, dfZ);

  // Endemic position
  const enPos = useMemo(() => {
    if (!eq.endemic) return null;
    const x = toSceneX(eq.endemic.I, params.K);
    const z = toSceneZ(eq.endemic.V, vMax);
    const y = getLandscapeHeight(eq.endemic.I, eq.endemic.V, params, refSpeed) + 0.2;
    return new THREE.Vector3(x, y, z);
  }, [eq.endemic, params, vMax, refSpeed]);

  const dfStable = !eq.endemic;

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 1 + 0.22 * Math.sin(t * 2.5);

    if (dfRef.current) {
      dfRef.current.scale.setScalar(dfStable ? pulse * 1.3 : 0.75);
    }
    if (dfLightRef.current) {
      dfLightRef.current.intensity = dfStable ? 4 * pulse : 1.2;
    }
    if (enRef.current) {
      enRef.current.scale.setScalar(pulse * 1.1);
    }
    if (enLightRef.current) {
      enLightRef.current.intensity = 5 * pulse;
    }
    if (coneRef.current) {
      coneRef.current.rotation.y = t * 0.6;
      const coneScale = 1 + 0.1 * Math.sin(t * 3);
      coneRef.current.scale.set(coneScale, 1, coneScale);
    }
  });

  const dfColor = dfStable ? new THREE.Color(0x22cc55) : new THREE.Color(0xff3344);
  const enColor = new THREE.Color(0xffcc00);

  return (
    <group>
      {/* Disease-free equilibrium */}
      <mesh ref={dfRef} position={dfPos}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial
          color={dfColor}
          emissive={dfColor}
          emissiveIntensity={dfStable ? 5 : 2}
          roughness={0.1}
        />
      </mesh>
      <pointLight ref={dfLightRef} position={dfPos} color={dfColor} distance={4} decay={2} />
      <Html position={dfPos.clone().add(new THREE.Vector3(0, 0.6, 0))} center>
        <div className="bg-black/70 rounded px-2 py-0.5 border border-red-500/40 text-[10px] font-mono text-red-300 whitespace-nowrap select-none">
          E₀ = (0, 0) {dfStable ? '✓ Estable' : '⚠ Inestable'}
        </div>
      </Html>

      {/* Endemic equilibrium */}
      {enPos && eq.endemic && (
        <>
          <mesh ref={enRef} position={enPos}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial
              color={enColor}
              emissive={enColor}
              emissiveIntensity={6}
              roughness={0.05}
              metalness={0.3}
            />
          </mesh>
          <pointLight ref={enLightRef} position={enPos} color={enColor} distance={6} decay={2} />

          {/* Attractor cone */}
          <mesh
            ref={coneRef}
            position={enPos.clone().add(new THREE.Vector3(0, 1.8, 0))}
            rotation={[Math.PI, 0, 0]}
          >
            <coneGeometry args={[0.9, 1.8, 16, 1, true]} />
            <meshBasicMaterial
              color={enColor}
              transparent
              opacity={0.15}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Stability ring */}
          <PulsingRing position={enPos} color={enColor} radius={0.7} />

          <Html position={enPos.clone().add(new THREE.Vector3(0, 0.75, 0))} center>
            <div className="bg-black/70 rounded px-2 py-0.5 border border-yellow-500/40 text-[10px] font-mono text-yellow-300 whitespace-nowrap select-none">
              E* = ({eq.endemic.I.toFixed(0)}, {eq.endemic.V.toFixed(0)}) ✓ Estable
            </div>
          </Html>
        </>
      )}
    </group>
  );
}
