"use client";

import { useMemo } from "react";
import {
  filterByPeriod,
  calculateMetrics,
  buildEquityCurve,
  buildRollingAverage,
  calculateByDirection,
  calculateBySetupType,
  calculateByEmotionalState,
  calculateByMarketType,
  calculateByInstrument,
  calculateByTag,
  calculateCurrentStreak,
  calculateAvgRR,
  calculateByDayOfWeek,
  type Period,
  type TradeMetrics,
  type DailyPnL,
  type GroupedMetrics,
} from "@/lib/calculations";
import type { TradeWithRelations } from "@/types/database";

export type { Period, TradeMetrics, DailyPnL, GroupedMetrics };
export type { DayOfWeekMetrics } from "@/lib/calculations";

interface UseTradeMetricsOptions {
  period?: Period;
  rolling7?: boolean;
  rolling30?: boolean;
}

export interface TradeMetricsResult {
  /** Trades filtered by the selected period */
  filteredTrades: TradeWithRelations[];

  /** Aggregate metrics */
  metrics: TradeMetrics;

  /** Daily P&L / equity curve */
  equityCurve: DailyPnL[];
  rolling7: DailyPnL[];
  rolling30: DailyPnL[];

  /** Current streak */
  currentStreak: { count: number; type: "win" | "loss" | "none" };

  /** Average R:R ratio */
  avgRR: number;

  /** P&L grouped by day of week (Mon–Sun) */
  byDayOfWeek: import("@/lib/calculations").DayOfWeekMetrics[];

  /** Grouped metrics */
  byDirection: GroupedMetrics;
  byMarketType: GroupedMetrics;
  byInstrument: GroupedMetrics;
  bySetupType: GroupedMetrics;
  byEmotionalState: GroupedMetrics;
  byTag: GroupedMetrics;
}

/**
 * Derive all trading metrics from a pre-fetched trades array.
 * Accepts a `trades` array (from useTrades) and a period filter,
 * returning memoized metrics to avoid recomputation on unrelated renders.
 */
export function useTradeMetrics(
  trades: TradeWithRelations[],
  options: UseTradeMetricsOptions = {}
): TradeMetricsResult {
  const { period = "all" } = options;

  const filteredTrades = useMemo(
    () => filterByPeriod(trades, period),
    [trades, period]
  );

  const metrics = useMemo(
    () => calculateMetrics(filteredTrades),
    [filteredTrades]
  );

  const equityCurve = useMemo(
    () => buildEquityCurve(filteredTrades),
    [filteredTrades]
  );

  const rolling7 = useMemo(
    () => buildRollingAverage(equityCurve, 7),
    [equityCurve]
  );

  const rolling30 = useMemo(
    () => buildRollingAverage(equityCurve, 30),
    [equityCurve]
  );

  const byDirection = useMemo(
    () => calculateByDirection(filteredTrades),
    [filteredTrades]
  );

  const byMarketType = useMemo(
    () => calculateByMarketType(filteredTrades),
    [filteredTrades]
  );

  const byInstrument = useMemo(
    () => calculateByInstrument(filteredTrades),
    [filteredTrades]
  );

  const bySetupType = useMemo(
    () => calculateBySetupType(filteredTrades),
    [filteredTrades]
  );

  const byEmotionalState = useMemo(
    () => calculateByEmotionalState(filteredTrades),
    [filteredTrades]
  );

  const byTag = useMemo(
    () => calculateByTag(filteredTrades),
    [filteredTrades]
  );

  const currentStreak = useMemo(
    () => calculateCurrentStreak(filteredTrades),
    [filteredTrades]
  );

  const avgRR = useMemo(
    () => calculateAvgRR(filteredTrades),
    [filteredTrades]
  );

  const byDayOfWeek = useMemo(
    () => calculateByDayOfWeek(filteredTrades),
    [filteredTrades]
  );

  return {
    filteredTrades,
    metrics,
    equityCurve,
    rolling7,
    rolling30,
    currentStreak,
    avgRR,
    byDayOfWeek,
    byDirection,
    byMarketType,
    byInstrument,
    bySetupType,
    byEmotionalState,
    byTag,
  };
}
