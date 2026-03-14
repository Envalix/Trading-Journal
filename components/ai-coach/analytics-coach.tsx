"use client";

import { useState } from "react";
import { Bot, Loader2, RefreshCw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";

export function AnalyticsCoach() {
  const [completion, setCompletion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setCompletion("");
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/ai-coach/analyze", { method: "POST" });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Analysis failed");
      }
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setCompletion((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-800 dark:bg-primary-900/20">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-primary-900 dark:text-primary-100">
              AI Trade Coach
            </h2>
            <p className="text-xs text-primary-600 dark:text-primary-400">
              Powered by Claude — analyzes your last 50 trades
            </p>
          </div>
        </div>

        {completion ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAnalyze}
            disabled={isLoading}
            className="text-primary-700 hover:bg-primary-100 dark:text-primary-300"
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Re-analyze
          </Button>
        ) : (
          <Button
            onClick={handleAnalyze}
            disabled={isLoading}
            size="sm"
            className="bg-primary-600 hover:bg-primary-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Get AI Coaching
              </>
            )}
          </Button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && !completion && (
        <div className="flex items-center gap-2 py-4 text-sm text-primary-600 dark:text-primary-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Analyzing your last 50 trades...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-loss-light bg-loss-light/20 px-4 py-3 text-sm text-loss">
          {error}
        </div>
      )}

      {/* Streamed response */}
      {completion && (
        <div className="prose prose-sm max-w-none text-surface-800 dark:prose-invert dark:text-surface-200 [&_h2]:text-primary-800 [&_h2]:dark:text-primary-200 [&_strong]:text-surface-900 [&_strong]:dark:text-surface-50">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{completion}</ReactMarkdown>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !completion && !error && (
        <p className="text-sm text-primary-600 dark:text-primary-400">
          Click &quot;Get AI Coaching&quot; to analyze patterns in your trade history — emotions, discipline scores, and what&apos;s impacting your profitability.
        </p>
      )}
    </div>
  );
}
