"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type {
  PlaybookWithRules,
  PlaybookRule,
  PlaybookInsert,
  PlaybookRuleInsert,
} from "@/types/database";

export function usePlaybooks() {
  const { user } = useAuth();
  const [playbooks, setPlaybooks] = useState<PlaybookWithRules[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlaybooks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("playbooks")
      .select("*, playbook_rules(*)")
      .eq("user_id", user.id)
      .order("created_at");
    if (err) {
      setError(err.message);
    } else {
      const sorted = (data ?? []).map((p) => ({
        ...p,
        playbook_rules: [...(p.playbook_rules as unknown as PlaybookRule[])].sort(
          (a, b) => a.order_index - b.order_index
        ),
      }));
      setPlaybooks(sorted);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPlaybooks();
  }, [fetchPlaybooks]);

  async function createPlaybook(
    name: string,
    description: string | null,
    rules: Array<{ rule_text: string; is_required: boolean }>
  ): Promise<PlaybookWithRules> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const insert: PlaybookInsert = { user_id: user.id, name, description };
    const { data: created, error: err } = await supabase
      .from("playbooks")
      .insert(insert)
      .select()
      .single();

    if (err) throw new Error(err.message);

    let insertedRules: PlaybookWithRules["playbook_rules"] = [];
    if (rules.length > 0) {
      const ruleInserts: PlaybookRuleInsert[] = rules.map((r, i) => ({
        playbook_id: created.id,
        rule_text: r.rule_text,
        is_required: r.is_required,
        order_index: i,
      }));
      const { data: rulesData, error: rulesErr } = await supabase
        .from("playbook_rules")
        .insert(ruleInserts)
        .select();
      if (rulesErr) throw new Error(rulesErr.message);
      insertedRules = rulesData ?? [];
    }

    const full: PlaybookWithRules = { ...created, playbook_rules: insertedRules };
    setPlaybooks((prev) => [...prev, full]);
    return full;
  }

  async function updatePlaybook(
    id: string,
    name: string,
    description: string | null,
    rules: Array<{ rule_text: string; is_required: boolean }>
  ): Promise<void> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const { data: updated, error: err } = await supabase
      .from("playbooks")
      .update({ name, description })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (err) throw new Error(err.message);

    // Delete old rules and reinsert
    const { error: delErr } = await supabase
      .from("playbook_rules")
      .delete()
      .eq("playbook_id", id);
    if (delErr) throw new Error(delErr.message);

    let newRules: PlaybookWithRules["playbook_rules"] = [];
    if (rules.length > 0) {
      const ruleInserts: PlaybookRuleInsert[] = rules.map((r, i) => ({
        playbook_id: id,
        rule_text: r.rule_text,
        is_required: r.is_required,
        order_index: i,
      }));
      const { data: rulesData, error: rulesErr } = await supabase
        .from("playbook_rules")
        .insert(ruleInserts)
        .select();
      if (rulesErr) throw new Error(rulesErr.message);
      newRules = rulesData ?? [];
    }

    setPlaybooks((prev) =>
      prev.map((p) =>
        p.id === id ? { ...updated, playbook_rules: newRules } : p
      )
    );
  }

  async function deletePlaybook(id: string): Promise<void> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const { error: err } = await supabase
      .from("playbooks")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (err) throw new Error(err.message);
    setPlaybooks((prev) => prev.filter((p) => p.id !== id));
  }

  return {
    playbooks,
    loading,
    error,
    createPlaybook,
    updatePlaybook,
    deletePlaybook,
    refetch: fetchPlaybooks,
  };
}
