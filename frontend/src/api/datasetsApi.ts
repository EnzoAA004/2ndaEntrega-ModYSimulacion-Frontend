import { apiClient } from "./client";

export interface DatasetSummary {
  total_measurements?: number;
  locations?: number;
  date_from?: string;
  date_to?: string;
  avg_viral_concentration_gc_l?: number;
  max_viral_concentration_gc_l?: number;
}

export async function uploadCsv(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post("/datasets/upload-csv", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function seedDemo() {
  const { data } = await apiClient.post("/datasets/seed-demo");
  return data;
}

export async function getDatasetSummary() {
  const { data } = await apiClient.get<DatasetSummary>("/datasets/summary");
  return data;
}
