"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function scorePassword(pwd: string): number {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

const STRENGTH_LABELS = ["", "Very Weak", "Weak", "Fair", "Strong", "Very Strong"];
const STRENGTH_COLORS = [
  "",
  "bg-loss",
  "bg-loss",
  "bg-yellow-400",
  "bg-profit",
  "bg-profit",
];

interface PasswordChangeFormProps {
  onSuccess: () => void;
}

export function PasswordChangeForm({ onSuccess }: PasswordChangeFormProps) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = scorePassword(next);
  const mismatch = confirm.length > 0 && next !== confirm;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError("Passwords do not match."); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    setError("");
    setLoading(true);

    const supabase = createClient();

    // Supabase requires re-authentication to change password.
    // We first verify the current password by signing in.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) { setError("Could not verify identity."); setLoading(false); return; }

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: current,
    });
    if (signInErr) { setError("Current password is incorrect."); setLoading(false); return; }

    const { error: updateErr } = await supabase.auth.updateUser({ password: next });
    if (updateErr) { setError(updateErr.message); setLoading(false); return; }

    setCurrent(""); setNext(""); setConfirm("");
    setLoading(false);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-loss-light px-3 py-2 text-sm text-loss">{error}</p>
      )}

      {/* Current password */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            className="w-full rounded-lg border border-surface-300 px-3 py-2 pr-10 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
          >
            {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* New password */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          New Password
        </label>
        <div className="relative">
          <input
            type={showNext ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            className="w-full rounded-lg border border-surface-300 px-3 py-2 pr-10 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
          />
          <button
            type="button"
            onClick={() => setShowNext((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400"
          >
            {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {next.length > 0 && (
          <div className="mt-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i <= strength ? STRENGTH_COLORS[strength] : "bg-surface-200"
                  )}
                />
              ))}
            </div>
            <p className="mt-1 text-xs text-surface-500">{STRENGTH_LABELS[strength]}</p>
          </div>
        )}
      </div>

      {/* Confirm */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-surface-700 dark:text-surface-300">
          Confirm New Password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-surface-900 shadow-sm outline-none dark:bg-surface-700 dark:text-surface-100",
            mismatch
              ? "border-loss focus:border-loss focus:ring-2 focus:ring-loss/20"
              : "border-surface-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600"
          )}
        />
        {mismatch && (
          <p className="mt-1 text-xs text-loss">Passwords do not match.</p>
        )}
      </div>

      <Button type="submit" loading={loading}>
        Update Password
      </Button>
    </form>
  );
}
