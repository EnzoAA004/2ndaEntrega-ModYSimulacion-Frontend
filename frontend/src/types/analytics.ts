import { RiskLevel } from "./common";
import { Measurement } from "./measurement";

export interface Overview {
  total_measurements?: number;
  active_locations?: number;
  latest_risk_level?: RiskLevel | string;
  highest_risk_location?: string;
  average_viral_load?: number;
  trend_14d?: number;
  trend_last_14_days?: number;
  trend_last_30_days?: number;
  trend_label?: string;
  critical_locations?: number;
  high_locations?: number;
  early_warning_locations?: number;
  status_message?: string;
}

export interface RiskResult {
  location_name: string;
  city?: string;
  country?: string;
  latest_sample_date?: string;
  samples?: number;
  latest_viral_concentration_gc_l?: number;
  latest_clinical_cases?: number;
  latest_rainfall_mm?: number;
  trend_7d?: number;
  trend_14d?: number;
  risk_level?: RiskLevel | string;
  risk_score?: number;
  early_warning?: boolean;
  explanation?: string;
}

export interface LocationAnalytics {
  location_name: string;
  series: Measurement[];
  time_series?: Measurement[];
  moving_average_7d?: number[];
  variation_7d?: number;
  variation_14d?: number;
  risk?: RiskResult;
  early_warning?: boolean;
  explanation?: string;
  thresholds?: {
    high?: number;
    critical?: number;
  };
}

export interface ForecastPoint {
  sample_date: string;
  predicted_viral_concentration_gc_l?: number;
  viral_concentration_gc_l?: number;
  lower_bound?: number;
  upper_bound?: number;
  risk_level?: RiskLevel | string;
  clinical_cases?: number | null;
  rainfall_mm?: number | null;
}

export interface ForecastScenario {
  name: string;
  series: ForecastPoint[];
}

export interface ForecastSummary {
  status?: string;
  trend?: string;
  growth_rate_log_per_day?: number;
  doubling_time_days?: number | null;
  projected_change_percent?: number | null;
  max_predicted_viral_concentration_gc_l?: number | null;
  final_predicted_viral_concentration_gc_l?: number | null;
  forecast_risk_level?: RiskLevel | string;
  high_threshold_crossing_date?: string | null;
  critical_threshold_crossing_date?: string | null;
  confidence_band_log_std?: number;
  recommendation?: string;
  message?: string;
}

export interface LocationForecast {
  location_name: string;
  horizon_days: number;
  window_days: number;
  history: ForecastPoint[];
  forecast: ForecastPoint[];
  scenarios: ForecastScenario[];
  summary: ForecastSummary;
  thresholds?: {
    high?: number;
    critical?: number;
  };
}
