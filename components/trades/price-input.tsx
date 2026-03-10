import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface PriceInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  prefix?: string;
  error?: string;
}

export const PriceInput = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ prefix = "$", error, className, ...props }, ref) => {
    return (
      <div>
        <div
          className={cn(
            "flex items-center rounded-lg border bg-white shadow-sm transition-colors focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/20",
            error ? "border-loss" : "border-surface-300"
          )}
        >
          <span className="select-none border-r border-surface-200 px-3 py-2 text-sm text-surface-400">
            {prefix}
          </span>
          <input
            ref={ref}
            type="number"
            step="any"
            min="0"
            className="w-full rounded-r-lg bg-transparent px-3 py-2 text-sm text-surface-900 outline-none placeholder:text-surface-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            {...props}
          />
        </div>
        {error && <p className="mt-1 text-xs text-loss">{error}</p>}
      </div>
    );
  }
);

PriceInput.displayName = "PriceInput";
