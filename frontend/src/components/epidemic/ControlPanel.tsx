import { useState, useEffect } from 'react';
import { useEpidemicStore } from '../../store/epidemicStore';
import type { SimParams } from '../../simulation/agentEngine';

// ── Presets ──────────────────────────────────────────────────────────
const PRESETS: Array<{ label: string; params: Partial<SimParams> }> = [
  {
    label: '🟢 Control',
    params: { contagion: 0.20, maskUsage: 0.60, distancing: 0.50, vacRate: 0.40, recoveryDays: 10, population: 250 },
  },
  {
    label: '🟡 Endémico',
    params: { contagion: 0.45, maskUsage: 0.20, distancing: 0.10, vacRate: 0.10, recoveryDays: 14, population: 250 },
  },
  {
    label: '🔴 Epidemia',
    params: { contagion: 0.75, maskUsage: 0.00, distancing: 0.00, vacRate: 0.00, recoveryDays: 14, population: 250 },
  },
  {
    label: '🔥 Variante',
    params: { contagion: 0.92, maskUsage: 0.00, distancing: 0.00, vacRate: 0.00, recoveryDays: 21, population: 300 },
  },
  {
    label: '💉 Vacunación',
    params: { contagion: 0.55, maskUsage: 0.30, distancing: 0.20, vacRate: 0.70, recoveryDays: 12, population: 300 },
  },
  {
    label: '🌧 Invernal',
    params: { contagion: 0.68, maskUsage: 0.10, distancing: 0.00, vacRate: 0.05, recoveryDays: 18, population: 250 },
  },
];

// ── Slider ────────────────────────────────────────────────────────────
interface SliderProps {
  emoji: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  color: string;
  onChange: (v: number) => void;
  onRelease?: (v: number) => void;
}

function Slider({ emoji, label, hint, value, min, max, step, format, color, onChange, onRelease }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-300 flex items-center gap-1.5">
          <span>{emoji}</span>
          <span className="font-medium">{label}</span>
        </span>
        <span className="text-xs font-mono font-bold tabular-nums" style={{ color }}>
          {format(value)}
        </span>
      </div>
      <div className="relative h-1.5 rounded-full bg-slate-700/60">
        <div
          className="absolute left-0 top-0 h-full rounded-full transition-none"
          style={{ width: `${pct}%`, background: color, opacity: 0.7 }}
        />
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          onPointerUp={onRelease ? (e) => onRelease(Number((e.target as HTMLInputElement).value)) : undefined}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          style={{ zIndex: 1 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg pointer-events-none"
          style={{ left: `calc(${pct}% - 6px)`, background: color, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
      <div className="text-[10px] text-slate-600">{hint}</div>
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────
export function ControlPanel() {
  const { params, isPlaying, setParam, play, pause, reset, applyPreset } = useEpidemicStore();

  // Local state for reset-triggering sliders (avoid resetting while dragging)
  const [localPop, setLocalPop] = useState(params.population);
  const [localVac, setLocalVac] = useState(params.vacRate);

  useEffect(() => setLocalPop(params.population), [params.population]);
  useEffect(() => setLocalVac(params.vacRate), [params.vacRate]);

  const dynamicHint = (() => {
    if (params.maskUsage > 0.4 && params.distancing > 0.3)
      return { icon: '✅', color: '#22c55e', text: 'Barbijo + distanciamiento activos. Gran efecto en la curva.' };
    if (params.contagion > 0.7)
      return { icon: '⚠️', color: '#ef4444', text: 'Alto riesgo. El virus se propaga muy fácilmente.' };
    if (localVac > 0.5)
      return { icon: '💉', color: '#3b82f6', text: 'Alta vacunación. La epidemia debería desaparecer.' };
    return { icon: '💡', color: '#64748b', text: 'Mové los controles para ver el impacto en tiempo real.' };
  })();

  return (
    <aside
      className="flex w-[270px] shrink-0 flex-col overflow-y-auto border-r"
      style={{ background: '#0b1629', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Presets */}
      <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
          Escenarios rápidos
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.params)}
              className="text-left px-2.5 py-2 rounded-lg text-[11px] font-medium leading-tight text-slate-300 transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.09)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.18)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.07)';
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="p-3 space-y-5 flex-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <p className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold">
          Controles de la epidemia
        </p>

        <Slider
          emoji="🦠" label="Facilidad de contagio"
          hint="Qué tan fácil se transmite el virus"
          value={params.contagion} min={0.05} max={1.0} step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          color="#ef4444"
          onChange={(v) => setParam('contagion', v)}
        />

        <Slider
          emoji="😷" label="Uso de barbijo"
          hint="Reduce la transmisión hasta un 70%"
          value={params.maskUsage} min={0} max={1} step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          color="#06b6d4"
          onChange={(v) => setParam('maskUsage', v)}
        />

        <Slider
          emoji="🤝" label="Distanciamiento social"
          hint="Las personas mantienen mayor separación"
          value={params.distancing} min={0} max={1} step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          color="#22c55e"
          onChange={(v) => setParam('distancing', v)}
        />

        <Slider
          emoji="⚡" label="Días para recuperarse"
          hint="Cuánto tiempo dura la infección"
          value={params.recoveryDays} min={3} max={30} step={1}
          format={(v) => `${v} días`}
          color="#f59e0b"
          onChange={(v) => setParam('recoveryDays', v)}
        />

        <Slider
          emoji="💉" label="Vacunación inicial"
          hint="Personas ya vacunadas al inicio (suelta para reiniciar)"
          value={localVac} min={0} max={0.9} step={0.01}
          format={(v) => `${Math.round(v * 100)}%`}
          color="#3b82f6"
          onChange={setLocalVac}
          onRelease={(v) => setParam('vacRate', v)}
        />

        <Slider
          emoji="👥" label="Tamaño de la ciudad"
          hint="Cantidad de personas (suelta para reiniciar)"
          value={localPop} min={50} max={400} step={10}
          format={(v) => `${Math.round(v)} personas`}
          color="#a855f7"
          onChange={setLocalPop}
          onRelease={(v) => setParam('population', v)}
        />
      </div>

      {/* Playback */}
      <div className="p-3 flex gap-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          onClick={isPlaying ? pause : play}
          className="flex-1 py-2 rounded-lg text-sm font-bold transition-all"
          style={{ background: isPlaying ? '#ef4444' : '#22c55e', color: '#000' }}
        >
          {isPlaying ? '⏸ Pausar' : '▶ Continuar'}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-400 transition-all"
          style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
        >
          ↺ Reset
        </button>
      </div>

      {/* Dynamic hint */}
      <div className="p-3">
        <div
          className="rounded-xl p-3 text-xs leading-relaxed"
          style={{
            background: `${dynamicHint.color}0d`,
            border: `1px solid ${dynamicHint.color}25`,
            borderLeft: `3px solid ${dynamicHint.color}`,
          }}
        >
          <span className="mr-1">{dynamicHint.icon}</span>
          <span className="text-slate-300">{dynamicHint.text}</span>
        </div>
      </div>
    </aside>
  );
}
