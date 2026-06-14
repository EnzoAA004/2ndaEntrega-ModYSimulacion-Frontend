export function formatNumber(value?: number | null, digits = 0) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: digits }).format(value);
}

export function formatScientific(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  if (Math.abs(value) >= 100000) return value.toExponential(2);
  return formatNumber(value, 2);
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(value));
}

export function formatPercentTrend(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, 1)}%`;
}
