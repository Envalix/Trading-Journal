"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  count?: number;
}

export function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  count = 1,
}: DeleteConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-surface-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-loss-light">
          <AlertTriangle className="h-6 w-6 text-loss" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-surface-900">
          Delete {count > 1 ? `${count} trades` : "trade"}?
        </h2>
        <p className="mb-6 text-sm text-surface-500">
          This action cannot be undone. The{" "}
          {count > 1 ? `${count} trades` : "trade"} will be permanently removed.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" loading={loading} onClick={handleConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
