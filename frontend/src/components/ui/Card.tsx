import { clsx } from "clsx";
import { PropsWithChildren } from "react";

interface CardProps extends PropsWithChildren {
  className?: string;
}

export function Card({ children, className }: CardProps) {
  return <section className={clsx("rounded-lg border border-slate-200 bg-white p-5 shadow-soft", className)}>{children}</section>;
}

export function CardTitle({ children }: PropsWithChildren) {
  return <h3 className="text-base font-semibold text-slate-900">{children}</h3>;
}
