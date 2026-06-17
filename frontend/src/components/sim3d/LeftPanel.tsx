import { useState } from 'react';
import { useSim3DStore } from '../../store/sim3dStore';
import type { ToggleKey } from '../../store/sim3dStore';
import type { SimParams } from '../simulation3d/useODESolver';

const PRESETS = [
  {
    label: '🔴 Brote explosivo',
    params: { beta: 0.48, gamma: 0.09, alpha: 22, K: 120000, k: 0.12, d: 0.04 },
    I0: 80, V0: 4000, tMax: 120,
  },
  {
    label: '🟢 Control efectivo',
    params: { beta: 0.18, gamma: 0.28, alpha: 8, K: 100000, k: 0.18, d: 0.08 },
    I0: 800, V0: 18000, tMax: 90,
  },
  {
    label: '🟡 Equilibrio endémico',
    params: { beta: 0.40, gamma: 0.12, alpha: 25, K: 100000, k: 0.15, d: 0.05 },
    I0: 150, V0: 9000, tMax: 100,
  },
  {
    label: '⚡ Pico y descenso',
    params: { beta: 0.34, gamma: 0.20, alpha: 10, K: 80000, k: 0.20, d: 0.10 },
    I0: 500, V0: 14000, tMax: 90,
  },
] as const;

const PARAM_META: Record<keyof SimParams, { symbol: string; label: string; min: number; max: number; step: number; unit: string; desc: string }> = {
  beta: { symbol: 'β', label: 'Transmisión', min: 0.05, max: 1.5, step: 0.01, unit: '', desc: 'Tasa de contagio entre personas. Mayor β → epidemia más rápida.' },
  gamma: { symbol: 'γ', label: 'Recuperación', min: 0.01, max: 1.0, step: 0.01, unit: '', desc: 'Tasa de recuperación. Mayor γ → enfermedad más corta.' },
  alpha: { symbol: 'α', label: 'Excreción viral', min: 1, max: 100, step: 1, unit: '', desc: 'Cuánto virus excreta cada infectado al sistema cloacal.' },
  K: { symbol: 'K', label: 'Cap. poblacional', min: 1000, max: 500000, step: 1000, unit: 'p', desc: 'Tamaño máximo de la población susceptible.' },
  k: { symbol: 'k', label: 'Decaimiento viral', min: 0.01, max: 0.8, step: 0.01, unit: '', desc: 'Rapidez con que el virus se degrada en las aguas.' },
  d: { symbol: 'd', label: 'Dilución', min: 0.01, max: 0.4, step: 0.01, unit: '', desc: 'Factor de dilución por afluentes de agua limpia.' },
};

const TOGGLES: { key: ToggleKey; label: string; color: string }[] = [
  { key: 'showParticles', label: 'Partículas', color: '#06b6d4' },
  { key: 'showLandscape', label: 'Paisaje energético', color: '#a855f7' },
  { key: 'showNullclines', label: 'Nulclinas', color: '#22cc66' },
  { key: 'showMultiIC', label: 'Múltiples C.I.', color: '#f59e0b' },
  { key: 'showEquilibria', label: 'Equilibrios', color: '#ffcc00' },
];

function SliderRow({
  paramKey,
  value,
  onChange,
  onHover,
}: {
  paramKey: keyof SimParams;
  value: number;
  onChange: (v: number) => void;
  onHover: (k: keyof SimParams | null) => void;
}) {
  const meta = PARAM_META[paramKey];
  const dec = meta.step < 0.01 ? 3 : meta.step < 1 ? 2 : 0;
  return (
    <div
      className="space-y-1"
      onMouseEnter={() => onHover(paramKey)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="font-mono text-[#06b6d4] font-bold text-[11px]">{meta.symbol}</span>
          <span className="text-slate-400">{meta.label}</span>
        </label>
        <span className="text-xs font-mono text-slate-300 tabular-nums">
          {value.toFixed(dec)}{meta.unit}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={meta.min}
          max={meta.max}
          step={meta.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #06b6d4 0%, #06b6d4 ${((value - meta.min) / (meta.max - meta.min)) * 100}%, #1e3a5f ${((value - meta.min) / (meta.max - meta.min)) * 100}%, #1e3a5f 100%)`,
          }}
        />
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-white/[0.06] pb-3 mb-3">
      <div className="text-[9px] font-semibold uppercase tracking-widest text-slate-500 mb-2">{title}</div>
      {children}
    </div>
  );
}

export function LeftPanel() {
  const {
    params, setParam,
    I0, setI0, V0, setV0, tMax, setTMax,
    showParticles, showLandscape, showNullclines, showMultiIC, showEquilibria,
    toggle, applyPreset, play, pause, reset, isPlaying,
  } = useSim3DStore();

  const [hoveredParam, setHoveredParam] = useState<keyof SimParams | null>(null);
  const R0 = params.beta / params.gamma;

  return (
    <aside
      className="w-[260px] shrink-0 flex flex-col h-full overflow-y-auto"
      style={{ background: '#0b1529', borderRight: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="p-4 flex-1">

        {/* Header */}
        <div className="mb-4 pb-3 border-b border-white/[0.06]">
          <div className="text-xs font-bold text-slate-200 tracking-wide">Wastewater Sentinel</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Simulación 3D · Espacio de Fase</div>
        </div>

        {/* Presets */}
        <Section title="Escenarios">
          <div className="space-y-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-md text-slate-300 transition"
                style={{ background: '#0f1e3a', border: '1px solid rgba(255,255,255,0.07)' }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#06b6d444')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Section>

        {/* Epidemic params */}
        <Section title="Parámetros epidémicos">
          <div className="space-y-3.5">
            {(['beta', 'gamma', 'alpha', 'K'] as (keyof SimParams)[]).map((k) => (
              <SliderRow
                key={k}
                paramKey={k}
                value={params[k]}
                onChange={(v) => setParam(k, v)}
                onHover={setHoveredParam}
              />
            ))}
          </div>
        </Section>

        {/* Wastewater params */}
        <Section title="Aguas residuales">
          <div className="space-y-3.5">
            {(['k', 'd'] as (keyof SimParams)[]).map((key) => (
              <SliderRow
                key={key}
                paramKey={key}
                value={params[key]}
                onChange={(v) => setParam(key, v)}
                onHover={setHoveredParam}
              />
            ))}
          </div>
        </Section>

        {/* Initial conditions */}
        <Section title="Condiciones iniciales">
          <div className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#06b6d4] font-mono font-bold text-[11px]">I₀</span>
                <span className="font-mono text-slate-300">{I0.toLocaleString()} p</span>
              </div>
              <input type="range" min={1} max={20000} step={50} value={I0} onChange={(e) => setI0(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right,#06b6d4 ${(I0/20000)*100}%,#1e3a5f ${(I0/20000)*100}%)` }} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#06b6d4] font-mono font-bold text-[11px]">V₀</span>
                <span className="font-mono text-slate-300">{V0.toLocaleString()}</span>
              </div>
              <input type="range" min={0} max={60000} step={500} value={V0} onChange={(e) => setV0(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right,#06b6d4 ${(V0/60000)*100}%,#1e3a5f ${(V0/60000)*100}%)` }} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-[#06b6d4] font-mono font-bold text-[11px]">T</span>
                <span className="font-mono text-slate-300">{tMax} días</span>
              </div>
              <input type="range" min={10} max={300} step={5} value={tMax} onChange={(e) => setTMax(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right,#06b6d4 ${((tMax-10)/290)*100}%,#1e3a5f ${((tMax-10)/290)*100}%)` }} />
            </div>
          </div>
        </Section>

        {/* Display toggles */}
        <Section title="Capas visibles">
          <div className="space-y-2">
            {TOGGLES.map(({ key, label, color }) => {
              const values = { showParticles, showLandscape, showNullclines, showMultiIC, showEquilibria };
              return (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => toggle(key)}
                    className="w-7 h-4 rounded-full relative transition-colors cursor-pointer"
                    style={{ background: values[key] ? color + '55' : '#1e3a5f', border: `1px solid ${values[key] ? color : '#334466'}` }}
                  >
                    <div
                      className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                      style={{ left: values[key] ? '14px' : '2px', background: values[key] ? color : '#4a6080', boxShadow: values[key] ? `0 0 4px ${color}` : 'none' }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">{label}</span>
                </label>
              );
            })}
          </div>
        </Section>

        {/* System state */}
        <Section title="Estado del sistema">
          <div className="space-y-2 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">R₀ = β/γ</span>
              <span
                className="font-bold text-base tabular-nums"
                style={{ color: R0 < 1 ? '#22cc55' : R0 < 2 ? '#eab308' : '#ef4444', textShadow: `0 0 8px currentColor` }}
              >
                {R0.toFixed(2)}
              </span>
            </div>
            <div
              className="rounded-md px-2 py-1.5 text-[10px]"
              style={{ background: '#0f1e3a', borderLeft: `2px solid ${R0 < 1 ? '#22cc55' : R0 < 2 ? '#eab308' : '#ef4444'}` }}
            >
              {R0 < 1 ? '✓ La enfermedad se extingue' : R0 < 2 ? '⚠ Brote activo → equilibrio' : '🔴 Epidemia crítica'}
            </div>
          </div>
        </Section>

        {/* Param description tooltip */}
        {hoveredParam && (
          <div
            className="rounded-md p-2.5 text-[10px] text-slate-300 leading-relaxed"
            style={{ background: '#0f1e3a', border: '1px solid #06b6d433' }}
          >
            <span className="font-mono text-[#06b6d4] font-bold">{PARAM_META[hoveredParam].symbol}</span>{' '}
            {PARAM_META[hoveredParam].desc}
          </div>
        )}

        {/* Playback controls */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={isPlaying ? pause : play}
            className="flex-1 py-1.5 rounded-md text-xs font-semibold transition text-white"
            style={{ background: isPlaying ? '#1e3a5f' : '#06b6d4', border: `1px solid ${isPlaying ? '#334466' : '#06b6d4'}` }}
          >
            {isPlaying ? '⏸ Pausar' : '▶ Animar'}
          </button>
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-md text-xs text-slate-400 transition hover:text-slate-200"
            style={{ background: '#0f1e3a', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            ↺
          </button>
        </div>

      </div>
    </aside>
  );
}
