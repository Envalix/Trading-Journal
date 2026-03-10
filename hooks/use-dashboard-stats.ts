"use client";

import { useMemo } from "react";
import type { Trade } from "@/types/database";
import type { DashboardStats } from "@/types";

export function useDashboardStats(trades: Trade[]): DashboardStats {
  return useMemo(() => {
    const closedTrades = trades.filter((t) => t.status === "closed" && t.pnl !== undefined);
    const openTrades = trades.filter((t) => t.status === "open");
    const winners = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
    const losers = closedTrades.filter((t) => (t.pnl ?? 0) <= 0);

    const totalPnl = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const avgWin = winners.length > 0 ? winners.reduce((sum, t) => sum + (t.pnl ?? 0), 0) / winners.length : 0;
    const avgLoss = losers.length > 0 ? Math.abs(losers.reduce((sum, t) => sum + (t.pnl ?? 0), 0) / losers.length) : 0;
    const grossProfit = winners.reduce((sum, t) => sum + (t.pnl ?? 0), 0);
    const grossLoss = Math.abs(losers.reduce((sum, t) => sum + (t.pnl ?? 0), 0));

    return {
      totalTrades: trades.length,
      openTrades: openTrades.length,
      closedTrades: closedTrades.length,
      winRate: closedTrades.length > 0 ? (winners.length / closedTrades.length) * 100 : 0,
      totalPnl,
      avgWin,
      avgLoss,
      profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
      largestWin: winners.length > 0 ? Math.max(...winners.map((t) => t.pnl ?? 0)) : 0,
      largestLoss: losers.length > 0 ? Math.abs(Math.min(...losers.map((t) => t.pnl ?? 0))) : 0,
    };
  }, [trades]);
}
