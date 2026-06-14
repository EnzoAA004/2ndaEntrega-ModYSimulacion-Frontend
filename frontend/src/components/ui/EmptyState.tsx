import { Database } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title = "Sin datos disponibles", message = "Carga datos demo o importa un CSV para comenzar.", actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
      <Database className="mb-3 h-8 w-8 text-slate-400" />
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{message}</p>
      {actionLabel && onAction && <Button className="mt-4" onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
