"use client";

import Link from "next/link";
import { use } from "react";
import { ChevronLeft } from "lucide-react";
import { PlaybookForm } from "@/components/playbooks/playbook-form";
import { usePlaybooks } from "@/hooks/use-playbooks";

export default function EditPlaybookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { playbooks, loading, updatePlaybook } = usePlaybooks();
  const playbook = playbooks.find((p) => p.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-surface-400">
        Loading...
      </div>
    );
  }

  if (!playbook) {
    return (
      <div className="flex items-center justify-center p-12 text-surface-400">
        Playbook not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Link
          href="/playbooks"
          className="flex items-center gap-1 text-sm text-surface-500 hover:text-surface-900 dark:hover:text-surface-100"
        >
          <ChevronLeft className="h-4 w-4" />
          Playbooks
        </Link>
        <span className="text-surface-300">/</span>
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">
          Edit: {playbook.name}
        </h1>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <PlaybookForm
          initial={playbook}
          onSave={(name, description, rules) =>
            updatePlaybook(id, name, description, rules)
          }
        />
      </div>
    </div>
  );
}
