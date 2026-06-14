import { clsx } from "clsx";
import { riskBadgeClass, riskLabel } from "../../utils/riskUtils";

interface BadgeProps {
  children?: React.ReactNode;
  risk?: string | null;
  tone?: "slate" | "cyan" | "green" | "amber" | "red";
}

export function Badge({ children, risk, tone = "slate" }: BadgeProps) {
  const tones = {
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
  };
  return <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", risk ? riskBadgeClass(risk) : tones[tone])}>{risk ? riskLabel(risk) : children}</span>;
}
