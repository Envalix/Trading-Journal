"use client";

import { AnalyticsCoach } from "@/components/ai-coach/analytics-coach";

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Analytics</h1>
        <p className="mt-1 text-sm text-surface-500">Deep dive into your trading performance</p>
      </div>

      <AnalyticsCoach />
    </div>
  );
}
