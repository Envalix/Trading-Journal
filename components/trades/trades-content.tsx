"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Filter, LayoutGrid, LayoutList, PlusCircle, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useTrades } from "@/hooks/use-trades";
import { useTags } from "@/hooks/use-tags";
import { useInstruments } from "@/hooks/use-instruments";
import { useUpdateTrade } from "@/hooks/use-update-trade";
import { useCreateTrade } from "@/hooks/use-create-trade";
import { useToast } from "@/contexts/toast-context";
import { useTradeFilters } from "@/hooks/use-trade-filters";
import { applyFilters, applySorting } from "@/lib/trade-filters";
import { formatCurrency } from "@/lib/utils";
import { calculateMetrics } from "@/lib/calculations";
import { FilterPanel } from "./filter-panel";
import { FilterChips } from "./filter-chips";
import { TradesTable } from "./trades-table";
import { TradeCard } from "./trade-card";
import { Pagination } from "./pagination";
import { ExportButton } from "./export-button";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { CloseTradeModal } from "./close-trade-modal";
import { Button } from "@/components/ui/button";
import type { TradeWithRelations } from "@/types/database";
import type { SortField } from "@/lib/trade-filters";

export function TradesContent() {
  // ── Data fetching ────────────────────────────────────────────
  const { trades: allTrades, loading, error, setTrades } = useTrades();
  const { tags } = useTags();
  const { instruments } = useInstruments();

  // ── Filter + sort state (URL-persisted) ──────────────────────
  const {
    filters,
    search: searchParam,
    sortField,
    sortDir,
    page,
    perPage,
    activeFilterCount,
    setFilters,
    setSearch: setSearchParam,
    setSort,
    setPage,
    setPerPage,
    clearFilters,
  } = useTradeFilters();

  // ── Local UI state ───────────────────────────────────────────
  const [view, setView] = useState<"table" | "cards">("table");
  const [filterOpen, setFilterOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(searchParam);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; tradeId?: string }>({ open: false });
  const [closeModal, setCloseModal] = useState<{ open: boolean; trade?: TradeWithRelations }>({ open: false });

  // Debounce search
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    setLocalSearch(searchParam);
  }, [searchParam]);
  function handleSearchChange(val: string) {
    setLocalSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearchParam(val), 300);
  }

  // ── Derived data ─────────────────────────────────────────────
  const filteredSorted = useMemo(() => {
    const filtered = applyFilters(allTrades, filters, searchParam);
    return applySorting(filtered, sortField as SortField, sortDir);
  }, [allTrades, filters, searchParam, sortField, sortDir]);

  const totalPages = Math.ceil(filteredSorted.length / perPage);
  const paginated = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredSorted.slice(start, start + perPage);
  }, [filteredSorted, page, perPage]);

  const summaryMetrics = useMemo(
    () => calculateMetrics(filteredSorted),
    [filteredSorted]
  );

  // ── Sort toggle ───────────────────────────────────────────────
  function handleSort(field: SortField) {
    if (field === sortField) {
      setSort(field, sortDir === "desc" ? "asc" : "desc");
    } else {
      setSort(field, "desc");
    }
  }

  // ── Selection ────────────────────────────────────────────────
  const allSelected = paginated.length > 0 && paginated.every((t) => selectedIds.has(t.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        paginated.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => new Set([...prev, ...paginated.map((t) => t.id)]));
    }
  }

  // ── Trade actions ─────────────────────────────────────────────
  const { updateTrade, deleteTrade } = useUpdateTrade();
  const { createTrade } = useCreateTrade();
  const { toast } = useToast();

  async function handleDelete(id: string) {
    await deleteTrade(id);
    setTrades((prev) => prev.filter((t) => t.id !== id));
    setSelectedIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    toast("Trade deleted.", "success");
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    await Promise.all(ids.map((id) => deleteTrade(id)));
    setTrades((prev) => prev.filter((t) => !selectedIds.has(t.id)));
    setSelectedIds(new Set());
    toast(`${ids.length} trade${ids.length !== 1 ? "s" : ""} deleted.`, "success");
  }

  async function handleCloseTrade(exitPrice: number, exitDate: string) {
    if (!closeModal.trade) return;
    const id = closeModal.trade.id;
    const updated = await updateTrade(id, { exit_price: exitPrice, exit_date: exitDate, status: "closed" });
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    toast("Trade closed.", "success");
  }

  async function handleBulkClose(exitPrice: number, exitDate: string) {
    const openSelected = allTrades.filter((t) => selectedIds.has(t.id) && t.status === "open");
    await Promise.all(
      openSelected.map((t) => updateTrade(t.id, { exit_price: exitPrice, exit_date: exitDate, status: "closed" }))
    );
    setTrades((prev) =>
      prev.map((t) =>
        selectedIds.has(t.id) && t.status === "open"
          ? { ...t, exit_price: exitPrice, exit_date: exitDate, status: "closed" as const }
          : t
      )
    );
    setSelectedIds(new Set());
    toast(`${openSelected.length} trade${openSelected.length !== 1 ? "s" : ""} closed.`, "success");
  }

  const handleReopen = useCallback(
    async (trade: TradeWithRelations) => {
      const updated = await updateTrade(trade.id, { exit_price: null, exit_date: null, status: "open" });
      setTrades((prev) => prev.map((t) => (t.id === trade.id ? { ...t, ...updated } : t)));
      toast("Trade reopened.", "success");
    },
    [updateTrade, setTrades, toast]
  );

  const handleDuplicate = useCallback(
    async (trade: TradeWithRelations) => {
      try {
        const created = await createTrade({
          instrument_id: trade.instrument_id,
          direction: trade.direction,
          quantity: trade.quantity,
          entry_price: trade.entry_price,
          fees: trade.fees,
          stop_loss: trade.stop_loss,
          take_profit: trade.take_profit,
          setup_type: trade.setup_type,
          entry_date: new Date().toISOString(),
          status: "open",
        });
        setTrades((prev) => [
          { ...created, instruments: trade.instruments, trade_tags: [], trade_images: [] } as TradeWithRelations,
          ...prev,
        ]);
        toast("Trade duplicated.", "success");
      } catch (err) {
        toast((err as Error).message, "error");
      }
    },
    [createTrade, setTrades, toast]
  );

  const openSelected = allTrades.filter((t) => selectedIds.has(t.id) && t.status === "open");
  const someSelected = selectedIds.size > 0;

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex gap-6">
      {/* Filter sidebar */}
      {filterOpen && (
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="sticky top-6 rounded-xl border border-surface-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-surface-800">Filters</h3>
              <button
                onClick={() => setFilterOpen(false)}
                className="rounded-lg p-1 text-surface-400 hover:bg-surface-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              tags={tags}
              instruments={instruments}
            />
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 w-full rounded-lg border border-surface-200 py-2 text-sm text-surface-500 hover:bg-surface-50"
              >
                Clear All Filters ({activeFilterCount})
              </button>
            )}
          </div>
        </aside>
      )}

      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">Trades</h1>
            <p className="mt-0.5 text-sm text-surface-500">
              {loading
                ? "Loading\u2026"
                : `${filteredSorted.length} of ${allTrades.length} trade${allTrades.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton trades={filteredSorted} />
            <Link href="/trades/new">
              <Button>
                <PlusCircle className="h-4 w-4" /> New Trade
              </Button>
            </Link>
          </div>
        </div>

        {/* Search + filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
            <input
              type="text"
              placeholder="Search by symbol, name, notes\u2026"
              value={localSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full rounded-lg border border-surface-300 bg-white py-2 pl-9 pr-8 text-sm shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
            {localSearch && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => setFilterOpen((o) => !o)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm transition-colors ${
              filterOpen || activeFilterCount > 0
                ? "border-primary-400 bg-primary-50 text-primary-700"
                : "border-surface-300 bg-white text-surface-700 hover:bg-surface-50"
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary-600 px-1.5 py-0.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Mobile filter drawer trigger */}
          <div className="flex gap-1 lg:hidden">
            <button
              onClick={() => setView("table")}
              className={`rounded-lg p-2 ${view === "table" ? "bg-primary-50 text-primary-600" : "text-surface-400 hover:bg-surface-100"}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("cards")}
              className={`rounded-lg p-2 ${view === "cards" ? "bg-primary-50 text-primary-600" : "text-surface-400 hover:bg-surface-100"}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden gap-1 lg:flex">
            <button
              onClick={() => setView("table")}
              className={`rounded-lg p-2 ${view === "table" ? "bg-primary-50 text-primary-600" : "text-surface-400 hover:bg-surface-100"}`}
              title="Table view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("cards")}
              className={`rounded-lg p-2 ${view === "cards" ? "bg-primary-50 text-primary-600" : "text-surface-400 hover:bg-surface-100"}`}
              title="Card view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        <FilterChips
          filters={filters}
          search={searchParam}
          tags={tags}
          instruments={instruments}
          onRemove={setFilters}
          onClearSearch={() => handleSearchChange("")}
          onClearAll={clearFilters}
        />

        {/* Mobile filter panel */}
        {filterOpen && (
          <div className="rounded-xl border border-surface-200 bg-white p-4 shadow-sm lg:hidden">
            <FilterPanel
              filters={filters}
              onChange={setFilters}
              tags={tags}
              instruments={instruments}
            />
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="mt-4 w-full rounded-lg border border-surface-200 py-2 text-sm text-surface-500 hover:bg-surface-50"
              >
                Clear All Filters ({activeFilterCount})
              </button>
            )}
          </div>
        )}

        {/* Summary stats */}
        {filteredSorted.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Trades", value: String(summaryMetrics.closedTrades) },
              {
                label: "Total P&L",
                value: formatCurrency(summaryMetrics.totalPnL),
                color:
                  summaryMetrics.totalPnL > 0
                    ? "text-profit"
                    : summaryMetrics.totalPnL < 0
                    ? "text-loss"
                    : "",
              },
              {
                label: "Win Rate",
                value:
                  summaryMetrics.closedTrades > 0
                    ? `${summaryMetrics.winRate.toFixed(1)}%`
                    : "—",
              },
              {
                label: "Avg P&L",
                value:
                  summaryMetrics.closedTrades > 0
                    ? formatCurrency(summaryMetrics.totalPnL / summaryMetrics.closedTrades)
                    : "—",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-surface-200 bg-white px-4 py-3 shadow-sm"
              >
                <p className="text-xs font-medium text-surface-500">{s.label}</p>
                <p className={`mt-0.5 text-lg font-bold ${s.color ?? "text-surface-900"}`}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Bulk action bar */}
        {someSelected && (
          <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3">
            <span className="text-sm font-medium text-primary-800">
              {selectedIds.size} selected
            </span>
            <div className="ml-auto flex gap-2">
              {openSelected.length > 0 && (
                <Button size="sm" variant="secondary" onClick={() => setCloseModal({ open: true })}>
                  Close ({openSelected.length})
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                onClick={() => setDeleteModal({ open: true })}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedIds.size})
              </Button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-2 text-sm text-primary-600 hover:text-primary-800"
              >
                Deselect
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="rounded-xl bg-loss-light px-4 py-3 text-sm text-loss">{error}</p>
        )}

        {/* Trades */}
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-100" />
            ))}
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-dashed border-surface-300 bg-white">
            <Filter className="mb-2 h-8 w-8 text-surface-300" />
            <p className="text-sm font-medium text-surface-500">No trades match your filters</p>
            {activeFilterCount > 0 || searchParam ? (
              <button
                onClick={() => { clearFilters(); handleSearchChange(""); }}
                className="mt-2 text-sm text-primary-600 hover:underline"
              >
                Clear all filters
              </button>
            ) : (
              <Link href="/trades/new" className="mt-3">
                <Button size="sm">Log your first trade</Button>
              </Link>
            )}
          </div>
        ) : view === "table" ? (
          <TradesTable
            trades={paginated}
            selectedIds={selectedIds}
            sortField={sortField as SortField}
            sortDir={sortDir}
            onSort={handleSort}
            onToggleSelect={toggleSelect}
            onToggleAll={toggleAll}
            onClose={(trade) => setCloseModal({ open: true, trade })}
            onDelete={(id) => setDeleteModal({ open: true, tradeId: id })}
            onDuplicate={handleDuplicate}
            onReopen={handleReopen}
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1 py-1">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="h-4 w-4 rounded border-surface-300 accent-primary-600"
              />
              <span className="text-xs text-surface-400">Select all on page</span>
            </div>
            {paginated.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                selected={selectedIds.has(trade.id)}
                onToggleSelect={() => toggleSelect(trade.id)}
                onDelete={() => setDeleteModal({ open: true, tradeId: trade.id })}
                onClose={() => setCloseModal({ open: true, trade })}
                onDuplicate={() => handleDuplicate(trade)}
                onReopen={() => handleReopen(trade)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredSorted.length > 0 && (
          <Pagination
            total={filteredSorted.length}
            page={page}
            perPage={perPage}
            onPage={setPage}
            onPerPage={setPerPage}
          />
        )}
      </div>

      {/* Modals */}
      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        count={deleteModal.tradeId ? 1 : selectedIds.size}
        onConfirm={async () => {
          if (deleteModal.tradeId) await handleDelete(deleteModal.tradeId);
          else await handleBulkDelete();
        }}
      />
      <CloseTradeModal
        open={closeModal.open}
        onClose={() => setCloseModal({ open: false })}
        title={closeModal.trade ? "Close Trade" : `Close ${openSelected.length} Trades`}
        onConfirm={async (exitPrice, exitDate) => {
          if (closeModal.trade) await handleCloseTrade(exitPrice, exitDate);
          else await handleBulkClose(exitPrice, exitDate);
        }}
      />
    </div>
  );
}
