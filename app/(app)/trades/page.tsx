import { Suspense } from "react";
import { TradesContent } from "@/components/trades/trades-content";

function TradesLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-surface-200" />
        <div className="h-10 w-28 animate-pulse rounded-lg bg-surface-200" />
      </div>
      <div className="h-10 w-full animate-pulse rounded-lg bg-surface-100" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-100" />
        ))}
      </div>
    </div>
  );
}

export default function TradesPage() {
  return (
    <Suspense fallback={<TradesLoadingSkeleton />}>
      <TradesContent />
    </Suspense>
  );
}
