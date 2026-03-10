"use client";

import { X } from "lucide-react";
import type { TradeFilters } from "@/lib/trade-filters";
import type { Tag, Instrument } from "@/types/database";
import { MARKET_TYPE_LABELS } from "@/constants/instruments";

interface FilterChipsProps {
  filters: TradeFilters;
  search: string;
  tags: Tag[];
  instruments: Instrument[];
  onRemove: (updates: Partial<TradeFilters>) => void;
  onClearSearch: () => void;
  onClearAll: () => void;
}

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

export function FilterChips({
  filters,
  search,
  tags,
  instruments,
  onRemove,
  onClearSearch,
  onClearAll,
}: FilterChipsProps) {
  const chips: Chip[] = [];

  if (search) {
    chips.push({ key: "search", label: `"${search}"`, onRemove: onClearSearch });
  }
  if (filters.status !== "all") {
    chips.push({
      key: "status",
      label: filters.status.charAt(0).toUpperCase() + filters.status.slice(1),
      onRemove: () => onRemove({ status: "all" }),
    });
  }
  if (filters.direction !== "all") {
    chips.push({
      key: "direction",
      label: filters.direction.charAt(0).toUpperCase() + filters.direction.slice(1),
      onRemove: () => onRemove({ direction: "all" }),
    });
  }
  if (filters.market !== "all") {
    chips.push({
      key: "market",
      label: MARKET_TYPE_LABELS[filters.market] ?? filters.market,
      onRemove: () => onRemove({ market: "all" }),
    });
  }
  if (filters.pnl !== "all") {
    const labels: Record<string, string> = {
      profitable: "Profitable",
      losing: "Losing",
      breakeven: "Break-even",
    };
    chips.push({
      key: "pnl",
      label: labels[filters.pnl] ?? filters.pnl,
      onRemove: () => onRemove({ pnl: "all" }),
    });
  }
  if (filters.dateFrom || filters.dateTo) {
    const label = [filters.dateFrom, filters.dateTo].filter(Boolean).join(" → ");
    chips.push({
      key: "date",
      label,
      onRemove: () => onRemove({ dateFrom: "", dateTo: "" }),
    });
  }
  for (const id of filters.instruments) {
    const instr = instruments.find((i) => i.id === id);
    chips.push({
      key: `instr-${id}`,
      label: instr?.symbol ?? id,
      onRemove: () => onRemove({ instruments: filters.instruments.filter((i) => i !== id) }),
    });
  }
  for (const id of filters.tags) {
    const tag = tags.find((t) => t.id === id);
    chips.push({
      key: `tag-${id}`,
      label: `#${tag?.name ?? id}`,
      onRemove: () => onRemove({ tags: filters.tags.filter((t) => t !== id) }),
    });
  }
  if (filters.emotion) {
    chips.push({
      key: "emotion",
      label: filters.emotion,
      onRemove: () => onRemove({ emotion: "" }),
    });
  }
  if (filters.setup) {
    chips.push({
      key: "setup",
      label: filters.setup,
      onRemove: () => onRemove({ setup: "" }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-700"
        >
          {chip.label}
          <button
            type="button"
            onClick={chip.onRemove}
            className="ml-0.5 rounded-full hover:bg-primary-100"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-surface-400 hover:text-surface-600"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
