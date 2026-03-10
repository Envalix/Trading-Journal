import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function calculatePnl(
  direction: "long" | "short",
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  fees = 0
): number {
  const rawPnl =
    direction === "long"
      ? (exitPrice - entryPrice) * quantity
      : (entryPrice - exitPrice) * quantity;
  return rawPnl - fees;
}

export function calculatePnlPercent(entryPrice: number, exitPrice: number, direction: "long" | "short"): number {
  if (direction === "long") {
    return ((exitPrice - entryPrice) / entryPrice) * 100;
  }
  return ((entryPrice - exitPrice) / entryPrice) * 100;
}

export function isProfit(pnl: number): boolean {
  return pnl > 0;
}
