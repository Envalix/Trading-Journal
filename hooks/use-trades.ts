"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type { TradeWithRelations, TradeStatus, TradeDirection } from "@/types/database";

export function useTrades(
  status?: TradeStatus | "all",
  direction?: TradeDirection | "all",
  search?: string
) {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    let query = supabase
      .from("trades")
      .select("*, instruments(*), trade_tags(tags(*))")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);
    if (direction && direction !== "all") query = query.eq("direction", direction);

    const { data, error: err } = await query;

    if (err) {
      setError(err.message);
    } else {
      let result = data as unknown as TradeWithRelations[];
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (t) =>
            t.instruments?.symbol.toLowerCase().includes(q) ||
            t.instruments?.name.toLowerCase().includes(q)
        );
      }
      setTrades(result);
    }
    setLoading(false);
  }, [user, status, direction, search]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return { trades, loading, error, refetch: fetchTrades, setTrades };
}
