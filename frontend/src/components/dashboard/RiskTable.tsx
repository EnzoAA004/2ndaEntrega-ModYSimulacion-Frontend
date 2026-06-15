import { RiskResult } from "../../types/analytics";
import { formatDate, formatNumber, formatPercentTrend, formatScientific } from "../../utils/formatters";
import { Badge } from "../ui/Badge";

export function RiskTable({ rows }: { rows: RiskResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Ubicacion</th>
            <th className="px-4 py-3">Ultima fecha</th>
            <th className="px-4 py-3">Carga viral</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Tend. 7d</th>
            <th className="px-4 py-3">Tend. 14d</th>
            <th className="px-4 py-3">Riesgo</th>
            <th className="px-4 py-3">Alerta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.location_name} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="font-medium text-slate-900">{row.location_name}</div>
                <div className="text-xs text-slate-500">{row.city ?? "-"} · {formatNumber(row.samples)} muestras</div>
              </td>
              <td className="px-4 py-3 text-slate-600">{formatDate(row.latest_sample_date)}</td>
              <td className="px-4 py-3 text-slate-600">{formatScientific(row.latest_viral_concentration_gc_l)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(row.risk_score, 1)}/100</td>
              <td className="px-4 py-3 text-slate-600">{formatPercentTrend(row.trend_7d)}</td>
              <td className="px-4 py-3 text-slate-600">{formatPercentTrend(row.trend_14d)}</td>
              <td className="px-4 py-3"><Badge risk={row.risk_level} /></td>
              <td className="px-4 py-3">{row.early_warning ? <Badge tone="red">Activa</Badge> : <Badge tone="green">Normal</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
