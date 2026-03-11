"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type { Account, AccountInsert, AccountUpdate } from "@/types/database";

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at");
    if (err) {
      setError(err.message);
    } else {
      setAccounts(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  async function createAccount(
    data: Omit<AccountInsert, "user_id">
  ): Promise<Account> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    // If this is the first account, make it the default
    const isFirst = accounts.length === 0;
    const insert: AccountInsert = {
      ...data,
      user_id: user.id,
      is_default: isFirst ? true : (data.is_default ?? false),
    };

    const { data: created, error: err } = await supabase
      .from("accounts")
      .insert(insert)
      .select()
      .single();

    if (err) throw new Error(err.message);
    setAccounts((prev) => [...prev, created]);
    return created;
  }

  async function updateAccount(id: string, data: AccountUpdate): Promise<void> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();
    const { data: updated, error: err } = await supabase
      .from("accounts")
      .update(data)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (err) throw new Error(err.message);
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }

  async function deleteAccount(id: string): Promise<void> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    // Check for open trades linked to this account
    const { count, error: checkErr } = await supabase
      .from("trades")
      .select("id", { count: "exact", head: true })
      .eq("account_id", id)
      .eq("status", "open");

    if (checkErr) throw new Error(checkErr.message);
    if (count && count > 0) {
      throw new Error(
        `Cannot delete account: ${count} open trade(s) are linked to it.`
      );
    }

    const { error: err } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (err) throw new Error(err.message);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }

  async function setDefaultAccount(id: string): Promise<void> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    // Unset all, then set the chosen one
    const { error: unsetErr } = await supabase
      .from("accounts")
      .update({ is_default: false })
      .eq("user_id", user.id);

    if (unsetErr) throw new Error(unsetErr.message);

    const { data: updated, error: setErr } = await supabase
      .from("accounts")
      .update({ is_default: true })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (setErr) throw new Error(setErr.message);

    setAccounts((prev) =>
      prev.map((a) => (a.id === id ? updated : { ...a, is_default: false }))
    );
  }

  return {
    accounts,
    loading,
    error,
    createAccount,
    updateAccount,
    deleteAccount,
    setDefaultAccount,
    refetch: fetchAccounts,
  };
}
