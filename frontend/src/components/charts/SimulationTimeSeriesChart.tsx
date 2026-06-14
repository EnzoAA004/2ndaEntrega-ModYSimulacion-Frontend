import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SimulationResult } from "../../types/simulation";
import { combineTimeSeries } from "../../utils/chartUtils";
import { formatScientific } from "../../utils/formatters";

const colors = ["#0891b2", "#f97316", "#16a34a", "#7c3aed", "#dc2626"];

export function SimulationTimeSeriesChart({ result }: { result?: SimulationResult }) {
  const rows = combineTimeSeries(result);
  const keys = Object.keys(result?.series ?? {});
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={rows}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="t" label={{ value: "Tiempo", position: "insideBottom", offset: -4 }} />
          <YAxis tickFormatter={formatScientific} />
          <Tooltip formatter={(value: number) => formatScientific(value)} />
          <Legend />
          {keys.map((key, index) => (
            <Line key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} strokeWidth={2} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
