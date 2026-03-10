"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Copy,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import type { TradeWithRelations } from "@/types/database";
import type { SortField } from "@/lib/trade-filters";

interface TradesTableProps {
  trades: TradeWithRelations[];
  selectedIds: Set<string>;
  sortField: SortField;
  sortDir: "asc" | "desc";
  onSort: (field: SortField) => void;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onClose: (trade: TradeWithRelations) => void;
  onDelete: (id: string) => void;
  onDuplicate: (trade: TradeWithRelations) => void;
  onReopen: (trade: TradeWithRelations) => void;
}

function SortIcon({ field, active, dir }: { field: string; active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-surface-300" />;
  return dir === "asc" ? (
    <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary-500" />
  ) : (
    <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary-500" />
  );
}

function ColHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  field: SortField;
  sortField: SortField;
  sortDir: "asc" | "desc";
  onSort: (f: SortField) => void;
  className?: string;
}) {
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-surface-500",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center hover:text-surface-800"
      >
        {label}
        <SortIcon field={field} active={sortField === field} dir={sortDir} />
      </button>
    </th>
  );
}

function ActionMenu({
  trade,
  onClose,
  onDelete,
  onDuplicate,
  onReopen,
}: {
  trade: TradeWithRelations;
  onClose: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onReopen: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-40 rounded-xl border border-surface-200 bg-white py-1 shadow-lg">
            <Link
              href={`/trades/${trade.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              onClick={() => setOpen(false)}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            <button
              onClick={() => { setOpen(false); onDuplicate(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
            >
              <Copy className="h-3.5 w-3.5" /> Duplicate
            </button>
            {trade.status === "open" ? (
              <button
                onClick={() => { setOpen(false); onClose(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              >
                <X className="h-3.5 w-3.5" /> Close Trade
              </button>
            ) : (
              <button
                onClick={() => { setOpen(false); onReopen(); }}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reopen
              </button>
            )}
            <hr className="my-1 border-surface-100" />
            <button
              onClick={() => { setOpen(false); onDelete(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-loss hover:bg-loss-light"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function TradesTable({
  trades,
  selectedIds,
  sortField,
  sortDir,
  onSort,
  onToggleSelect,
  onToggleAll,
  onClose,
  onDelete,
  onDuplicate,
  onReopen,
}: TradesTableProps) {
  const allSelected = trades.length > 0 && selectedIds.size === trades.length;

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-200 bg-white shadow-sm">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-surface-200 bg-surface-50">
            <th className="w-10 px-3 py-2.5">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                className="h-4 w-4 rounded border-surface-300 accent-primary-600"
              />
            </th>
            <ColHeader label="Date" field="entry_date" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <ColHeader label="Instrument" field="instrument" sortField={sortField} sortDir={sortDir} onSort={onSort} />
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
              Direction
            </th>
            <ColHeader label="Entry" field="entry_price" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right" />
            <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-surface-500">
              Exit
            </th>
            <ColHeader label="Qty" field="quantity" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right" />
            <ColHeader label="P&amp;L" field="pnl" sortField={sortField} sortDir={sortDir} onSort={onSort} className="text-right" />
            <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-surface-500">
              Status
            </th>
            <th className="w-10 px-3 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-100">
          {trades.map((trade) => {
            const selected = selectedIds.has(trade.id);
            const pnl = trade.pnl;
            const entryDate = new Date(trade.entry_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "2-digit",
            });
            const exitDate = trade.exit_date
              ? new Date(trade.exit_date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "2-digit",
                })
              : null;

            return (
              <tr
                key={trade.id}
                className={cn(
                  "transition-colors hover:bg-surface-50",
                  selected && "bg-primary-50/40"
                )}
              >
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleSelect(trade.id)}
                    className="h-4 w-4 rounded border-surface-300 accent-primary-600"
                  />
                </td>
                <td className="px-3 py-3">
                  <Link href={`/trades/${trade.id}`} className="hover:text-primary-600">
                    <span className="font-medium text-surface-800">{entryDate}</span>
                    {exitDate && (
                      <span className="block text-xs text-surface-400">{exitDate}</span>
                    )}
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <Link href={`/trades/${trade.id}`} className="hover:text-primary-600">
                    <span className="font-semibold text-surface-900">
                      {trade.instruments?.symbol ?? trade.instrument_id}
                    </span>
                    {trade.instruments?.market_type && (
                      <span className="ml-1.5 rounded bg-surface-100 px-1.5 py-0.5 text-[10px] text-surface-500">
                        {trade.instruments.market_type}
                      </span>
                    )}
                  </Link>
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      trade.direction === "long"
                        ? "bg-profit-light text-profit-dark"
                        : "bg-loss-light text-loss-dark"
                    )}
                  >
                    {trade.direction === "long" ? "Long" : "Short"}
                  </span>
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-surface-800">
                  {formatNumber(trade.entry_price, 4)}
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-surface-500">
                  {trade.exit_price ? formatNumber(trade.exit_price, 4) : "—"}
                </td>
                <td className="px-3 py-3 text-right font-mono text-sm text-surface-800">
                  {formatNumber(trade.quantity)}
                </td>
                <td className="px-3 py-3 text-right">
                  {pnl !== null ? (
                    <span
                      className={cn(
                        "font-semibold",
                        pnl > 0 ? "text-profit" : pnl < 0 ? "text-loss" : "text-surface-500"
                      )}
                    >
                      {formatCurrency(pnl)}
                    </span>
                  ) : (
                    <span className="text-surface-400">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      trade.status === "open"
                        ? "bg-primary-50 text-primary-600"
                        : "bg-surface-100 text-surface-500"
                    )}
                  >
                    {trade.status}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <ActionMenu
                    trade={trade}
                    onClose={() => onClose(trade)}
                    onDelete={() => onDelete(trade.id)}
                    onDuplicate={() => onDuplicate(trade)}
                    onReopen={() => onReopen(trade)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
