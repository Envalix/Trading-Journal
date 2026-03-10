import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthAlertProps {
  type: "error" | "success";
  message: string;
  className?: string;
}

export function AuthAlert({ type, message, className }: AuthAlertProps) {
  const isError = type === "error";
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg px-4 py-3 text-sm",
        isError ? "bg-loss-light text-loss-dark" : "bg-profit-light text-profit-dark",
        className
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <span>{message}</span>
    </div>
  );
}
