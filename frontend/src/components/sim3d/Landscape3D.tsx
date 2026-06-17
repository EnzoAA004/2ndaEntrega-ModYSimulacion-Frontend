import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { SimParams } from '../simulation3d/useODESolver';
import {
  getLandscapeHeight,
  computeRefSpeed,
  SCENE_HALF,
  HEIGHT_SCALE,
} from './landscape';

const GRID = 64;
const VERTS = GRID + 1;

interface Props {
  params: SimParams;
  vMax: number;
}

export function Landscape3D({ params, vMax }: Props) {
  const meshRef = useRef<THREE.Mesh>(null!);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(VERTS * VERTS * 3);
    const colors = new Float32Array(VERTS * VERTS * 3);
    const indices: number[] = [];

    const refSpeed = computeRefSpeed(params);
    let maxH = 0;

    // First pass: compute heights
    const heights = new Float32Array(VERTS * VERTS);
    for (let iz = 0; iz < VERTS; iz++) {
      for (let ix = 0; ix < VERTS; ix++) {
        const idx = iz * VERTS + ix;
        const sceneX = (ix / GRID) * 2 * SCENE_HALF - SCENE_HALF;
        const sceneZ = (iz / GRID) * 2 * SCENE_HALF - SCENE_HALF;
        const I = ((sceneX + SCENE_HALF) / (2 * SCENE_HALF)) * params.K;
        const V = ((sceneZ + SCENE_HALF) / (2 * SCENE_HALF)) * vMax;
        const h = getLandscapeHeight(I, V, params, refSpeed);
        heights[idx] = h;
        if (h > maxH) maxH = h;
      }
    }

    // Second pass: positions + colors
    const col = new THREE.Color();
    for (let iz = 0; iz < VERTS; iz++) {
      for (let ix = 0; ix < VERTS; ix++) {
        const idx = iz * VERTS + ix;
        const sceneX = (ix / GRID) * 2 * SCENE_HALF - SCENE_HALF;
        const sceneZ = (iz / GRID) * 2 * SCENE_HALF - SCENE_HALF;
        const h = heights[idx];

        positions[idx * 3 + 0] = sceneX;
        positions[idx * 3 + 1] = h;
        positions[idx * 3 + 2] = sceneZ;

        // Color: hue from flow direction, brightness from height
        const I = ((sceneX + SCENE_HALF) / (2 * SCENE_HALF)) * params.K;
        const V = ((sceneZ + SCENE_HALF) / (2 * SCENE_HALF)) * vMax;
        const dI = params.beta * I * (1 - I / params.K) - params.gamma * I;
        const dV = params.alpha * I - (params.k + params.d) * V;
        const angle = Math.atan2(dV, dI);
        const hue = (angle / (2 * Math.PI) + 0.5) % 1;
        const normH = maxH > 0 ? h / maxH : 0;
        const lightness = 0.12 + normH * 0.38;
        const saturation = 0.5 + normH * 0.4;
        col.setHSL(hue, saturation, lightness);
        colors[idx * 3 + 0] = col.r;
        colors[idx * 3 + 1] = col.g;
        colors[idx * 3 + 2] = col.b;
      }
    }

    // Indices (two triangles per quad)
    for (let iz = 0; iz < GRID; iz++) {
      for (let ix = 0; ix < GRID; ix++) {
        const a = iz * VERTS + ix;
        const b = a + 1;
        const c = a + VERTS;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    return geom;
  }, [params, vMax]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <group>
      {/* Terrain */}
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshPhongMaterial
          vertexColors
          shininess={30}
          specular={new THREE.Color(0x334466)}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Wireframe overlay (very subtle) */}
      <mesh geometry={geometry}>
        <meshBasicMaterial
          color={0x1a3366}
          wireframe
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </mesh>

      {/* Floor plane */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2 * SCENE_HALF, 2 * SCENE_HALF, 1, 1]} />
        <meshBasicMaterial
          color={0x0a1828}
          transparent
          opacity={0.85}
          side={THREE.FrontSide}
        />
      </mesh>
    </group>
  );
}
