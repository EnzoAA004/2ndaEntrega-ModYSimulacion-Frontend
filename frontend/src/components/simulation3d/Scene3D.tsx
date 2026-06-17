import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line, Html, Grid } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type { SimParams, ODEPoint } from "./useODESolver";
import { vectorField, getEquilibria } from "./useODESolver";

// ── Scene constants ──────────────────────────────────────────────
const SCALE = 10;   // I (x) and V (z) span [-5, 5] in scene
const HEIGHT = 10;  // Time (y) spans [0, 10]

function toVec3(
  I: number,
  V: number,
  t: number,
  K: number,
  vMax: number,
  tMax: number,
): THREE.Vector3 {
  return new THREE.Vector3(
    (I / K) * SCALE - SCALE / 2,
    (t / tMax) * HEIGHT,
    (V / vMax) * SCALE - SCALE / 2,
  );
}

const GRADIENT_STOPS = [
  new THREE.Color(0x0033ee),
  new THREE.Color(0x0099ff),
  new THREE.Color(0x00ffaa),
  new THREE.Color(0xffdd00),
  new THREE.Color(0xff3300),
];

function lerpColor(u: number): THREE.Color {
  u = Math.max(0, Math.min(1, u));
  const n = GRADIENT_STOPS.length - 1;
  const i = Math.floor(u * n);
  const f = u * n - i;
  return GRADIENT_STOPS[Math.min(i, n - 1)].clone().lerp(
    GRADIENT_STOPS[Math.min(i + 1, n)],
    f,
  );
}

// ── Main trajectory line ─────────────────────────────────────────
function Trajectory({
  pts,
  K,
  vMax,
  tMax,
  width = 4,
}: {
  pts: ODEPoint[];
  K: number;
  vMax: number;
  tMax: number;
  width?: number;
}) {
  const { points, colors } = useMemo(
    () => ({
      points: pts.map((p) => toVec3(p.I, p.V, p.t, K, vMax, tMax)),
      colors: pts.map((_, i) => lerpColor(i / Math.max(1, pts.length - 1))),
    }),
    [pts, K, vMax, tMax],
  );
  if (points.length < 2) return null;
  return <Line points={points} vertexColors={colors} lineWidth={width} />;
}

// ── Sphere that travels continuously along the main trajectory ───
function AnimatedProbe({
  pts,
  K,
  vMax,
  tMax,
}: {
  pts: ODEPoint[];
  K: number;
  vMax: number;
  tMax: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const matRef = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame(({ clock }) => {
    const u = (clock.elapsedTime * 0.13) % 1;
    const idx = Math.floor(u * (pts.length - 1));
    const pt = pts[Math.min(idx, pts.length - 1)];
    if (!pt) return;
    const pos = toVec3(pt.I, pt.V, pt.t, K, vMax, tMax);
    meshRef.current.position.copy(pos);
    lightRef.current.position.copy(pos);
    const c = lerpColor(idx / (pts.length - 1));
    matRef.current.color.copy(c);
    matRef.current.emissive.copy(c);
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.22, 20, 20]} />
        <meshStandardMaterial ref={matRef} emissiveIntensity={8} />
      </mesh>
      <pointLight ref={lightRef} intensity={6} distance={5} decay={2} />
    </>
  );
}

// ── Vector field arrows in base plane (y=0) ──────────────────────
function VectorField({
  params,
  K,
  vMax,
}: {
  params: SimParams;
  K: number;
  vMax: number;
}) {
  const geometry = useMemo(() => {
    const grid = 12;
    const arrowLen = 0.46;
    const positions: number[] = [];
    const colors: number[] = [];

    for (let i = 0; i < grid; i++) {
      for (let j = 0; j < grid; j++) {
        const I = (i / (grid - 1)) * K * 0.93;
        const V = (j / (grid - 1)) * vMax * 0.93;
        const [dI, dV] = vectorField(I, V, params);
        const mag = Math.sqrt(dI * dI + dV * dV);
        if (mag < 1e-12) continue;

        const x = (I / K) * SCALE - SCALE / 2;
        const z = (V / vMax) * SCALE - SCALE / 2;

        // Normalize direction into scene space
        const dxScene = (dI / K) * SCALE;
        const dzScene = (dV / vMax) * SCALE;
        const magScene = Math.sqrt(dxScene * dxScene + dzScene * dzScene);
        const ndx = (dxScene / magScene) * arrowLen;
        const ndz = (dzScene / magScene) * arrowLen;

        const tx = x + ndx, tz = z + ndz;

        // Shaft
        positions.push(x, 0.01, z, tx, 0.01, tz);

        // Arrowhead barbs
        const hLen = 0.38 * arrowLen;
        const hWid = 0.22 * arrowLen;
        const px = -ndz / arrowLen;
        const pz = ndx / arrowLen;
        const bx = tx - ndx * hLen / arrowLen;
        const bz = tz - ndz * hLen / arrowLen;
        positions.push(tx, 0.01, tz, bx + px * hWid, 0.01, bz + pz * hWid);
        positions.push(tx, 0.01, tz, bx - px * hWid, 0.01, bz - pz * hWid);

        // Color: blue (slow) → orange (fast)
        const relMag = Math.min(1, mag / (K * params.beta * 0.3 + 1));
        const c = new THREE.Color().setHSL(0.6 - relMag * 0.5, 0.9, 0.45 + relMag * 0.2);
        for (let k = 0; k < 6; k++) colors.push(c.r, c.g, c.b);
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return geom;
  }, [params, K, vMax]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial vertexColors transparent opacity={0.75} />
    </lineSegments>
  );
}

// ── Nullcline surfaces ───────────────────────────────────────────
function NullclineSurfaces({
  params,
  K,
  vMax,
}: {
  params: SimParams;
  K: number;
  vMax: number;
}) {
  const { vNullGeom, iNullGeom, iZeroGeom } = useMemo(() => {
    const hasEndemic = params.beta > params.gamma;
    const Istar = hasEndemic ? params.K * (1 - params.gamma / params.beta) : null;
    const xStar = Istar !== null ? (Istar / K) * SCALE - SCALE / 2 : null;

    // V-nullcline: V = αI/(k+d) — a tilted plane through (0,0)
    const eqSlope = (params.alpha / ((params.k + params.d) * vMax)) * K;
    const x0 = -SCALE / 2, x1 = SCALE / 2;
    const z0 = -SCALE / 2; // at I=0, V=0
    const z1raw = eqSlope * SCALE - SCALE / 2;
    const z1 = Math.min(SCALE / 2, z1raw);
    const x1adj = z1raw > SCALE / 2 ? (SCALE / 2 + SCALE / 2) / eqSlope - SCALE / 2 : x1;

    const vPos = new Float32Array([
      x0, 0, z0, x1adj, 0, z1,
      x0, HEIGHT, z0, x1adj, HEIGHT, z1,
    ]);
    const vGeom = new THREE.BufferGeometry();
    vGeom.setAttribute("position", new THREE.Float32BufferAttribute(vPos, 3));
    vGeom.setIndex([0, 1, 2, 1, 3, 2]);
    vGeom.computeVertexNormals();

    // I=0 plane (trivial nullcline at left edge)
    const iz0 = -SCALE / 2;
    const izPos = new Float32Array([
      iz0, 0, -SCALE / 2, iz0, 0, SCALE / 2,
      iz0, HEIGHT, -SCALE / 2, iz0, HEIGHT, SCALE / 2,
    ]);
    const izGeom = new THREE.BufferGeometry();
    izGeom.setAttribute("position", new THREE.Float32BufferAttribute(izPos, 3));
    izGeom.setIndex([0, 1, 2, 1, 3, 2]);
    izGeom.computeVertexNormals();

    // I=I* plane (endemic nullcline)
    let iGeom: THREE.BufferGeometry | null = null;
    if (xStar !== null) {
      const iPos = new Float32Array([
        xStar, 0, -SCALE / 2, xStar, 0, SCALE / 2,
        xStar, HEIGHT, -SCALE / 2, xStar, HEIGHT, SCALE / 2,
      ]);
      iGeom = new THREE.BufferGeometry();
      iGeom.setAttribute("position", new THREE.Float32BufferAttribute(iPos, 3));
      iGeom.setIndex([0, 1, 2, 1, 3, 2]);
      iGeom.computeVertexNormals();
    }

    return { vNullGeom: vGeom, iNullGeom: iGeom, iZeroGeom: izGeom };
  }, [params, K, vMax]);

  return (
    <group renderOrder={-1}>
      <mesh geometry={vNullGeom}>
        <meshBasicMaterial
          color={0x4488ff}
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={iZeroGeom}>
        <meshBasicMaterial
          color={0x00ff88}
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {iNullGeom && (
        <mesh geometry={iNullGeom}>
          <meshBasicMaterial
            color={0x00ff88}
            transparent
            opacity={0.14}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// ── Pulsing equilibrium spheres ──────────────────────────────────
function EquilibriumSpheres({
  params,
  K,
  vMax,
  tMax,
}: {
  params: SimParams;
  K: number;
  vMax: number;
  tMax: number;
}) {
  const { diseaseFree, endemic } = getEquilibria(params);
  const dfRef = useRef<THREE.Mesh>(null!);
  const enRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const pulse = 1 + 0.25 * Math.sin(clock.elapsedTime * 2.8);
    dfRef.current?.scale.setScalar(pulse);
    enRef.current?.scale.setScalar(pulse * 1.1);
  });

  const dfPos = toVec3(diseaseFree.I, diseaseFree.V, 0, K, vMax, tMax);
  const enBase = endemic ? toVec3(endemic.I, endemic.V, 0, K, vMax, tMax) : null;
  const enTop = endemic ? toVec3(endemic.I, endemic.V, tMax, K, vMax, tMax) : null;

  return (
    <>
      <mesh position={dfPos} ref={dfRef}>
        <sphereGeometry args={[0.18, 20, 20]} />
        <meshStandardMaterial color={0xff3344} emissive={0xff3344} emissiveIntensity={5} />
      </mesh>
      {enBase && (
        <mesh position={enBase} ref={enRef}>
          <sphereGeometry args={[0.26, 20, 20]} />
          <meshStandardMaterial color={0xffcc00} emissive={0xffcc00} emissiveIntensity={6} />
        </mesh>
      )}
      {enTop && (
        <>
          <mesh position={enTop}>
            <sphereGeometry args={[0.26, 20, 20]} />
            <meshStandardMaterial color={0xffcc00} emissive={0xffcc00} emissiveIntensity={6} />
          </mesh>
          <Line
            points={[enBase!, enTop]}
            color={0xffcc00}
            lineWidth={1.2}
            dashed
            dashSize={0.3}
            gapSize={0.2}
          />
        </>
      )}
    </>
  );
}

// ── Multi-IC trajectories ────────────────────────────────────────
function MultiIcTrajectories({
  params,
  K,
  vMax,
  tMax,
}: {
  params: SimParams;
  K: number;
  vMax: number;
  tMax: number;
}) {
  const trajectories = useMemo(() => {
    const N = 18;
    const steps = 180;
    const dt = tMax / steps;
    return Array.from({ length: N }, (_, idx) => {
      const f = idx / N;
      const I0 = Math.max(1, f < 0.5 ? f * K * 0.2 : f * K * 0.65);
      const V0 = ((idx % 6) / 5) * vMax * 0.45;
      const pts: [number, number, number][] = [[
        (I0 / K) * SCALE - SCALE / 2,
        0,
        (V0 / vMax) * SCALE - SCALE / 2,
      ]];
      let I = I0, V = V0;
      for (let s = 1; s <= steps; s++) {
        const dI = params.beta * I * (1 - I / K) - params.gamma * I;
        const dV = params.alpha * I - (params.k + params.d) * V;
        I = Math.max(0, I + dt * dI);
        V = Math.max(0, V + dt * dV);
        pts.push([
          (I / K) * SCALE - SCALE / 2,
          (s * dt / tMax) * HEIGHT,
          (V / vMax) * SCALE - SCALE / 2,
        ]);
      }
      const hue = 0.55 + f * 0.35;
      return { pts, color: new THREE.Color().setHSL(hue, 0.75, 0.55) };
    });
  }, [params, K, vMax, tMax]);

  return (
    <>
      {trajectories.map(({ pts, color }, i) =>
        pts.length >= 2 ? (
          <Line
            key={i}
            points={pts}
            color={color}
            lineWidth={0.7}
            transparent
            opacity={0.3}
          />
        ) : null,
      )}
    </>
  );
}

// ── Axes labels + ticks ──────────────────────────────────────────
function SceneAxes({
  K,
  vMax,
  tMax,
}: {
  K: number;
  vMax: number;
  tMax: number;
}) {
  const o = -SCALE / 2;

  const ixAxis: [THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(o, 0, o),
    new THREE.Vector3(SCALE / 2 + 1.2, 0, o),
  ];
  const izAxis: [THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(o, 0, o),
    new THREE.Vector3(o, 0, SCALE / 2 + 1.2),
  ];
  const iyAxis: [THREE.Vector3, THREE.Vector3] = [
    new THREE.Vector3(o, 0, o),
    new THREE.Vector3(o, HEIGHT + 1.2, o),
  ];

  return (
    <group>
      <Grid
        args={[SCALE, SCALE]}
        cellSize={SCALE / 10}
        cellThickness={0.4}
        cellColor="#0d1f3e"
        sectionSize={SCALE / 2}
        sectionThickness={0.9}
        sectionColor="#1a3560"
        fadeDistance={30}
        infiniteGrid={false}
        position={[0, 0, 0]}
      />
      <Line points={ixAxis} color="#ff5533" lineWidth={2} />
      <Line points={izAxis} color="#4499ff" lineWidth={2} />
      <Line points={iyAxis} color="#44ff88" lineWidth={2} />

      <Html position={[SCALE / 2 + 2, 0.2, o]}>
        <span className="text-[#ff5533] text-[11px] font-mono whitespace-nowrap select-none">
          I (Infectados)
        </span>
      </Html>
      <Html position={[o, 0.2, SCALE / 2 + 2]}>
        <span className="text-[#4499ff] text-[11px] font-mono whitespace-nowrap select-none">
          V (Carga viral)
        </span>
      </Html>
      <Html position={[o, HEIGHT + 1.8, o]}>
        <span className="text-[#44ff88] text-[11px] font-mono whitespace-nowrap select-none">
          t (Tiempo)
        </span>
      </Html>

      {/* I-axis ticks */}
      {[0.25, 0.5, 0.75, 1.0].map((f) => {
        const x = f * SCALE - SCALE / 2;
        return (
          <group key={f}>
            <Line
              points={[new THREE.Vector3(x, 0, o), new THREE.Vector3(x, 0, o - 0.4)]}
              color="#ff5533"
              lineWidth={1}
            />
            <Html position={[x, -0.05, o - 1.0]}>
              <span className="text-[#ff5533] text-[9px] font-mono select-none">
                {(f * K).toExponential(0)}
              </span>
            </Html>
          </group>
        );
      })}

      {/* t-axis ticks */}
      {[0.25, 0.5, 0.75, 1.0].map((f) => {
        const y = f * HEIGHT;
        return (
          <group key={f}>
            <Line
              points={[new THREE.Vector3(o, y, o), new THREE.Vector3(o - 0.4, y, o)]}
              color="#44ff88"
              lineWidth={1}
            />
            <Html position={[o - 1.2, y, o]}>
              <span className="text-[#44ff88] text-[9px] font-mono select-none">
                {(f * tMax).toFixed(0)}d
              </span>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

// ── Scene content (all 3D elements, must be inside Canvas) ───────
function SceneContent({
  pts,
  params,
  K,
  vMax,
  tMax,
  showNullclines,
  showVectorField,
  showMultiIc,
  showEquilibria,
}: {
  pts: ODEPoint[];
  params: SimParams;
  K: number;
  vMax: number;
  tMax: number;
  showNullclines: boolean;
  showVectorField: boolean;
  showMultiIc: boolean;
  showEquilibria: boolean;
}) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[10, 20, 10]} intensity={0.4} />

      <Stars radius={65} depth={25} count={2800} factor={4} saturation={0.4} fade speed={0.4} />

      <OrbitControls
        makeDefault
        target={[0, HEIGHT / 2, 0]}
        minDistance={6}
        maxDistance={40}
        autoRotate
        autoRotateSpeed={0.45}
        enablePan
        enableZoom
      />

      <SceneAxes K={K} vMax={vMax} tMax={tMax} />

      {showMultiIc && (
        <MultiIcTrajectories params={params} K={K} vMax={vMax} tMax={tMax} />
      )}

      <Trajectory pts={pts} K={K} vMax={vMax} tMax={tMax} width={4.5} />
      <AnimatedProbe pts={pts} K={K} vMax={vMax} tMax={tMax} />

      {showNullclines && (
        <NullclineSurfaces params={params} K={K} vMax={vMax} />
      )}
      {showVectorField && (
        <VectorField params={params} K={K} vMax={vMax} />
      )}
      {showEquilibria && (
        <EquilibriumSpheres params={params} K={K} vMax={vMax} tMax={tMax} />
      )}

      <EffectComposer>
        <Bloom
          intensity={1.6}
          luminanceThreshold={0.09}
          luminanceSmoothing={0.85}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

// ── Public API ───────────────────────────────────────────────────
export interface Scene3DProps {
  params: SimParams;
  trajectory: ODEPoint[];
  vMax: number;
  tMax: number;
  showNullclines: boolean;
  showVectorField: boolean;
  showMultiIc: boolean;
  showEquilibria: boolean;
}

export function Scene3D({
  params,
  trajectory,
  vMax,
  tMax,
  showNullclines,
  showVectorField,
  showMultiIc,
  showEquilibria,
}: Scene3DProps) {
  return (
    <Canvas
      camera={{ position: [13, 9, 13], fov: 54 }}
      gl={{ antialias: true }}
      onCreated={({ gl }) => {
        gl.setClearColor(new THREE.Color(0x050a1a));
      }}
    >
      <SceneContent
        pts={trajectory}
        params={params}
        K={params.K}
        vMax={vMax}
        tMax={tMax}
        showNullclines={showNullclines}
        showVectorField={showVectorField}
        showMultiIc={showMultiIc}
        showEquilibria={showEquilibria}
      />
    </Canvas>
  );
}
