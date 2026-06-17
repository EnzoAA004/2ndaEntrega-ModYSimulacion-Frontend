import { useEpidemicStore } from '../../store/epidemicStore';
import type { SimParams } from '../../simulation/agentEngine';

interface PresetDef {
  label: string;
  emoji: string;
  params: Partial<SimParams>;
}

const PRESETS: PresetDef[] = [
  { label: 'Control', emoji: '🟢', params: { contagion: 0.2, maskUsage: 0.7, distancing: 0.7, vacRate: 0.3, mutationRate: 0, quarantine: 0, temperature: 0.5 } },
  { label: 'Endémico', emoji: '🟡', params: { contagion: 0.45, maskUsage: 0.3, distancing: 0.2, vacRate: 0.1, mutationRate: 0, quarantine: 0, temperature: 0 } },
  { label: 'Epidemia', emoji: '🔴', params: { contagion: 0.75, maskUsage: 0.0, distancing: 0.0, vacRate: 0.0, mutationRate: 0, quarantine: 0, temperature: -0.5 } },
  { label: 'Variante', emoji: '🔥', params: { contagion: 0.92, maskUsage: 0.0, distancing: 0.0, vacRate: 0.0, mutationRate: 0.8, quarantine: 0, temperature: -1 } },
  { label: 'Vacunación', emoji: '💉', params: { contagion: 0.55, maskUsage: 0.4, distancing: 0.1, vacRate: 0.6, hospitalLevel: 0.6, quarantine: 0, temperature: 0 } },
  { label: 'Cuarentena', emoji: '🚧', params: { contagion: 0.65, maskUsage: 0.6, distancing: 0.8, vacRate: 0, quarantine: 0.9, temperature: 0 } },
];

interface SliderDef {
  key: keyof SimParams;
  label: string;
  emoji: string;
  min: number; max: number; step: number;
  color: string;
  hint: string;
  format: (v: number) => string;
}

const SLIDERS: SliderDef[] = [
  { key: 'contagion',     label: 'Contagiosidad',       emoji: '🦠', min: 0.05, max: 1,   step: 0.01, color: '#ef4444', hint: 'Probabilidad de transmisión por contacto',     format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'maskUsage',     label: 'Uso de barbijo',       emoji: '😷', min: 0,    max: 1,   step: 0.01, color: '#3b82f6', hint: 'Reduce el contagio hasta un 65%',              format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'distancing',    label: 'Distanciamiento',      emoji: '🤝', min: 0,    max: 1,   step: 0.01, color: '#22c55e', hint: 'Reduce velocidad y radio de infección',        format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'vacRate',       label: 'Vacunación',           emoji: '💉', min: 0,    max: 0.9, step: 0.01, color: '#a855f7', hint: 'Porcentaje de la población inmune al inicio',  format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'recoveryDays',  label: 'Días de recuperación', emoji: '🏥', min: 3,    max: 30,  step: 1,    color: '#f59e0b', hint: 'Tiempo hasta recuperarse',                     format: (v) => `${v}d` },
  { key: 'population',    label: 'Población',            emoji: '👥', min: 50,   max: 700, step: 10,   color: '#64748b', hint: 'Número de agentes en las 3 ciudades',          format: (v) => `${v}` },
];

const FUN_SLIDERS: SliderDef[] = [
  { key: 'mutationRate',  label: 'Mutación viral',       emoji: '🧬', min: 0,  max: 1, step: 0.01, color: '#c026d3', hint: 'El virus se vuelve más contagioso con el tiempo', format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'hospitalLevel', label: 'Hospitales',           emoji: '🏨', min: 0,  max: 1, step: 0.01, color: '#06b6d4', hint: 'Reduce el tiempo de recuperación hasta un 50%',   format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'quarantine',    label: 'Cuarentena',           emoji: '🚧', min: 0,  max: 1, step: 0.01, color: '#dc2626', hint: 'Confinamiento: reduce la movilidad hasta un 85%', format: (v) => `${(v * 100).toFixed(0)}%` },
  { key: 'temperature',   label: 'Temperatura',          emoji: '🌡️', min: -1, max: 1, step: 0.05, color: '#f97316', hint: '❄️ Invierno = más contagio   ☀️ Verano = menos', format: (v) => v > 0.1 ? `☀️ +${(v*100).toFixed(0)}%` : v < -0.1 ? `❄️ ${(v*100).toFixed(0)}%` : '🌤 0%' },
];

function SliderRow({ s, value, onChange }: { s: SliderDef; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium flex items-center gap-1.5 text-slate-200">
          <span>{s.emoji}</span> {s.label}
        </label>
        <span className="text-xs font-mono" style={{ color: s.color }}>{s.format(value)}</span>
      </div>
      <input
        type="range" min={s.min} max={s.max} step={s.step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: s.color }}
      />
      <p className="text-[10px] text-slate-600">{s.hint}</p>
    </div>
  );
}

export function ControlPanel() {
  const { params, setParam, play, pause, reset, isPlaying, applyPreset, triggerEvent, simSpeed, setSimSpeed } = useEpidemicStore();

  return (
    <div
      className="flex flex-col gap-3 p-4 overflow-y-auto flex-shrink-0"
      style={{
        width: 275,
        background: 'rgba(8,14,31,0.92)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        color: 'white',
      }}
    >
      {/* Presets */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">Escenarios</p>
        <div className="grid grid-cols-3 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p.params)}
              className="rounded-lg px-1 py-2 text-[11px] font-bold border border-white/10 transition-all hover:border-white/25 hover:scale-105 active:scale-95"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <div>{p.emoji}</div>
              <div className="text-slate-300 mt-0.5">{p.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-white/8" />

      {/* Speed control */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium flex items-center gap-1.5 text-slate-200">
            <span>⏩</span> Velocidad
          </label>
          <span className="text-xs font-mono text-yellow-400">{simSpeed.toFixed(1)}×</span>
        </div>
        <input
          type="range" min={0.1} max={4} step={0.1} value={simSpeed}
          onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: '#eab308' }}
        />
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>🐌 Lento</span>
          <span>Normal</span>
          <span>🚀 Rápido</span>
        </div>
      </div>

      <div className="border-t border-white/8" />

      {/* Standard sliders */}
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">Parámetros epidémicos</p>
        {SLIDERS.map((s) => (
          <SliderRow
            key={s.key}
            s={s}
            value={params[s.key] as number}
            onChange={(v) => setParam(s.key, v)}
          />
        ))}
      </div>

      <div className="border-t border-white/8" />

      {/* Fun params */}
      <div className="space-y-3">
        <p className="text-[11px] uppercase tracking-widest text-slate-500 font-semibold">✨ Parámetros especiales</p>
        {FUN_SLIDERS.map((s) => (
          <SliderRow
            key={s.key}
            s={s}
            value={params[s.key] as number}
            onChange={(v) => setParam(s.key, v)}
          />
        ))}
      </div>

      <div className="border-t border-white/8" />

      {/* Random events */}
      <div>
        <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2 font-semibold">⚡ Eventos aleatorios</p>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => triggerEvent('festival')}
            className="rounded-lg px-3 py-2 text-xs font-semibold border border-orange-500/30 text-orange-300 hover:bg-orange-500/10 transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: 'rgba(249,115,22,0.07)' }}
          >
            🎉 Festival — +25% contagio por 8s
          </button>
          <button
            onClick={() => triggerEvent('traveler')}
            className="rounded-lg px-3 py-2 text-xs font-semibold border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: 'rgba(239,68,68,0.07)' }}
          >
            ✈️ Viajero infectado — inyecta 3 casos
          </button>
          <button
            onClick={() => triggerEvent('campaign')}
            className="rounded-lg px-3 py-2 text-xs font-semibold border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: 'rgba(168,85,247,0.07)' }}
          >
            💉 Campaña de vacunación — +30% vacunados
          </button>
        </div>
      </div>

      <div className="border-t border-white/8" />

      {/* Play / Pause / Reset */}
      <div className="flex gap-2">
        <button
          onClick={() => (isPlaying ? pause() : play())}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
          style={{
            background: isPlaying ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)',
            border: `1px solid ${isPlaying ? '#ef444466' : '#22c55e66'}`,
            color: isPlaying ? '#ef4444' : '#22c55e',
          }}
        >
          {isPlaying ? '⏸ Pausar' : '▶ Reanudar'}
        </button>
        <button
          onClick={reset}
          className="flex-1 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 border border-white/15 text-slate-300"
          style={{ background: 'rgba(255,255,255,0.05)' }}
        >
          🔄 Reiniciar
        </button>
      </div>

      {/* Active interventions */}
      {(params.maskUsage > 0 || params.distancing > 0 || params.vacRate > 0 || params.quarantine > 0 || params.hospitalLevel > 0) && (
        <div
          className="rounded-xl p-3 text-[11px] space-y-1"
          style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)' }}
        >
          <p className="text-green-400 font-semibold uppercase tracking-wide">✅ Activo</p>
          {params.maskUsage > 0 && <p className="text-slate-400">😷 Barbijo: {(params.maskUsage * 100).toFixed(0)}%</p>}
          {params.distancing > 0 && <p className="text-slate-400">🤝 Distanciamiento: {(params.distancing * 100).toFixed(0)}%</p>}
          {params.vacRate > 0 && <p className="text-slate-400">💉 Vacunados: {(params.vacRate * 100).toFixed(0)}%</p>}
          {params.quarantine > 0 && <p className="text-slate-400">🚧 Cuarentena: {(params.quarantine * 100).toFixed(0)}%</p>}
          {params.hospitalLevel > 0 && <p className="text-slate-400">🏨 Hospitales: {(params.hospitalLevel * 100).toFixed(0)}%</p>}
          {params.mutationRate > 0 && <p className="text-purple-400">🧬 Mutando... +{(params.mutationRate * 0.3).toFixed(2)}%/tick</p>}
        </div>
      )}
    </div>
  );
}
