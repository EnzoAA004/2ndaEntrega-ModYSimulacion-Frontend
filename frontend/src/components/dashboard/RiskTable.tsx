import { RiskResult } from "../../types/analytics";
import { formatPercentTrend, formatScientific } from "../../utils/formatters";
import { Badge } from "../ui/Badge";

export function RiskTable({ rows }: { rows: RiskResult[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Ubicacion</th>
            <th className="px-4 py-3">Ciudad</th>
            <th className="px-4 py-3">Carga viral</th>
            <th className="px-4 py-3">Tend. 7d</th>
            <th className="px-4 py-3">Tend. 14d</th>
            <th className="px-4 py-3">Riesgo</th>
            <th className="px-4 py-3">Alerta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr key={row.location_name}>
              <td className="px-4 py-3 font-medium text-slate-900">{row.location_name}</td>
              <td className="px-4 py-3 text-slate-600">{row.city ?? "-"}</td>
              <td className="px-4 py-3 text-slate-600">{formatScientific(row.latest_viral_concentration_gc_l)}</td>
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
