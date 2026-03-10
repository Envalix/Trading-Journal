/**
 * Trading Journal — P&L & Metrics Calculation Engine
 *
 * All functions are pure (no side effects) and handle edge cases:
 *   - Zero trades, all-win, all-loss, division by zero
 *
 * P&L source: closed trades carry DB-stored `pnl` (computed by Postgres trigger).
 * We prefer the stored value; fall back to client-side formula when null.
 */

import type { Trade, TradeWithRelations } from "@/types/database";

// ─── Period ──────────────────────────────────────────────────────────────────

export type Period = "today" | "week" | "month" | "year" | "all";

function startOf(period: Period): Date | null {
  const now = new Date();
  switch (period) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month": {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case "year": {
      return new Date(now.getFullYear(), 0, 1);
    }
    case "all":
      return null;
  }
}

/** Filter trades by the entry_date falling within [period start, now]. */
export function filterByPeriod<T extends Trade>(trades: T[], period: Period): T[] {
  const start = startOf(period);
  if (!start) return trades;
  return trades.filter((t) => new Date(t.entry_date) >= start);
}

// ─── Single-trade calculations ─────────────────────────────────────────────

/** Use DB-stored pnl when available; compute client-side otherwise. */
export function getTradePnL(trade: Trade): number | null {
  if (trade.pnl !== null) return trade.pnl;
  if (trade.exit_price === null) return null; // open trade
  const raw =
    trade.direction === "long"
      ? (trade.exit_price - trade.entry_price) * trade.quantity
      : (trade.entry_price - trade.exit_price) * trade.quantity;
  return raw - trade.fees;
}

export function getTradePnLPercent(trade: Trade): number | null {
  if (trade.pnl_percentage !== null) return trade.pnl_percentage;
  const pnl = getTradePnL(trade);
  if (pnl === null) return null;
  const cost = trade.entry_price * trade.quantity;
  return cost === 0 ? 0 : (pnl / cost) * 100;
}

export function getRiskReward(trade: Trade): number | null {
  const { entry_price, stop_loss, take_profit, direction } = trade;
  if (!stop_loss || !take_profit) return null;
  const risk =
    direction === "long" ? entry_price - stop_loss : stop_loss - entry_price;
  const reward =
    direction === "long" ? take_profit - entry_price : entry_price - take_profit;
  if (risk <= 0 || reward <= 0) return null;
  return reward / risk;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TradeMetrics {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;

  // P&L
  totalPnL: number;
  totalFees: number;

  // Win/loss
  wins: number;
  losses: number;
  breakEven: number;
  winRate: number; // 0–100

  // Averages
  avgWin: number;
  avgLoss: number; // positive magnitude

  // Risk
  profitFactor: number;
  expectancy: number;

  // Extremes
  largestWin: number;
  largestLoss: number; // negative value

  // Streaks
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;

  // Drawdown
  maxDrawdown: number; // positive magnitude (peak-to-trough)
}

export interface DailyPnL {
  date: string; // ISO date string YYYY-MM-DD
  pnl: number;
  cumulative: number;
  trades: number;
}

export interface GroupedMetrics {
  [key: string]: TradeMetrics;
}

// ─── Core metrics ──────────────────────────────────────────────────────────

/** Closed, non-null-pnl trades only (the source of truth for metrics). */
function closedWithPnL(trades: Trade[]): Array<Trade & { pnl: number }> {
  return trades.filter(
    (t): t is Trade & { pnl: number } =>
      t.status === "closed" && t.pnl !== null
  );
}

export function calculateWinRate(trades: Trade[]): number {
  const closed = closedWithPnL(trades);
  if (closed.length === 0) return 0;
  const wins = closed.filter((t) => t.pnl > 0).length;
  return (wins / closed.length) * 100;
}

export function calculateProfitFactor(trades: Trade[]): number {
  const closed = closedWithPnL(trades);
  const grossProfit = closed.reduce((s, t) => (t.pnl > 0 ? s + t.pnl : s), 0);
  const grossLoss = closed.reduce((s, t) => (t.pnl < 0 ? s + Math.abs(t.pnl) : s), 0);
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return grossProfit / grossLoss;
}

export function calculateExpectancy(trades: Trade[]): number {
  const closed = closedWithPnL(trades);
  if (closed.length === 0) return 0;
  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl < 0);
  const winRate = wins.length / closed.length;
  const lossRate = losses.length / closed.length;
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + t.pnl, 0) / losses.length) : 0;
  return winRate * avgWin - lossRate * avgLoss;
}

export function calculateDrawdown(trades: Trade[]): number {
  const sorted = closedWithPnL(trades).sort(
    (a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime()
  );
  let peak = 0;
  let cumulative = 0;
  let maxDrawdown = 0;
  for (const t of sorted) {
    cumulative += t.pnl;
    if (cumulative > peak) peak = cumulative;
    const drawdown = peak - cumulative;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  return maxDrawdown;
}

export function calculateStreak(trades: Trade[]): {
  wins: number;
  losses: number;
} {
  const sorted = closedWithPnL(trades).sort(
    (a, b) => new Date(a.exit_date!).getTime() - new Date(b.exit_date!).getTime()
  );
  let maxWins = 0;
  let maxLosses = 0;
  let curWins = 0;
  let curLosses = 0;
  for (const t of sorted) {
    if (t.pnl > 0) {
      curWins++;
      curLosses = 0;
      maxWins = Math.max(maxWins, curWins);
    } else {
      curLosses++;
      curWins = 0;
      maxLosses = Math.max(maxLosses, curLosses);
    }
  }
  return { wins: maxWins, losses: maxLosses };
}

/** Compute the full metrics object for a set of trades. */
export function calculateMetrics(trades: Trade[]): TradeMetrics {
  const closed = closedWithPnL(trades);
  const open = trades.filter((t) => t.status === "open");

  const wins = closed.filter((t) => t.pnl > 0);
  const losses = closed.filter((t) => t.pnl < 0);
  const breakEven = closed.filter((t) => t.pnl === 0);

  const totalPnL = closed.reduce((s, t) => s + t.pnl, 0);
  const totalFees = trades.reduce((s, t) => s + t.fees, 0);

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = losses.reduce((s, t) => s + Math.abs(t.pnl), 0);

  const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
  const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

  const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
  const lossRate = closed.length > 0 ? (losses.length / closed.length) / 1 : 0; // as fraction
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? Infinity : 0) : grossProfit / grossLoss;
  const expectancy = (winRate / 100) * avgWin - lossRate * avgLoss;

  const largestWin = wins.length > 0 ? Math.max(...wins.map((t) => t.pnl)) : 0;
  const largestLoss = losses.length > 0 ? Math.min(...losses.map((t) => t.pnl)) : 0;

  const streak = calculateStreak(trades);
  const maxDrawdown = calculateDrawdown(trades);

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    openTrades: open.length,
    totalPnL,
    totalFees,
    wins: wins.length,
    losses: losses.length,
    breakEven: breakEven.length,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    largestWin,
    largestLoss,
    maxConsecutiveWins: streak.wins,
    maxConsecutiveLosses: streak.losses,
    maxDrawdown,
  };
}

// ─── Equity curve ─────────────────────────────────────────────────────────

/** Build a daily P&L series suitable for equity curve charts. */
export function buildEquityCurve(trades: Trade[]): DailyPnL[] {
  const closed = closedWithPnL(trades).filter((t) => t.exit_date !== null);

  // Aggregate by exit date
  const byDate = new Map<string, { pnl: number; trades: number }>();
  for (const t of closed) {
    const date = t.exit_date!.slice(0, 10); // YYYY-MM-DD
    const existing = byDate.get(date) ?? { pnl: 0, trades: 0 };
    byDate.set(date, { pnl: existing.pnl + t.pnl, trades: existing.trades + 1 });
  }

  // Sort by date
  const entries = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));

  let cumulative = 0;
  return entries.map(([date, { pnl, trades }]) => {
    cumulative += pnl;
    return { date, pnl, cumulative, trades };
  });
}

/** Rolling N-day average of daily P&L. */
export function buildRollingAverage(curve: DailyPnL[], days: number): DailyPnL[] {
  return curve.map((point, idx) => {
    const window = curve.slice(Math.max(0, idx - days + 1), idx + 1);
    const avg = window.reduce((s, p) => s + p.pnl, 0) / window.length;
    return { ...point, pnl: avg };
  });
}

// ─── Grouping ─────────────────────────────────────────────────────────────

function groupAndCalculate(
  trades: Trade[],
  keyFn: (t: Trade) => string | null
): GroupedMetrics {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const key = keyFn(t) ?? "Unknown";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const result: GroupedMetrics = {};
  for (const [key, group] of groups) {
    result[key] = calculateMetrics(group);
  }
  return result;
}

export function calculateByDirection(trades: Trade[]): GroupedMetrics {
  return groupAndCalculate(trades, (t) => t.direction);
}

export function calculateBySetupType(trades: Trade[]): GroupedMetrics {
  return groupAndCalculate(trades, (t) => t.setup_type);
}

export function calculateByEmotionalState(trades: Trade[]): GroupedMetrics {
  return groupAndCalculate(trades, (t) => t.emotional_state);
}

export function calculateByMarketType(trades: TradeWithRelations[]): GroupedMetrics {
  return groupAndCalculate(trades, (t) =>
    (t as TradeWithRelations).instruments?.market_type ?? null
  );
}

export function calculateByInstrument(trades: TradeWithRelations[]): GroupedMetrics {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const key = t.instruments?.symbol ?? t.instrument_id;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }
  const result: GroupedMetrics = {};
  for (const [key, group] of groups) {
    result[key] = calculateMetrics(group);
  }
  return result;
}

export function calculateByTag(trades: TradeWithRelations[]): GroupedMetrics {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    if (t.trade_tags.length === 0) {
      const key = "Untagged";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    for (const { tags } of t.trade_tags) {
      const key = tags.name;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
  }
  const result: GroupedMetrics = {};
  for (const [key, group] of groups) {
    result[key] = calculateMetrics(group);
  }
  return result;
}

// ─── Additional metrics ────────────────────────────────────────────────────

/** Current win/loss streak based on most-recent closed trades. */
export function calculateCurrentStreak(trades: Trade[]): {
  count: number;
  type: "win" | "loss" | "none";
} {
  const sorted = closedWithPnL(trades).sort(
    (a, b) => new Date(b.exit_date!).getTime() - new Date(a.exit_date!).getTime()
  );
  if (sorted.length === 0) return { count: 0, type: "none" };
  const firstType = sorted[0].pnl > 0 ? "win" : "loss";
  let count = 0;
  for (const t of sorted) {
    const isWin = t.pnl > 0;
    if ((firstType === "win" && isWin) || (firstType === "loss" && !isWin)) {
      count++;
    } else {
      break;
    }
  }
  return { count, type: firstType };
}

/** Average R:R across all trades that have both stop_loss and take_profit set. */
export function calculateAvgRR(trades: Trade[]): number {
  const values = trades.map(getRiskReward).filter((v): v is number => v !== null);
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export interface DayOfWeekMetrics {
  day: string;
  pnl: number;
  trades: number;
  wins: number;
  losses: number;
}

/** Group closed-trade P&L by exit day of week (Mon–Sun order). */
export function calculateByDayOfWeek(trades: Trade[]): DayOfWeekMetrics[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = days.map((day) => ({ day, pnl: 0, trades: 0, wins: 0, losses: 0 }));
  for (const t of closedWithPnL(trades)) {
    if (!t.exit_date) continue;
    const dow = new Date(t.exit_date).getDay();
    result[dow].pnl += t.pnl;
    result[dow].trades++;
    if (t.pnl > 0) result[dow].wins++;
    else if (t.pnl < 0) result[dow].losses++;
  }
  // Return Mon–Sun
  return [result[1], result[2], result[3], result[4], result[5], result[6], result[0]];
}

// ─── Formatting helpers ────────────────────────────────────────────────────

export function formatMetricValue(value: number, type: "currency" | "percent" | "number" | "ratio"): string {
  switch (type) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    case "percent":
      return `${value.toFixed(2)}%`;
    case "ratio":
      return value === Infinity ? "\u221e" : value.toFixed(2);
    case "number":
      return value.toFixed(2);
  }
}
