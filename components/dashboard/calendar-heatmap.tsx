"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DailyPnL } from "@/lib/calculations";
import { formatCurrency } from "@/lib/utils";

interface CalendarHeatmapProps {
  data: DailyPnL[];
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function pnlToColor(pnl: number, max: number): string {
  if (max === 0) return "#F1F5F9";
  const intensity = Math.min(Math.abs(pnl) / max, 1);
  if (pnl > 0) {
    // Green shades
    const lightness = Math.round(95 - intensity * 45);
    return `hsl(152, 68%, ${lightness}%)`;
  } else {
    // Red shades
    const lightness = Math.round(95 - intensity * 45);
    return `hsl(0, 72%, ${lightness}%)`;
  }
}

export function CalendarHeatmap({ data }: CalendarHeatmapProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const pnlMap = useMemo(() => {
    const map = new Map<string, DailyPnL>();
    for (const d of data) {
      map.set(d.date, d);
    }
    return map;
  }, [data]);

  const maxAbs = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.max(...data.map((d) => Math.abs(d.pnl)));
  }, [data]);

  // Build calendar grid for the given month
  const { cells, monthLabel } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = firstDay.getDay(); // 0=Sun
    const daysInMonth = lastDay.getDate();

    const label = firstDay.toLocaleString("en-US", { month: "long", year: "numeric" });

    // Pad start
    const cellList: (string | null)[] = Array(startDow).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cellList.push(dateStr);
    }
    // Pad end to complete last week
    while (cellList.length % 7 !== 0) cellList.push(null);

    return { cells: cellList, monthLabel: label };
  }, [year, month]);

  function prevMonth() {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  }

  function nextMonth() {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  }

  const isNextDisabled =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month >= today.getMonth());

  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-surface-700">{monthLabel}</span>
        <button
          onClick={nextMonth}
          disabled={isNextDisabled}
          className="rounded-lg p-1 text-surface-400 hover:bg-surface-100 hover:text-surface-700 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day labels */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-surface-400">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, idx) => {
          if (!dateStr) {
            return <div key={`empty-${idx}`} />;
          }
          const entry = pnlMap.get(dateStr);
          const day = parseInt(dateStr.slice(8), 10);
          const bgColor = entry ? pnlToColor(entry.pnl, maxAbs) : "#F1F5F9";
          const isToday = dateStr === today.toISOString().slice(0, 10);

          return (
            <div
              key={dateStr}
              title={entry ? `${dateStr}\nP&L: ${formatCurrency(entry.pnl)}\nTrades: ${entry.trades}` : dateStr}
              className={`flex aspect-square items-center justify-center rounded text-[11px] font-medium ${
                isToday ? "ring-2 ring-primary-400 ring-offset-1" : ""
              } ${entry ? "cursor-default" : "text-surface-300"}`}
              style={{ backgroundColor: bgColor, color: entry ? (Math.abs(entry.pnl) / maxAbs > 0.5 ? "#fff" : "#334155") : undefined }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 flex items-center justify-end gap-3">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(0, 72%, 50%)" }} />
          <span className="text-[10px] text-surface-400">Loss</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "#F1F5F9" }} />
          <span className="text-[10px] text-surface-400">No trade</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded" style={{ backgroundColor: "hsl(152, 68%, 50%)" }} />
          <span className="text-[10px] text-surface-400">Profit</span>
        </div>
      </div>
    </div>
  );
}
