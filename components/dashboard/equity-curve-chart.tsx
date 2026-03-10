"use client";

import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { DailyPnL } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";

interface EquityCurveChartProps {
  data: DailyPnL[];
  rolling7?: DailyPnL[];
  rolling30?: DailyPnL[];
}

interface TooltipPayload {
  payload?: {
    date: string;
    cumulative: number;
    pnl: number;
    trades: number;
  };
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-surface-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-medium text-surface-500">{d.date}</p>
      <p className={`text-sm font-bold ${d.cumulative >= 0 ? "text-profit" : "text-loss"}`}>
        {formatCurrency(d.cumulative)}
      </p>
      <p className="text-xs text-surface-400">
        Day P&amp;L: {formatCurrency(d.pnl)} · {d.trades} trade{d.trades !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export function EquityCurveChart({ data, rolling7, rolling30 }: EquityCurveChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-surface-400">
        No closed trades yet
      </div>
    );
  }

  // Merge rolling averages into the data by date
  const r7Map = new Map(rolling7?.map((d) => [d.date, d.pnl]) ?? []);
  const r30Map = new Map(rolling30?.map((d) => [d.date, d.pnl]) ?? []);

  const chartData = data.map((d) => ({
    ...d,
    r7: r7Map.get(d.date),
    r30: r30Map.get(d.date),
  }));

  const minVal = Math.min(...data.map((d) => d.cumulative));
  const maxVal = Math.max(...data.map((d) => d.cumulative));
  const yDomain: [number, number] = [Math.min(minVal * 1.1, 0), Math.max(maxVal * 1.1, 0)];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 8 }}>
        <defs>
          <linearGradient id="equity-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94A3B8" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
          domain={yDomain}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={0} stroke="#CBD5E1" strokeDasharray="4 4" />
        <Area
          type="monotone"
          dataKey="cumulative"
          stroke="#3B82F6"
          strokeWidth={2}
          fill="url(#equity-gradient)"
          dot={false}
          activeDot={{ r: 4, fill: "#3B82F6" }}
        />
        {rolling7 && rolling7.length > 0 && (
          <Line
            type="monotone"
            dataKey="r7"
            stroke="#10B981"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
            name="7-day avg"
          />
        )}
        {rolling30 && rolling30.length > 0 && (
          <Line
            type="monotone"
            dataKey="r30"
            stroke="#F59E0B"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
            name="30-day avg"
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
