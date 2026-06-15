import { apiClient } from "./client";
import { SimulationResult } from "../types/simulation";

export async function runViralDecay(payload: unknown) {
  const { data } = await apiClient.post<SimulationResult>("/simulations/viral-decay-1d", payload);
  return data;
}

export async function runInfectionWastewater(payload: unknown) {
  const { data } = await apiClient.post<SimulationResult>("/simulations/infection-wastewater-2d", payload);
  return data;
}

export async function runNonHomogeneousEvent(payload: unknown) {
  const { data } = await apiClient.post<SimulationResult>("/simulations/non-homogeneous-event", payload);
  return data;
}

export async function runScenarioCompare(payload: unknown) {
  const { data } = await apiClient.post<SimulationResult>("/simulations/scenario-compare", payload);
  return data;
}

export async function runCalibration(payload: unknown) {
  const { data } = await apiClient.post("/simulations/calibrate", payload);
  return data;
}

export async function runBifurcation(payload: unknown) {
  const { data } = await apiClient.post<SimulationResult>("/simulations/bifurcation", payload);
  return data;
}

export async function runPhaseDiagram(payload: unknown) {
  const { data } = await apiClient.post<SimulationResult>("/simulations/phase-diagram", payload);
  return data;
}
