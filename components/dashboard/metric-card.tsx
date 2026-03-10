"use client";

import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  trend?: "positive" | "negative" | "neutral";
  className?: string;
}

export function MetricCard({ label, value, sub, trend, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-surface-200 bg-white p-5 shadow-sm",
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-surface-500">{label}</p>
      <p
        className={cn(
          "mt-1.5 text-2xl font-bold",
          trend === "positive" && "text-profit",
          trend === "negative" && "text-loss",
          trend === "neutral" && "text-surface-900",
          !trend && "text-surface-900"
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-surface-400">{sub}</p>}
    </div>
  );
}
