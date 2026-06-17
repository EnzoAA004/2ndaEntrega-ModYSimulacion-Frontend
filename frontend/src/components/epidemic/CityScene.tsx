import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useEpidemicStore } from '../../store/epidemicStore';
import { createAgents, stepAgents, WORLD_SIZE, MAX_POP } from '../../simulation/agentEngine';
import type { Agent } from '../../simulation/agentEngine';

// ── Static city ────────────────────────────────────────────────────

const BUILDING_DATA = [
  { x: -22, z: -22, w: 5, d: 4, h: 5.5 }, { x: -13, z: -22, w: 4, d: 5, h: 3.5 },
  { x: 7, z: -22, w: 3, d: 3, h: 6.0 },  { x: 16, z: -22, w: 5, d: 4, h: 4.0 },
  { x: 24, z: -22, w: 4, d: 4, h: 7.0 }, { x: -22, z: -13, w: 4, d: 5, h: 4.0 },
  { x: 14, z: -13, w: 5, d: 4, h: 5.0 }, { x: 24, z: -13, w: 3, d: 3, h: 3.5 },
  { x: -22, z: 8,  w: 4, d: 4, h: 3.0 }, { x: -14, z: 8,  w: 5, d: 3, h: 6.5 },
  { x: 16, z: 8,  w: 4, d: 5, h: 4.5 },  { x: 24, z: 8,  w: 3, d: 4, h: 5.0 },
  { x: -22, z: 17, w: 5, d: 4, h: 4.0 }, { x: -13, z: 17, w: 3, d: 5, h: 3.0 },
  { x: 8, z: 17,  w: 4, d: 3, h: 5.5 },  { x: 24, z: 17, w: 4, d: 4, h: 4.0 },
  { x: -22, z: 24, w: 4, d: 3, h: 6.0 }, { x: 8, z: 24,  w: 5, d: 4, h: 3.5 },
  { x: 17, z: 24, w: 4, d: 4, h: 5.0 },  { x: 25, z: 24, w: 3, d: 5, h: 7.5 },
];

const BUILDING_COLORS = [
  '#1e2a4a', '#162038', '#202840', '#1c263c',
  '#182038', '#1a2644', '#1d2f50', '#16203c',
];

const TREE_POSITIONS: Array<[number, number, number]> = [
  [-8, 0, -8], [-4, 0, -7], [4, 0, -7], [7, 0, -4],
  [7, 0, 4],  [4, 0, 7],  [-4, 0, 7],  [-7, 0, 4],
  [-7, 0, -3], [-18, 0, 0], [18, 0, -5], [-3, 0, -20],
  [12, 0, 20], [-20, 0, 15], [22, 0, 10],
];

function TreeMesh({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 1, 6]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <coneGeometry args={[0.75, 1.8, 6]} />
        <meshStandardMaterial color="#1a5c1a" emissive="#0d3a0d" emissiveIntensity={0.15} />
      </mesh>
      <mesh position={[0, 2.9, 0]}>
        <coneGeometry args={[0.52, 1.4, 6]} />
        <meshStandardMaterial color="#1e6b1e" emissive="#0d3a0d" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

function City() {
  const streetGeom = useMemo(() => {
    const pos: number[] = [];
    for (let c = -30; c <= 30; c += 10) {
      pos.push(c, 0.02, -30, c, 0.02, 30);
      pos.push(-30, 0.02, c, 30, 0.02, c);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <group>
      {/* Ground */}
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#0e1525" />
      </mesh>

      {/* Central park */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#1a4a28" />
      </mesh>

      {/* Street grid */}
      <lineSegments geometry={streetGeom}>
        <lineBasicMaterial color="#1e2d5a" transparent opacity={0.75} />
      </lineSegments>

      {/* Buildings */}
      {BUILDING_DATA.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, b.z]}>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial
            color={BUILDING_COLORS[i % BUILDING_COLORS.length]}
            emissive={BUILDING_COLORS[i % BUILDING_COLORS.length]}
            emissiveIntensity={0.12}
          />
        </mesh>
      ))}

      {/* Building window glow strips */}
      {BUILDING_DATA.map((b, i) => (
        <mesh key={`win-${i}`} position={[b.x, b.h * 0.6, b.z + b.d / 2 + 0.01]}>
          <planeGeometry args={[b.w * 0.7, b.h * 0.4]} />
          <meshBasicMaterial color="#334477" transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Trees */}
      {TREE_POSITIONS.map((pos, i) => (
        <TreeMesh key={i} position={pos} />
      ))}
    </group>
  );
}

// ── Agent system ───────────────────────────────────────────────────

const FLASH_POOL = 30;

type FlashEntry = { active: boolean; life: number; x1: number; y1: number; x2: number; y2: number };

function AgentSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const auraRef = useRef<THREE.InstancedMesh>(null!);
  const flashGeomRef = useRef<THREE.BufferGeometry>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const agentsRef = useRef<Agent[]>([]);
  const tickRef = useRef(0);
  const frameRef = useRef(0);
  const flashRef = useRef<FlashEntry[]>(
    Array.from({ length: FLASH_POOL }, () => ({
      active: false, life: 0, x1: 0, y1: 0, x2: 0, y2: 0,
    })),
  );

  const resetSignal = useEpidemicStore((s) => s.resetSignal);

  useEffect(() => {
    const { params } = useEpidemicStore.getState();
    agentsRef.current = createAgents(params.population, params.vacRate);
    tickRef.current = 0;
    frameRef.current = 0;
    flashRef.current.forEach((f) => { f.active = false; });
  }, [resetSignal]);

  useFrame((_, delta) => {
    const store = useEpidemicStore.getState();
    if (!store.isPlaying || agentsRef.current.length === 0) return;

    const dt = Math.min(delta, 0.05);
    const { counts, transmissions } = stepAgents(
      agentsRef.current, tickRef.current, store.params, dt,
    );
    tickRef.current++;
    frameRef.current++;

    // Spawn transmission flashes
    for (const [x1, y1, x2, y2] of transmissions.slice(0, 6)) {
      const slot = flashRef.current.find((f) => !f.active);
      if (slot) {
        slot.active = true; slot.life = 1.0;
        slot.x1 = x1 - 30; slot.y1 = y1 - 30;
        slot.x2 = x2 - 30; slot.y2 = y2 - 30;
      }
    }

    // Update InstancedMesh
    const col = new THREE.Color();
    for (let i = 0; i < MAX_POP; i++) {
      const a = agentsRef.current[i];

      if (!a) {
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(0);
        dummy.position.set(0, -200, 0);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
        auraRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const sx = a.x - 30;
      const sz = a.y - 30;

      // Agent sphere
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.position.set(sx, 0.45, sz);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      col.setRGB(a.r, a.g, a.b);
      meshRef.current.setColorAt(i, col);

      // Aura ring (infected only)
      if (a.state === 'I') {
        const pulse = 1 + 0.22 * Math.sin(Date.now() * 0.003 + i * 0.7);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.setScalar(pulse);
        dummy.position.set(sx, 0.03, sz);
        dummy.updateMatrix();
        auraRef.current.setMatrixAt(i, dummy.matrix);
      } else {
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(0);
        dummy.position.set(0, -200, 0);
        dummy.updateMatrix();
        auraRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    auraRef.current.instanceMatrix.needsUpdate = true;

    // Update flash lines
    const flashPos: number[] = [];
    for (const f of flashRef.current) {
      if (!f.active) continue;
      f.life -= delta * 3.5;
      if (f.life <= 0) { f.active = false; continue; }
      flashPos.push(f.x1, 0.65, f.y1, f.x2, 0.65, f.y2);
    }
    if (flashGeomRef.current) {
      const arr = flashPos.length ? flashPos : [0, 0, 0, 0, 0.001, 0];
      flashGeomRef.current.setAttribute(
        'position', new THREE.Float32BufferAttribute(arr, 3),
      );
      flashGeomRef.current.setDrawRange(0, flashPos.length / 3);
      const posAttr = flashGeomRef.current.getAttribute('position');
      if (posAttr) posAttr.needsUpdate = true;
    }

    // Auto-pause when epidemic ends (no more infected)
    if (counts.I === 0 && tickRef.current > 30) {
      store.pause();
    }

    // Sync React state every 10 frames
    if (frameRef.current % 10 === 0) {
      store.updateCounts(counts, tickRef.current);
      if (frameRef.current % 30 === 0) {
        store.pushHistory({
          tick: tickRef.current,
          day: Math.floor(tickRef.current / 30),
          ...counts,
        });
      }
    }
  });

  return (
    <>
      <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_POP]}>
        <sphereGeometry args={[0.44, 10, 8]} />
        <meshStandardMaterial roughness={0.2} metalness={0.1} />
      </instancedMesh>

      <instancedMesh ref={auraRef} args={[undefined, undefined, MAX_POP]}>
        <ringGeometry args={[1.5, 2.0, 24]} />
        <meshBasicMaterial
          color={0xff3344}
          transparent
          opacity={0.38}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </instancedMesh>

      <lineSegments>
        <bufferGeometry ref={flashGeomRef} />
        <lineBasicMaterial color={0xff88aa} transparent opacity={0.9} />
      </lineSegments>
    </>
  );
}

// ── Scene wrapper ──────────────────────────────────────────────────

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#0d1117']} />
      <ambientLight intensity={0.45} />
      <directionalLight position={[20, 40, 20]} intensity={0.9} />
      <pointLight position={[0, 15, 0]} intensity={0.5} color="#5577ff" distance={55} />
      <pointLight position={[0, 5, 0]} intensity={0.2} color="#ffffff" distance={25} />

      <Stars radius={80} depth={30} count={1200} factor={3} saturation={0.3} fade speed={0.25} />

      <OrbitControls
        makeDefault
        target={[0, 0, 0]}
        minDistance={18}
        maxDistance={90}
        maxPolarAngle={Math.PI / 2.1}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.22}
      />

      <City />
      <AgentSystem />

      <EffectComposer>
        <Bloom intensity={0.9} luminanceThreshold={0.55} luminanceSmoothing={0.9} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export function CityScene() {
  return (
    <Canvas
      camera={{ position: [0, 55, 40], fov: 45 }}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent />
    </Canvas>
  );
}
