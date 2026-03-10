"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type { TradeWithRelations } from "@/types/database";

export function useTrade(id: string) {
  const { user } = useAuth();
  const [trade, setTrade] = useState<TradeWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrade = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("trades")
      .select("*, instruments(*), trade_tags(tags(*)), trade_images(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (err) {
      setError(err.message);
    } else {
      setTrade(data as unknown as TradeWithRelations);
    }
    setLoading(false);
  }, [user, id]);

  useEffect(() => {
    fetchTrade();
  }, [fetchTrade]);

  return { trade, loading, error, refetch: fetchTrade, setTrade };
}
