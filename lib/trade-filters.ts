/**
 * Pure client-side filter, sort, and export utilities for the trades list.
 */

import type { TradeWithRelations } from "@/types/database";

export interface TradeFilters {
  status: "all" | "open" | "closed";
  direction: "all" | "long" | "short";
  market: string; // "all" | MarketType
  dateFrom: string; // YYYY-MM-DD
  dateTo: string; // YYYY-MM-DD
  instruments: string[]; // instrument IDs
  tags: string[]; // tag IDs
  pnl: "all" | "profitable" | "losing" | "breakeven";
  emotion: string;
  setup: string;
}

export const DEFAULT_FILTERS: TradeFilters = {
  status: "all",
  direction: "all",
  market: "all",
  dateFrom: "",
  dateTo: "",
  instruments: [],
  tags: [],
  pnl: "all",
  emotion: "",
  setup: "",
};

export type SortField =
  | "entry_date"
  | "exit_date"
  | "pnl"
  | "instrument"
  | "entry_price"
  | "quantity";

export function applyFilters(
  trades: TradeWithRelations[],
  filters: TradeFilters,
  search: string
): TradeWithRelations[] {
  const q = search.trim().toLowerCase();

  return trades.filter((t) => {
    if (filters.status !== "all" && t.status !== filters.status) return false;
    if (filters.direction !== "all" && t.direction !== filters.direction) return false;
    if (filters.market !== "all" && t.instruments?.market_type !== filters.market) return false;

    if (filters.dateFrom) {
      if (new Date(t.entry_date) < new Date(filters.dateFrom)) return false;
    }
    if (filters.dateTo) {
      const end = new Date(filters.dateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(t.entry_date) > end) return false;
    }

    if (filters.instruments.length > 0 && !filters.instruments.includes(t.instrument_id))
      return false;

    if (filters.tags.length > 0) {
      const tradeTagIds = t.trade_tags.map((tt) => tt.tags.id);
      if (!filters.tags.some((id) => tradeTagIds.includes(id))) return false;
    }

    if (filters.pnl !== "all") {
      if (t.status !== "closed" || t.pnl === null) return false;
      if (filters.pnl === "profitable" && t.pnl <= 0) return false;
      if (filters.pnl === "losing" && t.pnl >= 0) return false;
      if (filters.pnl === "breakeven" && t.pnl !== 0) return false;
    }

    if (filters.emotion && t.emotional_state !== filters.emotion) return false;
    if (filters.setup && t.setup_type !== filters.setup) return false;

    if (q) {
      const sym = (t.instruments?.symbol ?? "").toLowerCase();
      const name = (t.instruments?.name ?? "").toLowerCase();
      const pre = (t.notes_pre ?? "").toLowerCase();
      const post = (t.notes_post ?? "").toLowerCase();
      if (!sym.includes(q) && !name.includes(q) && !pre.includes(q) && !post.includes(q))
        return false;
    }

    return true;
  });
}

export function applySorting(
  trades: TradeWithRelations[],
  field: SortField,
  dir: "asc" | "desc"
): TradeWithRelations[] {
  return [...trades].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "entry_date":
        cmp = a.entry_date.localeCompare(b.entry_date);
        break;
      case "exit_date":
        cmp = (a.exit_date ?? "").localeCompare(b.exit_date ?? "");
        break;
      case "pnl":
        cmp = (a.pnl ?? -Infinity) - (b.pnl ?? -Infinity);
        break;
      case "instrument":
        cmp = (a.instruments?.symbol ?? "").localeCompare(b.instruments?.symbol ?? "");
        break;
      case "entry_price":
        cmp = a.entry_price - b.entry_price;
        break;
      case "quantity":
        cmp = a.quantity - b.quantity;
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

export function exportToCSV(trades: TradeWithRelations[]): void {
  const headers = [
    "Entry Date",
    "Exit Date",
    "Instrument",
    "Market Type",
    "Direction",
    "Status",
    "Entry Price",
    "Exit Price",
    "Quantity",
    "Fees",
    "P&L",
    "P&L %",
    "Setup Type",
    "Emotional State",
    "Tags",
    "Pre-Trade Notes",
    "Post-Trade Notes",
  ];

  const esc = (v: string | number) =>
    `"${String(v).replace(/"/g, '""').replace(/\n/g, " ")}"`;

  const rows = trades.map((t) =>
    [
      t.entry_date.slice(0, 10),
      t.exit_date?.slice(0, 10) ?? "",
      t.instruments?.symbol ?? t.instrument_id,
      t.instruments?.market_type ?? "",
      t.direction,
      t.status,
      t.entry_price,
      t.exit_price ?? "",
      t.quantity,
      t.fees,
      t.pnl ?? "",
      t.pnl_percentage ?? "",
      t.setup_type ?? "",
      t.emotional_state ?? "",
      t.trade_tags.map((tt) => tt.tags.name).join("; "),
      t.notes_pre ?? "",
      t.notes_post ?? "",
    ]
      .map(esc)
      .join(",")
  );

  const csv = [headers.map(esc).join(","), ...rows].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trades_export_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
