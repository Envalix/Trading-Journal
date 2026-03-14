"use client";

import { useState } from "react";
import { Bot, Loader2, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

interface ChartInspectorProps {
  tradeId: string;
  playbookIds: string[];
  hasImages: boolean;
  savedFeedback: string | null;
}

export function ChartInspector({
  tradeId,
  playbookIds,
  hasImages,
  savedFeedback,
}: ChartInspectorProps) {
  const [feedback, setFeedback] = useState<string | null>(savedFeedback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show if trade has playbooks assigned
  if (playbookIds.length === 0) return null;

  async function handleInspect() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-coach/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trade_id: tradeId }),
      });
      const data = await res.json() as { feedback?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Inspection failed");
      setFeedback(data.feedback ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleReanalyze() {
    setFeedback(null);
    handleInspect();
  }

  return (
    <section className="mt-6 rounded-xl border border-primary-200 bg-primary-50 p-5 shadow-sm dark:border-primary-800 dark:bg-primary-900/20">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
              AI Chart Inspector
            </h2>
            <p className="text-xs text-primary-600 dark:text-primary-400">
              {hasImages
                ? "Analyzes your chart vs. playbook rule compliance"
                : "Evaluates your stated rule compliance (no chart attached)"}
            </p>
          </div>
        </div>

        {feedback ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReanalyze}
            disabled={loading}
            className="text-primary-700 hover:bg-primary-100 dark:text-primary-300"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Re-analyze
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleInspect}
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Inspecting...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Ask AI Coach to Analyze
              </>
            )}
          </Button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-4 text-sm text-primary-600 dark:text-primary-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Reviewing your chart and rule compliance...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-loss-light bg-loss-light/20 px-4 py-3 text-sm text-loss">
          {error}
        </div>
      )}

      {/* AI feedback */}
      {feedback && !loading && (
        <div className="prose prose-sm max-w-none text-surface-800 dark:prose-invert dark:text-surface-200 [&_h2]:text-primary-800 [&_h2]:dark:text-primary-200 [&_strong]:text-surface-900 [&_strong]:dark:text-surface-50">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{feedback}</ReactMarkdown>
        </div>
      )}

      {/* Empty state */}
      {!feedback && !loading && !error && (
        <p className="text-sm text-primary-600 dark:text-primary-400">
          Click &quot;Ask AI Coach to Analyze&quot; to get an objective review of whether your trade entry matched your playbook rules.
        </p>
      )}
    </section>
  );
}
