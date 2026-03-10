"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { GroupedMetrics } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";

interface GroupBarChartProps {
  data: GroupedMetrics;
  /** What to display on the bar — defaults to totalPnL */
  metric?: "totalPnL" | "winRate" | "totalTrades";
  height?: number;
}

function CustomTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: { payload: { name: string; value: number; trades: number } }[];
  metric: string;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, trades } = payload[0].payload;
  return (
    <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs font-semibold text-surface-700">{name}</p>
      <p className={`text-sm font-bold ${value >= 0 ? "text-profit" : "text-loss"}`}>
        {metric === "totalPnL" ? formatCurrency(value) : metric === "winRate" ? `${value.toFixed(1)}%` : value}
      </p>
      <p className="text-xs text-surface-400">{trades} trade{trades !== 1 ? "s" : ""}</p>
    </div>
  );
}

export function GroupBarChart({ data, metric = "totalPnL", height = 200 }: GroupBarChartProps) {
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-sm text-surface-400"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  const chartData = entries
    .map(([name, m]) => ({
      name,
      value: metric === "totalPnL" ? m.totalPnL : metric === "winRate" ? m.winRate : m.totalTrades,
      trades: m.totalTrades,
    }))
    .sort((a, b) => b.value - a.value);

  const tickFormatter =
    metric === "totalPnL"
      ? (v: number) => `$${Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`
      : metric === "winRate"
      ? (v: number) => `${v.toFixed(0)}%`
      : String;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={tickFormatter}
          width={52}
        />
        <Tooltip content={<CustomTooltip metric={metric} />} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {chartData.map((entry) => (
            <Cell
              key={entry.name}
              fill={
                metric === "totalPnL"
                  ? entry.value >= 0
                    ? "#10B981"
                    : "#EF4444"
                  : "#3B82F6"
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
