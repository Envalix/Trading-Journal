import { cn } from "@/lib/utils";

export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-surface-700", className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-loss">*</span>}
    </label>
  );
}
