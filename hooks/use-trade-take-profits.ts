"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import type { TradeTakeProfit } from "@/types/database";

export function useTradeTakeProfit(tradeId: string | null) {
  const [tps, setTps] = useState<TradeTakeProfit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTPs = useCallback(async () => {
    if (!tradeId) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("trade_take_profits")
      .select("*")
      .eq("trade_id", tradeId)
      .order("level");

    if (err) {
      setError(err.message);
    } else {
      setTps(data ?? []);
    }
    setLoading(false);
  }, [tradeId]);

  useEffect(() => {
    fetchTPs();
  }, [fetchTPs]);

  async function upsertTPs(
    tid: string,
    items: Array<{ level: number; price: number; quantity_pct: number }>
  ): Promise<void> {
    const supabase = createClient();

    // Delete all existing TPs for this trade, then re-insert
    const { error: delErr } = await supabase
      .from("trade_take_profits")
      .delete()
      .eq("trade_id", tid);

    if (delErr) throw new Error(delErr.message);

    if (items.length === 0) {
      setTps([]);
      return;
    }

    const { data, error: insErr } = await supabase
      .from("trade_take_profits")
      .insert(
        items.map((item) => ({
          trade_id: tid,
          level: item.level,
          price: item.price,
          quantity_pct: item.quantity_pct,
        }))
      )
      .select()
      .order("level");

    if (insErr) throw new Error(insErr.message);
    if (tid === tradeId) setTps(data ?? []);
  }

  async function markTPHit(tpId: string): Promise<void> {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("trade_take_profits")
      .update({ status: "hit", hit_date: new Date().toISOString() })
      .eq("id", tpId)
      .select()
      .single();

    if (err) throw new Error(err.message);
    setTps((prev) => prev.map((tp) => (tp.id === tpId ? data : tp)));
  }

  async function updateSL(tid: string, stopLoss: number | null): Promise<void> {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("trades")
      .update({ stop_loss: stopLoss })
      .eq("id", tid);

    if (err) throw new Error(err.message);
  }

  async function updateTP(
    tpId: string,
    data: { price?: number; quantity_pct?: number }
  ): Promise<void> {
    const supabase = createClient();
    const { data: updated, error: err } = await supabase
      .from("trade_take_profits")
      .update(data)
      .eq("id", tpId)
      .select()
      .single();

    if (err) throw new Error(err.message);
    setTps((prev) => prev.map((tp) => (tp.id === tpId ? updated : tp)));
  }

  async function addTP(
    tid: string,
    item: { level: number; price: number; quantity_pct: number }
  ): Promise<void> {
    const supabase = createClient();
    const { data, error: err } = await supabase
      .from("trade_take_profits")
      .insert({ trade_id: tid, ...item })
      .select()
      .single();

    if (err) throw new Error(err.message);
    if (tid === tradeId) setTps((prev) => [...prev, data].sort((a, b) => a.level - b.level));
  }

  async function deleteTP(tpId: string): Promise<void> {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("trade_take_profits")
      .delete()
      .eq("id", tpId);

    if (err) throw new Error(err.message);
    setTps((prev) => prev.filter((tp) => tp.id !== tpId));
  }

  return {
    tps,
    loading,
    error,
    upsertTPs,
    markTPHit,
    updateSL,
    updateTP,
    addTP,
    deleteTP,
    refetch: fetchTPs,
  };
}
