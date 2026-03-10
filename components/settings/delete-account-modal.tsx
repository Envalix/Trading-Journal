"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface DeleteAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ open, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, signOut } = useAuth();
  const router = useRouter();

  if (!open) return null;

  const confirmed = confirmText === "DELETE";

  async function handleDelete() {
    if (!user || !confirmed) return;
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      // Delete user-owned records in dependency order
      // trade_images and trade_tags cascade from trades via DB FK
      await supabase.from("trades").delete().eq("user_id", user.id);
      await supabase.from("tags").delete().eq("user_id", user.id);
      await supabase
        .from("instruments")
        .delete()
        .eq("user_id", user.id)
        .eq("is_system", false);
      await supabase.from("profiles").delete().eq("id", user.id);

      // Sign out — the auth user record requires server-side deletion
      // (Supabase admin API). Data is cleared; account sign-in will fail.
      await signOut();
      router.push("/auth/login");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-surface-200 bg-white p-6 shadow-xl dark:border-surface-700 dark:bg-surface-800">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-loss-light">
              <AlertTriangle className="h-5 w-5 text-loss" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
                Delete Account
              </h2>
              <p className="text-xs text-surface-500">This action cannot be undone</p>
            </div>
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

        <div className="mb-5 rounded-xl border border-loss/30 bg-loss-light p-4">
          <p className="text-sm font-medium text-loss">
            This will permanently delete:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-loss/80">
            <li>• All your trades and trade history</li>
            <li>• All trade images and notes</li>
            <li>• All tags and custom instruments</li>
            <li>• Your profile and preferences</li>
          </ul>
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
            Type <span className="font-mono font-bold">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            className="w-full rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-loss focus:ring-2 focus:ring-loss/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!confirmed}
            loading={loading}
            className="flex-1"
          >
            Delete My Account
          </Button>
        </div>
      </div>
    </div>
  );
}
