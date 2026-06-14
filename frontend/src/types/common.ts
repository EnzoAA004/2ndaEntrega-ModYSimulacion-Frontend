export type RiskLevel = "low" | "moderate" | "high" | "critical" | "unknown";
export type NumericRecord = Record<string, number | string | boolean | null | undefined>;

export interface ApiErrorPayload {
  detail?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
