import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface Props {
  R0: number;
}

export function R0Indicator3D({ R0 }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const orbitRef = useRef<THREE.Group>(null!);

  const color = useMemo(() => {
    if (R0 < 1) return new THREE.Color(0x22cc55);
    if (R0 < 2) return new THREE.Color(0xeab308);
    return new THREE.Color(0xef4444);
  }, [R0]);

  const radius = useMemo(() => Math.min(0.4 + R0 * 0.12, 1.2), [R0]);
  const position = new THREE.Vector3(7, 5, -7);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const pulse = 1 + 0.15 * Math.sin(t * 2.8);
    if (meshRef.current) meshRef.current.scale.setScalar(pulse);
    if (matRef.current) {
      matRef.current.emissiveIntensity = (R0 > 2 ? 3 : R0 > 1 ? 2 : 1.2) * pulse;
    }
    if (lightRef.current) {
      lightRef.current.intensity = R0 * 1.5 * pulse;
    }
    if (orbitRef.current && R0 > 2) {
      orbitRef.current.rotation.y = t * 1.2;
    }
  });

  return (
    <group position={position}>
      {/* Main R₀ sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          ref={matRef}
          color={color}
          emissive={color}
          emissiveIntensity={2}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>

      <pointLight ref={lightRef} color={color} distance={8} decay={2} />

      {/* Orbiting hazard spheres when R₀ > 2 */}
      {R0 > 2 && (
        <group ref={orbitRef}>
          {[0, 1, 2, 3].map((i) => {
            const angle = (i / 4) * Math.PI * 2;
            const orbitR = radius + 0.45;
            return (
              <mesh
                key={i}
                position={[Math.cos(angle) * orbitR, 0, Math.sin(angle) * orbitR]}
              >
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial
                  color={color}
                  emissive={color}
                  emissiveIntensity={3}
                />
              </mesh>
            );
          })}
        </group>
      )}

      {/* Floating label */}
      <Html position={[0, radius + 0.8, 0]} center>
        <div
          className="rounded-lg border px-3 py-1.5 text-center pointer-events-none select-none"
          style={{
            background: 'rgba(5,10,26,0.85)',
            backdropFilter: 'blur(6px)',
            borderColor: `${color.getStyle()}55`,
          }}
        >
          <div
            className="text-[9px] font-mono font-semibold uppercase tracking-widest"
            style={{ color: '#94a3b8' }}
          >
            R₀ Número reproductivo
          </div>
          <div
            className="text-2xl font-bold font-mono tabular-nums"
            style={{ color: color.getStyle(), textShadow: `0 0 12px ${color.getStyle()}` }}
          >
            {R0.toFixed(2)}
          </div>
          <div
            className="text-[9px] font-mono mt-0.5"
            style={{ color: R0 < 1 ? '#22cc55' : R0 < 2 ? '#eab308' : '#ef4444' }}
          >
            {R0 < 1 ? '✓ Controlado' : R0 < 2 ? '⚠ Brote activo' : '🔴 Epidemia crítica'}
          </div>
        </div>
      </Html>
    </group>
  );
}
