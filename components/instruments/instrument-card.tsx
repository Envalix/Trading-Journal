import { Pencil, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketTypeBadge } from "./market-type-badge";
import type { Instrument } from "@/types/database";

interface InstrumentCardProps {
  instrument: Instrument;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function InstrumentCard({
  instrument,
  isFavorite,
  onToggleFavorite,
  onEdit,
  onDelete,
}: InstrumentCardProps) {
  return (
    <div className="group flex items-center justify-between rounded-xl border border-surface-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center gap-3">
        {/* Favorite toggle */}
        <button
          onClick={onToggleFavorite}
          className="shrink-0 text-surface-300 transition-colors hover:text-yellow-400"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={cn(
              "h-4 w-4",
              isFavorite && "fill-yellow-400 text-yellow-400"
            )}
          />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-surface-900">
              {instrument.symbol}
            </span>
            <MarketTypeBadge type={instrument.market_type} />
            {!instrument.is_system && (
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700">
                Custom
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-surface-500">{instrument.name}</p>
        </div>
      </div>

      {/* Actions (edit/delete only for custom instruments) */}
      {!instrument.is_system && (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              onClick={onEdit}
              className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700"
              aria-label="Edit instrument"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="rounded-md p-1.5 text-surface-400 transition-colors hover:bg-loss-light hover:text-loss"
              aria-label="Delete instrument"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
