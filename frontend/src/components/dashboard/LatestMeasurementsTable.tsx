import { Measurement } from "../../types/measurement";
import { formatDate, formatNumber, formatScientific } from "../../utils/formatters";
import { Badge } from "../ui/Badge";

export function LatestMeasurementsTable({ rows }: { rows: Measurement[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Fecha</th>
            <th className="px-4 py-3">Ubicacion</th>
            <th className="px-4 py-3">Ciudad</th>
            <th className="px-4 py-3">Carga viral</th>
            <th className="px-4 py-3">Casos</th>
            <th className="px-4 py-3">Riesgo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row, index) => (
            <tr key={`${row.id ?? row.location_name}-${index}`}>
              <td className="px-4 py-3 text-slate-600">{formatDate(row.sample_date)}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{row.location_name}</td>
              <td className="px-4 py-3 text-slate-600">{row.city ?? "-"}</td>
              <td className="px-4 py-3 text-slate-600">{formatScientific(row.viral_concentration_gc_l)}</td>
              <td className="px-4 py-3 text-slate-600">{formatNumber(row.clinical_cases)}</td>
              <td className="px-4 py-3"><Badge risk={row.risk_level} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
