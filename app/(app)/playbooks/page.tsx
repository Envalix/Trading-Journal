"use client";

import Link from "next/link";
import { Plus, Pencil, Trash2, BookOpen } from "lucide-react";
import { usePlaybooks } from "@/hooks/use-playbooks";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { PlaybookWithRules } from "@/types/database";

function PlaybookCard({
  playbook,
  onDelete,
}: {
  playbook: PlaybookWithRules;
  onDelete: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-surface-900 dark:text-surface-50">
            {playbook.name}
          </h3>
          {playbook.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-surface-500 dark:text-surface-400">
              {playbook.description}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link href={`/playbooks/${playbook.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </Link>
          {confirming ? (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onDelete(playbook.id)}
                className="rounded px-2 py-1 text-xs font-medium text-loss hover:bg-loss-light"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded px-2 py-1 text-xs text-surface-500 hover:bg-surface-100"
              >
                Cancel
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-surface-400 hover:text-loss"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Rules preview */}
      <div className="space-y-1">
        {playbook.playbook_rules.length === 0 ? (
          <p className="text-xs text-surface-400 italic">No rules defined</p>
        ) : (
          playbook.playbook_rules.slice(0, 4).map((rule) => (
            <div key={rule.id} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-surface-300 dark:bg-surface-500" />
              <span className="truncate text-xs text-surface-600 dark:text-surface-300">
                {rule.rule_text}
              </span>
              {rule.is_required && (
                <span className="shrink-0 text-xs text-loss">*</span>
              )}
            </div>
          ))
        )}
        {playbook.playbook_rules.length > 4 && (
          <p className="text-xs text-surface-400">
            +{playbook.playbook_rules.length - 4} more rules
          </p>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 border-t border-surface-100 pt-3 dark:border-surface-700">
        <div className="text-center">
          <p className="text-xs text-surface-400">Rules</p>
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
            {playbook.playbook_rules.length}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-surface-400">Required</p>
          <p className="text-sm font-semibold text-surface-900 dark:text-surface-50">
            {playbook.playbook_rules.filter((r) => r.is_required).length}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PlaybooksPage() {
  const { playbooks, loading, error, deletePlaybook } = usePlaybooks();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Playbooks</h1>
          <p className="mt-1 text-sm text-surface-500">Define your trading strategies and track discipline</p>
        </div>
        <Link href="/playbooks/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Playbook
          </Button>
        </Link>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-loss-light bg-loss-light/20 px-4 py-3 text-sm text-loss">
          {error}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-surface-200 bg-surface-100 dark:border-surface-700 dark:bg-surface-700"
            />
          ))}
        </div>
      ) : playbooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-surface-300 bg-surface-50 py-16 dark:border-surface-600 dark:bg-surface-800/50">
          <BookOpen className="h-10 w-10 text-surface-300 dark:text-surface-600" />
          <div className="text-center">
            <p className="font-medium text-surface-600 dark:text-surface-400">No playbooks yet</p>
            <p className="mt-1 text-sm text-surface-400">Create your first strategy to track rule discipline</p>
          </div>
          <Link href="/playbooks/new">
            <Button variant="secondary">
              <Plus className="mr-2 h-4 w-4" />
              Create Playbook
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {playbooks.map((playbook) => (
            <PlaybookCard
              key={playbook.id}
              playbook={playbook}
              onDelete={deletePlaybook}
            />
          ))}
        </div>
      )}
    </div>
  );
}
