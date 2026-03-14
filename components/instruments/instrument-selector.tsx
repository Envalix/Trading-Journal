"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketTypeBadge } from "./market-type-badge";
import type { Instrument, MarketType } from "@/types/database";

type TypeTab = MarketType | "all" | "custom";

const TYPE_TABS: { id: TypeTab; label: string }[] = [
  { id: "all",     label: "All" },
  { id: "forex",   label: "Forex" },
  { id: "crypto",  label: "Crypto" },
  { id: "stock",   label: "Stocks" },
  { id: "futures", label: "Futures" },
  { id: "custom",  label: "Custom" },
];

const QUOTE_FILTERS = ["ALL", "PERP", "USDT", "USDC", "BTC", "ETH", "BNB"] as const;
type QuoteFilter = (typeof QUOTE_FILTERS)[number];

interface InstrumentSelectorProps {
  instruments: Instrument[];
  favoriteIds: Set<string>;
  value: string | null;
  onChange: (instrumentId: string) => void;
  placeholder?: string;
  filterByType?: MarketType;
  error?: string;
  disabled?: boolean;
}

export function InstrumentSelector({
  instruments,
  favoriteIds,
  value,
  onChange,
  placeholder = "Select instrument…",
  filterByType,
  error,
  disabled,
}: InstrumentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const [activeTab, setActiveTab] = useState<TypeTab>(
    filterByType ?? "all"
  );
  const [quoteFilter, setQuoteFilter] = useState<QuoteFilter>("PERP");

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = instruments.find((i) => i.id === value) ?? null;

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Determine which tabs actually have instruments (to hide empty tabs)
  const availableTabs = TYPE_TABS.filter((tab) => {
    if (tab.id === "all") return true;
    if (tab.id === "custom") return instruments.some((i) => !i.is_system);
    return instruments.some((i) => i.market_type === tab.id);
  });

  // Apply tab + search filter, favorites first
  const tabFiltered = (() => {
    if (activeTab === "all") return instruments;
    if (activeTab === "custom") return instruments.filter((i) => !i.is_system);
    return instruments.filter((i) => i.market_type === activeTab);
  })();

  const quoteFiltered = (() => {
    if (activeTab !== "crypto" || quoteFilter === "ALL") return tabFiltered;
    if (quoteFilter === "PERP") {
      return tabFiltered.filter((i) =>
        i.symbol.toLowerCase().includes("_perp") || i.name.toLowerCase().includes("perp")
      );
    }
    const q = quoteFilter.toLowerCase();
    return tabFiltered.filter((i) => {
      const sym = i.symbol.toLowerCase();
      const name = i.name.toLowerCase();
      return sym.endsWith(q) || name.includes(`/${q} `) || name.endsWith(`/${q}`);
    });
  })();

  const filtered = quoteFiltered.filter((i) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q);
  });

  const sorted = [
    ...filtered.filter((i) => favoriteIds.has(i.id)),
    ...filtered.filter((i) => !favoriteIds.has(i.id)),
  ];

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        setOpen(true);
        setHighlighted(0);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, sorted.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (sorted[highlighted]) {
        selectItem(sorted[highlighted]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[highlighted] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlighted]);

  function selectItem(instrument: Instrument) {
    onChange(instrument.id);
    setOpen(false);
    setQuery("");
  }

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
    setHighlighted(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleTabClick(tab: TypeTab) {
    setActiveTab(tab);
    setHighlighted(0);
    if (tab === "crypto") setQuoteFilter("PERP");
    else setQuoteFilter("ALL");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={openDropdown}
        className={cn(
          "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm shadow-sm transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/20",
          error
            ? "border-loss bg-loss-light/30"
            : "border-surface-300 bg-white hover:border-surface-400 dark:border-surface-600 dark:bg-surface-700",
          disabled && "cursor-not-allowed opacity-60",
          open && "border-primary-500 ring-2 ring-primary-500/20"
        )}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {selected ? (
          <span className="flex items-center gap-2">
            {favoriteIds.has(selected.id) && (
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            )}
            <span className="font-mono font-semibold text-surface-900 dark:text-surface-100">
              {selected.symbol}
            </span>
            <span className="text-surface-500">{selected.name}</span>
            {!selected.is_system && (
              <span className="rounded-full bg-surface-100 px-1.5 py-0.5 text-xs text-surface-500 dark:bg-surface-600 dark:text-surface-400">
                Custom
              </span>
            )}
          </span>
        ) : (
          <span className="text-surface-400">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-surface-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {error && <p className="mt-1 text-xs text-loss">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-surface-200 bg-white shadow-lg dark:border-surface-700 dark:bg-surface-800">
          {/* Type tabs */}
          <div className="flex gap-0.5 overflow-x-auto border-b border-surface-100 px-2 pt-2 dark:border-surface-700">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "shrink-0 rounded-t-md px-3 py-1.5 text-xs font-medium transition-colors",
                  activeTab === tab.id
                    ? "border-b-2 border-primary-500 text-primary-600 dark:text-primary-400"
                    : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quote currency filter — visible only in Crypto tab */}
          {activeTab === "crypto" && (
            <div className="flex gap-1 overflow-x-auto border-b border-surface-100 px-2 py-1.5 dark:border-surface-700">
              {QUOTE_FILTERS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => { setQuoteFilter(q); setHighlighted(0); }}
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                    quoteFilter === q
                      ? "bg-primary-500 text-white"
                      : "bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600"
                  )}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Search */}
          <div className="flex items-center gap-2 border-b border-surface-100 px-3 py-2 dark:border-surface-700">
            <Search className="h-3.5 w-3.5 shrink-0 text-surface-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search symbol or name…"
              className="flex-1 bg-transparent text-sm text-surface-900 outline-none placeholder:text-surface-400 dark:text-surface-100"
            />
          </div>

          {/* List */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1"
          >
            {sorted.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-surface-400">
                No instruments found
              </li>
            ) : (
              sorted.map((instrument, idx) => {
                const isFav = favoriteIds.has(instrument.id);
                const isSelected = instrument.id === value;
                const isHl = idx === highlighted;

                return (
                  <li
                    key={instrument.id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectItem(instrument)}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 px-3 py-2 text-sm transition-colors",
                      isHl && "bg-primary-50 dark:bg-primary-900/20",
                      isSelected && "font-medium"
                    )}
                  >
                    {isFav ? (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="font-mono font-semibold text-surface-900 dark:text-surface-100">
                      {instrument.symbol}
                    </span>
                    <span className="flex-1 truncate text-surface-500">
                      {instrument.name}
                    </span>
                    {instrument.is_system ? (
                      <MarketTypeBadge type={instrument.market_type} />
                    ) : (
                      <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-medium text-surface-600 dark:bg-surface-700 dark:text-surface-400">
                        Custom
                      </span>
                    )}
                    {isSelected && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-primary-600" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
