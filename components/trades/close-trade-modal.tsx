"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { PriceInput } from "./price-input";

const schema = z.object({
  exit_price: z.coerce.number({ invalid_type_error: "Required" }).positive("Must be positive"),
  exit_date: z.string().min(1, "Exit date is required"),
});

type FormData = z.infer<typeof schema>;

interface CloseTradeModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (exitPrice: number, exitDate: string) => Promise<void>;
  title?: string;
}

export function CloseTradeModal({
  open,
  onClose,
  onConfirm,
  title = "Close Trade",
}: CloseTradeModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { exit_date: new Date().toISOString().slice(0, 16) },
  });

  if (!open) return null;

  async function onSubmit(data: FormData) {
    await onConfirm(data.exit_price, data.exit_date);
    reset();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-surface-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="exit_price" required>
              Exit Price
            </Label>
            <PriceInput
              id="exit_price"
              placeholder="0.00"
              error={errors.exit_price?.message}
              {...register("exit_price")}
            />
          </div>

          <div>
            <Label htmlFor="exit_date" required>
              Exit Date &amp; Time
            </Label>
            <input
              id="exit_date"
              type="datetime-local"
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              {...register("exit_date")}
            />
            {errors.exit_date && (
              <p className="mt-1 text-xs text-loss">{errors.exit_date.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Close Trade
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
