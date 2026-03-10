import { cn } from "@/lib/utils";

interface AuthCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ title, description, children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border border-surface-200 bg-white p-8 shadow-sm",
        className
      )}
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-surface-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-surface-500">{description}</p>}
      </div>
      {children}
    </div>
  );
}
