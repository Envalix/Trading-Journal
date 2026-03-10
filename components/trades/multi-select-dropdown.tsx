"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  id: string;
  label: string;
  sub?: string;
}

interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = query
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.sub?.toLowerCase().includes(query.toLowerCase())
      )
    : options;

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  const label =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? options.find((o) => o.id === selected[0])?.label ?? placeholder
      : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm shadow-sm",
          open
            ? "border-primary-400 ring-2 ring-primary-400/20"
            : "border-surface-300 hover:border-surface-400",
          selected.length > 0 ? "text-surface-900" : "text-surface-400"
        )}
      >
        <span className="truncate">{label}</span>
        <div className="flex items-center gap-1">
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange([]); }}
              onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), onChange([]))}
              className="rounded p-0.5 hover:bg-surface-200"
            >
              <X className="h-3 w-3 text-surface-400" />
            </span>
          )}
          <ChevronDown className={cn("h-4 w-4 text-surface-400 transition-transform", open && "rotate-180")} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-full min-w-[180px] rounded-xl border border-surface-200 bg-white shadow-lg">
          {options.length > 6 && (
            <div className="border-b border-surface-100 p-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-surface-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full rounded-md border border-surface-200 py-1.5 pl-8 pr-3 text-xs outline-none focus:border-primary-400 focus:ring-1 focus:ring-primary-400/20"
                  autoFocus
                />
              </div>
            </div>
          )}
          <ul className="max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-surface-400">No results</li>
            ) : (
              filtered.map((opt) => {
                const checked = selected.includes(opt.id);
                return (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onClick={() => toggle(opt.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-surface-50"
                    >
                      <span
                        className={cn(
                          "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border",
                          checked
                            ? "border-primary-500 bg-primary-500"
                            : "border-surface-300"
                        )}
                      >
                        {checked && <Check className="h-3 w-3 text-white" />}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-surface-800">{opt.label}</span>
                      {opt.sub && (
                        <span className="text-xs text-surface-400">{opt.sub}</span>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
          {selected.length > 0 && (
            <div className="border-t border-surface-100 px-3 py-1.5">
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-surface-400 hover:text-surface-600"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
