import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            "w-full rounded-lg border px-3 py-2 text-sm text-surface-900 shadow-sm outline-none transition-colors placeholder:text-surface-400",
            "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
            error
              ? "border-loss bg-loss-light/30 focus:border-loss focus:ring-loss/20"
              : "border-surface-300 bg-white hover:border-surface-400",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-loss">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
