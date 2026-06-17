import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useEpidemicStore } from '../../store/epidemicStore';
import { computeR0 } from '../../simulation/agentEngine';

const COLORS = {
  S: '#22c55e',
  I: '#ef4444',
  R: '#f59e0b',
  V: '#3b82f6',
};

export function EpidemicCurves() {
  const history = useEpidemicStore((s) => s.history);
  const params = useEpidemicStore((s) => s.params);
  const R0 = computeR0(params);

  // Show every Nth point if too many
  const displayed = history.length > 200
    ? history.filter((_, i) => i % Math.ceil(history.length / 200) === 0)
    : history;

  return (
    <div
      className="flex items-stretch flex-shrink-0"
      style={{
        height: 120,
        background: 'rgba(8,14,31,0.92)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Legend */}
      <div className="flex flex-col justify-center px-4 gap-1.5 flex-shrink-0" style={{ width: 140 }}>
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold mb-1">📈 Evolución</p>
        {(['S', 'I', 'R', 'V'] as const).map((k) => (
          <div key={k} className="flex items-center gap-2">
            <div className="w-3 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[k] }} />
            <span className="text-[11px] text-slate-400">
              {{ S: 'Susceptibles', I: 'Infectados', R: 'Recuperados', V: 'Vacunados' }[k]}
            </span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="flex-1 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayed} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: '#475569', fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, fontSize: 11 }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color: '#cbd5e1' }}
              formatter={(v: number) => v.toLocaleString()}
              labelFormatter={(l: number) => `Día ${l}`}
            />
            <Area type="monotone" dataKey="S" stroke={COLORS.S} strokeWidth={1.5} fill="url(#gS)" dot={false} />
            <Area type="monotone" dataKey="I" stroke={COLORS.I} strokeWidth={2} fill="url(#gI)" dot={false} />
            <Area type="monotone" dataKey="R" stroke={COLORS.R} strokeWidth={1.5} fill="url(#gR)" dot={false} />
            <Area type="monotone" dataKey="V" stroke={COLORS.V} strokeWidth={1.5} fill="url(#gV)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* R₀ trend */}
      <div className="flex flex-col justify-center px-4 flex-shrink-0 border-l border-white/8" style={{ width: 120 }}>
        <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1">Número Rt</p>
        <div
          className="text-3xl font-bold font-mono"
          style={{
            color: R0 > 2 ? '#ef4444' : R0 > 1 ? '#eab308' : '#22c55e',
            textShadow: `0 0 12px ${R0 > 2 ? '#ef4444' : R0 > 1 ? '#eab308' : '#22c55e'}66`,
          }}
        >
          {R0.toFixed(2)}
        </div>
        <div
          className="text-[10px] mt-1 px-2 py-0.5 rounded-full text-center font-bold"
          style={{
            background: R0 > 1 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
            color: R0 > 1 ? '#ef4444' : '#22c55e',
            border: `1px solid ${R0 > 1 ? '#ef444440' : '#22c55e40'}`,
          }}
        >
          {R0 > 2 ? 'Epidemia' : R0 > 1 ? 'Creciendo' : 'Controlado'}
        </div>
      </div>
    </div>
  );
}
