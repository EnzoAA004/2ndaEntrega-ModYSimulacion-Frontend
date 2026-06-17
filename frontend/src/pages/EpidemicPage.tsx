import { CityScene } from '../components/epidemic/CityScene';
import { StatsHUD } from '../components/epidemic/StatsHUD';
import { ControlPanel } from '../components/epidemic/ControlPanel';
import { EpidemicCurves } from '../components/epidemic/EpidemicCurves';
import { NarrativeBox } from '../components/epidemic/NarrativeBox';
import { useEpidemicStore } from '../store/epidemicStore';

function EndOverlay() {
  const { counts, tick, reset } = useEpidemicStore();
  const day = Math.floor(tick / 30);
  if (counts.I > 0 || tick < 30) return null;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center z-20"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="text-center px-10 py-8 rounded-3xl"
        style={{
          background: '#0b1e2b',
          border: '1px solid rgba(34,197,94,0.3)',
          boxShadow: '0 0 60px rgba(34,197,94,0.15)',
        }}
      >
        <div className="text-6xl mb-3">🎉</div>
        <div className="text-2xl font-black text-green-400 mb-1">¡Epidemia controlada!</div>
        <div className="text-slate-400 text-sm mb-5">La ciudad sobrevivió al día {day}</div>
        <button
          onClick={reset}
          className="px-8 py-2.5 rounded-xl font-bold text-sm transition-transform hover:scale-105"
          style={{ background: '#22c55e', color: '#000' }}
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
        background: '#0d1117',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      <StatsHUD />

      <div className="flex flex-1 min-h-0">
        <ControlPanel />

        <main className="flex-1 min-w-0 min-h-0 relative">
          <CityScene />

          {/* Narrative overlay */}
          <div className="absolute bottom-4 right-4 w-64 z-10">
            <NarrativeBox />
          </div>

          {/* Victory overlay */}
          <EndOverlay />
        </main>
      </div>

      <EpidemicCurves />
    </div>
  );
}
