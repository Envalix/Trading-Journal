"use client";

import { SETUP_TYPES, MARKET_TYPE_LABELS } from "@/constants/instruments";
import { MultiSelectDropdown } from "./multi-select-dropdown";
import type { TradeFilters } from "@/lib/trade-filters";
import type { Tag, Instrument } from "@/types/database";

const EMOTIONAL_STATES = ["Confident", "Fearful", "Greedy", "Calm", "Anxious", "FOMO", "Neutral"];

const QUICK_DATE_RANGES: { label: string; from: string; to: string }[] = (() => {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  const todayStr = fmt(today);

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  const last30 = new Date(today);
  last30.setDate(today.getDate() - 29);

  return [
    { label: "Today", from: todayStr, to: todayStr },
    { label: "This Week", from: fmt(weekStart), to: todayStr },
    { label: "This Month", from: fmt(monthStart), to: todayStr },
    { label: "Last 30 Days", from: fmt(last30), to: todayStr },
    { label: "This Year", from: fmt(yearStart), to: todayStr },
  ];
})();

interface FilterPanelProps {
  filters: TradeFilters;
  onChange: (updates: Partial<TradeFilters>) => void;
  tags: Tag[];
  instruments: Instrument[];
}

function ToggleGroup<T extends string>({
  options,
  value,
  onSelect,
}: {
  options: { value: T; label: string }[];
  value: T;
  onSelect: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onSelect(o.value)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.value
              ? "bg-primary-600 text-white"
              : "border border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function FilterPanel({ filters, onChange, tags, instruments }: FilterPanelProps) {
  const instrumentOptions = instruments.map((i) => ({
    id: i.id,
    label: i.symbol,
    sub: MARKET_TYPE_LABELS[i.market_type] ?? i.market_type,
  }));

  const tagOptions = tags.map((t) => ({ id: t.id, label: t.name }));

  const activeQuick = QUICK_DATE_RANGES.find(
    (r) => r.from === filters.dateFrom && r.to === filters.dateTo
  );

  return (
    <div className="space-y-5">
      {/* Status */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Status
        </p>
        <ToggleGroup
          options={[
            { value: "all", label: "All" },
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
          ]}
          value={filters.status}
          onSelect={(v) => onChange({ status: v as TradeFilters["status"] })}
        />
      </div>

      {/* Direction */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Direction
        </p>
        <ToggleGroup
          options={[
            { value: "all", label: "Both" },
            { value: "long", label: "Long" },
            { value: "short", label: "Short" },
          ]}
          value={filters.direction}
          onSelect={(v) => onChange({ direction: v as TradeFilters["direction"] })}
        />
      </div>

      {/* Market Type */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Market Type
        </p>
        <ToggleGroup
          options={[
            { value: "all", label: "All" },
            { value: "stock", label: "Stock" },
            { value: "crypto", label: "Crypto" },
            { value: "forex", label: "Forex" },
            { value: "futures", label: "Futures" },
            { value: "options", label: "Options" },
            { value: "cfd", label: "CFD" },
          ]}
          value={filters.market}
          onSelect={(v) => onChange({ market: v })}
        />
      </div>

      {/* P&L Result */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-500">
          P&amp;L Result
        </p>
        <ToggleGroup
          options={[
            { value: "all", label: "All" },
            { value: "profitable", label: "Profit" },
            { value: "losing", label: "Loss" },
            { value: "breakeven", label: "Break-even" },
          ]}
          value={filters.pnl}
          onSelect={(v) => onChange({ pnl: v as TradeFilters["pnl"] })}
        />
      </div>

      {/* Date Range */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Date Range
        </p>
        <div className="mb-2 flex flex-wrap gap-1">
          {QUICK_DATE_RANGES.map((r) => (
            <button
              key={r.label}
              type="button"
              onClick={() =>
                activeQuick?.label === r.label
                  ? onChange({ dateFrom: "", dateTo: "" })
                  : onChange({ dateFrom: r.from, dateTo: r.to })
              }
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                activeQuick?.label === r.label
                  ? "bg-primary-600 text-white"
                  : "border border-surface-200 text-surface-600 hover:bg-surface-50"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] text-surface-400">From</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onChange({ dateFrom: e.target.value })}
              className="w-full rounded-lg border border-surface-300 px-2 py-1.5 text-xs text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] text-surface-400">To</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onChange({ dateTo: e.target.value })}
              className="w-full rounded-lg border border-surface-300 px-2 py-1.5 text-xs text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
            />
          </div>
        </div>
      </div>

      {/* Instruments */}
      {instruments.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-500">
            Instruments
          </p>
          <MultiSelectDropdown
            options={instrumentOptions}
            selected={filters.instruments}
            onChange={(ids) => onChange({ instruments: ids })}
            placeholder="All instruments"
          />
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-500">
            Tags
          </p>
          <MultiSelectDropdown
            options={tagOptions}
            selected={filters.tags}
            onChange={(ids) => onChange({ tags: ids })}
            placeholder="All tags"
          />
        </div>
      )}

      {/* Emotional State */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Emotional State
        </p>
        <select
          value={filters.emotion}
          onChange={(e) => onChange({ emotion: e.target.value })}
          className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
        >
          <option value="">All states</option>
          {EMOTIONAL_STATES.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      {/* Setup Type */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-surface-500">
          Setup Type
        </p>
        <select
          value={filters.setup}
          onChange={(e) => onChange({ setup: e.target.value })}
          className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-800 outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
        >
          <option value="">All setups</option>
          {SETUP_TYPES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
