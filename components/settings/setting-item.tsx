import { cn } from "@/lib/utils";

interface SettingItemProps {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Stack label above control instead of side-by-side */
  stacked?: boolean;
}

export function SettingItem({
  label,
  description,
  children,
  className,
  stacked = false,
}: SettingItemProps) {
  return (
    <div
      className={cn(
        "py-5",
        stacked ? "space-y-2" : "flex items-start justify-between gap-8",
        className
      )}
    >
      <div className={stacked ? "" : "flex-1"}>
        <p className="text-sm font-medium text-surface-800 dark:text-surface-200">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">{description}</p>
        )}
      </div>
      <div className={stacked ? "" : "w-56 flex-shrink-0"}>{children}</div>
    </div>
  );
}

export function SettingSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <div className="border-b border-surface-200 px-6 py-4 dark:border-surface-700">
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">{title}</h2>
      </div>
      <div className="divide-y divide-surface-100 px-6 dark:divide-surface-700">{children}</div>
    </div>
  );
}
