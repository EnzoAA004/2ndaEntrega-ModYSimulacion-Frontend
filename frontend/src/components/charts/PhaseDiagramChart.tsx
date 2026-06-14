import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { SimulationResult } from "../../types/simulation";
import { getPhaseData } from "../../utils/chartUtils";

export function PhaseDiagramChart({ result }: { result?: SimulationResult }) {
  const data = getPhaseData(result);
  const equilibria = Array.isArray(result?.equilibria) ? result?.equilibria as Array<Record<string, number>> : [];
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="I" name="Infectados" type="number" />
          <YAxis dataKey="V" name="Carga viral" type="number" />
          <ZAxis dataKey="magnitude" range={[20, 100]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Campo vectorial simplificado" data={data} fill="#0891b2" fillOpacity={0.55} />
          <Scatter name="Equilibrios" data={equilibria} fill="#dc2626" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
