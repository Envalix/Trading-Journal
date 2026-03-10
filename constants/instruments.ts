import type { Instrument } from "@/types/database";

// Static instrument data mirroring the seed SQL UUIDs.
// Used for client-side display/filtering before live Supabase data is fetched.

export const FOREX_PAIRS: Instrument[] = [
  { id: "00000000-0000-0000-0001-000000000001", user_id: null, symbol: "EUR/USD", name: "Euro / US Dollar",               market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0001-000000000002", user_id: null, symbol: "GBP/USD", name: "British Pound / US Dollar",      market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0001-000000000003", user_id: null, symbol: "USD/JPY", name: "US Dollar / Japanese Yen",       market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0001-000000000004", user_id: null, symbol: "USD/CHF", name: "US Dollar / Swiss Franc",        market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0001-000000000005", user_id: null, symbol: "AUD/USD", name: "Australian Dollar / US Dollar",  market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0001-000000000006", user_id: null, symbol: "USD/CAD", name: "US Dollar / Canadian Dollar",    market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0001-000000000007", user_id: null, symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0001-000000000008", user_id: null, symbol: "EUR/GBP", name: "Euro / British Pound",           market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0001-000000000009", user_id: null, symbol: "EUR/JPY", name: "Euro / Japanese Yen",            market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0001-000000000010", user_id: null, symbol: "GBP/JPY", name: "British Pound / Japanese Yen",  market_type: "forex",   is_system: true, is_favorite: false, created_at: "" },
];

export const CRYPTO_PAIRS: Instrument[] = [
  { id: "00000000-0000-0000-0002-000000000001", user_id: null, symbol: "BTC/USD",  name: "Bitcoin / US Dollar",           market_type: "crypto",  is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0002-000000000002", user_id: null, symbol: "ETH/USD",  name: "Ethereum / US Dollar",          market_type: "crypto",  is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0002-000000000003", user_id: null, symbol: "SOL/USD",  name: "Solana / US Dollar",            market_type: "crypto",  is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0002-000000000004", user_id: null, symbol: "XRP/USD",  name: "Ripple / US Dollar",            market_type: "crypto",  is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0002-000000000005", user_id: null, symbol: "BNB/USD",  name: "Binance Coin / US Dollar",      market_type: "crypto",  is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0002-000000000006", user_id: null, symbol: "ADA/USD",  name: "Cardano / US Dollar",           market_type: "crypto",  is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0002-000000000007", user_id: null, symbol: "DOGE/USD", name: "Dogecoin / US Dollar",          market_type: "crypto",  is_system: true, is_favorite: false, created_at: "" },
];

export const STOCK_INSTRUMENTS: Instrument[] = [
  { id: "00000000-0000-0000-0003-000000000001", user_id: null, symbol: "AAPL",  name: "Apple Inc.",                      market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0003-000000000002", user_id: null, symbol: "MSFT",  name: "Microsoft Corporation",           market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0003-000000000003", user_id: null, symbol: "GOOGL", name: "Alphabet Inc.",                   market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0003-000000000004", user_id: null, symbol: "AMZN",  name: "Amazon.com Inc.",                 market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0003-000000000005", user_id: null, symbol: "TSLA",  name: "Tesla Inc.",                      market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0003-000000000006", user_id: null, symbol: "NVDA",  name: "NVIDIA Corporation",              market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0003-000000000007", user_id: null, symbol: "META",  name: "Meta Platforms Inc.",             market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0003-000000000008", user_id: null, symbol: "SPY",   name: "SPDR S&P 500 ETF",               market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0003-000000000009", user_id: null, symbol: "QQQ",   name: "Invesco QQQ Trust",               market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0003-000000000010", user_id: null, symbol: "IWM",   name: "iShares Russell 2000 ETF",        market_type: "stock",   is_system: true, is_favorite: false, created_at: "" },
];

export const FUTURES_INSTRUMENTS: Instrument[] = [
  { id: "00000000-0000-0000-0004-000000000001", user_id: null, symbol: "ES",  name: "E-mini S&P 500 Futures",            market_type: "futures", is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0004-000000000002", user_id: null, symbol: "NQ",  name: "E-mini NASDAQ-100 Futures",         market_type: "futures", is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0004-000000000003", user_id: null, symbol: "RTY", name: "E-mini Russell 2000 Futures",       market_type: "futures", is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0004-000000000004", user_id: null, symbol: "CL",  name: "Crude Oil Futures",                 market_type: "futures", is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0004-000000000005", user_id: null, symbol: "GC",  name: "Gold Futures",                      market_type: "futures", is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0004-000000000006", user_id: null, symbol: "SI",  name: "Silver Futures",                    market_type: "futures", is_system: true, is_favorite: false, created_at: "" },
  { id: "00000000-0000-0000-0004-000000000007", user_id: null, symbol: "ZB",  name: "30-Year US Treasury Bond Futures",  market_type: "futures", is_system: true, is_favorite: false, created_at: "" },
];

export const ALL_INSTRUMENTS: Instrument[] = [
  ...FOREX_PAIRS,
  ...CRYPTO_PAIRS,
  ...STOCK_INSTRUMENTS,
  ...FUTURES_INSTRUMENTS,
];

export const SETUP_TYPES = [
  "Breakout",
  "Pullback",
  "Trend Following",
  "Reversal",
  "Range",
  "News/Catalyst",
  "Support/Resistance",
  "Moving Average Crossover",
  "RSI Divergence",
  "MACD Crossover",
  "Other",
] as const;

export type SetupType = (typeof SETUP_TYPES)[number];

export const MARKET_TYPE_LABELS: Record<string, string> = {
  stock: "Stocks & ETFs",
  crypto: "Crypto",
  forex: "Forex",
  futures: "Futures",
  options: "Options",
  cfd: "CFD",
};
