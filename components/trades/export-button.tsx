"use client";

import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/trade-filters";
import type { TradeWithRelations } from "@/types/database";

interface ExportButtonProps {
  trades: TradeWithRelations[];
  disabled?: boolean;
}

export function ExportButton({ trades, disabled }: ExportButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || trades.length === 0}
      onClick={() => exportToCSV(trades)}
      className="flex items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm font-medium text-surface-700 shadow-sm hover:bg-surface-50 disabled:cursor-not-allowed disabled:opacity-40"
      title={`Export ${trades.length} trade${trades.length !== 1 ? "s" : ""} to CSV`}
    >
      <Download className="h-4 w-4" />
      Export CSV
      {trades.length > 0 && (
        <span className="rounded-full bg-surface-100 px-1.5 py-0.5 text-xs text-surface-500">
          {trades.length}
        </span>
      )}
    </button>
  );
}
