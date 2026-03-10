import { X } from "lucide-react";

interface TagChipProps {
  name: string;
  color: string;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export function TagChip({ name, color, onRemove, size = "sm" }: TagChipProps) {
  const padding = size === "md" ? "px-3 py-1 text-xs" : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium text-white ${padding}`}
      style={{ backgroundColor: color }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full opacity-75 hover:opacity-100"
          aria-label={`Remove ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
