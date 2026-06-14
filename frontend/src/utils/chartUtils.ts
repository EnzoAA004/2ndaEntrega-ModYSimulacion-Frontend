import { SimulationResult } from "../types/simulation";

export function combineTimeSeries(result?: SimulationResult) {
  const time = result?.time ?? [];
  const series = result?.series ?? {};
  return time.map((t, index) => {
    const row: Record<string, number> = { t };
    Object.entries(series).forEach(([key, values]) => {
      row[key] = values[index];
    });
    return row;
  });
}

export function getBifurcationData(result?: SimulationResult) {
  return result?.bifurcation_points ?? [];
}

export function getPhaseData(result?: SimulationResult) {
  return result?.phase_points ?? [];
}
