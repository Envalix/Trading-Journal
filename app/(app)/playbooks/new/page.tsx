"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PlaybookForm } from "@/components/playbooks/playbook-form";
import { usePlaybooks } from "@/hooks/use-playbooks";

export default function NewPlaybookPage() {
  const { createPlaybook } = usePlaybooks();

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
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-50">New Playbook</h1>
      </div>

      <div className="mx-auto w-full max-w-2xl">
        <PlaybookForm onSave={createPlaybook} />
      </div>
    </div>
  );
}
