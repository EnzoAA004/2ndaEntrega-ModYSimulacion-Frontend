import { apiBaseUrl, apiClient } from "./client";
import { LocationAnalytics, Overview, RiskResult } from "../types/analytics";

export interface ExecutiveReport {
  generated_at: string;
  title: string;
  overview: Overview;
  risk_table: RiskResult[];
  summary: {
    critical_locations?: number;
    high_or_critical_locations?: number;
    early_warning_locations?: number;
    highest_risk_location?: string;
  };
  recommendations: string[];
  academic_mapping: Array<{ topic: string; application: string }>;
}

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

export async function getExecutiveReport() {
  const { data } = await apiClient.get<ExecutiveReport>("/analytics/report");
  return data;
}

export function getMeasurementsCsvUrl() {
  return `${apiBaseUrl}/analytics/export/measurements.csv`;
}
