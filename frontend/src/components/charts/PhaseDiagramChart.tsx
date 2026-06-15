import { CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { SimulationResult } from "../../types/simulation";
import { getEquilibriumPoints, getPhaseData } from "../../utils/chartUtils";
import { formatNumber, formatScientific } from "../../utils/formatters";

type PhasePoint = {
  I: number;
  V: number;
  dI?: number;
  dV?: number;
  magnitude?: number;
  classification?: string;
  trajectoryIndex?: number;
  [key: string]: number | string | undefined;
};

function VectorArrow(props: any) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined || !payload) return null;
  const dI = Number(payload.dI ?? 0);
  const dV = Number(payload.dV ?? 0);
  const magnitude = Math.sqrt(dI * dI + dV * dV);
  if (!magnitude) return <circle cx={cx} cy={cy} r={2} fill="#94a3b8" />;
  const length = 14;
  const ux = dI / magnitude;
  const uy = dV / magnitude;
  const x2 = cx + ux * length;
  const y2 = cy - uy * length;
  const angle = Math.atan2(cy - y2, x2 - cx);
  const head = 4;
  const xh1 = x2 - head * Math.cos(angle - Math.PI / 6);
  const yh1 = y2 + head * Math.sin(angle - Math.PI / 6);
  const xh2 = x2 - head * Math.cos(angle + Math.PI / 6);
  const yh2 = y2 + head * Math.sin(angle + Math.PI / 6);
  const opacity = Math.max(0.35, Math.min(0.95, magnitude / 100000));
  return (
    <g opacity={opacity}>
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#0e7490" strokeWidth={1.6} strokeLinecap="round" />
      <path d={`M ${x2} ${y2} L ${xh1} ${yh1} L ${xh2} ${yh2} Z`} fill="#0e7490" />
    </g>
  );
}

function EquilibriumMarker(props: any) {
  const { cx, cy, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#fee2e2" stroke="#dc2626" strokeWidth={2} />
      <text x={cx + 10} y={cy - 10} fontSize={11} fill="#991b1b" fontWeight={700}>{payload?.classification ?? "eq"}</text>
    </g>
  );
}

function InvisiblePoint() {
  return null;
}

function pointInDomain(point: PhasePoint, domain: { iMin: number; iMax: number; vMin: number; vMax: number }) {
  const I = Number(point.I);
  const V = Number(point.V);
  return Number.isFinite(I) && Number.isFinite(V) && I >= domain.iMin && I <= domain.iMax && V >= domain.vMin && V <= domain.vMax;
}

function getDomain(data: PhasePoint[]) {
  const iValues = data.map((item) => Number(item.I)).filter(Number.isFinite);
  const vValues = data.map((item) => Number(item.V)).filter(Number.isFinite);
  const iMin = Math.min(...iValues, 0);
  const iMax = Math.max(...iValues, 1);
  const vMin = Math.min(...vValues, 0);
  const vMax = Math.max(...vValues, 1);
  return { iMin, iMax, vMin, vMax };
}

function buildTrajectories(result?: SimulationResult) {
  const data = getPhaseData(result) as unknown as PhasePoint[];
  const p = result?.parameters ?? {};
  const beta = Number(p.beta ?? 0.35);
  const K = Number(p.K ?? 100000);
  const gamma = Number(p.gamma ?? 0.12);
  const alpha = Number(p.alpha ?? 25);
  const k = Number(p.k ?? 0.15);
  const d = Number(p.d ?? 0.05);
  if (!data.length || !Number.isFinite(beta) || !Number.isFinite(K)) return [];
  const domain = getDomain(data);
  const seeds = [
    [domain.iMax * 0.05, domain.vMax * 0.15],
    [domain.iMax * 0.15, domain.vMax * 0.70],
    [domain.iMax * 0.35, domain.vMax * 0.25],
    [domain.iMax * 0.60, domain.vMax * 0.80],
    [domain.iMax * 0.85, domain.vMax * 0.35],
  ];
  return seeds.map((seed, trajectoryIndex) => {
    let I = seed[0];
    let V = seed[1];
    const path: PhasePoint[] = [];
    const dt = 0.08;
    for (let step = 0; step < 160; step += 1) {
      path.push({ I, V, trajectoryIndex });
      const dI = beta * I * (1 - I / K) - gamma * I;
      const dV = alpha * I - (k + d) * V;
      I = Math.max(domain.iMin, Math.min(domain.iMax, I + dI * dt));
      V = Math.max(domain.vMin, Math.min(domain.vMax, V + dV * dt));
    }
    return path;
  });
}

export function PhaseDiagramChart({ result }: { result?: SimulationResult }) {
  const data = getPhaseData(result) as unknown as PhasePoint[];
  const domain = getDomain(data);
  const allEquilibria = getEquilibriumPoints(result) as unknown as PhasePoint[];
  const rawDVNullcline = (result?.nullcline_points?.dV_dt ?? []) as unknown as PhasePoint[];
  const rawDINullcline = (result?.nullcline_points?.dI_dt ?? []) as unknown as PhasePoint[];
  const dVNullcline = rawDVNullcline.filter((point) => pointInDomain(point, domain));
  const dINullcline = rawDINullcline.filter((point) => pointInDomain(point, domain));
  const equilibria = allEquilibria.filter((point) => pointInDomain(point, domain));
  const cropped = dVNullcline.length !== rawDVNullcline.length || dINullcline.length !== rawDINullcline.length || equilibria.length !== allEquilibria.length;
  const trajectories = buildTrajectories(result);
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 p-3 text-xs leading-5 text-slate-600">
        El campo vectorial muestra direccion y velocidad local del sistema. Las nulclinas, equilibrios y trayectorias se recortan a la ventana elegida para evitar que un equilibrio lejano deforme la escala del gráfico.
        {cropped ? <span className="mt-1 block font-semibold text-amber-700">Algunas nulclinas o equilibrios quedaron fuera de la ventana. Para verlos completos, aumentá I_max o V_max.</span> : null}
      </div>
      <div className="h-[520px] rounded-xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 20, right: 36, bottom: 30, left: 18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="I" name="Infectados I" type="number" domain={[domain.iMin, domain.iMax]} tickFormatter={(value) => formatNumber(Number(value), 0)} label={{ value: "Infectados estimados I", position: "insideBottom", offset: -12 }} />
            <YAxis dataKey="V" name="Carga viral V" type="number" domain={[domain.vMin, domain.vMax]} tickFormatter={(value) => formatScientific(Number(value))} label={{ value: "Carga viral V", angle: -90, position: "insideLeft" }} />
            <ZAxis dataKey="magnitude" range={[18, 80]} />
            <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="4 4" />
            <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(value, name) => [typeof value === "number" ? formatScientific(value) : String(value), String(name)]} labelFormatter={() => "Estado local"} />
            <Legend verticalAlign="top" />
            <Scatter name="Campo vectorial" data={data} shape={<VectorArrow />} />
            {trajectories.map((trajectory, index) => (
              <Scatter key={index} name={`Trayectoria ${index + 1}`} data={trajectory} line={{ stroke: "#334155", strokeWidth: 1.8, strokeOpacity: 0.55 }} shape={<InvisiblePoint />} />
            ))}
            <Scatter name="Nulclina dV/dt = 0" data={dVNullcline} fill="#7c3aed" line={{ stroke: "#7c3aed", strokeWidth: 2 }} shape="circle" />
            <Scatter name="Nulclina dI/dt = 0" data={dINullcline} fill="#f97316" line={{ stroke: "#f97316", strokeWidth: 2 }} shape="circle" />
            <Scatter name="Equilibrios" data={equilibria} shape={<EquilibriumMarker />} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
