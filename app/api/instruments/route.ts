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
      const res = await fetch("https://api.binance.com/api/v3/exchangeInfo", {
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      return (data.symbols as BinanceSymbol[])
        .filter((s) => s.status === "TRADING")
        .map((s) => ({
          symbol: s.symbol,
          name: `${s.baseAsset}/${s.quoteAsset}`,
          market_type: "crypto",
        }));
    }

    /* ─── MEXC (same REST v3 format as Binance) ───────────────────── */
    case "mexc": {
      const res = await fetch("https://api.mexc.com/api/v3/exchangeInfo", {
        next: { revalidate: 3600 },
      });
      const data = await res.json();
      return (data.symbols as BinanceSymbol[])
        .filter((s) => s.status === "ENABLED" || s.status === "TRADING")
        .map((s) => ({
          symbol: s.symbol,
          name: `${s.baseAsset}/${s.quoteAsset}`,
          market_type: "crypto",
        }));
    }

    /* ─── Bybit ───────────────────────────────────────────────────── */
    case "bybit": {
      const res = await fetch(
        "https://api.bybit.com/v5/market/instruments-info?category=spot&limit=1000",
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      return ((data.result?.list ?? []) as BybitSymbol[]).map((s) => ({
        symbol: s.symbol,
        name: `${s.baseCoin}/${s.quoteCoin}`,
        market_type: "crypto",
      }));
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
