import { RiskLevel } from "../types/common";

export function normalizeRisk(risk?: string | null): RiskLevel {
  const value = (risk ?? "unknown").toLowerCase();
  if (["bajo", "low"].includes(value)) return "low";
  if (["moderado", "moderate", "medium"].includes(value)) return "moderate";
  if (["alto", "high"].includes(value)) return "high";
  if (["critico", "critical", "crítico"].includes(value)) return "critical";
  return "unknown";
}

export function riskLabel(risk?: string | null) {
  const normalized = normalizeRisk(risk);
  return { low: "Bajo", moderate: "Moderado", high: "Alto", critical: "Critico", unknown: "Sin dato" }[normalized];
}

export function riskBadgeClass(risk?: string | null) {
  const normalized = normalizeRisk(risk);
  return {
    low: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    moderate: "bg-amber-50 text-amber-700 ring-amber-200",
    high: "bg-orange-50 text-orange-700 ring-orange-200",
    critical: "bg-red-50 text-red-700 ring-red-200",
    unknown: "bg-slate-100 text-slate-600 ring-slate-200",
  }[normalized];
}
