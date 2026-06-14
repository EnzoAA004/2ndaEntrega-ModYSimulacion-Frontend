import { RiskLevel, NumericRecord } from "./common";

export type Method = "euler" | "heun" | "rk4";

export interface SimulationResult {
  model_type?: string;
  parameters?: NumericRecord;
  initial_conditions?: NumericRecord;
  time?: number[];
  series?: Record<string, number[]>;
  equilibria?: unknown;
  stability?: string | { classification?: string; eigenvalues?: number[]; [key: string]: unknown };
  risk?: { risk_level?: RiskLevel | string; risk_score?: number; trend?: string; [key: string]: unknown };
  interpretation?: string;
  saved_simulation_id?: number;
  max_infected?: number;
  max_viral_load?: number;
  eigenvalues?: number[];
  event_window?: [number, number];
  bifurcation_points?: Array<Record<string, number | string | boolean>>;
  phase_points?: Array<Record<string, number>>;
  lyapunov?: {
    time?: number[];
    values?: number[];
    increasing?: boolean;
    safe_region_violations?: number;
    explanation?: string;
  };
}
