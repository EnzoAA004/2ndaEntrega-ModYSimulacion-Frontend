import { useState } from "react";
import { BifurcationForm } from "../components/simulations/BifurcationForm";
import { CalibrationForm } from "../components/simulations/CalibrationForm";
import { InfectionWastewaterForm } from "../components/simulations/InfectionWastewaterForm";
import { LyapunovRiskPanel } from "../components/simulations/LyapunovRiskPanel";
import { NonHomogeneousEventForm } from "../components/simulations/NonHomogeneousEventForm";
import { PhaseDiagramForm } from "../components/simulations/PhaseDiagramForm";
import { ScenarioCompareForm } from "../components/simulations/ScenarioCompareForm";
import { SimulationResultPanel } from "../components/simulations/SimulationResultPanel";
import { ViralDecayForm } from "../components/simulations/ViralDecayForm";
import { PageHeader } from "../components/layout/PageHeader";
import { Card, CardTitle } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { SimulationResult } from "../types/simulation";

const tabs = [
  { id: "decay", label: "Modelo 1D" },
  { id: "infection", label: "Modelo 2D" },
  { id: "event", label: "Evento" },
  { id: "scenario", label: "Escenarios" },
  { id: "calibration", label: "Calibracion" },
  { id: "bifurcation", label: "Bifurcacion" },
  { id: "phase", label: "Fase" },
] as const;

type TabId = typeof tabs[number]["id"];

export function SimulationsPage() {
  const [tab, setTab] = useState<TabId>("decay");
  const [result, setResult] = useState<SimulationResult>();
  const kind = tab === "bifurcation" ? "bifurcation" : tab === "phase" ? "phase" : "time";
  const showResult = tab !== "calibration";
  return (
    <>
      <PageHeader title="Simulaciones dinamicas" description="Ejecuta modelos numericos, calibracion desde datos, comparacion de escenarios, estabilidad, bifurcaciones y regiones seguras." />
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((item) => <Button key={item.id} variant={tab === item.id ? "primary" : "ghost"} onClick={() => { setTab(item.id); setResult(undefined); }}>{item.label}</Button>)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <Card>
          <CardTitle>{tabs.find((item) => item.id === tab)?.label}</CardTitle>
          <p className="mb-4 mt-2 text-sm leading-6 text-slate-600">Los parametros se envian al backend; el frontend visualiza series, estabilidad, escenarios, calibracion e interpretaciones.</p>
          {tab === "decay" && <ViralDecayForm onResult={setResult} />}
          {tab === "infection" && <InfectionWastewaterForm onResult={setResult} />}
          {tab === "event" && <NonHomogeneousEventForm onResult={setResult} />}
          {tab === "scenario" && <ScenarioCompareForm onResult={setResult} />}
          {tab === "calibration" && <CalibrationForm />}
          {tab === "bifurcation" && <BifurcationForm onResult={setResult} />}
          {tab === "phase" && <PhaseDiagramForm onResult={setResult} />}
        </Card>
        <div className="space-y-6">
          {showResult ? <SimulationResultPanel result={result} kind={kind} /> : <Card className="text-sm leading-6 text-slate-600">La calibracion estima parametros desde mediciones históricas y los deja listos para justificar el modelo en el informe.</Card>}
          {showResult && <LyapunovRiskPanel result={result} />}
        </div>
      </div>
    </>
  );
}
