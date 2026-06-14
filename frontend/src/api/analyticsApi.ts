import { apiClient } from "./client";
import { LocationAnalytics, Overview, RiskResult } from "../types/analytics";

export async function getOverview() {
  const { data } = await apiClient.get<Overview>("/analytics/overview");
  return data;
}

export async function getRiskTable() {
  const { data } = await apiClient.get<RiskResult[]>("/analytics/risk-table");
  return data;
}

export async function getLocationAnalytics(locationName: string) {
  const { data } = await apiClient.get<LocationAnalytics>(`/analytics/location/${encodeURIComponent(locationName)}`);
  return data;
}
