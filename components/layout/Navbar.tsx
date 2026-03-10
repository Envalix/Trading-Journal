"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, BookOpen, LayoutDashboard, PlusCircle, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trades", label: "Trades", icon: BookOpen },
  { href: "/trades/new", label: "New Trade", icon: PlusCircle },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-surface-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <BarChart2 className="h-7 w-7 text-primary-600" />
            <span className="text-lg font-bold text-surface-900">Trading Journal</span>
          </div>

          {/* Nav Links */}
          <div className="hidden items-center gap-1 sm:flex">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-50 text-primary-700"
                      : "text-surface-600 hover:bg-surface-100 hover:text-surface-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
