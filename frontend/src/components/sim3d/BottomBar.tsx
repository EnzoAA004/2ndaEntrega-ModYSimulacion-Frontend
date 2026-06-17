import { useSim3DStore } from '../../store/sim3dStore';
import type { Speed } from '../../store/sim3dStore';

const SPEEDS: Speed[] = [1, 2, 5, 10];

export function BottomBar() {
  const {
    currentTime,
    tMax,
    isPlaying,
    speed,
    play,
    pause,
    reset,
    setCurrentTime,
    setSpeed,
  } = useSim3DStore();

  const progress = tMax > 0 ? currentTime / tMax : 0;

  return (
    <div
      className="h-12 shrink-0 flex items-center gap-4 px-4"
      style={{
        background: '#0b1529',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Playback buttons */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={isPlaying ? pause : play}
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm transition"
          style={{
            background: isPlaying ? '#1e3a5f' : '#06b6d4',
            color: 'white',
            border: `1px solid ${isPlaying ? '#334466' : '#06b6d4'}`,
          }}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={() => setCurrentTime(Math.min(tMax, currentTime + tMax / 20))}
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm transition text-slate-400 hover:text-white"
          style={{ background: '#0f1e3a', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Avanzar un paso"
        >
          ⏭
        </button>
        <button
          onClick={reset}
          className="w-8 h-8 rounded-md flex items-center justify-center text-sm transition text-slate-400 hover:text-white"
          style={{ background: '#0f1e3a', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Reiniciar"
        >
          ↺
        </button>
      </div>

      {/* Timeline scrubber */}
      <div className="flex-1 flex items-center gap-3">
        <span className="text-[10px] font-mono text-slate-500 w-6 text-right">
          {currentTime.toFixed(0)}
        </span>
        <div className="flex-1 relative flex items-center">
          <input
            type="range"
            min={0}
            max={tMax}
            step={tMax / 400}
            value={currentTime}
            onChange={(e) => {
              pause();
              setCurrentTime(Number(e.target.value));
            }}
            className="w-full h-1 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #06b6d4 ${progress * 100}%, #1e3a5f ${progress * 100}%)`,
            }}
          />
        </div>
        <span className="text-[10px] font-mono text-slate-500 w-6">{tMax}</span>
        <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
          t = <span className="text-[#06b6d4] font-bold">{currentTime.toFixed(1)}</span>/{tMax}d
        </span>
      </div>

      {/* Speed selector */}
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-slate-500 mr-1 uppercase tracking-widest">Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className="px-2 py-1 rounded text-[10px] font-mono font-bold transition"
            style={{
              background: speed === s ? '#06b6d4' : '#0f1e3a',
              color: speed === s ? 'white' : '#4a6080',
              border: `1px solid ${speed === s ? '#06b6d4' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
