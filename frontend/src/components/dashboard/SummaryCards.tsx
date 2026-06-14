import { Activity, AlertTriangle, MapPin, TrendingUp, Waves } from "lucide-react";
import { Overview } from "../../types/analytics";
import { formatNumber, formatPercentTrend } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

export function SummaryCards({ overview }: { overview?: Overview }) {
  const cards = [
    { label: "Total de mediciones", value: formatNumber(overview?.total_measurements), icon: Waves },
    { label: "Ubicaciones activas", value: formatNumber(overview?.active_locations), icon: MapPin },
    { label: "Ultimo riesgo", value: <Badge risk={overview?.latest_risk_level} />, icon: AlertTriangle },
    { label: "Mayor riesgo", value: overview?.highest_risk_location ?? "-", icon: Activity },
    { label: "Tendencia 14 dias", value: formatPercentTrend(overview?.trend_14d), icon: TrendingUp },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">{label}</p>
            <Icon className="h-4 w-4 text-sentinel-600" />
          </div>
          <div className="mt-3 text-xl font-bold text-slate-950">{value}</div>
        </Card>
      ))}
    </div>
  );
}
