import { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-sentinel-600 text-white hover:bg-sentinel-700 disabled:bg-slate-300",
    secondary: "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300",
    ghost: "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-slate-300",
  };
  return (
    <button
      className={clsx("inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition", variants[variant], className)}
      {...props}
    />
  );
}
