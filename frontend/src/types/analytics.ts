import { RiskLevel } from "./common";
import { Measurement } from "./measurement";

export interface Overview {
  total_measurements?: number;
  active_locations?: number;
  latest_risk_level?: RiskLevel | string;
  highest_risk_location?: string;
  trend_14d?: number;
}

export interface RiskResult {
  location_name: string;
  city?: string;
  latest_viral_concentration_gc_l?: number;
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
  risk?: RiskResult;
  early_warning?: boolean;
  explanation?: string;
}
