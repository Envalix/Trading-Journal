"use client";

import { useEffect, useState } from "react";
import { useController, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Plus, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { InstrumentSelector } from "@/components/instruments/instrument-selector";
import { TagSelector } from "@/components/tags/tag-selector";
import { DirectionToggle } from "./direction-toggle";
import { PriceInput } from "./price-input";
import { PnlPreview } from "./pnl-preview";
import { useCreateTrade } from "@/hooks/use-create-trade";
import { useUpdateTrade } from "@/hooks/use-update-trade";
import { useInstruments } from "@/hooks/use-instruments";
import { useExchangeInstruments, isExchangeInstrumentId } from "@/hooks/use-exchange-instruments";
import { useTags, setTradeTags } from "@/hooks/use-tags";
import { useAccounts } from "@/hooks/use-accounts";
import { useTradeTakeProfit } from "@/hooks/use-trade-take-profits";
import { useToast } from "@/contexts/toast-context";
import { SETUP_TYPES } from "@/constants/instruments";
import { PLATFORM_GROUPS, getPlatform } from "@/constants/platforms";
import { cn, formatCurrency } from "@/lib/utils";
import type { TradeWithRelations, TradeStatus } from "@/types/database";

const LEVERAGE_PRESETS = [1, 2, 3, 5, 10, 20, 25, 50, 100] as const;

const tpSchema = z.object({
  price: z.coerce.number().positive("Must be positive"),
  quantity_pct: z.coerce.number().min(1).max(100).default(100),
});

const schema = z
  .object({
    account_id: z.string().optional().or(z.literal("")),
    instrument_id: z.string().min(1, "Instrument is required"),
    platform: z.string().optional().or(z.literal("")),
    direction: z.enum(["long", "short"] as const),
    leverage: z.coerce.number().min(1).max(125).default(1),
    margin_mode: z.enum(["isolated", "cross"] as const).default("isolated"),
    entry_price: z.coerce
      .number({ invalid_type_error: "Required" })
      .positive("Must be positive"),
    exit_price: z.coerce.number().positive("Must be positive").optional().or(z.literal("")),
    quantity: z.coerce
      .number({ invalid_type_error: "Required" })
      .positive("Must be positive"),
    stop_loss: z.coerce.number().positive("Must be positive").optional().or(z.literal("")),
    take_profits: z.array(tpSchema).max(5).default([]),
    fees: z.coerce.number().min(0, "Must be >= 0").default(0),
    entry_date: z.string().min(1, "Entry date is required"),
    exit_date: z.string().optional().or(z.literal("")),
    setup_type: z.string().optional().or(z.literal("")),
    emotional_state: z.string().optional().or(z.literal("")),
    notes_pre: z.string().max(2000).optional().or(z.literal("")),
    notes_post: z.string().max(2000).optional().or(z.literal("")),
  })
  .refine(
    (d) => {
      if (d.exit_price && d.exit_date === "") return false;
      return true;
    },
    { message: "Exit date is required when exit price is set", path: ["exit_date"] }
  );

type FormData = z.infer<typeof schema>;

function toNullableNumber(v: number | "" | undefined): number | null {
  if (v === "" || v === undefined) return null;
  return v;
}

function toNullableString(v: string | undefined): string | null {
  if (!v || v === "") return null;
  return v;
}

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  return iso.slice(0, 16);
}

interface TradeFormProps {
  trade?: TradeWithRelations;
}

export function TradeForm({ trade }: Readonly<TradeFormProps>) {
  const isEditing = !!trade;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createTrade } = useCreateTrade();
  const { updateTrade } = useUpdateTrade();
  const { instruments: dbInstruments, favoriteIds, addCustom } = useInstruments();
  const { tags } = useTags();
  const { accounts } = useAccounts();
  const { upsertTPs } = useTradeTakeProfit(trade?.id ?? null);
  const { toast } = useToast();

  const [tagIds, setTagIds] = useState<string[]>(
    () => trade?.trade_tags.map((tt) => tt.tags.id) ?? []
  );
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    trade?.platform ?? ""
  );

  const platformDef = getPlatform(selectedPlatform);
  const { instruments: exchangeInstruments, loading: exchangeLoading } =
    useExchangeInstruments(
      platformDef?.supportsLivePairs ? selectedPlatform : null
    );

  const allInstruments = exchangeInstruments.length > 0
    ? [...dbInstruments, ...exchangeInstruments.filter(
        (ex) => !dbInstruments.some((db) => db.symbol === ex.symbol)
      )]
    : dbInstruments;

  // Build default take_profits from existing trade TPs
  const defaultTakeProfits = trade?.trade_take_profits
    ? trade.trade_take_profits.map((tp) => ({
        price: tp.price,
        quantity_pct: tp.quantity_pct,
      }))
    : [];

  // Read query params from calculator
  const qpDirection = searchParams?.get("direction") as "long" | "short" | null;
  const qpLeverage = searchParams?.get("leverage");
  const qpMarginMode = searchParams?.get("margin_mode") as "isolated" | "cross" | null;
  const qpEntry = searchParams?.get("entry_price");
  const qpSl = searchParams?.get("stop_loss");
  const qpAccountId = searchParams?.get("account_id");
  const qpQuantity = searchParams?.get("quantity");
  const qpTps = [1, 2, 3, 4, 5]
    .map((i) => searchParams?.get(`tp${i}`))
    .filter(Boolean) as string[];

  const isDraft = trade?.status === "draft";
  const hasCalcParams = !!(qpEntry || qpLeverage || qpQuantity);

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: trade
      ? {
          account_id: trade.account_id ?? "",
          instrument_id: trade.instrument_id,
          platform: trade.platform ?? "",
          direction: trade.direction,
          leverage: trade.leverage ?? 1,
          margin_mode: (trade.margin_mode as "isolated" | "cross") ?? "isolated",
          entry_price: trade.entry_price,
          exit_price: trade.exit_price ?? "",
          quantity: trade.quantity,
          stop_loss: trade.stop_loss ?? "",
          take_profits: defaultTakeProfits,
          fees: trade.fees,
          entry_date: toDatetimeLocal(trade.entry_date),
          exit_date: toDatetimeLocal(trade.exit_date),
          setup_type: trade.setup_type ?? "",
          emotional_state: trade.emotional_state ?? "",
          notes_pre: trade.notes_pre ?? "",
          notes_post: trade.notes_post ?? "",
        }
      : {
          account_id: qpAccountId ?? "",
          direction: qpDirection ?? "long",
          leverage: qpLeverage ? parseFloat(qpLeverage) : 1,
          margin_mode: qpMarginMode ?? "isolated",
          entry_price: qpEntry ? parseFloat(qpEntry) : undefined,
          quantity: qpQuantity ? parseFloat(qpQuantity) : undefined,
          stop_loss: qpSl ? parseFloat(qpSl) : "",
          take_profits: qpTps.map((p) => ({ price: parseFloat(p), quantity_pct: 100 })),
          fees: 0,
          entry_date: new Date().toISOString().slice(0, 16),
        },
  });

  // Sync calculator query params after mount — defaultValues only run once,
  // but searchParams may arrive after first render in Next.js 15 Suspense.
  useEffect(() => {
    if (isEditing) return;
    if (qpDirection) setValue("direction", qpDirection);
    if (qpLeverage) setValue("leverage", parseFloat(qpLeverage));
    if (qpMarginMode) setValue("margin_mode", qpMarginMode);
    if (qpEntry) setValue("entry_price", parseFloat(qpEntry));
    if (qpQuantity) setValue("quantity", parseFloat(qpQuantity));
    if (qpSl) setValue("stop_loss", parseFloat(qpSl));
    if (qpAccountId) setValue("account_id", qpAccountId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qpDirection, qpLeverage, qpMarginMode, qpEntry, qpQuantity, qpSl, qpAccountId]);

  const { field: directionField } = useController({ name: "direction", control });
  const { field: instrumentField } = useController({ name: "instrument_id", control });
  const { field: marginModeField } = useController({ name: "margin_mode", control });
  const { fields: tpFields, append: appendTp, remove: removeTp } = useFieldArray({
    control,
    name: "take_profits",
  });

  const watchedValues = watch([
    "direction",
    "entry_price",
    "exit_price",
    "quantity",
    "stop_loss",
    "fees",
    "leverage",
    "account_id",
  ]);
  const [wDir, wEntry, wExit, wQty, wSl, wFees, wLeverage, wAccountId] = watchedValues;

  const selectedAccount = accounts.find((a) => a.id === wAccountId);
  const availableBalance = selectedAccount
    ? selectedAccount.current_balance - selectedAccount.reserved_margin
    : null;

  // Calculate SL/TP percentages from entry for display
  const entryNum = Number(wEntry) || 0;
  const slNum = Number(wSl) || 0;
  const slPct =
    entryNum > 0 && slNum > 0
      ? (wDir === "long"
          ? ((slNum - entryNum) / entryNum)
          : ((entryNum - slNum) / entryNum)) * 100
      : null;
  const slRisk =
    entryNum > 0 && slNum > 0 && Number(wQty) > 0
      ? Math.abs(entryNum - slNum) * Number(wQty) * (Number(watch("leverage")) || 1)
      : null;

  async function resolveInstrumentId(instrumentId: string): Promise<string> {
    if (!isExchangeInstrumentId(instrumentId)) return instrumentId;
    const found = allInstruments.find((i) => i.id === instrumentId);
    if (!found) throw new Error("Selected instrument not found.");
    const marketType = platformDef?.defaultMarketType ?? "crypto";
    const created = await addCustom({
      symbol: found.symbol,
      name: found.name,
      market_type: marketType,
    });
    return created.id;
  }

  function buildPayload(data: FormData, statusOverride?: TradeStatus) {
    const exitPrice = toNullableNumber(data.exit_price as number | "");
    const status =
      statusOverride ?? (exitPrice != null ? "closed" : "open") as TradeStatus;

    return {
      payload: {
        instrument_id: data.instrument_id, // resolved later
        account_id: toNullableString(data.account_id),
        platform: toNullableString(data.platform),
        direction: data.direction,
        leverage: data.leverage ?? 1,
        margin_mode: data.margin_mode ?? "isolated",
        entry_price: data.entry_price,
        exit_price: exitPrice,
        quantity: data.quantity,
        stop_loss: toNullableNumber(data.stop_loss as number | ""),
        take_profit: null as number | null,
        fees: data.fees,
        entry_date: data.entry_date,
        exit_date: toNullableString(data.exit_date),
        setup_type: toNullableString(data.setup_type),
        emotional_state: toNullableString(data.emotional_state),
        notes_pre: toNullableString(data.notes_pre),
        notes_post: toNullableString(data.notes_post),
        status,
      },
      tps: data.take_profits.map((tp, i) => ({
        level: i + 1,
        price: tp.price,
        quantity_pct: tp.quantity_pct,
      })),
    };
  }

  async function saveTrade(data: FormData, statusOverride?: TradeStatus) {
    try {
      const resolvedInstrumentId = await resolveInstrumentId(data.instrument_id);
      const { payload, tps: tpsToSave } = buildPayload(data, statusOverride);
      payload.instrument_id = resolvedInstrumentId;

      if (isEditing) {
        await updateTrade(trade.id, payload);
        await setTradeTags(trade.id, tagIds);
        await upsertTPs(trade.id, tpsToSave);
        const msg = statusOverride === "open" && isDraft
          ? "Trade entered!"
          : "Trade updated successfully!";
        toast(msg, "success");
        router.push(`/trades/${trade.id}`);
      } else {
        const created = await createTrade(payload);
        if (tagIds.length > 0) await setTradeTags(created.id, tagIds);
        if (tpsToSave.length > 0) await upsertTPs(created.id, tpsToSave);
        const msg = statusOverride === "draft"
          ? "Draft saved!"
          : "Trade saved successfully!";
        toast(msg, "success");
        router.push("/trades");
      }
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function onSubmit(data: FormData) {
    await saveTrade(data);
  }

  const [savingDraft, setSavingDraft] = useState(false);
  async function onSaveDraft() {
    // Trigger validation manually but allow missing entry_date for drafts
    const values = watch() as FormData;
    setSavingDraft(true);
    try {
      await saveTrade(values, "draft");
    } finally {
      setSavingDraft(false);
    }
  }

  async function onEnterTrade() {
    // Convert draft to open — update entry_date to now
    const values = watch() as FormData;
    if (!values.entry_date) {
      setValue("entry_date", new Date().toISOString().slice(0, 16));
    }
    setSavingDraft(true);
    try {
      await saveTrade({ ...values, entry_date: values.entry_date || new Date().toISOString().slice(0, 16) }, "open");
    } finally {
      setSavingDraft(false);
    }
  }

  const leverageValue = Number(watch("leverage")) || 1;
  const presetBtnCls = (active: boolean) =>
    cn(
      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
      active
        ? "bg-primary-600 text-white"
        : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600"
    );

  const inputCls =
    "w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Calculator pre-fill banner */}
      {hasCalcParams && !isEditing && (
        <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 dark:border-primary-800 dark:bg-primary-900/20">
          <span className="text-sm text-primary-700 dark:text-primary-300">
            Pre-filled from Calculator — review and select an instrument, then save or save as draft.
          </span>
        </div>
      )}

      {/* Draft banner */}
      {isDraft && (
        <div className="flex items-center gap-3 rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 dark:border-yellow-700 dark:bg-yellow-900/20">
          <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            Draft Trade — click &quot;Enter Trade Now&quot; when you&apos;re ready to go live. Entry time will be updated.
          </span>
        </div>
      )}

      {/* Platform + Instrument + Direction */}
      <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-surface-500">
          Platform &amp; Instrument
        </h2>

        {/* Account selector */}
        {accounts.length > 0 && (
          <div className="mb-4">
            <Label htmlFor="account_id">Account</Label>
            <select
              id="account_id"
              className={inputCls}
              {...register("account_id")}
            >
              <option value="">— No account —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                  {a.is_default ? " (default)" : ""}
                  {" — "}
                  {formatCurrency(a.current_balance - a.reserved_margin)} avail.
                </option>
              ))}
            </select>
            {availableBalance !== null && (
              <p className="mt-1 text-xs text-surface-400">
                Available balance: {formatCurrency(availableBalance)}
              </p>
            )}
          </div>
        )}

        {/* Platform selector */}
        <div className="mb-4">
          <Label htmlFor="platform">Trading Platform</Label>
          <select
            id="platform"
            className={inputCls}
            {...register("platform")}
            onChange={(e) => {
              register("platform").onChange(e);
              setSelectedPlatform(e.target.value);
              setValue("instrument_id", "");
            }}
          >
            <option value="">— Select platform —</option>
            {PLATFORM_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                    {p.supportsLivePairs ? " ✦" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {platformDef?.supportsLivePairs && (
            <p className="mt-1 flex items-center gap-1 text-xs text-surface-400">
              {exchangeLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading live pairs from {platformDef.label}…
                </>
              ) : exchangeInstruments.length > 0 ? (
                `✦ ${exchangeInstruments.length.toLocaleString()} live pairs loaded from ${platformDef.label}`
              ) : null}
            </p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="instrument_id" required>
              Instrument
            </Label>
            <InstrumentSelector
              instruments={allInstruments}
              favoriteIds={favoriteIds}
              value={instrumentField.value}
              onChange={instrumentField.onChange}
            />
            {errors.instrument_id && (
              <p className="mt-1 text-xs text-loss">{errors.instrument_id.message}</p>
            )}
          </div>

          <div>
            <Label required>Direction</Label>
            <DirectionToggle
              value={directionField.value}
              onChange={directionField.onChange}
            />
          </div>
        </div>
      </section>

      {/* Entry */}
      <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-surface-500">
          Entry
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="entry_price" required>
              Entry Price
            </Label>
            <PriceInput
              id="entry_price"
              placeholder="0.00"
              error={errors.entry_price?.message}
              {...register("entry_price")}
            />
          </div>

          <div>
            <Label htmlFor="quantity" required>
              Quantity / Contracts
            </Label>
            <PriceInput
              id="quantity"
              prefix="#"
              placeholder="1"
              error={errors.quantity?.message}
              {...register("quantity")}
            />
          </div>

          <div>
            <Label htmlFor="entry_date" required>
              Entry Date &amp; Time
            </Label>
            <input
              id="entry_date"
              type="datetime-local"
              className={inputCls}
              {...register("entry_date")}
            />
            {errors.entry_date && (
              <p className="mt-1 text-xs text-loss">{errors.entry_date.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="fees">Fees</Label>
            <PriceInput
              id="fees"
              placeholder="0.00"
              error={errors.fees?.message}
              {...register("fees")}
            />
          </div>
        </div>

        {/* Leverage */}
        <div className="mt-4">
          <Label>Leverage</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {LEVERAGE_PRESETS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setValue("leverage", l)}
                className={presetBtnCls(leverageValue === l)}
              >
                {l}x
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="125"
              step="1"
              className="w-20 rounded-lg border border-surface-300 bg-white px-3 py-1 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
              placeholder="Custom"
              value={leverageValue}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v)) setValue("leverage", v, { shouldDirty: true, shouldValidate: true });
              }}
            />
          </div>
          {errors.leverage && (
            <p className="mt-1 text-xs text-loss">{errors.leverage.message}</p>
          )}
        </div>

        {/* Margin Mode */}
        <div className="mt-4">
          <Label>Margin Mode</Label>
          <div className="mt-1 flex w-48 gap-1 rounded-xl bg-surface-100 p-1 dark:bg-surface-700">
            <button
              type="button"
              onClick={() => marginModeField.onChange("isolated")}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
                marginModeField.value === "isolated"
                  ? "bg-white text-surface-900 shadow dark:bg-surface-800 dark:text-surface-50"
                  : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              )}
            >
              Isolated
            </button>
            <button
              type="button"
              onClick={() => marginModeField.onChange("cross")}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
                marginModeField.value === "cross"
                  ? "bg-white text-surface-900 shadow dark:bg-surface-800 dark:text-surface-50"
                  : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
              )}
            >
              Cross
            </button>
          </div>
        </div>
      </section>

      {/* Exit */}
      <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-surface-500">
          Exit
        </h2>
        <p className="mb-5 text-xs text-surface-400">
          Leave blank to save as an open trade.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="exit_price">Exit Price</Label>
            <PriceInput
              id="exit_price"
              placeholder="0.00"
              error={errors.exit_price?.message}
              {...register("exit_price")}
            />
          </div>

          <div>
            <Label htmlFor="exit_date">Exit Date &amp; Time</Label>
            <input
              id="exit_date"
              type="datetime-local"
              className={inputCls}
              {...register("exit_date")}
            />
            {errors.exit_date && (
              <p className="mt-1 text-xs text-loss">{errors.exit_date.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Risk Management */}
      <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-surface-500">
          Risk Management
        </h2>

        {/* Stop Loss */}
        <div className="mb-4">
          <Label htmlFor="stop_loss">Stop Loss</Label>
          <PriceInput
            id="stop_loss"
            placeholder="0.00"
            error={errors.stop_loss?.message}
            {...register("stop_loss")}
          />
          {slPct !== null && (
            <p className={cn("mt-1 text-xs", slPct < 0 ? "text-loss" : "text-profit")}>
              {slPct.toFixed(2)}% from entry
              {slRisk != null && slRisk > 0 && (
                <span className="ml-1 text-surface-400">
                  ({formatCurrency(slRisk)} risk)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Multiple Take Profits */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <Label>Take Profit Levels</Label>
            {tpFields.length < 5 && (
              <button
                type="button"
                onClick={() => appendTp({ price: 0, quantity_pct: 100 })}
                className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
              >
                <Plus className="h-3 w-3" /> Add TP
              </button>
            )}
          </div>

          {tpFields.length === 0 && (
            <p className="mt-2 text-xs text-surface-400">
              No take profit levels set.{" "}
              <button
                type="button"
                className="text-primary-600 hover:underline"
                onClick={() => appendTp({ price: 0, quantity_pct: 100 })}
              >
                Add one
              </button>
            </p>
          )}

          <div className="mt-2 space-y-3">
            {tpFields.map((field, idx) => {
              const tpPrice = Number(watch(`take_profits.${idx}.price`)) || 0;
              const tpPct =
                entryNum > 0 && tpPrice > 0
                  ? (wDir === "long"
                      ? ((tpPrice - entryNum) / entryNum)
                      : ((entryNum - tpPrice) / entryNum)) * 100
                  : null;

              return (
                <div key={field.id} className="flex items-start gap-2">
                  <span className="mt-2 shrink-0 rounded-md bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    TP{idx + 1}
                  </span>
                  <div className="flex flex-1 gap-2">
                    <div className="flex-1">
                      <PriceInput
                        placeholder="0.00"
                        error={errors.take_profits?.[idx]?.price?.message}
                        {...register(`take_profits.${idx}.price`)}
                      />
                      {tpPct !== null && (
                        <p className={cn("mt-0.5 text-xs", tpPct > 0 ? "text-profit" : "text-loss")}>
                          {tpPct.toFixed(2)}% from entry
                        </p>
                      )}
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        step="1"
                        placeholder="100%"
                        className={inputCls}
                        {...register(`take_profits.${idx}.quantity_pct`)}
                      />
                      <p className="mt-0.5 text-xs text-surface-400">Qty %</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTp(idx)}
                    className="mt-2 shrink-0 rounded p-1 text-surface-400 hover:text-loss"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <PnlPreview
            direction={wDir ?? "long"}
            entryPrice={Number(wEntry) || null}
            exitPrice={Number(wExit) || null}
            quantity={Number(wQty) || null}
            stopLoss={Number(wSl) || null}
            takeProfit={null}
            fees={Number(wFees) || 0}
          />
        </div>
      </section>

      {/* Setup & Psychology */}
      <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-surface-500">
          Setup &amp; Psychology
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="setup_type">Setup Type</Label>
            <select
              id="setup_type"
              className={inputCls}
              {...register("setup_type")}
            >
              <option value="">— Select —</option>
              {SETUP_TYPES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="emotional_state">Emotional State</Label>
            <select
              id="emotional_state"
              className={inputCls}
              {...register("emotional_state")}
            >
              <option value="">— Select —</option>
              {["Confident", "Fearful", "Greedy", "Calm", "Anxious", "FOMO", "Neutral"].map(
                (e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <Label>Tags</Label>
          <TagSelector tags={tags} selectedIds={tagIds} onChange={setTagIds} />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="notes_pre">Pre-trade Notes</Label>
            <textarea
              id="notes_pre"
              rows={3}
              placeholder="Why are you taking this trade?"
              className={inputCls}
              {...register("notes_pre")}
            />
            {errors.notes_pre && (
              <p className="mt-1 text-xs text-loss">{errors.notes_pre.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="notes_post">Post-trade Notes</Label>
            <textarea
              id="notes_post"
              rows={3}
              placeholder="What happened? What did you learn?"
              className={inputCls}
              {...register("notes_post")}
            />
            {errors.notes_post && (
              <p className="mt-1 text-xs text-loss">{errors.notes_post.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push(isEditing ? `/trades/${trade.id}` : "/trades")}
        >
          Cancel
        </Button>

        {/* Draft: show "Enter Trade" to activate it */}
        {isEditing && isDraft && (
          <Button
            type="button"
            loading={savingDraft}
            onClick={onEnterTrade}
          >
            Enter Trade Now
          </Button>
        )}

        {/* Save as Draft — only on new trades or existing drafts */}
        {(!isEditing || isDraft) && (
          <Button
            type="button"
            variant="secondary"
            loading={savingDraft}
            onClick={onSaveDraft}
          >
            {isDraft ? "Update Draft" : "Save as Draft"}
          </Button>
        )}

        <Button type="submit" loading={isSubmitting}>
          {isEditing
            ? isDraft
              ? "Enter Trade"
              : "Save Changes"
            : "Save Trade"}
        </Button>
      </div>
    </form>
  );
}
