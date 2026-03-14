"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PlaybookWithRules } from "@/types/database";

interface RuleRow {
  uid: string;
  rule_text: string;
  is_required: boolean;
}

interface PlaybookFormProps {
  readonly initial?: PlaybookWithRules;
  readonly onSave: (
    name: string,
    description: string | null,
    rules: Omit<RuleRow, "uid">[]
  ) => Promise<unknown>;
}

let uidCounter = 0;
function newUid() { return String(++uidCounter); }

function submitLabel(saving: boolean, isEdit: boolean) {
  if (saving) return "Saving...";
  return isEdit ? "Update Playbook" : "Create Playbook";
}

export function PlaybookForm({ initial, onSave }: PlaybookFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [rules, setRules] = useState<RuleRow[]>(
    initial?.playbook_rules.map((r) => ({
      uid: r.id,
      rule_text: r.rule_text,
      is_required: r.is_required,
    })) ?? []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addRule() {
    setRules((prev) => [...prev, { uid: newUid(), rule_text: "", is_required: true }]);
  }

  function removeRule(index: number) {
    setRules((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRule(index: number, field: keyof RuleRow, value: string | boolean) {
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
  }

  function moveRule(index: number, direction: "up" | "down") {
    const next = [...rules];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRules(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Strategy name is required");
      return;
    }
    const validRules = rules
      .filter((r) => r.rule_text.trim() !== "")
      .map(({ rule_text, is_required }) => ({ rule_text, is_required }));
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim(), description.trim() || null, validRules);
      router.push("/playbooks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save playbook");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="rounded-lg border border-loss-light bg-loss-light/20 px-4 py-3 text-sm text-loss">
          {error}
        </div>
      )}

      {/* Name & Description */}
      <div className="flex flex-col gap-4 rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-800">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-surface-500">
          Strategy Info
        </h2>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Strategy Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Break & Retest"
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your strategy and when to use it..."
            rows={3}
            className="flex w-full rounded-md border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 placeholder:text-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-50 dark:placeholder:text-surface-500"
          />
        </div>
      </div>

      {/* Rules */}
      <div className="flex flex-col gap-4 rounded-xl border border-surface-200 bg-white p-5 dark:border-surface-700 dark:bg-surface-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-surface-500">
            Rules
          </h2>
          <span className="text-xs text-surface-400">
            <span className="text-loss">*</span> = Required (affects Discipline Score)
          </span>
        </div>

        {rules.length === 0 && (
          <p className="text-sm text-surface-400 italic">
            No rules yet. Add your first rule below.
          </p>
        )}

        <div className="flex flex-col gap-2">
          {rules.map((rule, i) => (
            <div key={rule.uid} className="flex items-center gap-2">
              {/* Up/Down */}
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveRule(i, "up")}
                  disabled={i === 0}
                  className="rounded p-0.5 text-surface-400 hover:text-surface-600 disabled:opacity-20"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => moveRule(i, "down")}
                  disabled={i === rules.length - 1}
                  className="rounded p-0.5 text-surface-400 hover:text-surface-600 disabled:opacity-20"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>

              {/* Rule text */}
              <Input
                value={rule.rule_text}
                onChange={(e) => updateRule(i, "rule_text", e.target.value)}
                placeholder={`Rule ${i + 1}...`}
                className="flex-1"
              />

              {/* Required toggle */}
              <button
                type="button"
                onClick={() => updateRule(i, "is_required", !rule.is_required)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  rule.is_required
                    ? "bg-loss-light text-loss-dark hover:bg-loss/20"
                    : "bg-surface-100 text-surface-500 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400"
                }`}
              >
                {rule.is_required ? "Required" : "Optional"}
              </button>

              {/* Delete */}
              <button
                type="button"
                onClick={() => removeRule(i)}
                className="shrink-0 rounded p-1 text-surface-400 hover:text-loss"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" onClick={addRule} className="w-fit">
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/playbooks")}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {submitLabel(saving, !!initial)}
        </Button>
      </div>
    </form>
  );
}
