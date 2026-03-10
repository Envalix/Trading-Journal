"use client";

import { useEffect, useRef, useState } from "react";
import type { Instrument } from "@/types/database";
import type { ExchangeSymbol } from "@/app/api/instruments/route";

// Exchange instruments use a synthetic ID so the selector can track selection
// without needing a DB row. The form submit resolves this to a real instrument.
const PREFIX = "exchange:";

export function makeExchangeInstrumentId(platform: string, symbol: string): string {
  return `${PREFIX}${platform}:${symbol}`;
}

export function isExchangeInstrumentId(id: string): boolean {
  return id.startsWith(PREFIX);
}

/** Returns { platform, symbol } from a synthetic exchange instrument ID. */
export function parseExchangeInstrumentId(
  id: string
): { platform: string; symbol: string } | null {
  if (!isExchangeInstrumentId(id)) return null;
  const rest = id.slice(PREFIX.length);
  const colon = rest.indexOf(":");
  if (colon === -1) return null;
  return { platform: rest.slice(0, colon), symbol: rest.slice(colon + 1) };
}

function toInstrument(s: ExchangeSymbol, platform: string): Instrument {
  return {
    id: makeExchangeInstrumentId(platform, s.symbol),
    symbol: s.symbol,
    name: s.name,
    market_type: s.market_type,
    is_system: false,
    is_favorite: false,
    user_id: null,
    created_at: "",
  };
}

export function useExchangeInstruments(platform: string | null) {
  const [instruments, setInstruments] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, Instrument[]>>(new Map());

  useEffect(() => {
    if (!platform) {
      setInstruments([]);
      return;
    }

    // Return cached result immediately
    if (cacheRef.current.has(platform)) {
      setInstruments(cacheRef.current.get(platform)!);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/instruments?platform=${platform}`)
      .then((r) => r.json())
      .then((data: ExchangeSymbol[]) => {
        if (cancelled) return;
        const list = data.map((s) => toInstrument(s, platform));
        cacheRef.current.set(platform, list);
        setInstruments(list);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load pairs from exchange.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [platform]);

  return { instruments, loading, error };
}
