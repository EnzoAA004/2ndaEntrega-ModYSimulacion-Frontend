import { SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ label: string; value: string }>;
  hint?: string;
}

export function Select({ label, options, hint, className, ...props }: SelectProps) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>}
      <select className={clsx("w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sentinel-500 focus:ring-2 focus:ring-sentinel-100", className)} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}
