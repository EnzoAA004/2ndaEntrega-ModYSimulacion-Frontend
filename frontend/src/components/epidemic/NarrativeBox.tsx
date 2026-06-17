import { useEpidemicStore } from '../../store/epidemicStore';

interface Narrative {
  icon: string;
  title: string;
  body: string;
  tip: string;
  color: string;
}

function getNarrative(R0: number, infectedPct: number): Narrative {
  if (infectedPct === 0) return {
    icon: '🎉', title: '¡Epidemia extinguida!',
    body: 'No quedan infectados en la ciudad.\nEl virus desapareció de la población.',
    tip: '👏 ¡Lo lograste! Reiniciá para probar otro escenario.',
    color: '#22c55e',
  };
  if (R0 < 0.5) return {
    icon: '📉', title: 'Casi eliminada',
    body: 'Los infectados casi no contagian a nadie.\nLa epidemia desaparece rápido.',
    tip: '💚 ¡Seguí así! La curva baja sola.',
    color: '#4ade80',
  };
  if (R0 < 1.0) return {
    icon: '✅', title: 'Bajo control',
    body: `Cada infectado contagia a ~${R0.toFixed(1)} persona.\nCuando es menos de 1, la epidemia se extingue.`,
    tip: '💡 Mantené las medidas activas.',
    color: '#86efac',
  };
  if (R0 < 1.5) return {
    icon: '⚠️', title: 'Brote moderado',
    body: `Cada infectado contagia a ~${R0.toFixed(1)} persona.\nLa epidemia crece, pero despacio.`,
    tip: '💡 Subí el barbijo o el distanciamiento.',
    color: '#fbbf24',
  };
  if (R0 < 2.5) return {
    icon: '🦠', title: 'Epidemia activa',
    body: `Cada infectado contagia a ~${R0.toFixed(1)} personas.\nLos casos aumentan rápidamente.`,
    tip: '🚨 Activá distanciamiento + barbijo urgente.',
    color: '#f97316',
  };
  return {
    icon: '🔥', title: '¡Pandemia explosiva!',
    body: `Cada infectado contagia a ~${R0.toFixed(1)} personas.\nPropagación exponencial descontrolada.`,
    tip: '🚨 Activá todas las medidas de inmediato.',
    color: '#ef4444',
  };
}

export function NarrativeBox() {
  const { params, counts, tick } = useEpidemicStore();
  const day = Math.floor(tick / 30);

  const R0 = params.contagion * (1 - params.maskUsage * 0.7) * (1 - params.distancing * 0.65) * 3.5;
  const total = counts.S + counts.I + counts.R + counts.V || 1;
  const infectedPct = (counts.I / total) * 100;

  const n = getNarrative(R0, counts.I === 0 && tick > 0 ? 0 : infectedPct);

  return (
    <div
      className="rounded-2xl overflow-hidden backdrop-blur-md select-none"
      style={{
        background: 'rgba(8, 16, 34, 0.93)',
        border: `1px solid ${n.color}35`,
        borderLeft: `3px solid ${n.color}`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 0 1px ${n.color}10`,
      }}
    >
      <div className="px-4 py-3">
        <div className="text-[10px] text-slate-500 font-mono mb-1.5">
          📅 Día {day} · {infectedPct.toFixed(1)}% infectados
        </div>
        <div
          className="flex items-center gap-2 font-black text-sm mb-2 leading-tight"
          style={{ color: n.color }}
        >
          <span className="text-xl">{n.icon}</span>
          <span>{n.title}</span>
        </div>
        <div className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mb-2.5">
          {n.body}
        </div>
        <div
          className="text-[11px] font-semibold py-1.5 px-2.5 rounded-lg"
          style={{ background: `${n.color}14`, color: n.color }}
        >
          {n.tip}
        </div>
      </div>
    </div>
  );
}
