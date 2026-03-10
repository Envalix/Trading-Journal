"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, TrendingUp } from "lucide-react";
import { useTrades } from "@/hooks/use-trades";
import { useTradeMetrics, type Period } from "@/hooks/use-trade-metrics";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { PeriodSelector } from "@/components/dashboard/period-selector";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EquityCurveChart } from "@/components/dashboard/equity-curve-chart";
import { WinLossChart } from "@/components/dashboard/win-loss-chart";
import { GroupBarChart } from "@/components/dashboard/group-bar-chart";
import { DayOfWeekChart } from "@/components/dashboard/day-of-week-chart";
import { CalendarHeatmap } from "@/components/dashboard/calendar-heatmap";
import { RecentTradesList } from "@/components/dashboard/recent-trades-list";

export default function DashboardPage() {
  const [period, setPeriod] = useState<Period>("month");
  const { trades, loading } = useTrades();

  const {
    filteredTrades,
    metrics,
    equityCurve,
    rolling7,
    rolling30,
    currentStreak,
    avgRR,
    byDayOfWeek,
    byMarketType,
    bySetupType,
    byEmotionalState,
  } = useTradeMetrics(trades, { period });

  const pnlTrend =
    metrics.totalPnL > 0 ? "positive" : metrics.totalPnL < 0 ? "negative" : "neutral";

  const streakLabel =
    currentStreak.type === "none"
      ? "—"
      : `${currentStreak.count} ${currentStreak.type === "win" ? "W" : "L"}`;
  const streakTrend =
    currentStreak.type === "win"
      ? "positive"
      : currentStreak.type === "loss"
      ? "negative"
      : "neutral";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-32 animate-pulse rounded-lg bg-surface-200" />
            <div className="mt-1 h-4 w-48 animate-pulse rounded bg-surface-100" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
        <div className="h-80 animate-pulse rounded-xl bg-surface-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-surface-500">
            {filteredTrades.length} trade{filteredTrades.length !== 1 ? "s" : ""} in period
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector value={period} onChange={setPeriod} />
          <Link
            href="/trades/new"
            className="flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Log Trade
          </Link>
        </div>
      </div>

      {/* Metric cards — row 1 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total P&L"
          value={formatCurrency(metrics.totalPnL)}
          sub={`${metrics.closedTrades} closed trade${metrics.closedTrades !== 1 ? "s" : ""}`}
          trend={pnlTrend}
        />
        <MetricCard
          label="Win Rate"
          value={metrics.closedTrades > 0 ? `${metrics.winRate.toFixed(1)}%` : "—"}
          sub={`${metrics.wins}W / ${metrics.losses}L`}
          trend={metrics.winRate >= 50 ? "positive" : metrics.winRate > 0 ? "negative" : "neutral"}
        />
        <MetricCard
          label="Profit Factor"
          value={
            metrics.profitFactor === Infinity
              ? "∞"
              : metrics.closedTrades > 0
              ? formatNumber(metrics.profitFactor)
              : "—"
          }
          sub={metrics.profitFactor >= 1 ? "Profitable" : metrics.closedTrades > 0 ? "Under 1.0" : undefined}
          trend={
            metrics.profitFactor >= 1.5
              ? "positive"
              : metrics.profitFactor >= 1
              ? "neutral"
              : metrics.closedTrades > 0
              ? "negative"
              : "neutral"
          }
        />
        <MetricCard
          label="Expectancy"
          value={metrics.closedTrades > 0 ? formatCurrency(metrics.expectancy) : "—"}
          sub="per trade"
          trend={
            metrics.expectancy > 0 ? "positive" : metrics.expectancy < 0 ? "negative" : "neutral"
          }
        />
      </div>

      {/* Metric cards — row 2 */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard
          label="Total Trades"
          value={String(metrics.totalTrades)}
          sub={metrics.openTrades > 0 ? `${metrics.openTrades} open` : "All closed"}
          trend="neutral"
        />
        <MetricCard
          label="Avg Win / Loss"
          value={
            metrics.closedTrades > 0
              ? `${formatCurrency(metrics.avgWin)} / ${formatCurrency(metrics.avgLoss)}`
              : "—"
          }
          trend="neutral"
        />
        <MetricCard
          label="Avg R:R"
          value={avgRR > 0 ? formatNumber(avgRR) : "—"}
          sub="Risk/Reward ratio"
          trend={avgRR >= 2 ? "positive" : avgRR >= 1 ? "neutral" : avgRR > 0 ? "negative" : "neutral"}
        />
        <MetricCard
          label="Current Streak"
          value={streakLabel}
          sub={
            currentStreak.type !== "none"
              ? `Max ${currentStreak.type === "win" ? metrics.maxConsecutiveWins : metrics.maxConsecutiveLosses} this period`
              : undefined
          }
          trend={streakTrend}
        />
      </div>

      {/* Equity curve */}
      <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900">Equity Curve</h2>
          <div className="flex items-center gap-4 text-xs text-surface-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 bg-primary-500" /> Cumulative
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[#10B981]" /> 7-day avg
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-[#F59E0B]" /> 30-day avg
            </span>
          </div>
        </div>
        <EquityCurveChart data={equityCurve} rolling7={rolling7} rolling30={rolling30} />
      </div>

      {/* Win/Loss + Day of Week */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-surface-900">Win / Loss Split</h2>
          <WinLossChart metrics={metrics} />
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-surface-900">P&amp;L by Day of Week</h2>
          <DayOfWeekChart data={byDayOfWeek} />
        </div>
      </div>

      {/* Market type + Setup type */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-surface-900">P&amp;L by Market Type</h2>
          <GroupBarChart data={byMarketType} />
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-surface-900">P&amp;L by Setup Type</h2>
          <GroupBarChart data={bySetupType} />
        </div>
      </div>

      {/* Emotional state + Calendar heatmap */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-surface-900">P&amp;L by Emotional State</h2>
          <GroupBarChart data={byEmotionalState} />
        </div>

        <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-surface-900">Trade Calendar</h2>
          <CalendarHeatmap data={equityCurve} />
        </div>
      </div>

      {/* Recent trades */}
      <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-surface-900">Recent Trades</h2>
          <Link
            href="/trades"
            className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View all <TrendingUp className="h-3.5 w-3.5" />
          </Link>
        </div>
        <RecentTradesList trades={filteredTrades} limit={8} />
      </div>
    </div>
  );
}
