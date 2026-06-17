import { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useEpidemicStore } from '../../store/epidemicStore';
import { createAgents, stepAgents, WORLD_SIZE, MAX_POP, STATE_COLOR, TICKS_PER_DAY } from '../../simulation/agentEngine';
import type { Agent } from '../../simulation/agentEngine';

// ── Heatmap ─────────────────────────────────────────────────────────

let _hmCanvas: HTMLCanvasElement | null = null;
let _hmCtx: CanvasRenderingContext2D | null = null;

function getHMCtx() {
  if (!_hmCanvas) {
    _hmCanvas = document.createElement('canvas');
    _hmCanvas.width = 128;
    _hmCanvas.height = 128;
    _hmCtx = _hmCanvas.getContext('2d');
  }
  return { canvas: _hmCanvas!, ctx: _hmCtx! };
}

function updateHeatmap(agents: Agent[], texture: THREE.CanvasTexture) {
  const { ctx } = getHMCtx();
  const W = 128;
  const density = new Float32Array(W * W);

  for (const a of agents) {
    if (a.state !== 'I') continue;
    const px = Math.floor((a.x / WORLD_SIZE) * W);
    const py = Math.floor((a.y / WORLD_SIZE) * W);
    const R = 10;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || nx >= W || ny < 0 || ny >= W) continue;
        const d = Math.sqrt(dx * dx + dy * dy);
        density[ny * W + nx] += Math.exp((-d * d) / 20);
      }
    }
  }

  let maxD = 0.001;
  for (let i = 0; i < density.length; i++) if (density[i] > maxD) maxD = density[i];

  const imgData = ctx.createImageData(W, W);
  const data = imgData.data;
  for (let i = 0; i < W * W; i++) {
    const t = Math.min(1, density[i] / maxD);
    const idx = i * 4;
    if (t < 0.001) { data[idx + 3] = 0; continue; }
    if (t < 0.33) {
      const s = t / 0.33;
      data[idx] = 0; data[idx + 1] = Math.floor(100 + s * 100); data[idx + 2] = Math.floor(200 - s * 50);
    } else if (t < 0.66) {
      const s = (t - 0.33) / 0.33;
      data[idx] = Math.floor(s * 255); data[idx + 1] = 200; data[idx + 2] = 0;
    } else {
      const s = (t - 0.66) / 0.34;
      data[idx] = 255; data[idx + 1] = Math.floor(200 * (1 - s)); data[idx + 2] = 0;
    }
    data[idx + 3] = Math.floor(t * 180);
  }
  ctx.putImageData(imgData, 0, 0);
  texture.needsUpdate = true;
}

// ── City ─────────────────────────────────────────────────────────────

interface BuildingDef { x: number; z: number; w: number; d: number; h: number; color: string; emissive?: string }

// ── BARRIO NORTE (z: -28 to -12) ─────────────────────────────────────
// ── CENTRO       (z: -10 to +10) ─────────────────────────────────────
// ── BARRIO SUR   (z: +12 to +27) ─────────────────────────────────────
const BUILDINGS: BuildingDef[] = [
  // Barrio Norte
  { x: -22, z: -24, w: 5, d: 4, h: 4.0, color: '#1e2d4a' },
  { x: -13, z: -24, w: 4, d: 5, h: 3.0, color: '#162035' },
  { x:  -3, z: -24, w: 3, d: 3, h: 5.5, color: '#1a2840' },
  { x:   7, z: -24, w: 5, d: 4, h: 3.5, color: '#1e2d4a' },
  { x:  17, z: -24, w: 4, d: 4, h: 6.5, color: '#162035' },
  { x:  25, z: -24, w: 3, d: 4, h: 3.5, color: '#1a2840' },
  { x: -22, z: -16, w: 4, d: 5, h: 3.5, color: '#1a2840' },
  { x:  -5, z: -16, w: 3, d: 3, h: 5.0, color: '#162035' },
  { x:   8, z: -16, w: 5, d: 4, h: 4.5, color: '#1e2d4a' },
  { x:  24, z: -16, w: 3, d: 3, h: 3.0, color: '#162035' },
  // Escuela (Norte landmark)
  { x: -10, z: -20, w: 6, d: 5, h: 3.5, color: '#1e2a20', emissive: '#1e2a20' },
  // Torre Norte
  { x:  0,  z: -22, w: 4, d: 4, h: 8.5, color: '#12182e' },

  // Centro
  { x: -20, z:  -5, w: 4, d: 4, h: 3.0, color: '#1a2840' },
  { x: -20, z:   5, w: 5, d: 3, h: 5.5, color: '#1e2d4a' },
  { x:  16, z:  -5, w: 4, d: 5, h: 4.0, color: '#162035' },
  { x:  16, z:   5, w: 3, d: 4, h: 4.5, color: '#1a2840' },
  // Hospital (Centro landmark)
  { x: 18,  z: -5, w: 7, d: 6, h: 5.0, color: '#1e3340', emissive: '#1e3340' },
  // Commercial tower Centro
  { x: -12, z:  0, w: 4, d: 4, h: 10.0, color: '#101828' },
  { x:  12, z:  0, w: 3, d: 3, h:  7.0, color: '#12182e' },

  // Barrio Sur
  { x: -22, z:  17, w: 5, d: 4, h: 3.5, color: '#1e2d4a' },
  { x: -12, z:  17, w: 3, d: 5, h: 2.8, color: '#162035' },
  { x:  -2, z:  17, w: 4, d: 3, h: 5.0, color: '#1a2840' },
  { x:   9, z:  17, w: 4, d: 4, h: 3.5, color: '#1e2d4a' },
  { x:  19, z:  17, w: 3, d: 4, h: 4.5, color: '#162035' },
  { x: -22, z:  25, w: 4, d: 3, h: 5.5, color: '#162035' },
  { x:  -8, z:  25, w: 5, d: 4, h: 3.0, color: '#1a2840' },
  { x:   5, z:  25, w: 4, d: 4, h: 4.5, color: '#1e2d4a' },
  { x:  18, z:  25, w: 3, d: 5, h: 7.0, color: '#162035' },
  // Plaza Sur landmark
  { x: 25,  z: 22,  w: 3, d: 3, h: 4.0, color: '#1a2840' },
];

const TREE_POS: Array<[number, number, number]> = [
  [-6, 0, -6], [-4, 0, -7], [4, 0, -7], [6, 0, -4],
  [6, 0, 4],   [4, 0, 7],   [-4, 0, 7], [-6, 0, 4],
  [-7, 0, 0],  [7, 0, 0],   [0, 0, -7], [0, 0, 7],
  [-18, 0, 0], [18, 0, -5], [-3, 0, -20], [3, 0, -20],
  [12, 0, 20], [-20, 0, 15], [22, 0, 10], [-24, 0, -5],
  [24, 0, 5], [-10, 0, 24], [10, 0, -24], [-5, 0, 10],
  [5, 0, -10], [15, 0, 0], [-15, 0, 0], [0, 0, 15],
  [-24, 0, 20], [24, 0, -20],
];

function TreeMesh({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.12, 0.18, 1, 6]} />
        <meshStandardMaterial color="#4a3728" />
      </mesh>
      <mesh position={[0, 1.9, 0]}>
        <coneGeometry args={[0.8, 2.5, 7]} />
        <meshStandardMaterial color="#1a5c1a" emissive="#0d3a0d" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 3.1, 0]}>
        <coneGeometry args={[0.55, 1.6, 7]} />
        <meshStandardMaterial color="#1e6b1e" emissive="#0d4a0d" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function HospitalCross({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 5.4, z]}>
      <mesh>
        <boxGeometry args={[1.8, 0.18, 0.4]} />
        <meshStandardMaterial color="#ff2244" emissive="#ff0022" emissiveIntensity={1.2} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.4, 0.18, 1.8]} />
        <meshStandardMaterial color="#ff2244" emissive="#ff0022" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function City() {
  const streetGeom = useMemo(() => {
    const pos: number[] = [];
    // Streets within each district
    for (let c = -30; c <= 30; c += 8) {
      pos.push(c, 0.02, -30, c, 0.02, 30);
      pos.push(-30, 0.02, c, 30, 0.02, c);
    }
    // Main avenues connecting districts (brighter)
    pos.push(0, 0.03, -30,  0, 0.03, 30);  // vertical avenue
    pos.push(-30, 0.03, -11, 30, 0.03, -11); // Norte/Centro boundary
    pos.push(-30, 0.03,  11, 30, 0.03,  11); // Centro/Sur boundary
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return g;
  }, []);

  return (
    <group>
      {/* Base ground */}
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshStandardMaterial color="#0d1523" />
      </mesh>

      {/* Barrio Norte subtle tint */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, -20]}>
        <planeGeometry args={[60, 18]} />
        <meshStandardMaterial color="#0e1428" transparent opacity={0.6} />
      </mesh>

      {/* Barrio Sur subtle tint */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 20]}>
        <planeGeometry args={[60, 16]} />
        <meshStandardMaterial color="#10130e" transparent opacity={0.6} />
      </mesh>

      {/* Central park */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
        <planeGeometry args={[14, 14]} />
        <meshStandardMaterial color="#1a3520" />
      </mesh>

      {/* Park inner grass */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#1e4025" emissive="#0a2010" emissiveIntensity={0.3} />
      </mesh>

      {/* Norte park */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, -20]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#162a1a" />
      </mesh>

      {/* Sur plaza */}
      <mesh rotation-x={-Math.PI / 2} position={[-5, 0.01, 21]}>
        <planeGeometry args={[10, 6]} />
        <meshStandardMaterial color="#1a1a10" />
      </mesh>

      {/* Connecting highway center line */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.025, 0]}>
        <planeGeometry args={[1.2, 60]} />
        <meshStandardMaterial color="#1e2d5a" emissive="#2233aa" emissiveIntensity={0.15} />
      </mesh>

      {/* Street grid */}
      <lineSegments geometry={streetGeom}>
        <lineBasicMaterial color="#1e2d5a" transparent opacity={0.5} />
      </lineSegments>

      {/* Buildings */}
      {BUILDINGS.map((b, i) => (
        <group key={i}>
          <mesh position={[b.x, b.h / 2, b.z]}>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              color={b.color}
              emissive={b.emissive ?? b.color}
              emissiveIntensity={0.2}
            />
          </mesh>
          {/* Window glow */}
          <mesh position={[b.x, b.h * 0.55, b.z + b.d / 2 + 0.02]}>
            <planeGeometry args={[b.w * 0.75, b.h * 0.45]} />
            <meshBasicMaterial color="#2a4a8a" transparent opacity={0.45} />
          </mesh>
        </group>
      ))}

      {/* Hospital cross sign */}
      <HospitalCross x={18} z={-5} />
      {/* Hospital glow */}
      <pointLight position={[18, 4, -5]} intensity={2.5} distance={18} color="#ff3355" />

      {/* School – yellow accent roof */}
      <mesh position={[-18, 3.5 + 0.1, 5]}>
        <boxGeometry args={[6, 0.15, 5]} />
        <meshStandardMaterial color="#eecc22" emissive="#aaaa00" emissiveIntensity={0.8} />
      </mesh>

      {/* Trees */}
      {TREE_POS.map((pos, i) => (
        <TreeMesh key={i} position={pos} />
      ))}
    </group>
  );
}

// ── Wave pool ────────────────────────────────────────────────────────

const WAVE_POOL = 24;
const FLASH_POOL = 20;

type WaveEntry = { active: boolean; life: number; x: number; z: number };
type FlashEntry = { active: boolean; life: number; x1: number; y1: number; x2: number; y2: number };

// ── Camera controller ─────────────────────────────────────────────

function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const targetRef = useRef(new THREE.Vector3(0, 0, 0));
  const agentsSignal = useRef<Agent[]>([]);

  // Expose to AgentSystem
  (CameraController as unknown as { agentsRef: typeof agentsSignal }).agentsRef = agentsSignal;

  useFrame(() => {
    const agents = agentsSignal.current;
    if (agents.length === 0) return;

    const infected = agents.filter((a) => a.state === 'I');
    if (infected.length > 0 && infected.length < agents.length * 0.35) {
      const cx = infected.reduce((s, a) => s + (a.x - 30), 0) / infected.length;
      const cz = infected.reduce((s, a) => s + (a.y - 30), 0) / infected.length;
      targetRef.current.lerp(new THREE.Vector3(cx * 0.25, 0, cz * 0.25), 0.006);
    } else {
      targetRef.current.lerp(new THREE.Vector3(0, 0, 0), 0.004);
    }

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetRef.current, 0.012);
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[0, 0, 0]}
      minDistance={18}
      maxDistance={90}
      maxPolarAngle={Math.PI / 2.1}
      enablePan
      autoRotate
      autoRotateSpeed={0.18}
    />
  );
}

// ── Agent system ──────────────────────────────────────────────────

function AgentSystem() {
  const agentMeshRef = useRef<THREE.InstancedMesh>(null!);
  const haloMeshRef = useRef<THREE.InstancedMesh>(null!);
  const infectRingRef = useRef<THREE.InstancedMesh>(null!);
  const waveMeshRef = useRef<THREE.InstancedMesh>(null!);
  const flashGeomRef = useRef<THREE.BufferGeometry>(null!);
  const heatTexRef = useRef<THREE.CanvasTexture | null>(null);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const agentsRef = useRef<Agent[]>([]);
  const tickRef = useRef(0);
  const frameRef = useRef(0);
  const tickAccRef = useRef(0); // fractional tick accumulator for smooth simSpeed

  const wavesRef = useRef<WaveEntry[]>(
    Array.from({ length: WAVE_POOL }, () => ({ active: false, life: 0, x: 0, z: 0 })),
  );
  const flashRef = useRef<FlashEntry[]>(
    Array.from({ length: FLASH_POOL }, () => ({ active: false, life: 0, x1: 0, y1: 0, x2: 0, y2: 0 })),
  );

  const resetSignal = useEpidemicStore((s) => s.resetSignal);
  const eventSignal = useEpidemicStore((s) => s.eventSignal);

  // Create heatmap texture once
  const heatmapTexture = useMemo(() => {
    const { canvas } = getHMCtx();
    const tex = new THREE.CanvasTexture(canvas);
    heatTexRef.current = tex;
    return tex;
  }, []);

  useEffect(() => {
    const { params } = useEpidemicStore.getState();
    agentsRef.current = createAgents(params.population, params.vacRate, params.contagion);
    tickRef.current = 0;
    frameRef.current = 0;
    tickAccRef.current = 0;
    wavesRef.current.forEach((w) => { w.active = false; });
    flashRef.current.forEach((f) => { f.active = false; });
  }, [resetSignal]);

  // Handle traveler event: inject 3 infected agents in random far spots
  useEffect(() => {
    if (!eventSignal || eventSignal.type !== 'traveler') return;
    const agents = agentsRef.current;
    let injected = 0;
    for (let i = agents.length - 1; i >= 0 && injected < 3; i--) {
      if (agents[i].state === 'S') {
        agents[i].state = 'I';
        agents[i].infectedTick = tickRef.current;
        const [r, g, b] = STATE_COLOR.I;
        agents[i].r = r; agents[i].g = g; agents[i].b = b;
        // Move to a random far location
        agents[i].x = 2 + Math.random() * (WORLD_SIZE - 4);
        agents[i].y = 2 + Math.random() * (WORLD_SIZE - 4);
        injected++;
      }
    }
  }, [eventSignal]);

  const { size } = useThree();
  void size; // suppress unused warning

  useFrame(({ clock }, delta) => {
    const store = useEpidemicStore.getState();
    const t = clock.getElapsedTime();

    if (!store.isPlaying || agentsRef.current.length === 0) {
      // Still animate waves when paused
      animateWaves(delta);
      return;
    }

    // Accumulate fractional ticks — simSpeed=0.4 means ~24 steps/s at 60fps
    tickAccRef.current += store.simSpeed;
    const stepsThisFrame = Math.floor(tickAccRef.current);
    tickAccRef.current -= stepsThisFrame;

    // Run 0 or 1 simulation steps (cap at 1 to avoid spiral-of-death)
    let counts = store.counts;
    let transmissions: Array<[number, number, number, number]> = [];
    if (stepsThisFrame >= 1) {
      const result = stepAgents(agentsRef.current, tickRef.current, store.params);
      counts = result.counts;
      transmissions = result.transmissions;
      tickRef.current++;
    }
    frameRef.current++;

    if (counts.I === 0 && tickRef.current > TICKS_PER_DAY) {
      store.pause();
    }

    const R0 = store.params.contagion * (1 - store.params.maskUsage * 0.65) * (1 - store.params.distancing * 0.6) * 3.8;
    const ringColor = R0 > 2 ? 0xef4444 : R0 > 1 ? 0xeab308 : 0x22c55e;

    // Update agent instances
    for (let i = 0; i < MAX_POP; i++) {
      const a = agentsRef.current[i];

      if (!a) {
        dummy.scale.setScalar(0);
        dummy.position.set(0, -200, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        agentMeshRef.current.setMatrixAt(i, dummy.matrix);
        haloMeshRef.current.setMatrixAt(i, dummy.matrix);
        infectRingRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }

      const sx = a.x - 30;
      const sz = a.y - 30;

      // Agent sphere (small dot with glow)
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(1);
      dummy.position.set(sx, 0.45, sz);
      dummy.updateMatrix();
      agentMeshRef.current.setMatrixAt(i, dummy.matrix);
      col.setRGB(a.r, a.g, a.b);
      agentMeshRef.current.setColorAt(i, col);

      // Halo — breathing animation
      const breathScale = 1 + 0.15 * Math.sin(t * 2.5 + i * 0.41);
      dummy.scale.setScalar(breathScale);
      dummy.position.set(sx, 0.45, sz);
      dummy.updateMatrix();
      haloMeshRef.current.setMatrixAt(i, dummy.matrix);
      haloMeshRef.current.setColorAt(i, col);

      // Infection radius ring (only infected)
      if (a.state === 'I') {
        const pulse = 1 + 0.08 * Math.sin(t * 3.2 + i * 0.6);
        dummy.scale.set(pulse, 1, pulse);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.position.set(sx, 0.05, sz);
        dummy.updateMatrix();
        infectRingRef.current.setMatrixAt(i, dummy.matrix);
        void ringColor;
      } else {
        dummy.scale.setScalar(0);
        dummy.position.set(0, -200, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        infectRingRef.current.setMatrixAt(i, dummy.matrix);
      }
    }

    agentMeshRef.current.instanceMatrix.needsUpdate = true;
    if (agentMeshRef.current.instanceColor) agentMeshRef.current.instanceColor.needsUpdate = true;
    haloMeshRef.current.instanceMatrix.needsUpdate = true;
    if (haloMeshRef.current.instanceColor) haloMeshRef.current.instanceColor.needsUpdate = true;
    infectRingRef.current.instanceMatrix.needsUpdate = true;

    // Spawn transmission waves + flash lines
    for (const [x1, y1, x2, y2] of transmissions.slice(0, 6)) {
      const mx = (x1 + x2) / 2 - 30, mz = (y1 + y2) / 2 - 30;
      const wslot = wavesRef.current.find((w) => !w.active);
      if (wslot) { wslot.active = true; wslot.life = 1.0; wslot.x = mx; wslot.z = mz; }
      const fslot = flashRef.current.find((f) => !f.active);
      if (fslot) {
        fslot.active = true; fslot.life = 1.0;
        fslot.x1 = x1 - 30; fslot.y1 = y1 - 30;
        fslot.x2 = x2 - 30; fslot.y2 = y2 - 30;
      }
    }

    animateWaves(delta);

    // Flash lines
    const flashPos: number[] = [];
    for (const f of flashRef.current) {
      if (!f.active) continue;
      f.life -= delta * 1.8;
      if (f.life <= 0) { f.active = false; continue; }
      flashPos.push(f.x1, 1.2, f.y1, f.x2, 1.2, f.y2);
    }
    if (flashGeomRef.current) {
      const arr = flashPos.length ? flashPos : [0, 0, 0, 0, 0.001, 0];
      flashGeomRef.current.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      flashGeomRef.current.setDrawRange(0, Math.floor(flashPos.length / 3));
      const posAttr = flashGeomRef.current.getAttribute('position');
      if (posAttr) posAttr.needsUpdate = true;
    }

    // Heatmap
    if (frameRef.current % 20 === 0 && heatTexRef.current) {
      updateHeatmap(agentsRef.current, heatTexRef.current);
    }

    // Sync React state
    if (frameRef.current % 10 === 0) {
      store.updateCounts(counts, tickRef.current);
      if (frameRef.current % 30 === 0) {
        store.pushHistory({
          tick: tickRef.current,
          day: Math.floor(tickRef.current / TICKS_PER_DAY),
          ...counts,
        });
      }
    }
  });

  function animateWaves(delta: number) {
    for (let i = 0; i < WAVE_POOL; i++) {
      const w = wavesRef.current[i];
      if (!w.active) {
        dummy.scale.setScalar(0);
        dummy.position.set(0, -200, 0);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        waveMeshRef.current.setMatrixAt(i, dummy.matrix);
        continue;
      }
      w.life -= delta * 2.2;
      if (w.life <= 0) { w.active = false; continue; }
      const radius = (1 - w.life) * 7 + 0.5;
      dummy.scale.set(radius, 1, radius);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.position.set(w.x, 0.08, w.z);
      dummy.updateMatrix();
      waveMeshRef.current.setMatrixAt(i, dummy.matrix);
    }
    waveMeshRef.current.instanceMatrix.needsUpdate = true;
  }

  return (
    <>
      {/* Agent spheres — clean medium balls like Plague Inc. */}
      <instancedMesh ref={agentMeshRef} args={[undefined, undefined, MAX_POP]}>
        <sphereGeometry args={[0.52, 14, 10]} />
        <meshStandardMaterial roughness={0.35} metalness={0.05} />
      </instancedMesh>

      {/* Halo glow — very subtle, only visible with bloom */}
      <instancedMesh ref={haloMeshRef} args={[undefined, undefined, MAX_POP]}>
        <sphereGeometry args={[0.72, 10, 8]} />
        <meshBasicMaterial transparent opacity={0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>

      {/* Infection radius rings */}
      <instancedMesh ref={infectRingRef} args={[undefined, undefined, MAX_POP]}>
        <ringGeometry args={[2.0, 2.6, 32]} />
        <meshBasicMaterial
          color={0xef4444}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </instancedMesh>

      {/* Transmission wave rings */}
      <instancedMesh ref={waveMeshRef} args={[undefined, undefined, WAVE_POOL]}>
        <ringGeometry args={[0.3, 0.65, 24]} />
        <meshBasicMaterial
          color={0xff3366}
          transparent
          opacity={0.55}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Flash transmission lines */}
      <lineSegments>
        <bufferGeometry ref={flashGeomRef} />
        <lineBasicMaterial color={0xff2255} transparent opacity={1.0} blending={THREE.AdditiveBlending} />
      </lineSegments>

      {/* Heatmap overlay */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <planeGeometry args={[WORLD_SIZE, WORLD_SIZE]} />
        <meshBasicMaterial
          map={heatmapTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </>
  );
}

// ── Scene wrapper ──────────────────────────────────────────────────

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#080e1f']} />

      <ambientLight intensity={0.45} color="#aaccff" />
      <directionalLight position={[30, 50, 30]} intensity={0.85} color="#ffffff" castShadow />
      <directionalLight position={[-20, 30, -20]} intensity={0.3} color="#4466aa" />

      {/* Street lights at intersections */}
      {([-20, -10, 0, 10, 20] as number[]).flatMap((x) =>
        ([-20, -10, 0, 10, 20] as number[]).map((z) => (
          <pointLight
            key={`sl-${x}-${z}`}
            position={[x, 3, z]}
            intensity={1.4}
            distance={14}
            color="#ffd580"
            decay={2}
          />
        )),
      )}

      <pointLight position={[0, 4, 0]} intensity={2} distance={25} color="#55ff88" />

      <Stars radius={80} depth={30} count={1500} factor={3} saturation={0.3} fade speed={0.2} />

      <CameraController />
      <City />
      <AgentSystem />

      <EffectComposer>
        <Bloom intensity={2.2} luminanceThreshold={0.1} luminanceSmoothing={0.75} mipmapBlur />
      </EffectComposer>
    </>
  );
}

export function CityScene() {
  return (
    <Canvas
      camera={{ position: [0, 58, 42], fov: 44 }}
      shadows
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContent />
    </Canvas>
  );
}
