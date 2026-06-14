import { Area, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Measurement } from "../../types/measurement";
import { formatDate, formatScientific } from "../../utils/formatters";

export function ViralLoadChart({ data }: { data: Measurement[] }) {
  const rows = data.map((item) => ({
    date: item.sample_date,
    viral: item.viral_concentration_gc_l ?? 0,
    moving: (item as unknown as { moving_average_7d?: number }).moving_average_7d,
    cases: item.clinical_cases,
  }));
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 12, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tickFormatter={formatDate} minTickGap={28} />
          <YAxis yAxisId="left" tickFormatter={formatScientific} />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip labelFormatter={formatDate} formatter={(value: number) => formatScientific(value)} />
          <Legend />
          <Area yAxisId="left" type="monotone" dataKey="viral" name="Carga viral gc/L" fill="#cffafe" stroke="#0891b2" strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="moving" name="Media movil 7d" stroke="#0f766e" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="cases" name="Casos clinicos" stroke="#f97316" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
