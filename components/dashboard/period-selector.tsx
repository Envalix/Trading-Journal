"use client";

import type { Period } from "@/lib/calculations";

const PERIODS: { value: Period; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "7 Days" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={
            p.value === value
              ? "rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-surface-900 shadow-sm"
              : "rounded-lg px-3 py-1.5 text-sm font-medium text-surface-500 hover:text-surface-700"
          }
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
