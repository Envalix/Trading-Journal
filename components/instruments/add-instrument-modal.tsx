"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AuthAlert } from "@/components/auth/auth-alert";
import { MARKET_TYPE_LABELS } from "@/constants/instruments";
import type { Instrument } from "@/types/database";

const schema = z.object({
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(20, "Symbol too long")
    .regex(/^[A-Za-z0-9/.-]+$/, "Symbol may only contain letters, numbers, /, . or -"),
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  market_type: z.enum(["stock", "crypto", "forex", "futures", "options", "cfd"] as const),
});

type FormData = z.infer<typeof schema>;

interface AddInstrumentModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
  editingInstrument?: Instrument | null;
  existingSymbols: string[];
}

export function AddInstrumentModal({
  open,
  onClose,
  onSave,
  editingInstrument,
  existingSymbols,
}: AddInstrumentModalProps) {
  const isEditing = !!editingInstrument;

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { market_type: "stock" },
  });

  // Populate form when editing
  useEffect(() => {
    if (editingInstrument) {
      reset({
        symbol: editingInstrument.symbol,
        name: editingInstrument.name,
        market_type: editingInstrument.market_type,
      });
    } else {
      reset({ symbol: "", name: "", market_type: "stock" });
    }
  }, [editingInstrument, reset]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  async function onSubmit(data: FormData) {
    const upperSymbol = data.symbol.toUpperCase().trim();

    // Check for duplicate symbols (exclude current if editing)
    const isDuplicate = existingSymbols
      .filter((s) => !isEditing || s !== editingInstrument?.symbol)
      .includes(upperSymbol);

    if (isDuplicate) {
      setError("symbol", { message: `Symbol "${upperSymbol}" already exists` });
      return;
    }

    try {
      await onSave({ ...data, symbol: upperSymbol });
      onClose();
    } catch (err) {
      setError("root", { message: (err as Error).message });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900">
            {isEditing ? "Edit Instrument" : "Add Custom Instrument"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {errors.root && <AuthAlert type="error" message={errors.root.message!} />}

          <div>
            <Label htmlFor="symbol" required>Symbol</Label>
            <Input
              id="symbol"
              placeholder="e.g. AAPL, BTC/USDT, EUR/USD"
              error={errors.symbol?.message}
              {...register("symbol")}
            />
          </div>

          <div>
            <Label htmlFor="name" required>Name</Label>
            <Input
              id="name"
              placeholder="e.g. Apple Inc."
              error={errors.name?.message}
              {...register("name")}
            />
          </div>

          <div>
            <Label htmlFor="market_type" required>Market Type</Label>
            <select
              id="market_type"
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              {...register("market_type")}
            >
              {Object.entries(MARKET_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEditing ? "Save changes" : "Add instrument"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
