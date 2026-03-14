import { NextRequest, NextResponse } from "next/server";

export interface ExchangeSymbol {
  symbol: string;
  name: string;
  market_type: "crypto";
}

// Server-side proxy — avoids browser CORS issues with exchange APIs.
// Results are cached for 1 hour via Next.js fetch cache.
export async function GET(req: NextRequest) {
  const platform = req.nextUrl.searchParams.get("platform") ?? "";

  try {
    const symbols = await fetchSymbols(platform);
    return NextResponse.json(symbols, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
    });
  } catch (err) {
    console.error(`[instruments] fetch failed for ${platform}:`, err);
    return NextResponse.json([], { status: 200 });
  }
}

async function fetchSymbols(platform: string): Promise<ExchangeSymbol[]> {
  switch (platform) {
    /* ─── Binance ─────────────────────────────────────────────────── */
    case "binance": {
      const [spotRes, futuresRes] = await Promise.allSettled([
        fetch("https://api.binance.com/api/v3/exchangeInfo", { next: { revalidate: 3600 } }),
        fetch("https://fapi.binance.com/fapi/v1/exchangeInfo", { next: { revalidate: 3600 } }),
      ]);

      const spotSymbols: ExchangeSymbol[] =
        spotRes.status === "fulfilled"
          ? ((await spotRes.value.json()).symbols as BinanceSymbol[])
              .filter((s) => s.status === "TRADING")
              .map((s) => ({ symbol: s.symbol, name: `${s.baseAsset}/${s.quoteAsset}`, market_type: "crypto" as const }))
          : [];

      const futuresSymbols: ExchangeSymbol[] =
        futuresRes.status === "fulfilled"
          ? ((await futuresRes.value.json()).symbols as BinanceFuturesSymbol[])
              .filter((s) => s.status === "TRADING" && s.contractType === "PERPETUAL")
              .map((s) => ({ symbol: s.symbol, name: `${s.baseAsset}/${s.quoteAsset} Perp`, market_type: "crypto" as const }))
          : [];

      // Merge, deduplicate by symbol
      const seen = new Set<string>();
      return [...spotSymbols, ...futuresSymbols].filter((s) => {
        if (seen.has(s.symbol)) return false;
        seen.add(s.symbol);
        return true;
      });
    }

    /* ─── MEXC ────────────────────────────────────────────────────── */
    case "mexc": {
      const res = await fetch("https://contract.mexc.com/api/v1/contract/detail", {
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      return ((data.data ?? []) as MexcContractSymbol[])
        .filter((s) => s.state === 0)
        .map((s) => ({
          symbol: `${s.baseCoin}${s.quoteCoin}_PERP`,
          name: `${s.baseCoin}/${s.quoteCoin} Perp`,
          market_type: "crypto" as const,
        }));
    }

    /* ─── Bybit ───────────────────────────────────────────────────── */
    case "bybit": {
      const [spotRes, linearRes] = await Promise.allSettled([
        fetch("https://api.bybit.com/v5/market/instruments-info?category=spot&limit=1000", { next: { revalidate: 3600 } }),
        fetch("https://api.bybit.com/v5/market/instruments-info?category=linear&limit=1000", { next: { revalidate: 3600 } }),
      ]);

      const spotSymbols: ExchangeSymbol[] =
        spotRes.status === "fulfilled"
          ? ((await spotRes.value.json()).result?.list ?? [] as BybitSymbol[]).map((s: BybitSymbol) => ({
              symbol: s.symbol,
              name: `${s.baseCoin}/${s.quoteCoin}`,
              market_type: "crypto" as const,
            }))
          : [];

      const linearSymbols: ExchangeSymbol[] =
        linearRes.status === "fulfilled"
          ? ((await linearRes.value.json()).result?.list ?? [] as BybitSymbol[])
              .filter((s: BybitSymbol) => s.quoteCoin === "USDT")
              .map((s: BybitSymbol) => ({
                symbol: s.symbol,
                name: `${s.baseCoin}/${s.quoteCoin} Perp`,
                market_type: "crypto" as const,
              }))
          : [];

      const seen = new Set<string>();
      return [...spotSymbols, ...linearSymbols].filter((s) => {
        if (seen.has(s.symbol)) return false;
        seen.add(s.symbol);
        return true;
      });
    }

    /* ─── OKX ─────────────────────────────────────────────────────── */
    case "okx": {
      const res = await fetch(
        "https://www.okx.com/api/v5/public/instruments?instType=SPOT",
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      return ((data.data ?? []) as OkxSymbol[]).map((s) => ({
        symbol: s.instId.replace("-", ""),
        name: s.instId,
        market_type: "crypto",
      }));
    }

    /* ─── Kraken ──────────────────────────────────────────────────── */
    case "kraken": {
      const res = await fetch("https://api.kraken.com/0/public/AssetPairs", {
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      return Object.entries((data.result ?? {}) as Record<string, KrakenPair>).map(
        ([key, val]) => ({
          symbol: key,
          name: val.altname ?? key,
          market_type: "crypto",
        })
      );
    }

    /* ─── KuCoin ──────────────────────────────────────────────────── */
    case "kucoin": {
      const res = await fetch("https://api.kucoin.com/api/v1/symbols", {
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      return ((data.data ?? []) as KucoinSymbol[])
        .filter((s) => s.enableTrading)
        .map((s) => ({
          symbol: s.symbol.replace("-", ""),
          name: s.symbol,
          market_type: "crypto",
        }));
    }

    /* ─── Bitget ──────────────────────────────────────────────────── */
    case "bitget": {
      const res = await fetch(
        "https://api.bitget.com/api/v2/spot/public/symbols",
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      return ((data.data ?? []) as BitgetSymbol[]).map((s) => ({
        symbol: s.symbol,
        name: `${s.baseCoin}/${s.quoteCoin}`,
        market_type: "crypto",
      }));
    }

    /* ─── Gate.io ─────────────────────────────────────────────────── */
    case "gate": {
      const res = await fetch(
        "https://api.gateio.ws/api/v4/spot/currency_pairs",
        { next: { revalidate: 3600 } }
      );
      const data: GatePair[] = await res.json();
      return data.map((s) => ({
        symbol: s.id.replace("_", ""),
        name: `${s.base}/${s.quote}`,
        market_type: "crypto",
      }));
    }

    default:
      return [];
  }
}

// ─── Exchange-specific response types ─────────────────────────────────────────

interface BinanceSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
}

interface BinanceFuturesSymbol {
  symbol: string;
  status: string;
  contractType: string;
  baseAsset: string;
  quoteAsset: string;
}

interface BybitSymbol {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
}

interface OkxSymbol {
  instId: string;
}

interface KrakenPair {
  altname?: string;
}

interface KucoinSymbol {
  symbol: string;
  enableTrading: boolean;
}

interface BitgetSymbol {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
}

interface GatePair {
  id: string;
  base: string;
  quote: string;
}

interface MexcContractSymbol {
  symbol: string;
  baseCoin: string;
  quoteCoin: string;
  state: number; // 0 = active
}
