"use client";

import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type { TradeInsert } from "@/types/database";

export type CreateTradeInput = Omit<TradeInsert, "user_id">;

export function useCreateTrade() {
  const { user } = useAuth();

  async function createTrade(input: CreateTradeInput) {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("trades")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  return { createTrade };
}
