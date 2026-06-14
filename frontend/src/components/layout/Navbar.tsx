import { Activity, Menu } from "lucide-react";

export function Navbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden" onClick={onMenu} aria-label="Abrir menu">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sentinel-600 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-sentinel-700">Wastewater Sentinel</p>
            <p className="text-xs text-slate-500">Vigilancia epidemiologica ambiental</p>
          </div>
        </div>
        <div className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 sm:block">FastAPI ready</div>
      </div>
    </header>
  );
}
