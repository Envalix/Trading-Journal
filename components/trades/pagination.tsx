"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PER_PAGE_OPTIONS } from "@/hooks/use-trade-filters";

interface PaginationProps {
  total: number;
  page: number;
  perPage: number;
  onPage: (p: number) => void;
  onPerPage: (per: number) => void;
}

export function Pagination({ total, page, perPage, onPage, onPerPage }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);

  // Build page number list: always show first, last, current±1, with … gaps
  function getPages(): (number | "…")[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "…")[] = [1];
    if (page > 3) pages.push("…");
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push("…");
    pages.push(totalPages);
    return pages;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Count */}
      <p className="text-sm text-surface-500">
        {total === 0 ? "No results" : `${start}–${end} of ${total} trade${total !== 1 ? "s" : ""}`}
      </p>

      <div className="flex items-center gap-4">
        {/* Per-page selector */}
        <div className="flex items-center gap-2 text-sm text-surface-500">
          <span>Per page:</span>
          <div className="flex gap-1">
            {PER_PAGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => onPerPage(opt)}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium",
                  perPage === opt
                    ? "bg-primary-600 text-white"
                    : "text-surface-500 hover:bg-surface-100"
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Page buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPage(page - 1)}
              disabled={page === 1}
              className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPages().map((p, idx) =>
              p === "…" ? (
                <span key={`gap-${idx}`} className="px-1 text-surface-400">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => onPage(p as number)}
                  className={cn(
                    "min-w-[32px] rounded-lg px-2 py-1 text-sm font-medium",
                    p === page
                      ? "bg-primary-600 text-white"
                      : "text-surface-600 hover:bg-surface-100"
                  )}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => onPage(page + 1)}
              disabled={page === totalPages}
              className="rounded-lg p-1.5 text-surface-500 hover:bg-surface-100 disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
