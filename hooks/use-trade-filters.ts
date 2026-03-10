"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  type TradeFilters,
  type SortField,
  DEFAULT_FILTERS,
} from "@/lib/trade-filters";

export type { TradeFilters, SortField };

const PER_PAGE_OPTIONS = [20, 50, 100] as const;
export { PER_PAGE_OPTIONS };

export interface TradeFilterState {
  filters: TradeFilters;
  search: string;
  sortField: SortField;
  sortDir: "asc" | "desc";
  page: number;
  perPage: number;
  activeFilterCount: number;
  setFilters: (updates: Partial<TradeFilters>) => void;
  setSearch: (q: string) => void;
  setSort: (field: SortField, dir: "asc" | "desc") => void;
  setPage: (p: number) => void;
  setPerPage: (per: number) => void;
  clearFilters: () => void;
}

export function useTradeFilters(): TradeFilterState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sp = searchParams;

  const filters: TradeFilters = {
    status: (sp.get("status") as TradeFilters["status"]) || "all",
    direction: (sp.get("direction") as TradeFilters["direction"]) || "all",
    market: sp.get("market") || "all",
    dateFrom: sp.get("from") || "",
    dateTo: sp.get("to") || "",
    instruments: sp.get("instruments")?.split(",").filter(Boolean) ?? [],
    tags: sp.get("tags")?.split(",").filter(Boolean) ?? [],
    pnl: (sp.get("pnl") as TradeFilters["pnl"]) || "all",
    emotion: sp.get("emotion") || "",
    setup: sp.get("setup") || "",
  };

  const search = sp.get("q") || "";
  const sortField = (sp.get("sort") as SortField) || "entry_date";
  const sortDir = (sp.get("dir") as "asc" | "desc") || "desc";
  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const perPage = ([20, 50, 100] as number[]).includes(parseInt(sp.get("per") || "20", 10))
    ? parseInt(sp.get("per") || "20", 10)
    : 20;

  const activeFilterCount = [
    filters.status !== "all",
    filters.direction !== "all",
    filters.market !== "all",
    !!(filters.dateFrom || filters.dateTo),
    filters.instruments.length > 0,
    filters.tags.length > 0,
    filters.pnl !== "all",
    !!filters.emotion,
    !!filters.setup,
  ].filter(Boolean).length;

  const updateParams = useCallback(
    (updates: Record<string, string | null>, resetPage = true) => {
      const params = new URLSearchParams(sp.toString());
      for (const [key, val] of Object.entries(updates)) {
        if (val === null || val === "" || val === "all") {
          params.delete(key);
        } else {
          params.set(key, val);
        }
      }
      if (resetPage) params.delete("page");
      const qs = params.toString();
      router.push(`${pathname}${qs ? `?${qs}` : ""}`);
    },
    [sp, router, pathname]
  );

  const setFilters = useCallback(
    (updates: Partial<TradeFilters>) => {
      const p: Record<string, string | null> = {};
      if (updates.status !== undefined) p.status = updates.status;
      if (updates.direction !== undefined) p.direction = updates.direction;
      if (updates.market !== undefined) p.market = updates.market;
      if (updates.dateFrom !== undefined) p.from = updates.dateFrom || null;
      if (updates.dateTo !== undefined) p.to = updates.dateTo || null;
      if (updates.instruments !== undefined)
        p.instruments = updates.instruments.join(",") || null;
      if (updates.tags !== undefined) p.tags = updates.tags.join(",") || null;
      if (updates.pnl !== undefined) p.pnl = updates.pnl;
      if (updates.emotion !== undefined) p.emotion = updates.emotion || null;
      if (updates.setup !== undefined) p.setup = updates.setup || null;
      updateParams(p);
    },
    [updateParams]
  );

  const setSearch = useCallback(
    (q: string) => updateParams({ q: q || null }),
    [updateParams]
  );

  const setSort = useCallback(
    (field: SortField, dir: "asc" | "desc") => {
      updateParams(
        {
          sort: field !== "entry_date" ? field : null,
          dir: dir !== "desc" ? dir : null,
        },
        false
      );
    },
    [updateParams]
  );

  const setPage = useCallback(
    (p: number) => updateParams({ page: p > 1 ? String(p) : null }, false),
    [updateParams]
  );

  const setPerPage = useCallback(
    (per: number) => updateParams({ per: per !== 20 ? String(per) : null }),
    [updateParams]
  );

  const clearFilters = useCallback(() => {
    router.push(pathname);
  }, [router, pathname]);

  return {
    filters,
    search,
    sortField,
    sortDir,
    page,
    perPage,
    activeFilterCount,
    setFilters,
    setSearch,
    setSort,
    setPage,
    setPerPage,
    clearFilters,
  };
}

export { DEFAULT_FILTERS };
