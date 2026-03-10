import type { MarketType } from "@/types/database";

export interface Platform {
  id: string;
  label: string;
  category: "crypto" | "stock" | "forex" | "other";
  supportsLivePairs: boolean;
  defaultMarketType: MarketType;
}

export const PLATFORMS: Platform[] = [
  // Crypto – live pair fetch supported
  { id: "binance",     label: "Binance",             category: "crypto", supportsLivePairs: true,  defaultMarketType: "crypto" },
  { id: "bybit",       label: "Bybit",               category: "crypto", supportsLivePairs: true,  defaultMarketType: "crypto" },
  { id: "mexc",        label: "MEXC",                category: "crypto", supportsLivePairs: true,  defaultMarketType: "crypto" },
  { id: "okx",         label: "OKX",                 category: "crypto", supportsLivePairs: true,  defaultMarketType: "crypto" },
  { id: "kraken",      label: "Kraken",              category: "crypto", supportsLivePairs: true,  defaultMarketType: "crypto" },
  { id: "kucoin",      label: "KuCoin",              category: "crypto", supportsLivePairs: true,  defaultMarketType: "crypto" },
  { id: "bitget",      label: "Bitget",              category: "crypto", supportsLivePairs: true,  defaultMarketType: "crypto" },
  { id: "gate",        label: "Gate.io",             category: "crypto", supportsLivePairs: true,  defaultMarketType: "crypto" },
  // Crypto – no public symbol API
  { id: "coinbase",    label: "Coinbase",            category: "crypto", supportsLivePairs: false, defaultMarketType: "crypto" },
  { id: "htx",         label: "HTX (Huobi)",         category: "crypto", supportsLivePairs: false, defaultMarketType: "crypto" },
  { id: "phemex",      label: "Phemex",              category: "crypto", supportsLivePairs: false, defaultMarketType: "crypto" },
  { id: "bingx",       label: "BingX",               category: "crypto", supportsLivePairs: false, defaultMarketType: "crypto" },
  // Stock brokers
  { id: "ibkr",        label: "Interactive Brokers", category: "stock",  supportsLivePairs: false, defaultMarketType: "stock"  },
  { id: "robinhood",   label: "Robinhood",           category: "stock",  supportsLivePairs: false, defaultMarketType: "stock"  },
  { id: "webull",      label: "Webull",              category: "stock",  supportsLivePairs: false, defaultMarketType: "stock"  },
  { id: "etrade",      label: "E*TRADE",             category: "stock",  supportsLivePairs: false, defaultMarketType: "stock"  },
  { id: "td",          label: "TD Ameritrade",       category: "stock",  supportsLivePairs: false, defaultMarketType: "stock"  },
  // Forex / CFD
  { id: "mt4",         label: "MetaTrader 4",        category: "forex",  supportsLivePairs: false, defaultMarketType: "forex"  },
  { id: "mt5",         label: "MetaTrader 5",        category: "forex",  supportsLivePairs: false, defaultMarketType: "forex"  },
  { id: "ctrader",     label: "cTrader",             category: "forex",  supportsLivePairs: false, defaultMarketType: "forex"  },
  // Other
  { id: "tradingview", label: "TradingView",         category: "other",  supportsLivePairs: false, defaultMarketType: "crypto" },
  { id: "other",       label: "Other",               category: "other",  supportsLivePairs: false, defaultMarketType: "crypto" },
];

export const PLATFORM_GROUPS = [
  { label: "Crypto",       platforms: PLATFORMS.filter((p) => p.category === "crypto") },
  { label: "Stocks",       platforms: PLATFORMS.filter((p) => p.category === "stock")  },
  { label: "Forex / CFD",  platforms: PLATFORMS.filter((p) => p.category === "forex")  },
  { label: "Other",        platforms: PLATFORMS.filter((p) => p.category === "other")  },
];

export function getPlatform(id: string): Platform | undefined {
  return PLATFORMS.find((p) => p.id === id);
}
