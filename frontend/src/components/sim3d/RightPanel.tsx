import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { useSim3DStore } from '../../store/sim3dStore';
import { getEquilibria } from '../simulation3d/useODESolver';

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: '#0f1e3a', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-1">
        {label}
      </div>
      <div
        className="text-xl font-bold font-mono tabular-nums"
        style={{ color, textShadow: `0 0 10px ${color}66` }}
      >
        {value}
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5 font-mono">{sub}</div>
    </div>
  );
}

function darkTooltipStyle() {
  return {
    contentStyle: {
      background: '#0f1e3a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '6px',
      fontSize: '10px',
      color: '#cbd5e1',
    },
    labelStyle: { color: '#94a3b8', fontSize: '10px' },
    cursor: { stroke: '#334466' },
  };
}

export function RightPanel() {
  const { params, trajectory, vMax, tMax, currentTime } = useSim3DStore();
  const eq = getEquilibria(params);
  const R0 = params.beta / params.gamma;

  const { peakI, peakITime, peakV, peakVTime, timeToEq } = useMemo(() => {
    let pI = 0, pIt = 0, pV = 0, pVt = 0;
    for (const pt of trajectory) {
      if (pt.I > pI) { pI = pt.I; pIt = pt.t; }
      if (pt.V > pV) { pV = pt.V; pVt = pt.t; }
    }
    // Time to equilibrium: when I stays within 1% of I*
    const Istar = eq.endemic?.I ?? 0;
    let teq = tMax;
    if (Istar > 0) {
      for (const pt of trajectory) {
        if (Math.abs(pt.I - Istar) / Istar < 0.02) { teq = pt.t; break; }
      }
    }
    return { peakI: pI, peakITime: pIt, peakV: pV, peakVTime: pVt, timeToEq: teq };
  }, [trajectory, eq, tMax]);

  // Downsample trajectory for charts (max 120 points)
  const chartData = useMemo(() => {
    const step = Math.max(1, Math.floor(trajectory.length / 120));
    return trajectory.filter((_, i) => i % step === 0).map((pt) => ({
      t: Math.round(pt.t),
      I: Math.round(pt.I),
      V: Math.round(pt.V),
    }));
  }, [trajectory]);

  const currentChartTime = Math.round(currentTime);
  const tt = darkTooltipStyle();

  const explanation = useMemo(() => {
    if (R0 < 1) return {
      icon: '🟢', color: '#22cc55',
      title: 'Sistema bajo control',
      body: `Con R₀ = ${R0.toFixed(2)} < 1, la tasa de recuperación (γ=${params.gamma.toFixed(2)}) supera la de transmisión (β=${params.beta.toFixed(2)}). La enfermedad desaparece naturalmente y la carga viral converge a cero.`,
      action: 'Incrementá β o reducí γ para cruzar el umbral R₀=1.',
    };
    if (R0 < 2) return {
      icon: '🟡', color: '#eab308',
      title: 'Brote activo',
      body: `Con R₀ = ${R0.toFixed(2)}, el sistema converge al equilibrio endémico: I*=${eq.endemic?.I.toFixed(0) ?? '-'} infectados, V*=${eq.endemic?.V.toFixed(0) ?? '-'} UFC/L. La trayectoria desciende el paisaje energético hasta el atractor.`,
      action: `Reducí β por debajo de ${params.gamma.toFixed(2)} para eliminar el equilibrio endémico.`,
    };
    return {
      icon: '🔴', color: '#ef4444',
      title: 'Epidemia crítica',
      body: `Con R₀ = ${R0.toFixed(2)} >> 1, la transmisión domina ampliamente la recuperación. El pico de infectados alcanza ${peakI.toFixed(0)} en el día ${peakITime.toFixed(0)}. Se necesita intervención urgente.`,
      action: `Hay que reducir β un ${((1 - 1/R0)*100).toFixed(0)}% para llevar R₀ < 1.`,
    };
  }, [R0, params, eq, peakI, peakITime]);

  return (
    <aside
      className="w-[268px] shrink-0 flex flex-col h-full overflow-y-auto"
      style={{ background: '#0b1529', borderLeft: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="p-4 flex-1 space-y-4">

        {/* KPIs */}
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Indicadores clave</div>
          <div className="grid grid-cols-1 gap-2">
            <KpiCard
              label="Número reproductivo R₀"
              value={R0.toFixed(2)}
              sub={R0 < 1 ? 'Controlado' : R0 < 2 ? 'Brote activo' : 'Crítico'}
              color={R0 < 1 ? '#22cc55' : R0 < 2 ? '#eab308' : '#ef4444'}
            />
            <div className="grid grid-cols-2 gap-2">
              <KpiCard
                label="Pico infectados"
                value={peakI > 999 ? `${(peakI/1000).toFixed(1)}K` : peakI.toFixed(0)}
                sub={`día ${peakITime.toFixed(0)}`}
                color="#06b6d4"
              />
              <KpiCard
                label="Pico carga viral"
                value={peakV > 999 ? `${(peakV/1000).toFixed(1)}K` : peakV.toFixed(0)}
                sub={`día ${peakVTime.toFixed(0)}`}
                color="#a855f7"
              />
            </div>
            {eq.endemic && (
              <div className="grid grid-cols-2 gap-2">
                <KpiCard label="I* endémico" value={eq.endemic.I.toFixed(0)} sub="equilibrio" color="#ffcc00" />
                <KpiCard label="V* endémico" value={eq.endemic.V.toFixed(0)} sub="UFC/L" color="#ffcc00" />
              </div>
            )}
          </div>
        </div>

        {/* I(t) chart */}
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
            I(t) — Infectados
          </div>
          <div style={{ background: '#0a1628', borderRadius: 8, padding: '8px 4px 4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="t" stroke="#334466" tick={{ fontSize: 8, fill: '#4a6080' }} />
                <YAxis stroke="#334466" tick={{ fontSize: 8, fill: '#4a6080' }} />
                <Tooltip {...tt} formatter={(v: number) => [v.toLocaleString(), 'I']} labelFormatter={(l) => `t=${l}d`} />
                {currentChartTime > 0 && (
                  <ReferenceLine x={currentChartTime} stroke="#06b6d4" strokeWidth={1.5} strokeDasharray="3 3" />
                )}
                <Line type="monotone" dataKey="I" stroke="#06b6d4" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* V(t) chart */}
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
            V(t) — Carga viral en aguas
          </div>
          <div style={{ background: '#0a1628', borderRadius: 8, padding: '8px 4px 4px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="t" stroke="#334466" tick={{ fontSize: 8, fill: '#4a6080' }} />
                <YAxis stroke="#334466" tick={{ fontSize: 8, fill: '#4a6080' }} />
                <Tooltip {...tt} formatter={(v: number) => [v.toLocaleString(), 'V']} labelFormatter={(l) => `t=${l}d`} />
                {currentChartTime > 0 && (
                  <ReferenceLine x={currentChartTime} stroke="#22cc55" strokeWidth={1.5} strokeDasharray="3 3" />
                )}
                <Line type="monotone" dataKey="V" stroke="#22cc55" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Explanation */}
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: '#0f1e3a', border: `1px solid ${explanation.color}22` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">{explanation.icon}</span>
            <span className="text-xs font-bold" style={{ color: explanation.color }}>
              {explanation.title}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">{explanation.body}</p>
          <div
            className="rounded-md p-2 text-[10px] text-slate-300"
            style={{ background: '#0a1628', borderLeft: `2px solid ${explanation.color}` }}
          >
            💡 {explanation.action}
          </div>
        </div>

        {/* Phase state */}
        <div>
          <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Matemáticas</div>
          <div className="space-y-1.5 text-[10px] font-mono text-slate-400"
            style={{ background: '#0a1628', borderRadius: 8, padding: '10px', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div>dI/dt = <span className="text-[#06b6d4]">β</span>·I·(1−I/<span className="text-[#a855f7]">K</span>) − <span className="text-[#22cc55]">γ</span>·I</div>
            <div>dV/dt = <span className="text-[#f59e0b]">α</span>·I − (<span className="text-[#ef4444]">k</span>+<span className="text-[#ec4899]">d</span>)·V</div>
            <div className="border-t border-white/[0.06] pt-1.5 mt-1.5">
              R₀ = <span className="text-[#06b6d4]">β</span>/<span className="text-[#22cc55]">γ</span> = <span className="text-white font-bold">{R0.toFixed(3)}</span>
            </div>
            {eq.endemic && (
              <>
                <div>I* = K·(1−γ/β) = <span className="text-[#ffcc00]">{eq.endemic.I.toFixed(0)}</span></div>
                <div>V* = α·I*/(k+d) = <span className="text-[#ffcc00]">{eq.endemic.V.toFixed(0)}</span></div>
              </>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
}
