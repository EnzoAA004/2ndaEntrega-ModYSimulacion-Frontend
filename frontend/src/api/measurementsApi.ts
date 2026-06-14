import { apiClient } from "./client";
import { LocationSummary, Measurement, MeasurementFilters } from "../types/measurement";
import { PaginatedResponse } from "../types/common";

export async function getLatestMeasurements() {
  const { data } = await apiClient.get<Measurement[]>("/measurements/latest");
  return data;
}

export async function getLocations() {
  const { data } = await apiClient.get<LocationSummary[]>("/measurements/locations");
  return data;
}

export async function getMeasurements(filters: MeasurementFilters) {
  const { data } = await apiClient.get<PaginatedResponse<Measurement> | Measurement[]>("/measurements", { params: filters });
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: filters.page ?? 1, page_size: filters.page_size ?? 20 };
  }
  return data;
}
