"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Copy, Pencil, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useTrade } from "@/hooks/use-trade";
import { useUpdateTrade } from "@/hooks/use-update-trade";
import { useCreateTrade } from "@/hooks/use-create-trade";
import { useTradeTakeProfit } from "@/hooks/use-trade-take-profits";
import { useToast } from "@/contexts/toast-context";
import { createClient } from "@/lib/supabase-browser";
import { DeleteConfirmModal } from "@/components/trades/delete-confirm-modal";
import { CloseTradeModal } from "@/components/trades/close-trade-modal";
import { ImageGallery } from "@/components/trades/image-gallery";
import { ImageUploader } from "@/components/trades/image-uploader";
import { ChartInspector } from "@/components/ai-coach/chart-inspector";
import { TagChip } from "@/components/tags/tag-chip";
import { Button } from "@/components/ui/button";
import { cn, formatCurrency } from "@/lib/utils";
import type { TradeImage, TradeTakeProfit } from "@/types/database";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex items-start justify-between gap-4 border-b border-surface-100 py-3 last:border-0 dark:border-surface-700">
      <span className="shrink-0 text-sm text-surface-500">{label}</span>
      <span className="text-right text-sm font-medium text-surface-900 dark:text-surface-50">
        {value}
      </span>
    </div>
  );
}

function TPStatusBadge({ status }: { status: TradeTakeProfit["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        status === "hit"
          ? "bg-profit-light text-profit"
          : status === "cancelled"
          ? "bg-surface-100 text-surface-500 dark:bg-surface-700"
          : "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
      )}
    >
      {status === "hit" ? "Hit" : status === "cancelled" ? "Cancelled" : "Pending"}
    </span>
  );
}

export default function TradeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { trade, loading, error } = useTrade(id);
  const { updateTrade, deleteTrade } = useUpdateTrade();
  const { createTrade } = useCreateTrade();
  const { tps, markTPHit, updateSL, updateTP, addTP, deleteTP } = useTradeTakeProfit(id);
  const { toast } = useToast();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [images, setImages] = useState<TradeImage[] | null>(null);
  const [ruleChecks, setRuleChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!trade?.id || !trade.trade_playbooks?.length) return;
    const supabase = createClient();
    supabase
      .from("trade_rule_checks")
      .select("rule_id, is_followed")
      .eq("trade_id", trade.id)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, boolean> = {};
          data.forEach((r) => { map[r.rule_id] = r.is_followed; });
          setRuleChecks(map);
        }
      });
  }, [trade?.id, trade?.trade_playbooks?.length]);

  // SL inline edit state
  const [editingSL, setEditingSL] = useState(false);
  const [slDraft, setSlDraft] = useState("");

  // TP inline edit state
  const [editingTPId, setEditingTPId] = useState<string | null>(null);
  const [tpPriceDraft, setTpPriceDraft] = useState("");
  const [tpQtyDraft, setTpQtyDraft] = useState("");

  // Add TP state
  const [addingTP, setAddingTP] = useState(false);
  const [newTPPrice, setNewTPPrice] = useState("");
  const [newTPQty, setNewTPQty] = useState("100");

  // Add Margin state (isolated trades only)
  const [addMarginAmount, setAddMarginAmount] = useState("");
  const [addingMargin, setAddingMargin] = useState(false);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-100 dark:bg-surface-700" />
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

  const t = trade;
  const displayImages = images ?? t.trade_images;
  const instrument = t.instruments;
  const pnl = t.pnl;
  const isProfit = pnl !== null && pnl >= 0;
  const isClosed = t.status === "closed";

  // Use TPs from hook (live state) but fall back to joined TPs from trade fetch
  const displayTPs = tps.length > 0 ? tps : (t.trade_take_profits ?? []);
  const entryPrice = t.entry_price;
  const stopLoss = t.stop_loss;

  // Use first TP for R:R display in hero
  const firstTP = displayTPs[0];
  const rr =
    entryPrice && stopLoss && firstTP
      ? (() => {
          const risk =
            t.direction === "long" ? entryPrice - stopLoss : stopLoss - entryPrice;
          const reward =
            t.direction === "long"
              ? firstTP.price - entryPrice
              : entryPrice - firstTP.price;
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
        leverage: t.leverage,
        margin_mode: t.margin_mode,
        account_id: t.account_id,
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

  async function handleSaveSL() {
    try {
      const val = slDraft === "" ? null : parseFloat(slDraft);
      await updateSL(id, val);
      await updateTrade(id, { stop_loss: val });
      toast("Stop loss updated.", "success");
      setEditingSL(false);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  function startEditTP(tp: TradeTakeProfit) {
    setEditingTPId(tp.id);
    setTpPriceDraft(String(tp.price));
    setTpQtyDraft(String(tp.quantity_pct));
  }

  async function handleSaveTP(tpId: string) {
    try {
      await updateTP(tpId, {
        price: parseFloat(tpPriceDraft),
        quantity_pct: parseFloat(tpQtyDraft),
      });
      toast("Take profit updated.", "success");
      setEditingTPId(null);
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function handleMarkHit(tpId: string) {
    try {
      await markTPHit(tpId);
      toast("Take profit marked as hit.", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function handleDeleteTP(tpId: string) {
    try {
      await deleteTP(tpId);
      toast("Take profit removed.", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function handleAddTP() {
    try {
      const nextLevel = displayTPs.length + 1;
      await addTP(id, {
        level: nextLevel,
        price: parseFloat(newTPPrice),
        quantity_pct: parseFloat(newTPQty) || 100,
      });
      toast("Take profit added.", "success");
      setAddingTP(false);
      setNewTPPrice("");
      setNewTPQty("100");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function handleAddMargin() {
    const amount = parseFloat(addMarginAmount);
    if (!amount || amount <= 0) return;
    setAddingMargin(true);
    try {
      await updateTrade(id, {
        additional_margin: (t.additional_margin ?? 0) + amount,
      });
      toast(`Added ${formatCurrency(amount)} margin.`, "success");
      setAddMarginAmount("");
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setAddingMargin(false);
    }
  }

  const inputCls =
    "rounded-lg border border-surface-300 bg-white px-2.5 py-1.5 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100";

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
            ? "border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800"
            : isProfit
            ? "border-profit bg-profit-light"
            : "border-loss bg-loss-light"
        )}
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-bold text-surface-900 dark:text-surface-50">
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
              {t.leverage > 1 && (
                <span className="rounded-full bg-surface-200 px-2.5 py-0.5 text-xs font-medium text-surface-600 dark:bg-surface-700 dark:text-surface-400">
                  {t.leverage}x
                </span>
              )}
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
          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/60 px-3 py-1.5 dark:bg-surface-800/60">
            <span className="text-xs text-surface-500">R:R</span>
            <span className="text-sm font-bold text-surface-900 dark:text-surface-50">1 : {rr}</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trade details */}
        <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
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
          {t.accounts && (
            <DetailRow label="Account" value={t.accounts.name} />
          )}
        </section>

        {/* Dates & Setup */}
        <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
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

        {/* Risk Management */}
        <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800 lg:col-span-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-400">
            Risk Management
          </h2>

          {/* Leverage + Margin Mode */}
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-surface-100 px-3 py-1 text-sm font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-300">
              {t.leverage}x Leverage
            </span>
            <span className="rounded-full bg-surface-100 px-3 py-1 text-sm font-medium text-surface-700 dark:bg-surface-700 dark:text-surface-300 capitalize">
              {t.margin_mode}
            </span>
          </div>

          {/* Add Margin — isolated open trades only */}
          {!isClosed && t.margin_mode === "isolated" && (
            <div className="mb-3 rounded-lg border border-surface-200 bg-surface-50 px-4 py-3 dark:border-surface-700 dark:bg-surface-700/40">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                    Margin
                  </p>
                  {(t.additional_margin ?? 0) > 0 && (
                    <p className="mt-0.5 text-xs text-surface-400">
                      +{formatCurrency(t.additional_margin ?? 0)} added
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    className={cn(inputCls, "w-28")}
                    value={addMarginAmount}
                    onChange={(e) => setAddMarginAmount(e.target.value)}
                    placeholder="Amount"
                    onKeyDown={(e) => e.key === "Enter" && handleAddMargin()}
                  />
                  <Button
                    size="sm"
                    onClick={handleAddMargin}
                    loading={addingMargin}
                    disabled={!addMarginAmount || parseFloat(addMarginAmount) <= 0}
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Margin
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Stop Loss */}
          <div className="flex items-center justify-between border-b border-surface-100 py-3 dark:border-surface-700">
            <span className="text-sm text-surface-500">Stop Loss</span>
            <div className="flex items-center gap-2">
              {editingSL ? (
                <>
                  <input
                    type="number"
                    step="any"
                    className={inputCls}
                    value={slDraft}
                    onChange={(e) => setSlDraft(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveSL}
                    className="rounded-lg p-1.5 text-profit transition-colors hover:bg-profit-light"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setEditingSL(false)}
                    className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                    {stopLoss ? formatCurrency(stopLoss) : "—"}
                  </span>
                  <button
                    onClick={() => {
                      setSlDraft(stopLoss ? String(stopLoss) : "");
                      setEditingSL(true);
                    }}
                    className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 dark:hover:bg-surface-700"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Take Profits */}
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-surface-500">Take Profits</span>
              {displayTPs.length < 5 && (
                <button
                  onClick={() => setAddingTP(true)}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> Add TP
                </button>
              )}
            </div>

            {displayTPs.length === 0 && !addingTP && (
              <p className="text-sm text-surface-400">No take profit levels set.</p>
            )}

            <div className="space-y-2">
              {displayTPs.map((tp) => {
                const tpPct =
                  entryPrice > 0
                    ? (t.direction === "long"
                        ? ((tp.price - entryPrice) / entryPrice)
                        : ((entryPrice - tp.price) / entryPrice)) * 100
                    : null;

                const tpProfit =
                  entryPrice > 0 && t.quantity > 0
                    ? (t.direction === "long"
                        ? (tp.price - entryPrice)
                        : (entryPrice - tp.price)) *
                      t.quantity *
                      (tp.quantity_pct / 100)
                    : null;

                return (
                  <div
                    key={tp.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50"
                  >
                    <span className="shrink-0 rounded-md bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                      TP{tp.level}
                    </span>
                    <TPStatusBadge status={tp.status} />

                    {editingTPId === tp.id ? (
                      <>
                        <input
                          type="number"
                          step="any"
                          className={cn(inputCls, "w-28")}
                          value={tpPriceDraft}
                          onChange={(e) => setTpPriceDraft(e.target.value)}
                          placeholder="Price"
                          autoFocus
                        />
                        <input
                          type="number"
                          min="1"
                          max="100"
                          className={cn(inputCls, "w-16")}
                          value={tpQtyDraft}
                          onChange={(e) => setTpQtyDraft(e.target.value)}
                          placeholder="Qty%"
                        />
                        <button
                          onClick={() => handleSaveTP(tp.id)}
                          className="rounded-lg p-1.5 text-profit transition-colors hover:bg-profit-light"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingTPId(null)}
                          className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 dark:hover:bg-surface-700"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-surface-900 dark:text-surface-50">
                          {formatCurrency(tp.price)}
                        </span>
                        {tpPct !== null && (
                          <span
                            className={cn(
                              "text-xs",
                              tpPct > 0 ? "text-profit" : "text-loss"
                            )}
                          >
                            {tpPct.toFixed(2)}%
                          </span>
                        )}
                        {tpProfit !== null && tpProfit !== 0 && (
                          <span className={cn("text-xs font-medium", tpProfit > 0 ? "text-profit" : "text-loss")}>
                            {tpProfit > 0 ? "+" : ""}{formatCurrency(tpProfit)}
                          </span>
                        )}
                        <span className="text-xs text-surface-400">{tp.quantity_pct}%</span>
                        {tp.hit_date && (
                          <span className="text-xs text-surface-400">
                            {new Date(tp.hit_date).toLocaleDateString()}
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-1">
                          {tp.status === "pending" && (
                            <button
                              onClick={() => handleMarkHit(tp.id)}
                              title="Mark as hit"
                              className="rounded-lg px-2 py-1 text-xs font-medium text-profit transition-colors hover:bg-profit-light"
                            >
                              Mark Hit
                            </button>
                          )}
                          <button
                            onClick={() => startEditTP(tp)}
                            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 dark:hover:bg-surface-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTP(tp.id)}
                            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:text-loss"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Add TP inline form */}
            {addingTP && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-primary-300 p-2">
                <span className="shrink-0 text-xs font-bold text-primary-600">
                  TP{displayTPs.length + 1}
                </span>
                <input
                  type="number"
                  step="any"
                  className={cn(inputCls, "flex-1")}
                  value={newTPPrice}
                  onChange={(e) => setNewTPPrice(e.target.value)}
                  placeholder="Price"
                  autoFocus
                />
                <input
                  type="number"
                  min="1"
                  max="100"
                  className={cn(inputCls, "w-16")}
                  value={newTPQty}
                  onChange={(e) => setNewTPQty(e.target.value)}
                  placeholder="Qty%"
                />
                <button
                  onClick={handleAddTP}
                  disabled={!newTPPrice}
                  className="rounded-lg p-1.5 text-profit transition-colors hover:bg-profit-light disabled:opacity-40"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setAddingTP(false); setNewTPPrice(""); }}
                  className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 dark:hover:bg-surface-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Notes */}
        {(trade.notes_pre || trade.notes_post) && (
          <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800 lg:col-span-2">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-surface-400">
              Notes
            </h2>
            {trade.notes_pre && (
              <div className="mb-4">
                <p className="mb-1 text-xs font-medium text-surface-500">Pre-trade</p>
                <p className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-300">
                  {trade.notes_pre}
                </p>
              </div>
            )}
            {trade.notes_post && (
              <div>
                <p className="mb-1 text-xs font-medium text-surface-500">Post-trade</p>
                <p className="whitespace-pre-wrap text-sm text-surface-700 dark:text-surface-300">
                  {trade.notes_post}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Tags */}
        {t.trade_tags.length > 0 && (
          <section className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
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

      {/* Playbook Grades */}
      {t.trade_playbooks?.length > 0 && (
        <section className="mt-6 space-y-4">
          {t.trade_playbooks.map(({ playbook_id, playbooks: playbook }) => {
            const grade = (t.trade_playbook_grades ?? []).find((g) => g.playbook_id === playbook_id);
            const score = grade?.grade_score ?? null;
            const color =
              score === null
                ? ""
                : score >= 80
                  ? "bg-profit-light text-profit-dark"
                  : score >= 50
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-loss-light text-loss-dark";
            return (
              <div key={playbook_id} className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-surface-400">
                    Playbook
                  </h2>
                  {score !== null && (
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${color}`}>
                      Discipline {score.toFixed(0)}%
                    </span>
                  )}
                </div>
                <Link
                  href={`/playbooks/${playbook_id}/edit`}
                  className="mb-1 block text-sm font-medium text-primary-600 hover:underline dark:text-primary-400"
                >
                  {playbook.name}
                </Link>
                {playbook.description && (
                  <p className="mb-3 text-xs text-surface-500">{playbook.description}</p>
                )}
                {playbook.playbook_rules.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {playbook.playbook_rules.map((rule) => {
                      const followed = ruleChecks[rule.id] ?? false;
                      return (
                        <div key={rule.id} className="flex items-center gap-2">
                          <span
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs",
                              followed
                                ? "bg-profit-light text-profit"
                                : "bg-surface-100 text-surface-400 dark:bg-surface-700"
                            )}
                          >
                            {followed ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
                          </span>
                          <span className={cn("text-sm", followed ? "text-surface-700 dark:text-surface-200" : "text-surface-400 line-through")}>
                            {rule.rule_text}
                          </span>
                          {rule.is_required && (
                            <span className="text-xs text-loss">*</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Screenshots */}
      <section className="mt-6 rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
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

      {/* AI Chart Inspector */}
      {t.trade_playbooks?.length > 0 && (
        <ChartInspector
          tradeId={id}
          playbookIds={t.trade_playbooks.map((tp) => tp.playbook_id)}
          hasImages={displayImages.length > 0}
          savedFeedback={(t.trade_playbook_grades ?? [])[0]?.ai_feedback ?? null}
        />
      )}

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
