import { useEffect, useMemo, useState } from "react";
import { Pause, Play } from "lucide-react";
import { SimulationResult } from "../../types/simulation";
import { formatNumber, formatScientific } from "../../utils/formatters";
import { Button } from "../ui/Button";
import { Card, CardTitle } from "../ui/Card";

interface EigenView {
  eigenvalues: number[];
  eigenvectors: Array<{ label: string; x: number; y: number }>;
  equilibrium: { I: number; V: number };
}

function extractEquilibrium(result: SimulationResult) {
  const eq = Array.isArray(result.equilibria) ? result.equilibria[result.equilibria.length - 1] as Record<string, any> : undefined;
  const values = (eq?.values ?? eq ?? {}) as Record<string, unknown>;
  return { I: Number(values.I ?? 0), V: Number(values.V ?? 0) };
}

function buildEigenView(result: SimulationResult): EigenView | undefined {
  const p = result.parameters ?? {};
  const beta = Number(p.beta);
  const K = Number(p.K);
  const gamma = Number(p.gamma);
  const alpha = Number(p.alpha);
  const k = Number(p.k);
  const d = Number(p.d);
  if (![beta, K, gamma, alpha, k, d].every(Number.isFinite)) return undefined;
  const equilibrium = extractEquilibrium(result);
  const a = beta - 2 * beta * equilibrium.I / K - gamma;
  const c = -(k + d);
  const denominator = c - a;
  const v1y = Math.abs(denominator) > 1e-9 ? -alpha / denominator : 1;
  const eigenvectors = [
    { label: "v1", x: 1, y: v1y },
    { label: "v2", x: 0, y: 1 },
  ];
  return { eigenvalues: [a, c], eigenvectors, equilibrium };
}

export function WaterEvolutionAnimator({ result }: { result: SimulationResult }) {
  const time = result.time ?? [];
  const infected = result.series?.I ?? [];
  const viral = result.series?.V ?? result.series?.S_t ?? [];
  const length = Math.min(time.length, viral.length || infected.length);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing || length < 2) return;
    const id = window.setInterval(() => setIndex((current) => (current + 1) % length), 240);
    return () => window.clearInterval(id);
  }, [playing, length]);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [result]);

  const maxV = Math.max(...viral, 1);
  const maxI = Math.max(...infected, 1);
  const currentV = viral[index] ?? 0;
  const currentI = infected[index] ?? 0;
  const intensity = Math.max(0.05, Math.min(1, currentV / maxV));
  const eigen = useMemo(() => buildEigenView(result), [result]);
  const particles = useMemo(() => Array.from({ length: 42 }, (_, i) => ({
    x: 8 + ((i * 19) % 84),
    y: 12 + ((i * 31) % 72),
    size: 3 + (i % 5),
    phase: i * 13,
  })), []);

  if (length < 2) return null;

  return (
    <Card className="overflow-hidden border-cyan-100 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-white">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle className="text-white">Animacion de evolucion en agua</CardTitle>
          <p className="mt-1 text-sm leading-6 text-cyan-100">Timeline visual de la señal viral: partículas, intensidad del agua, estado epidemiológico y lectura local de autovalores/autovectores.</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setPlaying((value) => !value)}>
          {playing ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
          {playing ? "Pausar" : "Reproducir"}
        </Button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <div className="relative h-80 overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-900/30 shadow-2xl" style={{ perspective: "900px" }}>
            <div className="absolute inset-x-8 bottom-8 top-10 rotate-x-[58deg] rounded-[2rem] border border-cyan-200/40 bg-cyan-400/10 shadow-[0_0_60px_rgba(34,211,238,0.25)]" />
            <div className="absolute inset-x-10 bottom-10 top-12 rotate-x-[58deg] rounded-[2rem]" style={{ background: `rgba(34, 211, 238, ${0.18 + intensity * 0.45})`, boxShadow: `0 0 ${40 + intensity * 90}px rgba(34,211,238,${0.25 + intensity * 0.45})` }} />
            {particles.map((particle, particleIndex) => {
              const visible = ((particleIndex + index) % 10) / 10 < intensity;
              return (
                <span
                  key={particleIndex}
                  className="absolute rounded-full bg-cyan-100 shadow-[0_0_16px_rgba(103,232,249,0.95)] transition-all duration-300"
                  style={{
                    left: `${particle.x}%`,
                    top: `${particle.y + Math.sin((index + particle.phase) / 8) * 3}%`,
                    width: particle.size + intensity * 6,
                    height: particle.size + intensity * 6,
                    opacity: visible ? 0.35 + intensity * 0.65 : 0.08,
                    transform: `translateZ(${intensity * 80}px)`,
                  }}
                />
              );
            })}
            <div className="absolute bottom-4 left-4 rounded-xl bg-slate-950/70 p-3 text-xs text-cyan-50 backdrop-blur">
              <p>Día simulado: <span className="font-bold">{formatNumber(time[index], 1)}</span></p>
              <p>Carga viral: <span className="font-bold">{formatScientific(currentV)}</span></p>
              {infected.length ? <p>Infectados estimados: <span className="font-bold">{formatNumber(currentI, 1)}</span></p> : null}
            </div>
          </div>

          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={length - 1}
              value={index}
              onChange={(event) => setIndex(Number(event.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="mt-1 flex justify-between text-xs text-cyan-100"><span>t = {formatNumber(time[0], 1)}</span><span>t = {formatNumber(time[length - 1], 1)}</span></div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Intensidad viral" value={`${formatNumber(intensity * 100, 1)}%`} />
            <Metric label="I / Imax" value={`${formatNumber((currentI / maxI) * 100, 1)}%`} />
            <Metric label="V actual" value={formatScientific(currentV)} />
            <Metric label="t actual" value={formatNumber(time[index], 1)} />
          </div>
          {eigen ? (
            <div className="rounded-2xl border border-cyan-300/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm font-semibold text-white">Autovalores y autovectores locales</p>
              <p className="mt-1 text-xs leading-5 text-cyan-100">Calculados a partir del jacobiano del modelo I-V en el equilibrio relevante.</p>
              <div className="mt-3 grid gap-2 text-sm">
                {eigen.eigenvalues.map((value, idx) => <div key={idx} className="rounded-lg bg-slate-950/50 p-2">λ{idx + 1} = {formatNumber(value, 4)} · {value < 0 ? "dirección contractiva" : "dirección expansiva"}</div>)}
              </div>
              <svg viewBox="0 0 220 150" className="mt-3 h-40 w-full rounded-xl bg-slate-950/60">
                <line x1="20" y1="120" x2="200" y2="120" stroke="#475569" strokeDasharray="4 4" />
                <line x1="40" y1="135" x2="40" y2="18" stroke="#475569" strokeDasharray="4 4" />
                {eigen.eigenvectors.map((vector, idx) => {
                  const norm = Math.max(Math.sqrt(vector.x * vector.x + vector.y * vector.y), 1e-6);
                  const x2 = 110 + (vector.x / norm) * 65;
                  const y2 = 75 - (vector.y / norm) * 45;
                  return <line key={vector.label} x1="110" y1="75" x2={x2} y2={y2} stroke={idx === 0 ? "#22d3ee" : "#f97316"} strokeWidth="4" strokeLinecap="round" />;
                })}
                <circle cx="110" cy="75" r="5" fill="#fef3c7" />
                <text x="116" y="68" fill="#fef3c7" fontSize="10">equilibrio</text>
              </svg>
            </div>
          ) : (
            <div className="rounded-2xl border border-cyan-300/20 bg-white/10 p-4 text-sm text-cyan-100">Los autovectores se muestran cuando el resultado pertenece al modelo 2D infectados-carga viral.</div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-cyan-300/20 bg-white/10 p-3"><p className="text-xs uppercase tracking-wide text-cyan-100">{label}</p><p className="mt-1 text-lg font-bold text-white">{value}</p></div>;
}
