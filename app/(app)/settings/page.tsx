"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  Database,
  Download,
  Globe,
  KeyRound,
  Monitor,
  Moon,
  Palette,
  Save,
  Sun,
  Trash2,
  TriangleAlert,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import { useTheme, type Theme } from "@/contexts/theme-context";
import { useProfile } from "@/hooks/use-profile";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { SettingItem, SettingSection } from "@/components/settings/setting-item";
import { PasswordChangeForm } from "@/components/settings/password-change-form";
import { DeleteAccountModal } from "@/components/settings/delete-account-modal";
import { ClearTradesModal } from "@/components/settings/clear-trades-modal";
import { MARKET_TYPE_LABELS } from "@/constants/instruments";
import { cn } from "@/lib/utils";

const CURRENCIES = [
  { value: "USD", label: "USD \u2014 US Dollar" },
  { value: "EUR", label: "EUR \u2014 Euro" },
  { value: "GBP", label: "GBP \u2014 British Pound" },
  { value: "JPY", label: "JPY \u2014 Japanese Yen" },
  { value: "AUD", label: "AUD \u2014 Australian Dollar" },
  { value: "CAD", label: "CAD \u2014 Canadian Dollar" },
  { value: "CHF", label: "CHF \u2014 Swiss Franc" },
  { value: "LKR", label: "LKR \u2014 Sri Lankan Rupee" },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Colombo",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
];

const NUMBER_FORMATS = [
  { value: "1,234.56", label: "1,234.56 (US/UK)" },
  { value: "1.234,56", label: "1.234,56 (EU)" },
];

const DASHBOARD_PERIODS = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

function useLocalPref<T>(key: string, defaultValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? (JSON.parse(stored) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });
  function set(v: T) {
    setValue(v);
    localStorage.setItem(key, JSON.stringify(v));
  }
  return [value, set];
}

type SettingsTab = "trading" | "display" | "account" | "data";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "trading", label: "Trading", icon: Globe },
  { id: "display", label: "Display", icon: Palette },
  { id: "account", label: "Account", icon: User },
  { id: "data", label: "Data", icon: Database },
];

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function SaveBadge({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs",
        status === "saving" && "text-surface-400",
        status === "saved" && "text-profit",
        status === "error" && "text-loss"
      )}
    >
      {status === "saving" && (
        <>
          <Save className="h-3 w-3 animate-pulse" /> Saving...
        </>
      )}
      {status === "saved" && (
        <>
          <CheckCircle className="h-3 w-3" /> Saved
        </>
      )}
      {status === "error" && "Save failed"}
    </span>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("trading");
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { profile, loading, saveStatus, updateField, saveNow } = useProfile();
  const { toast } = useToast();

  const [defaultMarket, setDefaultMarket] = useLocalPref<string>("pref_market", "all");
  const [weekStart, setWeekStart] = useLocalPref<string>("pref_week_start", "monday");
  const [dateFormat, setDateFormat] = useLocalPref<string>("pref_date_format", "MM/DD/YYYY");
  const [numberFormat, setNumberFormat] = useLocalPref<string>("pref_number_format", "1,234.56");
  const [dashboardPeriod, setDashboardPeriod] = useLocalPref<string>("pref_dashboard_period", "month");

  const [displayName, setDisplayName] = useState("");
  const [nameEdited, setNameEdited] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [clearModal, setClearModal] = useState(false);
  const [tradeCount, setTradeCount] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (profile && !nameEdited) setDisplayName(profile.full_name ?? "");
  }, [profile, nameEdited]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("trades")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setTradeCount(count ?? 0));
  }, [user]);

  function handleThemeChange(t: Theme) {
    setTheme(t);
    updateField({ theme: t });
  }

  async function saveName() {
    await saveNow({ full_name: displayName.trim() || null });
    setNameEdited(false);
    toast("Display name updated.", "success");
  }

  async function handleExportAll() {
    if (!user) return;
    setExportLoading(true);
    const supabase = createClient();
    const [tradesRes, tagsRes, instrumentsRes] = await Promise.all([
      supabase.from("trades").select("*, trade_tags(tag_id), trade_images(*)").eq("user_id", user.id),
      supabase.from("tags").select("*").eq("user_id", user.id),
      supabase.from("instruments").select("*").eq("user_id", user.id).eq("is_system", false),
    ]);
    const exportData = {
      exported_at: new Date().toISOString(),
      version: "1.0",
      trades: tradesRes.data ?? [],
      tags: tagsRes.data ?? [],
      custom_instruments: instrumentsRes.data ?? [],
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trading_journal_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportLoading(false);
    toast("Export complete.", "success");
  }

  async function handleExportCSV() {
    if (!user) return;
    const { exportToCSV } = await import("@/lib/trade-filters");
    const supabase = createClient();
    const { data } = await supabase
      .from("trades")
      .select("*, instruments(*), trade_tags(tags(*))")
      .eq("user_id", user.id);
    if (data) exportToCSV(data as unknown as Parameters<typeof exportToCSV>[0]);
  }

  if (loading) {
    return (
      <div className="max-w-3xl space-y-4">
        <div className="h-8 w-24 animate-pulse rounded-lg bg-surface-200" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-100" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">Settings</h1>
          <p className="mt-0.5 text-sm text-surface-500">Manage your account and preferences</p>
        </div>
        <SaveBadge status={saveStatus} />
      </div>

      <div className="flex gap-1 rounded-xl border border-surface-200 bg-surface-50 p-1 dark:border-surface-700 dark:bg-surface-800">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              tab === id
                ? "bg-white text-surface-900 shadow-sm dark:bg-surface-700 dark:text-surface-100"
                : "text-surface-500 hover:text-surface-700 dark:text-surface-400 dark:hover:text-surface-200"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === "trading" && (
        <div className="space-y-4">
          <SettingSection title="Trading Preferences">
            <SettingItem label="Default Currency" description="Used for displaying P&L values across the app">
              <Select
                value={profile?.default_currency ?? "USD"}
                onChange={(v) => updateField({ default_currency: v })}
                options={CURRENCIES}
              />
            </SettingItem>
            <SettingItem label="Default Market Type" description="Pre-selected when logging a new trade">
              <Select
                value={defaultMarket}
                onChange={setDefaultMarket}
                options={[
                  { value: "all", label: "No default" },
                  ...Object.entries(MARKET_TYPE_LABELS).map(([v, label]) => ({ value: v, label })),
                ]}
              />
            </SettingItem>
            <SettingItem label="Timezone" description="Used for date and time display">
              <Select
                value={profile?.timezone ?? "UTC"}
                onChange={(v) => updateField({ timezone: v })}
                options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
              />
            </SettingItem>
            <SettingItem label="Week Start Day" description="Affects weekly statistics grouping">
              <Select
                value={weekStart}
                onChange={setWeekStart}
                options={[
                  { value: "monday", label: "Monday" },
                  { value: "sunday", label: "Sunday" },
                ]}
              />
            </SettingItem>
          </SettingSection>
        </div>
      )}

      {tab === "display" && (
        <div className="space-y-4">
          <SettingSection title="Appearance">
            <SettingItem label="Theme" description="Choose how the app looks">
              <div className="flex gap-2">
                {([
                  { value: "light" as const, label: "Light", icon: Sun },
                  { value: "dark" as const, label: "Dark", icon: Moon },
                  { value: "system" as const, label: "System", icon: Monitor },
                ]).map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value)}
                    className={cn(
                      "flex flex-1 flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-medium transition-colors",
                      theme === value
                        ? "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                        : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50 dark:border-surface-600 dark:text-surface-400 dark:hover:bg-surface-700"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {label}
                  </button>
                ))}
              </div>
            </SettingItem>
          </SettingSection>

          <SettingSection title="Formatting">
            <SettingItem label="Date Format" description="How dates are displayed throughout the app">
              <Select value={dateFormat} onChange={setDateFormat} options={DATE_FORMATS} />
            </SettingItem>
            <SettingItem label="Number Format" description="Decimal and thousands separator style">
              <Select value={numberFormat} onChange={setNumberFormat} options={NUMBER_FORMATS} />
            </SettingItem>
            <SettingItem label="Dashboard Default Period" description="Time period shown when you open the dashboard">
              <Select value={dashboardPeriod} onChange={setDashboardPeriod} options={DASHBOARD_PERIODS} />
            </SettingItem>
          </SettingSection>

          <SettingSection title="Notifications (Coming Soon)">
            <SettingItem label="Email Notifications" description="Receive weekly performance summaries">
              <div className="flex justify-end">
                <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-500 dark:bg-surface-700">Coming soon</span>
              </div>
            </SettingItem>
            <SettingItem label="Browser Notifications" description="Alerts for open trades and price targets">
              <div className="flex justify-end">
                <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-500 dark:bg-surface-700">Coming soon</span>
              </div>
            </SettingItem>
          </SettingSection>
        </div>
      )}

      {tab === "account" && (
        <div className="space-y-4">
          <SettingSection title="Profile">
            <SettingItem label="Email Address" description="Used for login">
              <input
                type="email"
                value={user?.email ?? ""}
                readOnly
                className="w-full rounded-lg border border-surface-200 bg-surface-50 px-3 py-2 text-sm text-surface-500 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-400"
              />
            </SettingItem>
            <SettingItem label="Display Name" description="Shown in your profile and exports" stacked>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setNameEdited(true); }}
                  placeholder="Your name"
                  className="flex-1 rounded-lg border border-surface-300 px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
                />
                {nameEdited && (
                  <Button size="sm" onClick={saveName}>
                    <Save className="h-4 w-4" /> Save
                  </Button>
                )}
              </div>
            </SettingItem>
          </SettingSection>

          <SettingSection title="Security">
            {showPasswordForm ? (
              <div className="py-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-surface-800 dark:text-surface-200">Change Password</p>
                  <button onClick={() => setShowPasswordForm(false)} className="text-xs text-surface-400 hover:text-surface-600">Cancel</button>
                </div>
                <PasswordChangeForm
                  onSuccess={() => { setShowPasswordForm(false); toast("Password updated successfully.", "success"); }}
                />
              </div>
            ) : (
              <SettingItem label="Password" description="Update your account password">
                <Button variant="secondary" size="sm" onClick={() => setShowPasswordForm(true)} className="w-full">
                  <KeyRound className="h-4 w-4" /> Change Password
                </Button>
              </SettingItem>
            )}
          </SettingSection>

          <div className="rounded-xl border border-loss/40 bg-loss-light/30 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-loss">Danger Zone</p>
                <p className="mt-0.5 text-xs text-loss/80">Permanently delete your account and all data. This cannot be undone.</p>
              </div>
              <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)} className="flex-shrink-0">
                <Trash2 className="h-4 w-4" /> Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}

      {tab === "data" && (
        <div className="space-y-4">
          <SettingSection title="Export Data">
            <SettingItem label="Export All Data" description="Download all trades, tags, and instruments as JSON">
              <Button variant="secondary" size="sm" onClick={handleExportAll} loading={exportLoading} className="w-full">
                <Download className="h-4 w-4" /> Export JSON
              </Button>
            </SettingItem>
            <SettingItem label="Export Trades (CSV)" description="Download trades in spreadsheet-compatible format">
              <Button variant="secondary" size="sm" onClick={handleExportCSV} className="w-full">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </SettingItem>
          </SettingSection>

          <SettingSection title="Import Data">
            <SettingItem label="Import from JSON" description="Restore from a previous export">
              <div className="flex justify-end">
                <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-surface-500 dark:bg-surface-700">Coming soon</span>
              </div>
            </SettingItem>
          </SettingSection>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800/40 dark:bg-yellow-900/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <TriangleAlert className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Clear All Trades</p>
                </div>
                <p className="mt-0.5 text-xs text-yellow-700 dark:text-yellow-400">
                  {tradeCount > 0
                    ? `Permanently deletes all ${tradeCount} trade${tradeCount !== 1 ? "s" : ""}. Your account and preferences will be kept.`
                    : "You have no trades to clear."}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={tradeCount === 0}
                onClick={() => setClearModal(true)}
                className="flex-shrink-0 border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300"
              >
                <Trash2 className="h-4 w-4" /> Clear Trades
              </Button>
            </div>
          </div>
        </div>
      )}

      <DeleteAccountModal open={deleteModal} onClose={() => setDeleteModal(false)} />
      <ClearTradesModal
        open={clearModal}
        tradeCount={tradeCount}
        onClose={() => setClearModal(false)}
        onSuccess={() => { setTradeCount(0); toast("All trades deleted.", "success"); }}
      />
    </div>
  );
}
