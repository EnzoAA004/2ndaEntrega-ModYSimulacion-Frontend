import { Badge } from "../ui/Badge";
import { formatNumber, formatPercentTrend, formatScientific } from "../../utils/formatters";

export function PredictionRankingPanel({ rows }: { rows: any[] }) {
  return (
    <div className="space-y-3">
      {rows.slice(0, 5).map((row) => (
        <div key={row.location_name} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-900">{row.location_name}</p>
              <p className="mt-1 text-xs text-slate-500">Score predictivo {formatNumber(row.predictive_score, 1)} · cambio {formatPercentTrend(row.projected_change_percent)}</p>
            </div>
            <Badge risk={row.forecast_risk_level} />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600">
            <div className="rounded-lg bg-slate-50 p-2"><span className="block uppercase text-slate-400">Máximo</span>{formatScientific(row.max_predicted_viral_concentration_gc_l)}</div>
            <div className="rounded-lg bg-slate-50 p-2"><span className="block uppercase text-slate-400">Duplicación</span>{row.doubling_time_days ? `${formatNumber(row.doubling_time_days, 1)} días` : "No aplica"}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
