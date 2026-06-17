import { useEffect, useRef, useState } from 'react';
import { useEpidemicStore } from '../../store/epidemicStore';
import { computeR0, TICKS_PER_DAY } from '../../simulation/agentEngine';

function AnimatedCount({ value, color }: { value: number; color: string }) {
  const [displayed, setDisplayed] = useState(value);
  const fromRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    const start = performance.now();
    const dur = 300;

    function tick(now: number) {
      const p = Math.min(1, (now - start) / dur);
      setDisplayed(Math.round(from + (to - from) * p));
      if (p < 1) { rafRef.current = requestAnimationFrame(tick); }
      else { fromRef.current = to; }
    }
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]);

  return (
    <span className="text-xl font-bold font-mono" style={{ color }}>
      {displayed.toLocaleString()}
    </span>
  );
}

interface StatChipProps {
  emoji: string;
  label: string;
  value: number;
  color: string;
}

function StatChip({ emoji, label, value, color }: StatChipProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm"
      style={{ background: 'rgba(255,255,255,0.04)' }}>
      <span className="text-xl">{emoji}</span>
      <div>
        <div className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{label}</div>
        <AnimatedCount value={value} color={color} />
      </div>
    </div>
  );
}

export function StatsHUD() {
  const counts = useEpidemicStore((s) => s.counts);
  const tick = useEpidemicStore((s) => s.tick);
  const params = useEpidemicStore((s) => s.params);
  const day = Math.floor(tick / TICKS_PER_DAY);
  const R0 = computeR0(params);
  const r0Color = R0 > 2 ? '#ef4444' : R0 > 1 ? '#eab308' : '#22c55e';

  return (
    <div
      className="flex items-center justify-between px-6 py-3 border-b border-white/10 flex-shrink-0"
      style={{ background: 'rgba(8,14,31,0.85)', backdropFilter: 'blur(12px)' }}
    >
      {/* Day */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm">📅</span>
        <span className="font-mono text-2xl font-bold text-white">Día {day}</span>
      </div>

      {/* Stat chips */}
      <div className="flex items-center gap-3">
        <StatChip emoji="😊" label="Susceptibles" value={counts.S} color="#22c55e" />
        <StatChip emoji="🦠" label="Infectados" value={counts.I} color="#ef4444" />
        <StatChip emoji="💪" label="Recuperados" value={counts.R} color="#f59e0b" />
        <StatChip emoji="💉" label="Vacunados" value={counts.V} color="#3b82f6" />
      </div>

      {/* R₀ badge */}
      <div className="text-right">
        <div
          style={{
            color: r0Color,
            textShadow: `0 0 18px ${r0Color}88`,
            fontSize: '1.75rem',
            fontWeight: 'bold',
            fontFamily: 'monospace',
            lineHeight: 1,
          }}
        >
          R₀ = {R0.toFixed(1)}
        </div>
        <div className="text-xs text-slate-400 mt-0.5 max-w-[180px] text-right">
          {R0 > 1
            ? `Cada infectado contagia a ~${R0.toFixed(1)} personas`
            : 'La epidemia está desapareciendo'}
        </div>
      </div>
    </div>
  );
}
