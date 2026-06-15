import { BifurcationChart } from "../charts/BifurcationChart";
import { PhaseDiagramChart } from "../charts/PhaseDiagramChart";
import { SimulationTimeSeriesChart } from "../charts/SimulationTimeSeriesChart";
import { MethodComparisonRow, SimulationResult } from "../../types/simulation";
import { formatNumber, formatScientific } from "../../utils/formatters";
import { Badge } from "../ui/Badge";
import { Card, CardTitle } from "../ui/Card";

interface Props {
  result?: SimulationResult;
  kind?: "time" | "bifurcation" | "phase";
}

interface ScenarioRow {
  name?: string;
  final_I?: number;
  final_V?: number;
  max_I?: number;
  max_V?: number;
  max_I_time?: number;
  max_V_time?: number;
  risk?: { risk_level?: string; risk_score?: number };
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
  const scenarios = (result as unknown as { scenarios?: ScenarioRow[] }).scenarios ?? [];
  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Resultado del modelo</CardTitle>
            <p className="mt-1 text-sm text-slate-500">{result.model_type ?? "modelo"} · método {result.method_used ?? "analítico"}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {result.risk?.risk_level && <Badge risk={result.risk.risk_level} />}
            {stability && <Badge tone="cyan">{stability}</Badge>}
          </div>
        </div>
        {kind === "bifurcation" ? <BifurcationChart result={result} /> : kind === "phase" ? <PhaseDiagramChart result={result} /> : <SimulationTimeSeriesChart result={result} />}
      </Card>

      <QualitativeGraphGuide kind={kind} stability={stability} result={result} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Equilibrios</p>
          <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{JSON.stringify(result.equilibria ?? "-", null, 2)}</pre>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Metricas</p>
          <div className="mt-2 space-y-1 text-sm text-slate-700">
            <p>Max. infectados: {formatNumber(result.max_infected, 1)}</p>
            <p>t max infectados: {formatNumber(result.max_infection_time, 1)}</p>
            <p>Max. carga viral: {formatScientific(result.max_viral_load)}</p>
            <p>t max viral: {formatNumber(result.max_viral_load_time, 1)}</p>
            <p>Riesgo: {formatNumber(result.risk?.risk_score, 2)}</p>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estabilidad / autovalores</p>
          <p className="mt-2 text-sm font-semibold text-slate-900">{stability ?? "-"}</p>
          <pre className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-xs text-slate-700">{JSON.stringify(result.eigenvalues ?? (typeof result.stability === "object" ? result.stability.eigenvalues : "-"), null, 2)}</pre>
        </Card>
      </div>

      {scenarios.length ? <ScenarioTable rows={scenarios} /> : null}
      {result.method_comparison?.rows?.length ? <MethodComparisonTable rows={result.method_comparison.rows} /> : null}

      {result.interpretation && (
        <Card>
          <CardTitle>Interpretacion</CardTitle>
          <p className="mt-2 text-sm leading-6 text-slate-600">{result.interpretation}</p>
          {typeof result.stability === "object" && result.stability.explanation ? <p className="mt-2 text-sm leading-6 text-slate-600">{String(result.stability.explanation)}</p> : null}
        </Card>
      )}
    </div>
  );
}

function QualitativeGraphGuide({ kind, stability, result }: { kind: "time" | "bifurcation" | "phase"; stability?: string; result: SimulationResult }) {
  const cards = kind === "phase" ? [
    ["Campo vectorial", "Las flechas indican hacia dónde evoluciona el sistema desde cada estado inicial."],
    ["Nulclinas", "Sobre una nulclina una variable tiene derivada nula; sus cortes ubican equilibrios."],
    ["Estabilidad", stability ? `Clasificación local: ${stability}.` : "Se interpreta con autovalores y dirección del flujo."],
  ] : kind === "bifurcation" ? [
    ["Parámetro crítico", "La línea de umbral marca el valor donde cambia la cantidad o estabilidad de equilibrios."],
    ["Ramas", "Azul representa estabilidad; rojo representa inestabilidad o pérdida de estabilidad."],
    ["Aplicación", "Permite leer cuándo un aumento de beta, gamma u otro parámetro activa un régimen de brote."],
  ] : [
    ["Evolución temporal", "Permite ver convergencia, crecimiento, amortiguamiento, saturación u oscilaciones."],
    ["Máximos", "Las líneas verticales señalan el máximo de infectados o carga viral cuando el backend lo calcula."],
    ["Comparación numérica", result.method_comparison?.rows?.length ? "Euler, Heun y RK4 se comparan para analizar precisión y estabilidad numérica." : "Se puede comparar con otros métodos o escenarios si el modelo lo habilita."],
  ];
  return (
    <Card className="border-sentinel-100 bg-gradient-to-r from-sentinel-50 to-white">
      <CardTitle>Lectura cualitativa del gráfico</CardTitle>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {cards.map(([title, body]) => (
          <div key={title} className="rounded-xl bg-white/80 p-4 ring-1 ring-slate-200">
            <p className="text-sm font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

function ScenarioTable({ rows }: { rows: ScenarioRow[] }) {
  return (
    <Card>
      <CardTitle>Comparacion de escenarios</CardTitle>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Escenario</th><th className="px-4 py-3">Max I</th><th className="px-4 py-3">Max V</th><th className="px-4 py-3">Final I</th><th className="px-4 py-3">Final V</th><th className="px-4 py-3">Riesgo</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => <tr key={row.name}><td className="px-4 py-3 font-medium text-slate-900">{row.name}</td><td className="px-4 py-3 text-slate-600">{formatNumber(row.max_I, 1)}</td><td className="px-4 py-3 text-slate-600">{formatScientific(row.max_V)}</td><td className="px-4 py-3 text-slate-600">{formatNumber(row.final_I, 1)}</td><td className="px-4 py-3 text-slate-600">{formatScientific(row.final_V)}</td><td className="px-4 py-3"><Badge risk={row.risk?.risk_level} /></td></tr>)}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function MethodComparisonTable({ rows }: { rows: MethodComparisonRow[] }) {
  return (
    <Card>
      <CardTitle>Comparacion de metodos numericos</CardTitle>
      <p className="mt-1 text-sm text-slate-500">Euler, Heun y RK4 se ejecutan con los mismos parametros para comparar estabilidad numerica y valores finales.</p>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Metodo</th><th className="px-4 py-3">Final V</th><th className="px-4 py-3">Max V</th><th className="px-4 py-3">t Max V</th><th className="px-4 py-3">Final I</th><th className="px-4 py-3">Max I</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row) => (
              <tr key={row.method}>
                <td className="px-4 py-3 font-medium text-slate-900">{row.label ?? row.method}</td>
                <td className="px-4 py-3 text-slate-600">{formatScientific(row.final_V ?? row.final_value)}</td>
                <td className="px-4 py-3 text-slate-600">{formatScientific(row.max_V ?? row.max_value)}</td>
                <td className="px-4 py-3 text-slate-600">{formatNumber(row.max_V_time ?? row.max_time, 1)}</td>
                <td className="px-4 py-3 text-slate-600">{formatNumber(row.final_I, 1)}</td>
                <td className="px-4 py-3 text-slate-600">{formatNumber(row.max_I, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
