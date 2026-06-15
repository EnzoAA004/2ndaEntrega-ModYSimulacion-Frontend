import { Area, Bar, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Measurement } from "../../types/measurement";
import { formatDate, formatNumber, formatScientific } from "../../utils/formatters";

interface ViralLoadChartProps {
  data: Measurement[];
  highThreshold?: number;
  criticalThreshold?: number;
}

export function ViralLoadChart({ data, highThreshold = 100000, criticalThreshold = 1000000 }: ViralLoadChartProps) {
  const rows = data.map((item) => ({
    date: item.sample_date,
    viral: item.viral_concentration_gc_l ?? 0,
    moving: item.moving_average_7d,
    cases: item.clinical_cases ?? 0,
    rainfall: item.rainfall_mm ?? 0,
  }));
  return (
    <div className="h-96 w-full">
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={{ top: 12, right: 24, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tickFormatter={formatDate} minTickGap={28} />
          <YAxis yAxisId="left" tickFormatter={formatScientific} width={76} />
          <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => formatNumber(Number(value), 0)} />
          <Tooltip
            labelFormatter={formatDate}
            formatter={(value, name) => {
              const numericValue = Number(value);
              const label = String(name);
              if (label.includes("Lluvia")) return [`${formatNumber(numericValue, 1)} mm`, label];
              if (label.includes("Casos")) return [formatNumber(numericValue, 0), label];
              return [formatScientific(numericValue), label];
            }}
          />
          <Legend />
          <ReferenceLine yAxisId="left" y={highThreshold} stroke="#f59e0b" strokeDasharray="6 6" label="Umbral alto" />
          <ReferenceLine yAxisId="left" y={criticalThreshold} stroke="#dc2626" strokeDasharray="6 6" label="Umbral critico" />
          <Bar yAxisId="right" dataKey="rainfall" name="Lluvia mm" fill="#cbd5e1" radius={[4, 4, 0, 0]} opacity={0.55} />
          <Area yAxisId="left" type="monotone" dataKey="viral" name="Carga viral gc/L" fill="#cffafe" stroke="#0891b2" strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="moving" name="Media movil 7d" stroke="#0f766e" strokeWidth={3} dot={false} connectNulls />
          <Line yAxisId="right" type="monotone" dataKey="cases" name="Casos clinicos" stroke="#f97316" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
