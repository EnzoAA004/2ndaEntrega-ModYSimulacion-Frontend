import { create } from 'zustand';
import { SimParams, ODEPoint, solveODE } from '../components/simulation3d/useODESolver';

export type Speed = 1 | 2 | 5 | 10;

const DEFAULT_PARAMS: SimParams = {
  beta: 0.40,
  gamma: 0.12,
  alpha: 25,
  K: 100000,
  k: 0.15,
  d: 0.05,
};

const DEFAULT_I0 = 150;
const DEFAULT_V0 = 9000;
const DEFAULT_TMAX = 100;
const SOLVE_STEPS = 400;

function computeTrajectory(
  I0: number,
  V0: number,
  tMax: number,
  params: SimParams,
): { trajectory: ODEPoint[]; vMax: number } {
  const trajectory = solveODE(I0, V0, tMax, SOLVE_STEPS, params);
  const fromTraj = Math.max(...trajectory.map((p) => p.V));
  const eqV = params.alpha * params.K / (params.k + params.d);
  const vMax = Math.max(fromTraj, eqV, 1000) * 1.15;
  return { trajectory, vMax };
}

const initialComputed = computeTrajectory(DEFAULT_I0, DEFAULT_V0, DEFAULT_TMAX, DEFAULT_PARAMS);

export type ToggleKey =
  | 'showParticles'
  | 'showLandscape'
  | 'showNullclines'
  | 'showMultiIC'
  | 'showEquilibria';

interface Sim3DStore {
  params: SimParams;
  I0: number;
  V0: number;
  tMax: number;
  isPlaying: boolean;
  currentTime: number;
  speed: Speed;
  trajectory: ODEPoint[];
  vMax: number;

  showParticles: boolean;
  showLandscape: boolean;
  showNullclines: boolean;
  showMultiIC: boolean;
  showEquilibria: boolean;

  setParam: (key: keyof SimParams, value: number) => void;
  setI0: (v: number) => void;
  setV0: (v: number) => void;
  setTMax: (v: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  setCurrentTime: (t: number) => void;
  setSpeed: (s: Speed) => void;
  toggle: (key: ToggleKey) => void;
  applyPreset: (p: {
    params: Partial<SimParams>;
    I0: number;
    V0: number;
    tMax: number;
  }) => void;
  recompute: () => void;
}

export const useSim3DStore = create<Sim3DStore>((set, get) => ({
  params: { ...DEFAULT_PARAMS },
  I0: DEFAULT_I0,
  V0: DEFAULT_V0,
  tMax: DEFAULT_TMAX,
  isPlaying: false,
  currentTime: 0,
  speed: 1,
  trajectory: initialComputed.trajectory,
  vMax: initialComputed.vMax,

  showParticles: true,
  showLandscape: true,
  showNullclines: true,
  showMultiIC: true,
  showEquilibria: true,

  recompute: () => {
    const { params, I0, V0, tMax } = get();
    const computed = computeTrajectory(I0, V0, tMax, params);
    set({ ...computed, currentTime: 0, isPlaying: false });
  },

  setParam: (key, value) => {
    const params = { ...get().params, [key]: value };
    const { I0, V0, tMax } = get();
    const computed = computeTrajectory(I0, V0, tMax, params);
    set({ params, ...computed, currentTime: 0, isPlaying: false });
  },

  setI0: (I0) => {
    const { params, V0, tMax } = get();
    const computed = computeTrajectory(I0, V0, tMax, params);
    set({ I0, ...computed, currentTime: 0, isPlaying: false });
  },

  setV0: (V0) => {
    const { params, I0, tMax } = get();
    const computed = computeTrajectory(I0, V0, tMax, params);
    set({ V0, ...computed, currentTime: 0, isPlaying: false });
  },

  setTMax: (tMax) => {
    const { params, I0, V0 } = get();
    const computed = computeTrajectory(I0, V0, tMax, params);
    set({ tMax, ...computed, currentTime: 0, isPlaying: false });
  },

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
  reset: () => {
    const { params, I0, V0, tMax } = get();
    const computed = computeTrajectory(I0, V0, tMax, params);
    set({ ...computed, currentTime: 0, isPlaying: false });
  },
  setCurrentTime: (t) => set({ currentTime: t }),
  setSpeed: (speed) => set({ speed }),
  toggle: (key) => set((s) => ({ [key]: !s[key] } as Pick<Sim3DStore, ToggleKey>)),

  applyPreset: ({ params: partialParams, I0, V0, tMax }) => {
    const params = { ...DEFAULT_PARAMS, ...partialParams };
    const computed = computeTrajectory(I0, V0, tMax, params);
    set({ params, I0, V0, tMax, ...computed, currentTime: 0, isPlaying: false });
  },
}));
