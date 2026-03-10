import { cn } from "@/lib/utils";
import type { TradeDirection } from "@/types/database";

interface PnlPreviewProps {
  direction: TradeDirection;
  entryPrice: number | null;
  exitPrice: number | null;
  quantity: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  fees: number;
}

function calcPnl(
  direction: TradeDirection,
  entry: number,
  exit: number,
  qty: number,
  fees: number
): number {
  const raw = direction === "long" ? (exit - entry) * qty : (entry - exit) * qty;
  return raw - fees;
}

function calcRR(
  direction: TradeDirection,
  entry: number,
  sl: number,
  tp: number
): number | null {
  const risk = direction === "long" ? entry - sl : sl - entry;
  const reward = direction === "long" ? tp - entry : entry - tp;
  if (risk <= 0 || reward <= 0) return null;
  return reward / risk;
}

export function PnlPreview({
  direction,
  entryPrice,
  exitPrice,
  quantity,
  stopLoss,
  takeProfit,
  fees,
}: PnlPreviewProps) {
  const hasExit = entryPrice && exitPrice && quantity;
  const hasRR = entryPrice && stopLoss && takeProfit;

  if (!hasExit && !hasRR) return null;

  const pnl = hasExit
    ? calcPnl(direction, entryPrice, exitPrice, quantity, fees)
    : null;
  const pnlPct =
    pnl !== null && entryPrice && quantity
      ? (pnl / (entryPrice * quantity)) * 100
      : null;
  const rr = hasRR ? calcRR(direction, entryPrice, stopLoss, takeProfit) : null;

  const isProfit = pnl !== null && pnl >= 0;

  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-400">
        Trade Preview
      </p>
      <div className="flex flex-wrap gap-4">
        {pnl !== null && (
          <div>
            <p className="text-xs text-surface-500">Estimated P&amp;L</p>
            <p
              className={cn(
                "text-xl font-bold",
                isProfit ? "text-profit" : "text-loss"
              )}
            >
              {isProfit ? "+" : ""}
              {pnl.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {pnlPct !== null && (
              <p
                className={cn(
                  "text-xs font-medium",
                  isProfit ? "text-profit" : "text-loss"
                )}
              >
                {isProfit ? "+" : ""}
                {pnlPct.toFixed(2)}%
              </p>
            )}
          </div>
        )}

        {rr !== null && (
          <div>
            <p className="text-xs text-surface-500">Risk / Reward</p>
            <p className="text-xl font-bold text-surface-900">
              1 : {rr.toFixed(2)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
