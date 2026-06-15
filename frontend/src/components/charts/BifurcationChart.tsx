import { CartesianGrid, Legend, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { SimulationResult } from "../../types/simulation";
import { getBifurcationData } from "../../utils/chartUtils";
import { formatNumber } from "../../utils/formatters";

export function BifurcationChart({ result }: { result?: SimulationResult }) {
  const data = getBifurcationData(result);
  const stable = data.filter((p) => p.stable === true || p.stability === "stable");
  const unstable = data.filter((p) => p.stable === false || p.stability === "unstable");
  const threshold = Number(result?.parameters?.threshold ?? result?.parameters?.gamma ?? result?.parameters?.beta_threshold);
  const maxParam = Math.max(...data.map((p) => Number(p.parameter_value)), threshold || 0);
  return (
    <div className="h-96">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 20, right: 28, bottom: 12, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="parameter_value" name="Parametro" type="number" label={{ value: String(result?.parameters?.parameter_name ?? "parámetro"), position: "insideBottom", offset: -4 }} />
          <YAxis dataKey="equilibrium_value" name="Equilibrio I*" type="number" tickFormatter={(value) => formatNumber(Number(value), 0)} />
          <ZAxis range={[38, 38]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value, name) => [formatNumber(Number(value), 2), String(name)]} />
          <Legend />
          {Number.isFinite(threshold) && (
            <>
              <ReferenceLine x={threshold} stroke="#f97316" strokeDasharray="6 6" label="umbral beta = gamma" />
              <ReferenceArea x1={threshold} x2={maxParam} fill="#fef3c7" fillOpacity={0.25} label="zona de brote" />
            </>
          )}
          <Scatter name="Equilibrio estable" data={stable} fill="#0891b2" />
          <Scatter name="Equilibrio inestable" data={unstable} fill="#dc2626" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
