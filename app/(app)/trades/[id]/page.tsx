"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { useTrade } from "@/hooks/use-trade";
import { useUpdateTrade } from "@/hooks/use-update-trade";
import { useCreateTrade } from "@/hooks/use-create-trade";
import { useToast } from "@/contexts/toast-context";
import { DeleteConfirmModal } from "@/components/trades/delete-confirm-modal";
import { CloseTradeModal } from "@/components/trades/close-trade-modal";
import { ImageGallery } from "@/components/trades/image-gallery";
import { ImageUploader } from "@/components/trades/image-uploader";
import { TagChip } from "@/components/tags/tag-chip";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { TradeImage } from "@/types/database";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-surface-100 last:border-0">
      <span className="shrink-0 text-sm text-surface-500">{label}</span>
      <span className="text-sm font-medium text-surface-900 text-right">{value}</span>
    </div>
  );
}

export default function TradeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { trade, loading, error } = useTrade(id);
  const { updateTrade, deleteTrade } = useUpdateTrade();
  const { createTrade } = useCreateTrade();
  const { toast } = useToast();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [images, setImages] = useState<TradeImage[] | null>(null);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[...Array(3)].map((_, i) => (
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

  // Narrow trade to non-null (guards above ensure this)
  const t = trade;
  // Sync images from fetched trade (once) then manage locally
  const displayImages = images ?? t.trade_images;
  const instrument = t.instruments;
  const pnl = t.pnl;
  const isProfit = pnl !== null && pnl >= 0;
  const isClosed = t.status === "closed";

  const rr =
    t.entry_price && t.stop_loss && t.take_profit
      ? (() => {
          const risk =
            t.direction === "long"
              ? t.entry_price - t.stop_loss
              : t.stop_loss - t.entry_price;
          const reward =
            t.direction === "long"
              ? t.take_profit - t.entry_price
              : t.entry_price - t.take_profit;
          return risk > 0 && reward > 0 ? (reward / risk).toFixed(2) : null;
        })()
      : null;

  async function handleDelete() {
    await deleteTrade(id);
    toast("Trade deleted.", "success");
    router.push("/trades");
  }

  async function handleClose(exitPrice: number, exitDate: string) {
    await updateTrade(id, { exit_price: exitPrice, exit_date: exitDate, status: "closed" });
    toast("Trade closed.", "success");
    router.refresh();
  }

  async function handleReopen() {
    await updateTrade(id, { exit_price: null, exit_date: null, status: "open" });
    toast("Trade reopened.", "success");
    router.refresh();
  }

  async function handleDuplicate() {
    try {
      const created = await createTrade({
        instrument_id: t.instrument_id,
        direction: t.direction,
        quantity: t.quantity,
        entry_price: t.entry_price,
        fees: t.fees,
        stop_loss: t.stop_loss,
        take_profit: t.take_profit,
        setup_type: t.setup_type,
        entry_date: new Date().toISOString(),
        status: "open",
      });
      toast("Trade duplicated.", "success");
      router.push(`/trades/${created.id}/edit`);
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back + actions */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/trades"
          className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-surface-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={handleDuplicate}>
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </Button>
          {isClosed ? (
            <Button size="sm" variant="secondary" onClick={handleReopen}>
              <RefreshCw className="h-3.5 w-3.5" /> Reopen
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setCloseOpen(true)}>
              <X className="h-3.5 w-3.5" /> Close Trade
            </Button>
          )}
          <Link href={`/trades/${id}/edit`}>
            <Button size="sm" variant="secondary">
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          </Link>
          <Button size="sm" variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>

      {/* P&L Hero */}
      <div
        className={cn(
          "mb-6 rounded-2xl border p-6",
          pnl === null
            ? "border-surface-200 bg-white"
            : isProfit
            ? "border-profit bg-profit-light"
            : "border-loss bg-loss-light"
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-surface-900">
                {instrument?.symbol ?? "\u2014"}
              </span>
              <span
                className={cn(
                  "rounded-md px-2.5 py-0.5 text-sm font-bold uppercase",
                  trade.direction === "long"
                    ? "bg-profit text-white"
                    : "bg-loss text-white"
                )}
              >
                {trade.direction}
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                  isClosed ? "bg-surface-200 text-surface-600" : "bg-primary-100 text-primary-700"
                )}
              >
                {isClosed ? "Closed" : "Open"}
              </span>
            </div>
            <p className="mt-1 text-sm text-surface-500">{instrument?.name}</p>
          </div>

          {pnl !== null && (
            <div className="text-right">
              <p className={cn("text-3xl font-bold", isProfit ? "text-profit" : "text-loss")}>
                {isProfit ? "+" : ""}
                {formatCurrency(pnl)}
              </p>
              {trade.pnl_percentage !== null && (
                <p className={cn("text-sm font-medium", isProfit ? "text-profit" : "text-loss")}>
                  {isProfit ? "+" : ""}
                  {trade.pnl_percentage.toFixed(2)}%
                </p>
              )}
            </div>
          )}
        </div>

        {rr && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/60 px-3 py-1.5">
            <span className="text-xs text-surface-500">R:R</span>
            <span className="text-sm font-bold text-surface-900">1 : {rr}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trade details */}
        <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-400">
            Trade Details
          </h2>
          <DetailRow label="Entry Price" value={formatCurrency(trade.entry_price)} />
          <DetailRow
            label="Exit Price"
            value={trade.exit_price ? formatCurrency(trade.exit_price) : null}
          />
          <DetailRow label="Quantity" value={trade.quantity} />
          <DetailRow label="Fees" value={trade.fees > 0 ? formatCurrency(trade.fees) : null} />
          <DetailRow
            label="Stop Loss"
            value={trade.stop_loss ? formatCurrency(trade.stop_loss) : null}
          />
          <DetailRow
            label="Take Profit"
            value={trade.take_profit ? formatCurrency(trade.take_profit) : null}
          />
        </section>

        {/* Dates & Setup */}
        <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-400">
            Timing &amp; Setup
          </h2>
          <DetailRow
            label="Entry Date"
            value={new Date(trade.entry_date).toLocaleString()}
          />
          <DetailRow
            label="Exit Date"
            value={trade.exit_date ? new Date(trade.exit_date).toLocaleString() : null}
          />
          <DetailRow label="Setup Type" value={trade.setup_type} />
          <DetailRow label="Emotional State" value={trade.emotional_state} />
          <DetailRow label="Market Type" value={instrument?.market_type} />
        </section>

        {/* Notes */}
        {(trade.notes_pre || trade.notes_post) && (
          <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-400">
              Notes
            </h2>
            {trade.notes_pre && (
              <div className="mb-4">
                <p className="mb-1 text-xs font-medium text-surface-500">Pre-trade</p>
                <p className="whitespace-pre-wrap text-sm text-surface-700">{trade.notes_pre}</p>
              </div>
            )}
            {trade.notes_post && (
              <div>
                <p className="mb-1 text-xs font-medium text-surface-500">Post-trade</p>
                <p className="whitespace-pre-wrap text-sm text-surface-700">{trade.notes_post}</p>
              </div>
            )}
          </section>
        )}

        {/* Tags */}
        {t.trade_tags.length > 0 && (
          <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-400">
              Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {t.trade_tags.map(({ tags: tag }) => (
                <TagChip key={tag.id} name={tag.name} color={tag.color} size="md" />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Screenshots */}
      <section className="mt-6 rounded-xl border border-surface-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-surface-400">
          Screenshots
        </h2>
        {displayImages.length > 0 && (
          <div className="mb-4">
            <ImageGallery
              tradeId={id}
              images={displayImages}
              onDeleted={(imgId) =>
                setImages((prev) => (prev ?? t.trade_images).filter((i) => i.id !== imgId))
              }
            />
          </div>
        )}
        <ImageUploader
          tradeId={id}
          onUploaded={(img) =>
            setImages((prev) => [...(prev ?? t.trade_images), img])
          }
        />
      </section>

      {/* Modals */}
      <DeleteConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
      <CloseTradeModal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirm={handleClose}
      />
    </div>
  );
}
