"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { TAG_COLORS } from "@/constants/tags";
import type { Tag } from "@/types/database";

interface TagFormModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => Promise<void>;
  editingTag?: Tag | null;
}

export function TagFormModal({ open, onClose, onSave, editingTag }: TagFormModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(TAG_COLORS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingTag) {
      setName(editingTag.name);
      setColor(editingTag.color);
    } else {
      setName("");
      setColor(TAG_COLORS[0]);
    }
    setError("");
  }, [editingTag, open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required"); return; }
    setLoading(true);
    try {
      await onSave(name.trim(), color);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-surface-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-900">
            {editingTag ? "Edit Tag" : "New Tag"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-loss-light px-3 py-2 text-sm text-loss">{error}</p>
          )}

          <div>
            <Label htmlFor="tag-name" required>Name</Label>
            <input
              id="tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Breakout, FOMO"
              className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="h-8 w-8 rounded-full ring-offset-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c,
                    outline: color === c ? `2px solid ${c}` : "none",
                    outlineOffset: "2px",
                  }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>

            {/* Preview */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-surface-500">Preview:</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: color }}
              >
                {name || "Tag name"}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>
              {editingTag ? "Save Changes" : "Create Tag"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
