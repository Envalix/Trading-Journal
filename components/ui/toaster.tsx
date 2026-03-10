"use client";

import { CheckCircle, Info, X, XCircle } from "lucide-react";
import { useToast } from "@/contexts/toast-context";
import { cn } from "@/lib/utils";

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styles = {
  success: "bg-profit-light border-profit text-profit-dark",
  error: "bg-loss-light border-loss text-loss-dark",
  info: "bg-primary-50 border-primary-200 text-primary-800",
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = icons[t.type];
        return (
          <div
            key={t.id}
            className={cn(
              "flex w-80 items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all",
              styles[t.type]
            )}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-60 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
