"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { BarChart2, BookOpen, Layers, LayoutDashboard, LogOut, PlusCircle, Settings, Tag } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: BookOpen },
  { href: "/trades/new", label: "New Trade", icon: PlusCircle },
  { href: "/instruments", label: "Instruments", icon: Layers },
  { href: "/tags", label: "Tags", icon: Tag },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <aside className="flex w-64 flex-col border-r border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-surface-200 px-6 dark:border-surface-700">
        <BarChart2 className="h-7 w-7 text-primary-600" />
        <span className="text-lg font-bold text-surface-900 dark:text-surface-50">Trading Journal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300"
                  : "text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-100"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-surface-200 p-4 dark:border-surface-700">
        {user && (
          <p className="mb-2 truncate px-3 text-xs text-surface-400 dark:text-surface-500">{user.email}</p>
        )}
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900 dark:text-surface-400 dark:hover:bg-surface-700 dark:hover:text-surface-100"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
