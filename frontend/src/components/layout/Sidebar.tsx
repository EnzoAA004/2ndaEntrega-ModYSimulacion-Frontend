import { NavLink } from "react-router-dom";
import { BarChart3, Box, Database, FileText, FlaskConical, Home, Info, Microscope } from "lucide-react";
import { clsx } from "clsx";

const links = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/measurements", label: "Mediciones", icon: BarChart3 },
  { to: "/dataset", label: "Dataset", icon: Database },
  { to: "/simulations", label: "Simulaciones", icon: FlaskConical },
  { to: "/simulation-3d", label: "Simulación 3D", icon: Box },
  { to: "/reports", label: "Reportes", icon: FileText },
  { to: "/theory", label: "Marco teorico", icon: Microscope },
  { to: "/about", label: "Acerca", icon: Info },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      <aside className={clsx("fixed inset-y-0 left-0 z-30 w-72 border-r border-slate-200 bg-white p-4 transition-transform lg:static lg:z-auto lg:block lg:translate-x-0", open ? "translate-x-0" : "-translate-x-full")}>
        <div className="mb-6 px-2 pt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Navegacion</p>
        </div>
        <nav className="space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => clsx("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium", isActive ? "bg-sentinel-50 text-sentinel-700" : "text-slate-600 hover:bg-slate-100")}
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <button className="fixed inset-0 z-20 bg-slate-950/30 lg:hidden" onClick={onClose} aria-label="Cerrar menu" />}
    </>
  );
}
