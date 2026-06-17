import {
  AreaChart, Area, XAxis, CartesianGrid,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { useEpidemicStore } from '../../store/epidemicStore';

export function EpidemicCurves() {
  const history = useEpidemicStore((s) => s.history);
  const data = history.slice(-150);

  return (
    <div
      className="flex items-center gap-3 border-t flex-shrink-0 px-3"
      style={{ background: '#090f1d', borderColor: 'rgba(255,255,255,0.06)', height: 92 }}
    >
      {/* Rotated label */}
      <div
        className="text-[9px] uppercase tracking-widest text-slate-600 font-semibold shrink-0 select-none"
        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
      >
        Curva epidémica
      </div>

      {/* Chart */}
      <div className="flex-1 h-full py-2 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tick={{ fill: '#475569', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `D${v}`}
              interval="preserveStartEnd"
            />
            <Tooltip
              contentStyle={{
                background: '#0f1e3a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8,
                fontSize: 11,
                color: '#e2e8f0',
                padding: '6px 10px',
              }}
              labelFormatter={(v: number) => `Día ${v}`}
              formatter={(value: number | string | Array<number | string>, name: string | number) => [
                typeof value === 'number' ? Math.round(value).toLocaleString() : String(value),
                String(name),
              ]}
            />
            <Area type="monotone" dataKey="S" name="Sanos"
              stroke="#22c55e" fill="#22c55e" fillOpacity={0.14}
              strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="I" name="Infectados"
              stroke="#ef4444" fill="#ef4444" fillOpacity={0.22}
              strokeWidth={2} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="R" name="Recuperados"
              stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.12}
              strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
            <Area type="monotone" dataKey="V" name="Vacunados"
              stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12}
              strokeWidth={1.5} dot={false} activeDot={{ r: 3, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1.5 shrink-0 pr-1">
        {[
          { color: '#22c55e', label: 'Sanos' },
          { color: '#ef4444', label: 'Infectados' },
          { color: '#f59e0b', label: 'Recuperados' },
          { color: '#3b82f6', label: 'Vacunados' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <div className="w-3 h-0.5 rounded-full" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
