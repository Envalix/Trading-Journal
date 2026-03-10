"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";

interface ClearTradesModalProps {
  open: boolean;
  tradeCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function ClearTradesModal({
  open,
  tradeCount,
  onClose,
  onSuccess,
}: ClearTradesModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useAuth();

  if (!open) return null;

  async function handleClear() {
    if (!user) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: err } = await supabase
      .from("trades")
      .delete()
      .eq("user_id", user.id);

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setLoading(false);
      onSuccess();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-surface-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-800">
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
              Clear All Trades
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <p className="mb-4 rounded-lg bg-loss-light px-3 py-2 text-sm text-loss">{error}</p>
        )}

        <p className="mb-5 text-sm text-surface-600 dark:text-surface-300">
          This will permanently delete{" "}
          <span className="font-semibold text-surface-900 dark:text-surface-100">
            {tradeCount} trade{tradeCount !== 1 ? "s" : ""}
          </span>{" "}
          and all associated images, notes, and tags. Your account and preferences will be kept.
        </p>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleClear}
            loading={loading}
            className="flex-1"
          >
            Clear All Trades
          </Button>
        </div>
      </div>
    </div>
  );
}
