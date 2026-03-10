import { BarChart2 } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-50 px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <BarChart2 className="h-8 w-8 text-primary-600" />
        <span className="text-2xl font-bold text-surface-900">Trading Journal</span>
      </div>
      {children}
    </div>
  );
}
