"use client";

import Link from "next/link";
import { useState } from "react";
import { Copy, MoreHorizontal, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { TradeWithRelations } from "@/types/database";

interface TradeCardProps {
  trade: TradeWithRelations;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onClose: () => void;
  onDuplicate: () => void;
  onReopen: () => void;
}

export function TradeCard({
  trade,
  selected,
  onToggleSelect,
  onDelete,
  onClose,
  onDuplicate,
  onReopen,
}: TradeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  const instrument = trade.instruments;
  const pnl = trade.pnl;
  const isProfit = pnl !== null && pnl >= 0;
  const isClosed = trade.status === "closed";

  const entryDate = new Date(trade.entry_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md",
        selected ? "border-primary-400 bg-primary-50/30" : "border-surface-200"
      )}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelect}
        className="h-4 w-4 shrink-0 rounded border-surface-300 accent-primary-600"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Clickable trade info */}
      <Link href={`/trades/${trade.id}`} className="flex flex-1 items-center gap-4 min-w-0">
        {/* Direction badge */}
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-xs font-bold uppercase",
            trade.direction === "long"
              ? "bg-profit-light text-profit-dark"
              : "bg-loss-light text-loss-dark"
          )}
        >
          {trade.direction}
        </span>

        {/* Symbol + name */}
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold text-surface-900">
            {instrument?.symbol ?? "—"}
          </p>
          <p className="truncate text-xs text-surface-400">{entryDate}</p>
        </div>

        {/* Setup type */}
        {trade.setup_type && (
          <span className="hidden shrink-0 rounded-full bg-surface-100 px-2 py-0.5 text-xs text-surface-500 sm:block">
            {trade.setup_type}
          </span>
        )}

        {/* Status */}
        <span
          className={cn(
            "ml-auto shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
            isClosed
              ? "bg-surface-100 text-surface-500"
              : "bg-primary-50 text-primary-700"
          )}
        >
          {isClosed ? "Closed" : "Open"}
        </span>

        {/* P&L */}
        <div className="shrink-0 text-right">
          {pnl !== null ? (
            <>
              <p
                className={cn(
                  "text-sm font-bold",
                  isProfit ? "text-profit" : "text-loss"
                )}
              >
                {isProfit ? "+" : ""}
                {formatCurrency(pnl)}
              </p>
              {trade.pnl_percentage !== null && (
                <p
                  className={cn(
                    "text-xs",
                    isProfit ? "text-profit" : "text-loss"
                  )}
                >
                  {isProfit ? "+" : ""}
                  {trade.pnl_percentage.toFixed(2)}%
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-surface-400">—</p>
          )}
        </div>
      </Link>

      {/* Action menu */}
      <div className="relative shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          className="rounded-md p-1.5 text-surface-400 opacity-0 transition-all hover:bg-surface-100 hover:text-surface-700 group-hover:opacity-100"
          aria-label="Trade actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-surface-200 bg-white py-1 shadow-lg">
              <Link
                href={`/trades/${trade.id}/edit`}
                className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                onClick={() => setMenuOpen(false)}
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Link>
              <button
                onClick={() => { onDuplicate(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              {isClosed ? (
                <button
                  onClick={() => { onReopen(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reopen
                </button>
              ) : (
                <button
                  onClick={() => { onClose(); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
                >
                  <X className="h-3.5 w-3.5" /> Close Trade
                </button>
              )}
              <div className="my-1 border-t border-surface-100" />
              <button
                onClick={() => { onDelete(); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-loss hover:bg-loss-light"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
