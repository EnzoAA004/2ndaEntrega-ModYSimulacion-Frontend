import { BifurcationChart } from "../charts/BifurcationChart";
import { PhaseDiagramChart } from "../charts/PhaseDiagramChart";
import { SimulationTimeSeriesChart } from "../charts/SimulationTimeSeriesChart";
import { SimulationResult } from "../../types/simulation";
import { formatNumber, formatScientific } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import { Card, CardTitle } from "../ui/Card";

interface Props {
  result?: SimulationResult;
  kind?: "time" | "bifurcation" | "phase";
}

export function SimulationResultPanel({ result, kind = "time" }: Props) {
  if (!result) {
    return (
      <Card className="flex min-h-80 items-center justify-center text-center text-sm text-slate-500">
        Ejecuta un modelo para visualizar resultados, estabilidad e interpretacion.
      </Card>
    );
  }
  const stability = typeof result.stability === "string" ? result.stability : result.stability?.classification;
  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <CardTitle>Resultado del modelo</CardTitle>
          <div className="flex flex-wrap gap-2">
            {result.risk?.risk_level && <Badge risk={result.risk.risk_level} />}
            {stability && <Badge tone="cyan">{stability}</Badge>}
          </div>
        </div>
        {kind === "bifurcation" ? <BifurcationChart result={result} /> : kind === "phase" ? <PhaseDiagramChart result={result} /> : <SimulationTimeSeriesChart result={result} />}
      </Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Equilibrios</p>
          <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{JSON.stringify(result.equilibria ?? "-", null, 2)}</pre>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Metricas</p>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>Max. infectados: {formatNumber(result.max_infected, 1)}</p>
            <p>Max. carga viral: {formatScientific(result.max_viral_load)}</p>
            <p>Riesgo: {formatNumber(result.risk?.risk_score, 2)}</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Autovalores</p>
          <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{JSON.stringify(result.eigenvalues ?? (typeof result.stability === "object" ? result.stability.eigenvalues : "-"), null, 2)}</pre>
        </Card>
      </div>
      {result.interpretation && (
        <Card>
          <CardTitle>Interpretacion</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">{result.interpretation}</p>
        </Card>
      )}
    </div>
  );
}
