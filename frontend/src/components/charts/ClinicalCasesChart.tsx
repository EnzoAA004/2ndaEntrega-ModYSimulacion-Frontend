import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Measurement } from "../../types/measurement";
import { formatDate, formatNumber } from "../../utils/formatters";

export function ClinicalCasesChart({ data }: { data: Measurement[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="sample_date" tickFormatter={formatDate} />
          <YAxis tickFormatter={(v) => formatNumber(v)} />
          <Tooltip labelFormatter={formatDate} />
          <Line type="monotone" dataKey="clinical_cases" name="Casos clinicos" stroke="#f97316" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
