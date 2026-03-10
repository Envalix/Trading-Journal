"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/contexts/auth-context";
import type { Instrument, MarketType, UserInstrumentFavorite } from "@/types/database";
import { ALL_INSTRUMENTS } from "@/constants/instruments";

export interface UseInstrumentsReturn {
  instruments: Instrument[];
  favoriteIds: Set<string>;
  loading: boolean;
  error: string | null;
  toggleFavorite: (instrumentId: string) => Promise<void>;
  addCustom: (data: CustomInstrumentData) => Promise<Instrument>;
  updateCustom: (id: string, data: CustomInstrumentData) => Promise<void>;
  deleteCustom: (id: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export interface CustomInstrumentData {
  symbol: string;
  name: string;
  market_type: MarketType;
}

export function useInstruments(): UseInstrumentsReturn {
  const { user } = useAuth();
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();

    const [instrRes, favRes] = await Promise.all([
      supabase
        .from("instruments")
        .select("*")
        .or(`is_system.eq.true,user_id.eq.${user.id}`)
        .order("symbol"),
      supabase
        .from("user_instrument_favorites")
        .select("*")
        .eq("user_id", user.id),
    ]);

    if (instrRes.error) {
      setError(instrRes.error.message);
      // Fall back to static instruments so the app is usable without the seed
      setInstruments(ALL_INSTRUMENTS);
    } else {
      const dbInstruments = instrRes.data ?? [];
      const hasSystemInstruments = dbInstruments.some((i) => i.is_system);
      if (hasSystemInstruments) {
        setInstruments(dbInstruments);
      } else {
        // Seed not yet run — merge static system instruments with any user-added ones
        const customInstruments = dbInstruments.filter((i) => !i.is_system);
        const merged = [
          ...ALL_INSTRUMENTS,
          ...customInstruments,
        ].sort((a, b) => a.symbol.localeCompare(b.symbol));
        setInstruments(merged);
      }
    }

    if (favRes.data) {
      setFavoriteIds(
        new Set((favRes.data as UserInstrumentFavorite[]).map((f) => f.instrument_id))
      );
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  async function toggleFavorite(instrumentId: string) {
    if (!user) return;
    const supabase = createClient();
    const isFav = favoriteIds.has(instrumentId);

    if (isFav) {
      await supabase
        .from("user_instrument_favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("instrument_id", instrumentId);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        next.delete(instrumentId);
        return next;
      });
    } else {
      await supabase
        .from("user_instrument_favorites")
        .insert({ user_id: user.id, instrument_id: instrumentId });
      setFavoriteIds((prev) => new Set([...prev, instrumentId]));
    }
  }

  async function addCustom(data: CustomInstrumentData): Promise<Instrument> {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const { data: inserted, error } = await supabase
      .from("instruments")
      .insert({
        user_id: user.id,
        symbol: data.symbol.toUpperCase().trim(),
        name: data.name.trim(),
        market_type: data.market_type,
        is_system: false,
        is_favorite: false,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    setInstruments((prev) =>
      [...prev, inserted].sort((a, b) => a.symbol.localeCompare(b.symbol))
    );
    return inserted;
  }

  async function updateCustom(id: string, data: CustomInstrumentData) {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const { data: updated, error } = await supabase
      .from("instruments")
      .update({
        symbol: data.symbol.toUpperCase().trim(),
        name: data.name.trim(),
        market_type: data.market_type,
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    setInstruments((prev) =>
      prev.map((i) => (i.id === id ? updated : i))
    );
  }

  async function deleteCustom(id: string) {
    if (!user) throw new Error("Not authenticated");
    const supabase = createClient();

    const { error } = await supabase
      .from("instruments")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);

    setInstruments((prev) => prev.filter((i) => i.id !== id));
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  return {
    instruments,
    favoriteIds,
    loading,
    error,
    toggleFavorite,
    addCustom,
    updateCustom,
    deleteCustom,
    refetch: fetchAll,
  };
}
