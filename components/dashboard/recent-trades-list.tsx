"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { TradeWithRelations } from "@/types/database";
import { formatCurrency } from "@/lib/utils";

interface RecentTradesListProps {
  trades: TradeWithRelations[];
  limit?: number;
}

export function RecentTradesList({ trades, limit = 8 }: RecentTradesListProps) {
  const recent = [...trades]
    .sort((a, b) => new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime())
    .slice(0, limit);

  if (recent.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-surface-400">
        No trades yet
      </div>
    );
  }

  return (
    <div className="divide-y divide-surface-100">
      {recent.map((trade) => {
        const symbol = trade.instruments?.symbol ?? trade.instrument_id;
        const pnl = trade.pnl;
        const isOpen = trade.status === "open";
        const date = trade.exit_date
          ? new Date(trade.exit_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : new Date(trade.entry_date).toLocaleDateString("en-US", { month: "short", day: "numeric" });

        return (
          <Link
            key={trade.id}
            href={`/trades/${trade.id}`}
            className="flex items-center gap-3 py-2.5 hover:bg-surface-50 px-1 rounded-lg transition-colors"
          >
            {/* Direction icon */}
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                trade.direction === "long"
                  ? "bg-profit-light text-profit"
                  : "bg-loss-light text-loss"
              }`}
            >
              {trade.direction === "long" ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : (
                <ArrowDownRight className="h-4 w-4" />
              )}
            </div>

            {/* Symbol + date */}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-surface-800">{symbol}</p>
              <p className="text-xs text-surface-400">{date}</p>
            </div>

            {/* P&L / status */}
            <div className="text-right">
              {isOpen ? (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600">
                  Open
                </span>
              ) : pnl !== null ? (
                <div className="flex items-center gap-0.5">
                  {pnl > 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-profit" />
                  ) : pnl < 0 ? (
                    <ArrowDownRight className="h-3.5 w-3.5 text-loss" />
                  ) : (
                    <Minus className="h-3.5 w-3.5 text-surface-400" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      pnl > 0 ? "text-profit" : pnl < 0 ? "text-loss" : "text-surface-500"
                    }`}
                  >
                    {formatCurrency(pnl)}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-surface-400">—</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
