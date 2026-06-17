import { CityScene } from '../components/epidemic/CityScene';
import { StatsHUD } from '../components/epidemic/StatsHUD';
import { ControlPanel } from '../components/epidemic/ControlPanel';
import { EpidemicCurves } from '../components/epidemic/EpidemicCurves';
import { NarrativeBox } from '../components/epidemic/NarrativeBox';
import { useEpidemicStore } from '../store/epidemicStore';
import { TICKS_PER_DAY } from '../simulation/agentEngine';

function EndOverlay() {
  const counts = useEpidemicStore((s) => s.counts);
  const tick = useEpidemicStore((s) => s.tick);
  const reset = useEpidemicStore((s) => s.reset);
  const day = Math.floor(tick / TICKS_PER_DAY);
  if (counts.I > 0 || tick < TICKS_PER_DAY) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-20"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="text-center px-10 py-8 rounded-3xl animate-bounce"
        style={{
          background: 'rgba(11,30,43,0.95)',
          border: '1px solid rgba(34,197,94,0.4)',
          boxShadow: '0 0 80px rgba(34,197,94,0.2)',
          animationDuration: '2s',
        }}
      >
        <div className="text-7xl mb-4">🎉</div>
        <div className="text-3xl font-black text-green-400 mb-2">¡Epidemia controlada!</div>
        <div className="text-slate-400 mb-6">La ciudad sobrevivió al día {day}</div>
        <button
          onClick={reset}
          className="px-8 py-3 rounded-xl font-bold text-sm transition-transform hover:scale-105 active:scale-95"
          style={{ background: '#22c55e', color: '#000', fontSize: '0.95rem' }}
        >
          ↺ Nueva simulación
        </button>
      </div>
    </div>
  );
}

export function EpidemicPage() {
  return (
    <div
      className="flex flex-col"
      style={{
        height: 'calc(100vh - 56px)',
        background: '#080e1f',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      <StatsHUD />

      <div className="flex flex-1 min-h-0">
        <ControlPanel />

        <main className="flex-1 min-w-0 min-h-0 relative">
          <CityScene />
          <NarrativeBox />
          <EndOverlay />
        </main>
      </div>

      <EpidemicCurves />
    </div>
  );
}
