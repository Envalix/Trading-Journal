"use client";

import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type { TradeUpdate } from "@/types/database";

export function useUpdateTrade() {
  const { user } = useAuth();

  async function updateTrade(id: string, data: TradeUpdate) {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const { data: updated, error } = await supabase
      .from("trades")
      .update(data)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated;
  }

  async function deleteTrade(id: string) {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const { error } = await supabase
      .from("trades")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
  }

  return { updateTrade, deleteTrade };
}
