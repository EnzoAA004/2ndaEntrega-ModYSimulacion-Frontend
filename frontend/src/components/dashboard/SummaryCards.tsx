import { Activity, AlertTriangle, MapPin, TrendingUp, Waves, Siren } from "lucide-react";
import { Overview } from "../../types/analytics";
import { formatNumber, formatPercentTrend, formatScientific } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function SummaryCards({ overview }: { overview?: Overview }) {
  const trend14 = overview?.trend_14d ?? overview?.trend_last_14_days;
  const cards = [
    { label: "Total de mediciones", value: formatNumber(overview?.total_measurements), helper: "registros cargados", icon: Waves },
    { label: "Ubicaciones activas", value: formatNumber(overview?.active_locations), helper: "plantas monitoreadas", icon: MapPin },
    { label: "Riesgo general", value: <Badge risk={overview?.latest_risk_level} />, helper: overview?.trend_label ?? "estado actual", icon: AlertTriangle },
    { label: "Mayor riesgo", value: overview?.highest_risk_location ?? "-", helper: "ubicación crítica", icon: Activity },
    { label: "Tendencia 14 días", value: formatPercentTrend(trend14), helper: overview?.trend_label ?? "variación reciente", icon: TrendingUp },
    { label: "Alertas tempranas", value: formatNumber(overview?.early_warning_locations), helper: `${formatNumber(overview?.high_locations)} en riesgo alto/crítico`, icon: Siren },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map(({ label, value, helper, icon: Icon }) => (
        <Card key={label} className="p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{label}</p>
            <Icon className="h-4 w-4 shrink-0 text-sentinel-600" />
          </div>
          <div className="mt-3 min-h-8 text-xl font-bold text-slate-950">{value}</div>
          <p className="mt-1 text-xs text-slate-500">{helper}</p>
        </Card>
      ))}
      <Card className="p-4 sm:col-span-2 xl:col-span-2">
        <p className="text-sm text-slate-500">Promedio viral global</p>
        <div className="mt-3 text-xl font-bold text-slate-950">{formatScientific(overview?.average_viral_load)}</div>
        <p className="mt-1 text-xs text-slate-500">gc/L promedio en mediciones cargadas</p>
      </Card>
    </div>
  );
}
