import { cn } from "@/lib/utils";
import type { MarketType } from "@/types/database";

export type MarketTypeFilter = MarketType | "all";

const TABS: { value: MarketTypeFilter; label: string }[] = [
  { value: "all",     label: "All" },
  { value: "stock",   label: "Stocks" },
  { value: "crypto",  label: "Crypto" },
  { value: "forex",   label: "Forex" },
  { value: "futures", label: "Futures" },
];

interface MarketTypeTabsProps {
  value: MarketTypeFilter;
  onChange: (v: MarketTypeFilter) => void;
}

export function MarketTypeTabs({ value, onChange }: MarketTypeTabsProps) {
  return (
    <div className="flex gap-1 rounded-lg border border-surface-200 bg-surface-100 p-1">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === tab.value
              ? "bg-white text-surface-900 shadow-sm"
              : "text-surface-500 hover:text-surface-700"
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
