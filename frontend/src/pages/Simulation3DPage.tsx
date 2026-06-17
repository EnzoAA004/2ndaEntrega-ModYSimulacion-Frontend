import { useEffect, useRef } from 'react';
import { useSim3DStore } from '../store/sim3dStore';
import { LeftPanel } from '../components/sim3d/LeftPanel';
import { RightPanel } from '../components/sim3d/RightPanel';
import { BottomBar } from '../components/sim3d/BottomBar';
import { MainScene3D } from '../components/sim3d/MainScene3D';

export function Simulation3DPage() {
  const { isPlaying, currentTime, tMax, speed, setCurrentTime, pause } = useSim3DStore();

  // Stable ref so the RAF closure always reads the latest time
  const currentTimeRef = useRef(currentTime);
  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    if (!isPlaying) return;

    let raf: number;
    let lastTs = performance.now();

    function tick() {
      const now = performance.now();
      const delta = Math.min((now - lastTs) / 1000, 0.1); // cap at 100ms
      lastTs = now;

      const advance = delta * speed * (tMax / 25);
      const next = Math.min(currentTimeRef.current + advance, tMax);
      currentTimeRef.current = next;
      setCurrentTime(next);

      if (next < tMax) {
        raf = requestAnimationFrame(tick);
      } else {
        pause();
      }
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, speed, tMax]); // intentionally excludes currentTime

  return (
    <div
      className="flex flex-col"
      style={{ height: 'calc(100vh - 56px)', background: '#050a1a', color: 'white', overflow: 'hidden' }}
    >
      <div className="flex flex-1 min-h-0">
        <LeftPanel />
        <main className="flex-1 min-w-0 min-h-0">
          <MainScene3D />
        </main>
        <RightPanel />
      </div>
      <BottomBar />
    </div>
  );
}
