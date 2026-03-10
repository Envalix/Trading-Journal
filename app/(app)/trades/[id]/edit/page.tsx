"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTrade } from "@/hooks/use-trade";
import { TradeForm } from "@/components/trades/trade-form";

export default function EditTradePage() {
  const params = useParams();
  const id = params.id as string;
  const { trade, loading, error } = useTrade(id);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-100" />
        ))}
      </div>
    );
  }

  if (error || !trade) {
    return (
      <div className="mx-auto max-w-3xl">
        <p className="rounded-xl bg-loss-light px-4 py-3 text-sm text-loss">
          {error ?? "Trade not found."}
        </p>
        <Link href="/trades" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
          Back to trades
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href={`/trades/${id}`}
          className="mb-4 flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to trade
        </Link>
        <h1 className="text-2xl font-bold text-surface-900">Edit Trade</h1>
        <p className="mt-1 text-sm text-surface-500">
          {trade.instruments?.symbol} &mdash; {trade.direction === "long" ? "Long" : "Short"}
        </p>
      </div>

      <TradeForm trade={trade} />
    </div>
  );
}
