"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { TagChip } from "./tag-chip";
import type { Tag } from "@/types/database";

interface TagSelectorProps {
  tags: Tag[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function TagSelector({
  tags,
  selectedIds,
  onChange,
  placeholder = "Add tags\u2026",
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selectedTags = tags.filter((t) => selectedIds.includes(t.id));
  const filtered = tags.filter(
    (t) =>
      !selectedIds.includes(t.id) &&
      t.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(tagId: string) {
    if (selectedIds.includes(tagId)) {
      onChange(selectedIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedIds, tagId]);
    }
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-lg border border-surface-300 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:border-primary-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      >
        {selectedTags.length === 0 ? (
          <span className="text-sm text-surface-400">{placeholder}</span>
        ) : (
          selectedTags.map((tag) => (
            <TagChip
              key={tag.id}
              name={tag.name}
              color={tag.color}
              onRemove={() => toggle(tag.id)}
            />
          ))
        )}
        <ChevronDown className="ml-auto h-4 w-4 shrink-0 text-surface-400" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-xl border border-surface-200 bg-white py-1 shadow-lg">
          {/* Search */}
          <div className="px-3 pb-1 pt-2">
            <div className="flex items-center gap-2 rounded-lg border border-surface-200 px-2 py-1">
              <Search className="h-3.5 w-3.5 text-surface-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search tags\u2026"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-surface-400"
              />
            </div>
          </div>

          {/* Options */}
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-surface-400">
                {tags.length === 0
                  ? "No tags yet. Create some on the Tags page."
                  : "No matching tags"}
              </p>
            ) : (
              filtered.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggle(tag.id)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-surface-50"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
