"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { TradeMetrics } from "@/lib/calculations";

interface WinLossChartProps {
  metrics: TradeMetrics;
}

const COLORS = {
  Wins: "#10B981",
  Losses: "#EF4444",
  "Break Even": "#94A3B8",
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="rounded-lg border border-surface-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-surface-700">
        {name}: {value}
      </p>
    </div>
  );
}

export function WinLossChart({ metrics }: WinLossChartProps) {
  const { wins, losses, breakEven, winRate, closedTrades } = metrics;

  if (closedTrades === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-surface-400">
        No closed trades yet
      </div>
    );
  }

  const chartData = [
    { name: "Wins", value: wins },
    { name: "Losses", value: losses },
    ...(breakEven > 0 ? [{ name: "Break Even", value: breakEven }] : []),
  ].filter((d) => d.value > 0);

  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={88}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name as keyof typeof COLORS]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-surface-900">{winRate.toFixed(1)}%</span>
        <span className="text-xs text-surface-400">Win Rate</span>
      </div>
      {/* Legend */}
      <div className="flex gap-4">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: COLORS[entry.name as keyof typeof COLORS] }}
            />
            <span className="text-xs text-surface-500">
              {entry.name} ({entry.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
