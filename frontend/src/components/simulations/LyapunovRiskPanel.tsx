import { SimulationResult } from "../../types/simulation";
import { RiskTrendChart } from "../charts/RiskTrendChart";
import { Badge } from "../ui/Badge";
import { Card, CardTitle } from "../ui/Card";

export function LyapunovRiskPanel({ result }: { result?: SimulationResult }) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <CardTitle>Region segura / Lyapunov</CardTitle>
        {result?.lyapunov && <Badge tone={result.lyapunov.increasing ? "red" : "green"}>{result.lyapunov.increasing ? "Riesgo creciente" : "Riesgo decreciente"}</Badge>}
      </div>
      <p className="text-sm leading-6 text-slate-600">
        Funcion de riesgo: <span className="font-semibold">V_risk(I,V) = a max(0, I - I_safe)^2 + b max(0, V - V_safe)^2</span>. El backend puede devolver su trayectoria para estimar violaciones de region segura.
      </p>
      {result?.lyapunov?.values?.length ? (
        <div className="mt-4">
          <RiskTrendChart time={result.lyapunov.time} values={result.lyapunov.values} />
          <p className="text-sm text-slate-600">Violaciones detectadas: {result.lyapunov.safe_region_violations ?? 0}</p>
        </div>
      ) : (
        <p className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-500">Sin serie V_risk(t) en la respuesta actual.</p>
      )}
    </Card>
  );
}
