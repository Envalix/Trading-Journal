import { TradeForm } from "@/components/trades/trade-form";

export default function NewTradePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-surface-900">New Trade</h1>
        <p className="mt-1 text-sm text-surface-500">Log a new trade entry</p>
      </div>

      <TradeForm />
    </div>
  );
}
