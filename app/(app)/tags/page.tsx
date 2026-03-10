"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useTags } from "@/hooks/use-tags";
import { useToast } from "@/contexts/toast-context";
import { TagChip } from "@/components/tags/tag-chip";
import { TagFormModal } from "@/components/tags/tag-form-modal";
import { DeleteConfirmModal } from "@/components/trades/delete-confirm-modal";
import { Button } from "@/components/ui/button";
import { SUGGESTED_TAGS } from "@/constants/tags";
import type { Tag } from "@/types/database";

export default function TagsPage() {
  const { tags, loading, createTag, updateTag, deleteTag } = useTags();
  const { toast } = useToast();

  const [formModal, setFormModal] = useState<{ open: boolean; tag?: Tag | null }>({
    open: false,
  });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; tagId?: string }>({
    open: false,
  });

  async function handleSave(name: string, color: string) {
    if (formModal.tag) {
      await updateTag(formModal.tag.id, name, color);
      toast("Tag updated.", "success");
    } else {
      await createTag(name, color);
      toast("Tag created.", "success");
    }
  }

  async function handleDelete() {
    if (!deleteModal.tagId) return;
    await deleteTag(deleteModal.tagId);
    toast("Tag deleted.", "success");
  }

  const suggestedNotAdded = SUGGESTED_TAGS.filter(
    (s) => !tags.some((t) => t.name.toLowerCase() === s.name.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Tags</h1>
          <p className="mt-1 text-sm text-surface-500">
            Categorize your trades with custom tags
          </p>
        </div>
        <Button onClick={() => setFormModal({ open: true })}>
          <Plus className="h-4 w-4" /> New Tag
        </Button>
      </div>

      {/* Your tags */}
      <section className="mb-8 rounded-xl border border-surface-200 bg-white shadow-sm">
        <div className="border-b border-surface-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-surface-700">
            Your Tags ({tags.length})
          </h2>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-surface-100" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-surface-400">No tags yet. Create one or add from suggestions below.</p>
          </div>
        ) : (
          <ul className="divide-y divide-surface-100">
            {tags.map((tag) => (
              <li key={tag.id} className="flex items-center justify-between px-5 py-3">
                <TagChip name={tag.name} color={tag.color} size="md" />
                <div className="flex gap-1">
                  <button
                    onClick={() => setFormModal({ open: true, tag })}
                    className="rounded-md p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700"
                    aria-label="Edit tag"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: true, tagId: tag.id })}
                    className="rounded-md p-1.5 text-surface-400 hover:bg-loss-light hover:text-loss"
                    aria-label="Delete tag"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Suggestions */}
      {suggestedNotAdded.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-surface-500">
            Suggested Tags — click to add
          </h2>
          <div className="flex flex-wrap gap-2">
            {suggestedNotAdded.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={async () => {
                  try {
                    await createTag(s.name, s.color);
                    toast(`"${s.name}" added.`, "success");
                  } catch (err) {
                    toast((err as Error).message, "error");
                  }
                }}
                className="rounded-full px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: s.color }}
              >
                + {s.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      <TagFormModal
        open={formModal.open}
        onClose={() => setFormModal({ open: false })}
        onSave={handleSave}
        editingTag={formModal.tag}
      />
      <DeleteConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        onConfirm={handleDelete}
      />
    </div>
  );
}
