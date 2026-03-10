import { cn } from "@/lib/utils";
import type { MarketType } from "@/types/database";

const styles: Record<MarketType, string> = {
  stock:   "bg-blue-50 text-blue-700",
  crypto:  "bg-orange-50 text-orange-700",
  forex:   "bg-emerald-50 text-emerald-700",
  futures: "bg-purple-50 text-purple-700",
  options: "bg-pink-50 text-pink-700",
  cfd:     "bg-slate-100 text-slate-700",
};

const labels: Record<MarketType, string> = {
  stock:   "Stock",
  crypto:  "Crypto",
  forex:   "Forex",
  futures: "Futures",
  options: "Options",
  cfd:     "CFD",
};

export function MarketTypeBadge({
  type,
  className,
}: {
  type: MarketType;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        styles[type],
        className
      )}
    >
      {labels[type]}
    </span>
  );
}
