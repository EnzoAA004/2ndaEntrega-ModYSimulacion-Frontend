import { useEpidemicStore } from '../../store/epidemicStore';
import { computeR0 } from '../../simulation/agentEngine';

function TransmissionTree({ R0 }: { R0: number }) {
  if (R0 <= 1) return null;
  const spread = Math.min(4, Math.round(R0));
  const levels = [1, spread, spread * spread].slice(0, 3);

  return (
    <div className="flex flex-col items-center gap-1 my-2">
      {levels.map((count, lvl) => (
        <div key={lvl} className="flex items-center gap-1">
          {Array.from({ length: Math.min(count, 8) }).map((_, i) => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: 8,
                height: 8,
                background: lvl === 0 ? '#ef4444' : lvl === 1 ? '#f97316' : '#fbbf24',
                boxShadow: `0 0 6px ${lvl === 0 ? '#ef444488' : '#f9731644'}`,
                animation: `pulse 1.5s ease-in-out ${lvl * 0.3}s infinite`,
              }}
            />
          ))}
          {count > 8 && <span className="text-[10px] text-slate-500">+{count - 8}</span>}
        </div>
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.2)} }`}</style>
    </div>
  );
}

function getPhase(I: number, total: number, tick: number): { label: string; emoji: string } {
  if (I === 0 && tick > 30) return { label: 'Controlada', emoji: '✅' };
  const pct = I / total;
  if (pct < 0.02) return { label: 'Inicio', emoji: '🦠' };
  if (pct < 0.15) return { label: 'Crecimiento', emoji: '📈' };
  if (pct < 0.4) return { label: 'Pico', emoji: '🔴' };
  return { label: 'Declive', emoji: '📉' };
}

function getTip(params: { maskUsage: number; distancing: number; vacRate: number }, R0: number): string {
  if (R0 > 2 && params.maskUsage < 0.3) return '💡 Activa el barbijo para reducir el contagio un 65%';
  if (R0 > 1 && params.distancing < 0.3) return '💡 El distanciamiento reduce el radio de infección';
  if (params.vacRate < 0.3) return '💡 La vacunación crea inmunidad de rebaño';
  if (R0 > 1) return '💡 Combina todas las medidas para detener la epidemia';
  return '💡 ¡Las medidas están funcionando! Mantén las intervenciones';
}

export function NarrativeBox() {
  const counts = useEpidemicStore((s) => s.counts);
  const tick = useEpidemicStore((s) => s.tick);
  const params = useEpidemicStore((s) => s.params);
  const day = Math.floor(tick / 30);
  const R0 = computeR0(params);
  const total = counts.S + counts.I + counts.R + counts.V;
  const phase = getPhase(counts.I, Math.max(1, total), tick);
  const r0Color = R0 > 2 ? '#ef4444' : R0 > 1 ? '#eab308' : '#22c55e';
  const tip = getTip(params, R0);

  return (
    <div
      className="absolute bottom-4 right-4 w-72 rounded-2xl p-4 shadow-2xl"
      style={{
        background: 'rgba(11,22,41,0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.1)',
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-slate-400">📅 Día {day}</span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: counts.I === 0 && tick > 30 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
            color: counts.I === 0 && tick > 30 ? '#22c55e' : '#ef4444',
          }}
        >
          {phase.emoji} {phase.label}
        </span>
      </div>

      {/* Main message */}
      <div className="text-sm text-slate-200 leading-relaxed mb-2">
        {R0 > 1 ? (
          <>Cada infectado contagia a{' '}
            <span style={{ color: r0Color, fontWeight: 'bold' }}>~{R0.toFixed(1)} personas</span>.
            La epidemia sigue creciendo.
          </>
        ) : R0 > 0.5 ? (
          <>El R₀ = <span style={{ color: r0Color, fontWeight: 'bold' }}>{R0.toFixed(1)}</span>.
            La epidemia está desacelerando.
          </>
        ) : (
          <>La epidemia está <span className="text-green-400 font-bold">bajo control</span>. ¡Buen trabajo!</>
        )}
      </div>

      {/* Transmission tree */}
      {R0 > 1 && counts.I > 0 && (
        <div className="mb-2">
          <p className="text-[10px] text-slate-600 mb-1 uppercase tracking-wide">Árbol de contagio</p>
          <TransmissionTree R0={R0} />
        </div>
      )}

      {/* Tip */}
      <div
        className="rounded-lg px-3 py-2 text-[11px] text-slate-400"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {tip}
      </div>
    </div>
  );
}
