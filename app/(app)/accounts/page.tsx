"use client";

import { useState } from "react";
import { Pencil, Plus, Star, Trash2, Wallet } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";
import { useToast } from "@/contexts/toast-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";
import type { Account, AccountInsert, AccountUpdate } from "@/types/database";

const CURRENCIES = ["USDT", "USD", "EUR", "BTC"] as const;

interface AccountFormData {
  name: string;
  exchange: string;
  currency: string;
  initial_balance: string;
  current_balance: string;
}

const defaultForm: AccountFormData = {
  name: "",
  exchange: "",
  currency: "USDT",
  initial_balance: "0",
  current_balance: "0",
};

function AccountForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: AccountFormData;
  onSubmit: (data: AccountFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState<AccountFormData>(initial);
  const [submitting, setSubmitting] = useState(false);

  function set(key: keyof AccountFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="acc-name" required>
            Account Name
          </Label>
          <input
            id="acc-name"
            className={inputCls}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="My Binance Account"
            required
          />
        </div>
        <div>
          <Label htmlFor="acc-exchange">Exchange</Label>
          <input
            id="acc-exchange"
            className={inputCls}
            value={form.exchange}
            onChange={(e) => set("exchange", e.target.value)}
            placeholder="Binance, Bybit, etc."
          />
        </div>
        <div>
          <Label htmlFor="acc-currency">Currency</Label>
          <select
            id="acc-currency"
            className={inputCls}
            value={form.currency}
            onChange={(e) => set("currency", e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="acc-initial">Initial Balance</Label>
          <input
            id="acc-initial"
            type="number"
            min="0"
            step="any"
            className={inputCls}
            value={form.initial_balance}
            onChange={(e) => set("initial_balance", e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div>
          <Label htmlFor="acc-current">Current Balance</Label>
          <input
            id="acc-current"
            type="number"
            min="0"
            step="any"
            className={inputCls}
            value={form.current_balance}
            onChange={(e) => set("current_balance", e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function AccountCard({
  account,
  onEdit,
  onDelete,
  onSetDefault,
}: {
  account: Account;
  onEdit: (acc: Account) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
}) {
  const available = account.current_balance - account.reserved_margin;

  return (
    <div className="rounded-xl border border-surface-200 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-900/30">
            <Wallet className="h-5 w-5 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-surface-900 dark:text-surface-50">
                {account.name}
              </span>
              {account.is_default && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                  <Star className="h-3 w-3" />
                  Default
                </span>
              )}
            </div>
            {account.exchange && (
              <p className="text-sm text-surface-400 dark:text-surface-500">
                {account.exchange} &middot; {account.currency}
              </p>
            )}
            {!account.exchange && (
              <p className="text-sm text-surface-400 dark:text-surface-500">
                {account.currency}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!account.is_default && (
            <button
              onClick={() => onSetDefault(account.id)}
              title="Set as default"
              className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-300"
            >
              <Star className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(account)}
            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-700 dark:hover:text-surface-300"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(account.id)}
            className="rounded-lg p-1.5 text-surface-400 transition-colors hover:bg-loss-light hover:text-loss dark:hover:bg-loss/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50">
          <p className="text-xs text-surface-400">Initial</p>
          <p className="mt-0.5 text-sm font-semibold text-surface-900 dark:text-surface-50">
            {formatCurrency(account.initial_balance)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50">
          <p className="text-xs text-surface-400">Current</p>
          <p
            className={cn(
              "mt-0.5 text-sm font-semibold",
              account.current_balance >= account.initial_balance
                ? "text-profit"
                : "text-loss"
            )}
          >
            {formatCurrency(account.current_balance)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50">
          <p className="text-xs text-surface-400">Available</p>
          <p className="mt-0.5 text-sm font-semibold text-surface-900 dark:text-surface-50">
            {formatCurrency(available)}
          </p>
        </div>
        <div className="rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-700/50">
          <p className="text-xs text-surface-400">Reserved</p>
          <p className="mt-0.5 text-sm font-semibold text-surface-900 dark:text-surface-50">
            {formatCurrency(account.reserved_margin)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AccountsPage() {
  const { accounts, loading, error, createAccount, updateAccount, deleteAccount, setDefaultAccount } =
    useAccounts();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  async function handleCreate(data: AccountFormData) {
    try {
      const payload: Omit<AccountInsert, "user_id"> = {
        name: data.name.trim(),
        exchange: data.exchange.trim() || null,
        currency: data.currency,
        initial_balance: parseFloat(data.initial_balance) || 0,
        current_balance: parseFloat(data.current_balance) || 0,
      };
      await createAccount(payload);
      toast("Account created.", "success");
      setShowAddForm(false);
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function handleEdit(data: AccountFormData) {
    if (!editingAccount) return;
    try {
      const payload: AccountUpdate = {
        name: data.name.trim(),
        exchange: data.exchange.trim() || null,
        currency: data.currency,
        initial_balance: parseFloat(data.initial_balance) || 0,
        current_balance: parseFloat(data.current_balance) || 0,
      };
      await updateAccount(editingAccount.id, payload);
      toast("Account updated.", "success");
      setEditingAccount(null);
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteAccount(id);
      toast("Account deleted.", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  async function handleSetDefault(id: string) {
    try {
      await setDefaultAccount(id);
      toast("Default account updated.", "success");
    } catch (err) {
      toast((err as Error).message, "error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
            Accounts
          </h1>
          <p className="mt-1 text-sm text-surface-500">
            Manage your trading accounts and track balances.
          </p>
        </div>
        <Button onClick={() => { setShowAddForm(true); setEditingAccount(null); }}>
          <Plus className="h-4 w-4" /> Add Account
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <section className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-surface-500">
            New Account
          </h2>
          <AccountForm
            initial={defaultForm}
            onSubmit={handleCreate}
            onCancel={() => setShowAddForm(false)}
            submitLabel="Create Account"
          />
        </section>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-xl bg-loss-light px-4 py-3 text-sm text-loss">
          {error}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-100 dark:bg-surface-700" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && accounts.length === 0 && !showAddForm && (
        <div className="rounded-xl border border-dashed border-surface-300 bg-white p-12 text-center dark:border-surface-600 dark:bg-surface-800">
          <Wallet className="mx-auto h-10 w-10 text-surface-300 dark:text-surface-600" />
          <p className="mt-3 font-medium text-surface-700 dark:text-surface-300">
            No accounts yet
          </p>
          <p className="mt-1 text-sm text-surface-400">
            Add your first trading account to get started.
          </p>
          <Button className="mt-5" onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4" /> Add Account
          </Button>
        </div>
      )}

      {/* Account cards */}
      {!loading && accounts.map((account) => (
        editingAccount?.id === account.id ? (
          <section
            key={account.id}
            className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800"
          >
            <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-surface-500">
              Edit Account
            </h2>
            <AccountForm
              initial={{
                name: account.name,
                exchange: account.exchange ?? "",
                currency: account.currency,
                initial_balance: String(account.initial_balance),
                current_balance: String(account.current_balance),
              }}
              onSubmit={handleEdit}
              onCancel={() => setEditingAccount(null)}
              submitLabel="Save Changes"
            />
          </section>
        ) : (
          <AccountCard
            key={account.id}
            account={account}
            onEdit={setEditingAccount}
            onDelete={handleDelete}
            onSetDefault={handleSetDefault}
          />
        )
      ))}
    </div>
  );
}
