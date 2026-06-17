import { create } from 'zustand';
import type { SimParams } from '../simulation/agentEngine';

export interface HistoryPoint {
  tick: number;
  day: number;
  S: number; I: number; R: number; V: number;
}

export type EventSignal = { type: 'traveler'; ts: number } | null;

interface EpidemicStore {
  params: SimParams;
  isPlaying: boolean;
  tick: number;
  counts: { S: number; I: number; R: number; V: number };
  history: HistoryPoint[];
  resetSignal: number;
  eventSignal: EventSignal;
  simSpeed: number; // 0.2 (slow) → 1.0 (normal) → 4.0 (fast)

  setParam: (key: keyof SimParams, value: number) => void;
  setSimSpeed: (v: number) => void;
  play: () => void;
  pause: () => void;
  reset: () => void;
  updateCounts: (counts: { S: number; I: number; R: number; V: number }, tick: number) => void;
  pushHistory: (point: HistoryPoint) => void;
  applyPreset: (newParams: Partial<SimParams>) => void;
  triggerEvent: (event: 'festival' | 'traveler' | 'campaign') => void;
}

const DEFAULT_PARAMS: SimParams = {
  contagion: 0.55,
  maskUsage: 0.0,
  distancing: 0.0,
  vacRate: 0.0,
  recoveryDays: 14,
  population: 300,
  mutationRate: 0.0,
  hospitalLevel: 0.0,
  quarantine: 0.0,
  temperature: 0.0,
};

export const useEpidemicStore = create<EpidemicStore>((set, get) => ({
  params: DEFAULT_PARAMS,
  isPlaying: true,
  tick: 0,
  counts: { S: 299, I: 1, R: 0, V: 0 },
  history: [],
  resetSignal: 0,
  eventSignal: null,
  simSpeed: 1.0,

  setParam: (key, value) => {
    set((s) => ({ params: { ...s.params, [key]: value } }));
    if (key === 'population' || key === 'vacRate') {
      set((s) => ({ resetSignal: s.resetSignal + 1, history: [], tick: 0 }));
    }
  },

  setSimSpeed: (v) => set({ simSpeed: v }),

  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),

  reset: () =>
    set((s) => ({
      resetSignal: s.resetSignal + 1,
      history: [],
      tick: 0,
      isPlaying: true,
      eventSignal: null,
    })),

  updateCounts: (counts, tick) => set({ counts, tick }),

  pushHistory: (point) =>
    set((s) => ({ history: [...s.history.slice(-300), point] })),

  applyPreset: (newParams) =>
    set((s) => ({
      params: { ...s.params, ...newParams },
      resetSignal: s.resetSignal + 1,
      history: [],
      tick: 0,
      isPlaying: true,
    })),

  triggerEvent: (event) => {
    const s = get();
    if (event === 'festival') {
      set({ params: { ...s.params, contagion: Math.min(1, s.params.contagion + 0.25) } });
      setTimeout(() => {
        set((st) => ({ params: { ...st.params, contagion: Math.max(0.1, st.params.contagion - 0.25) } }));
      }, 8000);
    } else if (event === 'campaign') {
      set({
        params: { ...s.params, vacRate: Math.min(1, s.params.vacRate + 0.3) },
        resetSignal: s.resetSignal + 1,
        history: [],
        tick: 0,
      });
    } else if (event === 'traveler') {
      set({ eventSignal: { type: 'traveler', ts: Date.now() } });
    }
  },
}));
