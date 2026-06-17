import { useState, useMemo } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { Scene3D } from "../components/simulation3d/Scene3D";
import { Card, CardTitle } from "../components/ui/Card";
import { solveODE, getEquilibria } from "../components/simulation3d/useODESolver";
import type { SimParams } from "../components/simulation3d/useODESolver";

// ── Presets ──────────────────────────────────────────────────────
const PRESETS = [
  {
    label: "Brote explosivo",
    params: { beta: 0.48, gamma: 0.09, alpha: 22, K: 120000, k: 0.12, d: 0.04 },
    I0: 80, V0: 4000, tMax: 120,
  },
  {
    label: "Control efectivo",
    params: { beta: 0.18, gamma: 0.25, alpha: 8, K: 100000, k: 0.18, d: 0.08 },
    I0: 800, V0: 18000, tMax: 90,
  },
  {
    label: "Equilibrio endémico",
    params: { beta: 0.40, gamma: 0.12, alpha: 25, K: 100000, k: 0.15, d: 0.05 },
    I0: 150, V0: 9000, tMax: 100,
  },
  {
    label: "Pico y descenso",
    params: { beta: 0.34, gamma: 0.20, alpha: 10, K: 80000, k: 0.20, d: 0.10 },
    I0: 500, V0: 14000, tMax: 90,
  },
] as const;

// ── Slider control ───────────────────────────────────────────────
function SliderParam({
  label,
  symbol,
  value,
  min,
  max,
  step,
  onChange,
  unit = "",
  decimals,
}: {
  label: string;
  symbol: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  unit?: string;
  decimals?: number;
}) {
  const dec = decimals ?? (step < 0.01 ? 3 : step < 1 ? 2 : 0);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-600">
          <span className="mr-1 font-mono text-sentinel-700">{symbol}</span>
          {label}
        </label>
        <span className="shrink-0 text-xs font-mono text-slate-400">
          {value.toFixed(dec)}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-sentinel-600"
      />
    </div>
  );
}

// ── Toggle ───────────────────────────────────────────────────────
function Toggle({
  label,
  checked,
  onChange,
  dotColor,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  dotColor: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 rounded accent-sentinel-600"
      />
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: dotColor, boxShadow: `0 0 5px ${dotColor}` }}
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

// ── Page ─────────────────────────────────────────────────────────
const DEFAULT: SimParams = {
  beta: 0.40,
  gamma: 0.12,
  alpha: 25,
  K: 100000,
  k: 0.15,
  d: 0.05,
};

export function Simulation3DPage() {
  const [params, setParams] = useState<SimParams>(DEFAULT);
  const [I0, setI0] = useState(150);
  const [V0, setV0] = useState(9000);
  const [tMax, setTMax] = useState(100);
  const [showNullclines, setShowNullclines] = useState(true);
  const [showVectorField, setShowVectorField] = useState(true);
  const [showMultiIc, setShowMultiIc] = useState(true);
  const [showEquilibria, setShowEquilibria] = useState(true);

  const set = (key: keyof SimParams) => (v: number) =>
    setParams((prev) => ({ ...prev, [key]: v }));

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setParams({ ...preset.params });
    setI0(preset.I0);
    setV0(preset.V0);
    setTMax(preset.tMax);
  }

  const trajectory = useMemo(
    () => solveODE(I0, V0, tMax, 400, params),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [I0, V0, tMax, params.beta, params.gamma, params.alpha, params.K, params.k, params.d],
  );

  const vMax = useMemo(() => {
    const fromTraj = Math.max(...trajectory.map((p) => p.V));
    const eqV = params.alpha * params.K / (params.k + params.d);
    return Math.max(fromTraj, eqV, 1000) * 1.15;
  }, [trajectory, params]);

  const eq = useMemo(() => getEquilibria(params), [params]);
  const R0 = params.beta / params.gamma;

  return (
    <>
      <PageHeader
        title="Simulación 3D · Espacio de Fase"
        description="Espacio tridimensional (I, V, t): trayectoria del sistema acoplado con nulclinas, campo vectorial y cuenca de atracción."
      />

      <div className="flex h-[calc(100vh-165px)] min-h-[580px] gap-4">
        {/* ── Controls ── */}
        <aside className="flex w-64 shrink-0 flex-col gap-3 overflow-y-auto pr-1">
          {/* Presets */}
          <Card>
            <CardTitle>Escenarios</CardTitle>
            <div className="mt-2 space-y-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-left text-xs font-medium transition hover:border-sentinel-300 hover:bg-sentinel-50 hover:text-sentinel-700"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Epidemic params */}
          <Card>
            <CardTitle>Parámetros epidémicos</CardTitle>
            <div className="mt-3 space-y-4">
              <SliderParam label="Transmisión" symbol="β" value={params.beta} min={0.05} max={1.5} step={0.01} onChange={set("beta")} />
              <SliderParam label="Recuperación" symbol="γ" value={params.gamma} min={0.01} max={1.0} step={0.01} onChange={set("gamma")} />
              <SliderParam label="Excreción viral" symbol="α" value={params.alpha} min={1} max={100} step={1} onChange={set("alpha")} />
              <SliderParam label="Cap. máxima" symbol="K" value={params.K} min={1000} max={500000} step={1000} onChange={set("K")} unit=" p" decimals={0} />
            </div>
          </Card>

          {/* Wastewater params */}
          <Card>
            <CardTitle>Aguas residuales</CardTitle>
            <div className="mt-3 space-y-4">
              <SliderParam label="Decaimiento viral" symbol="k" value={params.k} min={0.01} max={0.8} step={0.01} onChange={set("k")} />
              <SliderParam label="Dilución" symbol="d" value={params.d} min={0.01} max={0.4} step={0.01} onChange={set("d")} />
            </div>
          </Card>

          {/* Initial conditions */}
          <Card>
            <CardTitle>Condiciones iniciales</CardTitle>
            <div className="mt-3 space-y-4">
              <SliderParam label="Infectados I₀" symbol="I₀" value={I0} min={1} max={20000} step={50} onChange={setI0} unit=" p" decimals={0} />
              <SliderParam label="Carga viral V₀" symbol="V₀" value={V0} min={0} max={60000} step={500} onChange={setV0} unit="" decimals={0} />
              <SliderParam label="Tiempo total" symbol="T" value={tMax} min={10} max={300} step={5} onChange={setTMax} unit=" d" decimals={0} />
            </div>
          </Card>

          {/* Display toggles */}
          <Card>
            <CardTitle>Capas visibles</CardTitle>
            <div className="mt-3 space-y-2.5">
              <Toggle label="Nulclinas" checked={showNullclines} onChange={setShowNullclines} dotColor="#22cc66" />
              <Toggle label="Campo vectorial" checked={showVectorField} onChange={setShowVectorField} dotColor="#4499ff" />
              <Toggle label="Múltiples C.I." checked={showMultiIc} onChange={setShowMultiIc} dotColor="#aa66ff" />
              <Toggle label="Equilibrios" checked={showEquilibria} onChange={setShowEquilibria} dotColor="#ffcc00" />
            </div>
          </Card>

          {/* System state */}
          <Card>
            <CardTitle>Estado del sistema</CardTitle>
            <div className="mt-3 space-y-2 text-[11px] font-mono">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" style={{ boxShadow: "0 0 4px #ff3344" }} />
                <span className="leading-snug text-slate-600">
                  E₀=(0,0) —{" "}
                  {!eq.endemic ? (
                    <span className="text-green-600 font-semibold">Estable ✓</span>
                  ) : (
                    <span className="text-red-500">Inestable</span>
                  )}
                </span>
              </div>
              {eq.endemic ? (
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-400" style={{ boxShadow: "0 0 4px #ffcc00" }} />
                  <span className="leading-snug text-slate-600">
                    E*=({eq.endemic.I.toFixed(0)},{" "}
                    {eq.endemic.V.toFixed(0)}) —{" "}
                    <span className="text-green-600 font-semibold">Estable ✓</span>
                  </span>
                </div>
              ) : (
                <div className="text-slate-400">Sin eq. endémico</div>
              )}
              <div className="mt-1 border-t border-slate-100 pt-1">
                <span className="text-slate-500">
                  R₀ = β/γ ={" "}
                  <span
                    className={R0 > 1 ? "font-bold text-red-500" : "font-bold text-green-600"}
                  >
                    {R0.toFixed(2)}
                  </span>
                  {R0 > 1 ? " → Brote" : " → Control"}
                </span>
              </div>
            </div>
          </Card>

          {/* Legend */}
          <Card>
            <CardTitle>Leyenda</CardTitle>
            <div className="mt-3 space-y-2 text-[11px]">
              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 w-12 rounded"
                  style={{
                    background: "linear-gradient(to right,#0033ee,#00ffaa,#ff3300)",
                    boxShadow: "0 0 6px #0099ff",
                  }}
                />
                <span className="text-slate-600">Trayectoria principal (t₀→T)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-12 rounded bg-purple-400 opacity-50" />
                <span className="text-slate-600">Múltiples condiciones iniciales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded" style={{ background: "rgba(68,136,255,0.5)", boxShadow: "0 0 4px #4488ff" }} />
                <span className="text-slate-600">Nulclina V (dV/dt=0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded" style={{ background: "rgba(0,255,136,0.4)", boxShadow: "0 0 4px #00ff88" }} />
                <span className="text-slate-600">Nulclina I (dI/dt=0)</span>
              </div>
              <div className="mt-1 text-slate-400 leading-snug">
                Arrastrá para rotar · Scroll para zoom
              </div>
            </div>
          </Card>
        </aside>

        {/* ── 3D Canvas ── */}
        <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-800 bg-[#050a1a]">
          <Scene3D
            params={params}
            trajectory={trajectory}
            vMax={vMax}
            tMax={tMax}
            showNullclines={showNullclines}
            showVectorField={showVectorField}
            showMultiIc={showMultiIc}
            showEquilibria={showEquilibria}
          />
        </div>
      </div>
    </>
  );
}
