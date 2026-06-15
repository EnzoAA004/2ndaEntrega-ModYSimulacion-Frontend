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
