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
  if (result?.bifurcation_points?.length) return result.bifurcation_points;
  const parameterValues = (result as unknown as { parameter_values?: number[] })?.parameter_values ?? [];
  const equilibria = Array.isArray(result?.equilibria) ? result?.equilibria : [];
  return parameterValues.flatMap((parameterValue, index) => {
    const points = Array.isArray(equilibria[index]) ? equilibria[index] as Array<Record<string, unknown>> : [];
    return points.map((point) => ({
      parameter_value: parameterValue,
      equilibrium_value: Number(point.I ?? point.equilibrium_value ?? 0),
      stable: Boolean(point.stable),
      stability: point.stable ? "stable" : "unstable",
      branch: String(point.branch ?? "equilibrio"),
    }));
  });
}

export function getPhaseData(result?: SimulationResult) {
  if (result?.phase_points?.length) return result.phase_points;
  const gridPoints = (result as unknown as { grid_points?: Array<Record<string, number>> })?.grid_points ?? [];
  const vectors = (result as unknown as { vectors?: Array<Record<string, number>> })?.vectors ?? [];
  return gridPoints.map((point, index) => {
    const vector = vectors[index] ?? {};
    const dI = Number(vector.dI ?? 0);
    const dV = Number(vector.dV ?? 0);
    return { ...point, dI, dV, magnitude: Math.sqrt(dI * dI + dV * dV) };
  });
}

export function getEquilibriumPoints(result?: SimulationResult) {
  const equilibria = Array.isArray(result?.equilibria) ? result?.equilibria as Array<Record<string, unknown>> : [];
  return equilibria.map((eq) => {
    const values = (eq.values ?? eq) as Record<string, unknown>;
    return {
      I: Number(values.I ?? eq.I ?? 0),
      V: Number(values.V ?? eq.V ?? 0),
      classification: String(eq.classification ?? "equilibrio"),
    };
  });
}
