import { useMemo } from 'react';
import { Line, Html } from '@react-three/drei';
import * as THREE from 'three';
import { SCENE_HALF } from './landscape';

const S = SCENE_HALF;

export function SceneAxes3D({ K, vMax }: { K: number; vMax: number }) {
  const xAxis: [THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(-S, 0, -S),
    new THREE.Vector3(S + 1.5, 0, -S),
  ];
  const zAxis: [THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(-S, 0, -S),
    new THREE.Vector3(-S, 0, S + 1.5),
  ];

  const xTicks = useMemo(
    () =>
      [0.25, 0.5, 0.75, 1.0].map((f) => ({
        x: -S + f * 2 * S,
        label: (f * K).toExponential(0),
      })),
    [K],
  );

  const zTicks = useMemo(
    () =>
      [0.25, 0.5, 0.75, 1.0].map((f) => ({
        z: -S + f * 2 * S,
        label: (f * vMax).toExponential(0),
      })),
    [vMax],
  );

  return (
    <group>
      {/* X axis — Infectados */}
      <Line points={xAxis} color="#ff5533" lineWidth={2.2} />
      <Html position={[S + 2.2, 0.1, -S]} center>
        <span className="text-[#ff5533] text-[11px] font-mono font-semibold whitespace-nowrap select-none pointer-events-none">
          I (Infectados) →
        </span>
      </Html>

      {/* Z axis — Carga viral */}
      <Line points={zAxis} color="#44aaff" lineWidth={2.2} />
      <Html position={[-S, 0.1, S + 2.2]} center>
        <span className="text-[#44aaff] text-[11px] font-mono font-semibold whitespace-nowrap select-none pointer-events-none">
          V (Carga viral) →
        </span>
      </Html>

      {/* Height axis label */}
      <Html position={[-S, 3.5, -S]} center>
        <span className="text-[#44ff88] text-[10px] font-mono whitespace-nowrap select-none pointer-events-none opacity-80">
          ‖∇F‖ (Energía)↑
        </span>
      </Html>

      {/* X ticks */}
      {xTicks.map(({ x, label }) => (
        <group key={label}>
          <Line
            points={[new THREE.Vector3(x, 0, -S), new THREE.Vector3(x, 0, -S - 0.35)]}
            color="#ff5533"
            lineWidth={1}
          />
          <Html position={[x, -0.1, -S - 0.9]} center>
            <span className="text-[#ff5533] text-[9px] font-mono select-none pointer-events-none">
              {label}
            </span>
          </Html>
        </group>
      ))}

      {/* Z ticks */}
      {zTicks.map(({ z, label }) => (
        <group key={label}>
          <Line
            points={[new THREE.Vector3(-S, 0, z), new THREE.Vector3(-S - 0.35, 0, z)]}
            color="#44aaff"
            lineWidth={1}
          />
          <Html position={[-S - 1.0, -0.1, z]} center>
            <span className="text-[#44aaff] text-[9px] font-mono select-none pointer-events-none">
              {label}
            </span>
          </Html>
        </group>
      ))}

      {/* Legend card floating at corner */}
      <Html position={[S, 0.5, S]} center>
        <div className="bg-black/60 border border-white/10 rounded-lg p-2 text-[9px] font-mono pointer-events-none select-none space-y-0.5" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#44aaff] inline-block rounded" />
            <span className="text-[#44aaff]">Nulclina V (dV/dt=0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#22ee88] inline-block rounded" />
            <span className="text-[#22ee88]">Nulclina I (dI/dt=0)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ffcc00] inline-block" style={{ boxShadow: '0 0 4px #ffcc00' }} />
            <span className="text-[#ffcc00]">Equilibrio endémico E*</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff3344] inline-block" style={{ boxShadow: '0 0 4px #ff3344' }} />
            <span className="text-[#ff5566]">Equilibrio libre E₀</span>
          </div>
        </div>
      </Html>
    </group>
  );
}
