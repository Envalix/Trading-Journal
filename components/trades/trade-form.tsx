"use client";

import { useState } from "react";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import { useToast } from "@/contexts/toast-context";
import { SETUP_TYPES } from "@/constants/instruments";
import { PLATFORM_GROUPS, getPlatform } from "@/constants/platforms";
import type { TradeWithRelations, TradeStatus } from "@/types/database";

const schema = z
  .object({
    instrument_id: z.string().min(1, "Instrument is required"),
    platform: z.string().optional().or(z.literal("")),
    direction: z.enum(["long", "short"] as const),
    entry_price: z.coerce
      .number({ invalid_type_error: "Required" })
      .positive("Must be positive"),
    exit_price: z.coerce.number().positive("Must be positive").optional().or(z.literal("")),
    quantity: z.coerce
      .number({ invalid_type_error: "Required" })
      .positive("Must be positive"),
    stop_loss: z.coerce.number().positive("Must be positive").optional().or(z.literal("")),
    take_profit: z.coerce.number().positive("Must be positive").optional().or(z.literal("")),
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
  const { createTrade } = useCreateTrade();
  const { updateTrade } = useUpdateTrade();
  const { instruments: dbInstruments, favoriteIds, addCustom } = useInstruments();
  const { tags } = useTags();
  const { toast } = useToast();

  const [tagIds, setTagIds] = useState<string[]>(
    () => trade?.trade_tags.map((tt) => tt.tags.id) ?? []
  );

  // Track selected platform separately so we can fetch live pairs
  const [selectedPlatform, setSelectedPlatform] = useState<string>(
    trade?.platform ?? ""
  );

  const platformDef = getPlatform(selectedPlatform);
  const { instruments: exchangeInstruments, loading: exchangeLoading } =
    useExchangeInstruments(
      platformDef?.supportsLivePairs ? selectedPlatform : null
    );

  // Merge DB instruments with live exchange pairs (exchange pairs shown last)
  const allInstruments = exchangeInstruments.length > 0
    ? [...dbInstruments, ...exchangeInstruments.filter(
        (ex) => !dbInstruments.some((db) => db.symbol === ex.symbol)
      )]
    : dbInstruments;

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
          instrument_id: trade.instrument_id,
          platform: trade.platform ?? "",
          direction: trade.direction,
          entry_price: trade.entry_price,
          exit_price: trade.exit_price ?? "",
          quantity: trade.quantity,
          stop_loss: trade.stop_loss ?? "",
          take_profit: trade.take_profit ?? "",
          fees: trade.fees,
          entry_date: toDatetimeLocal(trade.entry_date),
          exit_date: toDatetimeLocal(trade.exit_date),
          setup_type: trade.setup_type ?? "",
          emotional_state: trade.emotional_state ?? "",
          notes_pre: trade.notes_pre ?? "",
          notes_post: trade.notes_post ?? "",
        }
      : {
          direction: "long",
          fees: 0,
          entry_date: new Date().toISOString().slice(0, 16),
        },
  });

  const { field: directionField } = useController({ name: "direction", control });
  const { field: instrumentField } = useController({ name: "instrument_id", control });

  const watchedValues = watch([
    "direction",
    "entry_price",
    "exit_price",
    "quantity",
    "stop_loss",
    "take_profit",
    "fees",
  ]);
  const [wDir, wEntry, wExit, wQty, wSl, wTp, wFees] = watchedValues;

  /** If the selected instrument is an exchange symbol not yet in the DB, upsert it. */
  async function resolveInstrumentId(instrumentId: string): Promise<string> {
    if (!isExchangeInstrumentId(instrumentId)) return instrumentId;

    // Find the instrument object from our merged list
    const found = allInstruments.find((i) => i.id === instrumentId);
    if (!found) throw new Error("Selected instrument not found.");

    const marketType = platformDef?.defaultMarketType ?? "crypto";

    // Upsert as a custom instrument and return the real DB ID
    const created = await addCustom({
      symbol: found.symbol,
      name: found.name,
      market_type: marketType,
    });
    return created.id;
  }

  async function onSubmit(data: FormData) {
    try {
      const resolvedInstrumentId = await resolveInstrumentId(data.instrument_id);
      const exitPrice = toNullableNumber(data.exit_price as number | "");
      const status = (exitPrice != null ? "closed" : "open") as TradeStatus;
      const platform = toNullableString(data.platform);

      const tradePayload = {
        instrument_id: resolvedInstrumentId,
        platform,
        direction: data.direction,
        entry_price: data.entry_price,
        exit_price: exitPrice,
        quantity: data.quantity,
        stop_loss: toNullableNumber(data.stop_loss as number | ""),
        take_profit: toNullableNumber(data.take_profit as number | ""),
        fees: data.fees,
        entry_date: data.entry_date,
        exit_date: toNullableString(data.exit_date),
        setup_type: toNullableString(data.setup_type),
        emotional_state: toNullableString(data.emotional_state),
        notes_pre: toNullableString(data.notes_pre),
        notes_post: toNullableString(data.notes_post),
        status,
      };

      if (isEditing) {
        await updateTrade(trade.id, tradePayload);
        await setTradeTags(trade.id, tagIds);
        toast("Trade updated successfully!", "success");
        router.push(`/trades/${trade.id}`);
      } else {
        const created = await createTrade(tradePayload);
        if (tagIds.length > 0) await setTradeTags(created.id, tagIds);
        toast("Trade saved successfully!", "success");
        router.push("/trades");
      }
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Platform + Instrument + Direction */}
      <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-surface-500">
          Platform &amp; Instrument
        </h2>

        {/* Platform selector */}
        <div className="mb-4">
          <Label htmlFor="platform">Trading Platform</Label>
          <select
            id="platform"
            className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
            {...register("platform")}
            onChange={(e) => {
              register("platform").onChange(e);
              setSelectedPlatform(e.target.value);
              // Clear instrument when platform changes
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
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
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
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
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
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="stop_loss">Stop Loss</Label>
            <PriceInput
              id="stop_loss"
              placeholder="0.00"
              error={errors.stop_loss?.message}
              {...register("stop_loss")}
            />
          </div>

          <div>
            <Label htmlFor="take_profit">Take Profit</Label>
            <PriceInput
              id="take_profit"
              placeholder="0.00"
              error={errors.take_profit?.message}
              {...register("take_profit")}
            />
          </div>
        </div>

        <div className="mt-4">
          <PnlPreview
            direction={wDir ?? "long"}
            entryPrice={Number(wEntry) || null}
            exitPrice={Number(wExit) || null}
            quantity={Number(wQty) || null}
            stopLoss={Number(wSl) || null}
            takeProfit={Number(wTp) || null}
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
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
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
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
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
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
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
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
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
        <Button type="submit" loading={isSubmitting}>
          {isEditing ? "Save Changes" : "Save Trade"}
        </Button>
      </div>
    </form>
  );
}
