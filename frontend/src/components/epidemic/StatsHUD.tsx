import { useEpidemicStore } from '../../store/epidemicStore';

function StatChip({
  emoji, label, value, color,
}: { emoji: string; label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
      style={{ background: `${color}12`, border: `1px solid ${color}30` }}
    >
      <span className="text-base leading-none">{emoji}</span>
      <div>
        <div className="text-[9px] text-slate-500 leading-none uppercase tracking-wide">{label}</div>
        <div className="text-sm font-black font-mono leading-tight tabular-nums" style={{ color }}>
          {value.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

export function StatsHUD() {
  const counts = useEpidemicStore((s) => s.counts);
  const tick   = useEpidemicStore((s) => s.tick);
  const params = useEpidemicStore((s) => s.params);

  const day = Math.floor(tick / 30);
  const R0 = params.contagion * (1 - params.maskUsage * 0.7) * (1 - params.distancing * 0.65) * 3.5;
  const R0Color = R0 < 1 ? '#22c55e' : R0 < 2 ? '#f59e0b' : '#ef4444';
  const R0Msg =
    R0 < 0.5 ? 'La epidemia desaparece' :
    R0 < 1   ? 'La epidemia baja sola' :
    R0 < 1.5 ? `Cada infectado contagia a ~${R0.toFixed(1)} persona` :
               `Cada infectado contagia a ~${R0.toFixed(1)} personas`;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2 border-b flex-shrink-0 flex-wrap"
      style={{ background: 'rgba(11,22,41,0.97)', borderColor: 'rgba(255,255,255,0.07)' }}
    >
      {/* Day */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg">📅</span>
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-wide">Simulación</div>
          <div className="text-sm font-bold font-mono text-white">Día {day}</div>
        </div>
      </div>

      <div className="w-px h-8 bg-white/10 shrink-0" />

      {/* Stat chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatChip emoji="🟢" label="Sanos"        value={counts.S} color="#22c55e" />
        <StatChip emoji="🔴" label="Infectados"   value={counts.I} color="#ef4444" />
        <StatChip emoji="🔵" label="Vacunados"    value={counts.V} color="#3b82f6" />
        <StatChip emoji="🟡" label="Recuperados"  value={counts.R} color="#f59e0b" />
      </div>

      {/* R₀ */}
      <div className="ml-auto flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-[9px] text-slate-500 uppercase tracking-wide">Número de reproducción</div>
          <div className="text-xs text-slate-400">{R0Msg}</div>
        </div>
        <div
          className="text-2xl font-black font-mono px-4 py-1.5 rounded-xl transition-all duration-700"
          style={{
            color: R0Color,
            background: `${R0Color}15`,
            border: `2px solid ${R0Color}40`,
            textShadow: `0 0 20px ${R0Color}80`,
          }}
        >
          R₀ = {R0.toFixed(1)}
        </div>
      </div>
    </div>
  );
}
