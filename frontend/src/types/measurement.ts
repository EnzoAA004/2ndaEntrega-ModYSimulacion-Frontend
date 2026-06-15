import { RiskLevel } from "./common";

export interface Measurement {
  id?: number;
  sample_date: string;
  location_name: string;
  city?: string;
  country?: string;
  population_served?: number;
  flow_rate_m3_day?: number;
  viral_concentration_gc_l?: number;
  moving_average_7d?: number | null;
  temperature_c?: number;
  rainfall_mm?: number;
  clinical_cases?: number;
  risk_level?: RiskLevel | string;
}

export interface LocationSummary {
  location_name: string;
  city?: string;
  country?: string;
}

export interface MeasurementFilters {
  location_name?: string;
  city?: string;
  country?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}
