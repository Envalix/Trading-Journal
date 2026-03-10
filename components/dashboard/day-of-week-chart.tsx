"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import type { DayOfWeekMetrics } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";

interface DayOfWeekChartProps {
  data: DayOfWeekMetrics[];
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: DayOfWeekMetrics }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-surface-700">{d.day}</p>
      <p className={`text-sm font-bold ${d.pnl >= 0 ? "text-profit" : "text-loss"}`}>
        {formatCurrency(d.pnl)}
      </p>
      <p className="text-xs text-surface-400">
        {d.wins}W / {d.losses}L · {d.trades} trade{d.trades !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function DayOfWeekChart({ data }: DayOfWeekChartProps) {
  const hasTrades = data.some((d) => d.trades > 0);
  if (!hasTrades) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-surface-400">
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#CBD5E1" />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((entry) => (
            <Cell
              key={entry.day}
              fill={entry.pnl >= 0 ? "#10B981" : "#EF4444"}
              opacity={entry.trades === 0 ? 0.2 : 1}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
