import { SimulationResult } from "../../types/simulation";
import { formatNumber, formatScientific } from "../../utils/formatters";
import { RiskTrendChart } from "../charts/RiskTrendChart";
import { Badge } from "../ui/Badge";
import { Card, CardTitle } from "../ui/Card";

export function LyapunovRiskPanel({ result }: { result?: SimulationResult }) {
  const lyapunov = result?.lyapunov;
  const tone = lyapunov?.increasing ? "red" : lyapunov?.trend === "decreasing" ? "green" : "amber";
  const label = lyapunov?.increasing ? "Riesgo creciente" : lyapunov?.trend === "decreasing" ? "Riesgo decreciente" : "Riesgo estable";
  const totalPoints = lyapunov?.values?.length ?? 0;
  const violations = lyapunov?.safe_region_violations ?? 0;
  const safeRatio = totalPoints ? Math.max(0, Math.min(100, ((totalPoints - violations) / totalPoints) * 100)) : 0;
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <CardTitle>Region segura / Lyapunov</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Control cualitativo de invarianza, escape y permanencia dentro de umbrales seguros.</p>
        </div>
        {lyapunov && <Badge tone={tone}>{label}</Badge>}
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Funcion de riesgo: <span className="font-semibold">V_risk(I,V) = a max(0, I - I_safe)^2 + b max(0, V - V_safe)^2</span>. Si la trayectoria mantiene V_risk bajo y no viola umbrales, el sistema permanece en una region operacional segura.
      </p>
      {lyapunov?.values?.length ? (
        <div className="mt-4 space-y-4">
          <RiskTrendChart time={lyapunov.time} values={lyapunov.values} />
          <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-900">Permanencia dentro de region segura</span>
              <span className="text-slate-600">{formatNumber(safeRatio, 1)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-sentinel-600" style={{ width: `${safeRatio}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">Este porcentaje resume cuántos puntos simulados respetan simultáneamente los límites I_safe y V_safe.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="I seguro" value={formatNumber(lyapunov.I_safe, 0)} />
            <Metric label="V seguro" value={formatScientific(lyapunov.V_safe)} />
            <Metric label="Violaciones" value={formatNumber(violations, 0)} />
            <Metric label="Tendencia" value={String(lyapunov.trend ?? "-")} />
          </div>
          {lyapunov.explanation && <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-600">{lyapunov.explanation}</p>}
        </div>
      ) : (
        <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-500">Ejecuta el modelo 2D para obtener una trayectoria V_risk(t) y detectar violaciones de region segura.</p>
      )}
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-slate-50 p-3"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 font-semibold text-slate-900">{value}</p></div>;
}
