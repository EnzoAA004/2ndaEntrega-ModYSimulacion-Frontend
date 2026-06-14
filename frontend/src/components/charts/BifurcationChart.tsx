import { CartesianGrid, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { SimulationResult } from "../../types/simulation";
import { getBifurcationData } from "../../utils/chartUtils";

export function BifurcationChart({ result }: { result?: SimulationResult }) {
  const data = getBifurcationData(result);
  const stable = data.filter((p) => p.stable === true || p.stability === "stable");
  const unstable = data.filter((p) => p.stable === false || p.stability === "unstable");
  const threshold = Number(result?.parameters?.gamma ?? result?.parameters?.beta_threshold);
  return (
    <div className="h-80">
      <ResponsiveContainer>
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="parameter_value" name="Parametro" type="number" />
          <YAxis dataKey="equilibrium_value" name="Equilibrio" type="number" />
          <ZAxis range={[45, 45]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          {Number.isFinite(threshold) && <ReferenceLine x={threshold} stroke="#f97316" label="umbral" />}
          <Scatter name="Estable" data={stable} fill="#0891b2" />
          <Scatter name="Inestable" data={unstable.length ? unstable : data.filter((p) => !stable.includes(p))} fill="#dc2626" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
