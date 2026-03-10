import { cn } from "@/lib/utils";
import type { TradeDirection } from "@/types/database";

interface DirectionToggleProps {
  value: TradeDirection;
  onChange: (v: TradeDirection) => void;
}

export function DirectionToggle({ value, onChange }: DirectionToggleProps) {
  return (
    <div className="flex rounded-lg border border-surface-200 bg-surface-100 p-1">
      <button
        type="button"
        onClick={() => onChange("long")}
        className={cn(
          "flex-1 rounded-md py-2 text-sm font-semibold transition-colors",
          value === "long"
            ? "bg-profit text-white shadow-sm"
            : "text-surface-500 hover:text-surface-700"
        )}
      >
        Long
      </button>
      <button
        type="button"
        onClick={() => onChange("short")}
        className={cn(
          "flex-1 rounded-md py-2 text-sm font-semibold transition-colors",
          value === "short"
            ? "bg-loss text-white shadow-sm"
            : "text-surface-500 hover:text-surface-700"
        )}
      >
        Short
      </button>
    </div>
  );
}
