-- ============================================================
-- Trading Journal - Seed Data
-- Pre-populated system instruments (user_id IS NULL, is_system = TRUE)
-- Run this after the initial migration.
-- ============================================================

insert into instruments (id, user_id, symbol, name, market_type, is_system, is_favorite) values

-- ── Forex Pairs (15) ──────────────────────────────────────
('00000000-0000-0000-0001-000000000001', null, 'EUR/USD', 'Euro / US Dollar',                      'forex', true, false),
('00000000-0000-0000-0001-000000000002', null, 'GBP/USD', 'British Pound / US Dollar',              'forex', true, false),
('00000000-0000-0000-0001-000000000003', null, 'USD/JPY', 'US Dollar / Japanese Yen',               'forex', true, false),
('00000000-0000-0000-0001-000000000004', null, 'AUD/USD', 'Australian Dollar / US Dollar',          'forex', true, false),
('00000000-0000-0000-0001-000000000005', null, 'USD/CHF', 'US Dollar / Swiss Franc',                'forex', true, false),
('00000000-0000-0000-0001-000000000006', null, 'USD/CAD', 'US Dollar / Canadian Dollar',            'forex', true, false),
('00000000-0000-0000-0001-000000000007', null, 'NZD/USD', 'New Zealand Dollar / US Dollar',         'forex', true, false),
('00000000-0000-0000-0001-000000000008', null, 'EUR/GBP', 'Euro / British Pound',                   'forex', true, false),
('00000000-0000-0000-0001-000000000009', null, 'EUR/JPY', 'Euro / Japanese Yen',                    'forex', true, false),
('00000000-0000-0000-0001-000000000010', null, 'GBP/JPY', 'British Pound / Japanese Yen',           'forex', true, false),
('00000000-0000-0000-0001-000000000011', null, 'AUD/JPY', 'Australian Dollar / Japanese Yen',       'forex', true, false),
('00000000-0000-0000-0001-000000000012', null, 'EUR/AUD', 'Euro / Australian Dollar',               'forex', true, false),
('00000000-0000-0000-0001-000000000013', null, 'GBP/AUD', 'British Pound / Australian Dollar',      'forex', true, false),
('00000000-0000-0000-0001-000000000014', null, 'EUR/CHF', 'Euro / Swiss Franc',                     'forex', true, false),
('00000000-0000-0000-0001-000000000015', null, 'USD/SGD', 'US Dollar / Singapore Dollar',           'forex', true, false),

-- ── Crypto Pairs – USDT (20) ──────────────────────────────
('00000000-0000-0000-0002-000000000001', null, 'BTC/USDT',  'Bitcoin / Tether',                     'crypto', true, false),
('00000000-0000-0000-0002-000000000002', null, 'ETH/USDT',  'Ethereum / Tether',                    'crypto', true, false),
('00000000-0000-0000-0002-000000000003', null, 'BNB/USDT',  'Binance Coin / Tether',                'crypto', true, false),
('00000000-0000-0000-0002-000000000004', null, 'SOL/USDT',  'Solana / Tether',                      'crypto', true, false),
('00000000-0000-0000-0002-000000000005', null, 'XRP/USDT',  'Ripple / Tether',                      'crypto', true, false),
('00000000-0000-0000-0002-000000000006', null, 'ADA/USDT',  'Cardano / Tether',                     'crypto', true, false),
('00000000-0000-0000-0002-000000000007', null, 'DOGE/USDT', 'Dogecoin / Tether',                    'crypto', true, false),
('00000000-0000-0000-0002-000000000008', null, 'DOT/USDT',  'Polkadot / Tether',                    'crypto', true, false),
('00000000-0000-0000-0002-000000000009', null, 'MATIC/USDT','Polygon / Tether',                     'crypto', true, false),
('00000000-0000-0000-0002-000000000010', null, 'LINK/USDT', 'Chainlink / Tether',                   'crypto', true, false),
('00000000-0000-0000-0002-000000000011', null, 'AVAX/USDT', 'Avalanche / Tether',                   'crypto', true, false),
('00000000-0000-0000-0002-000000000012', null, 'ATOM/USDT', 'Cosmos / Tether',                      'crypto', true, false),
('00000000-0000-0000-0002-000000000013', null, 'UNI/USDT',  'Uniswap / Tether',                     'crypto', true, false),
('00000000-0000-0000-0002-000000000014', null, 'LTC/USDT',  'Litecoin / Tether',                    'crypto', true, false),
('00000000-0000-0000-0002-000000000015', null, 'FTM/USDT',  'Fantom / Tether',                      'crypto', true, false),
('00000000-0000-0000-0002-000000000016', null, 'NEAR/USDT', 'NEAR Protocol / Tether',               'crypto', true, false),
('00000000-0000-0000-0002-000000000017', null, 'ALGO/USDT', 'Algorand / Tether',                    'crypto', true, false),
('00000000-0000-0000-0002-000000000018', null, 'APT/USDT',  'Aptos / Tether',                       'crypto', true, false),
('00000000-0000-0000-0002-000000000019', null, 'ARB/USDT',  'Arbitrum / Tether',                    'crypto', true, false),
('00000000-0000-0000-0002-000000000020', null, 'OP/USDT',   'Optimism / Tether',                    'crypto', true, false),

-- ── Stocks / ETFs (20) ────────────────────────────────────
('00000000-0000-0000-0003-000000000001', null, 'AAPL',  'Apple Inc.',                               'stock', true, false),
('00000000-0000-0000-0003-000000000002', null, 'TSLA',  'Tesla Inc.',                               'stock', true, false),
('00000000-0000-0000-0003-000000000003', null, 'MSFT',  'Microsoft Corporation',                    'stock', true, false),
('00000000-0000-0000-0003-000000000004', null, 'GOOGL', 'Alphabet Inc.',                            'stock', true, false),
('00000000-0000-0000-0003-000000000005', null, 'AMZN',  'Amazon.com Inc.',                          'stock', true, false),
('00000000-0000-0000-0003-000000000006', null, 'META',  'Meta Platforms Inc.',                      'stock', true, false),
('00000000-0000-0000-0003-000000000007', null, 'NVDA',  'NVIDIA Corporation',                       'stock', true, false),
('00000000-0000-0000-0003-000000000008', null, 'AMD',   'Advanced Micro Devices Inc.',              'stock', true, false),
('00000000-0000-0000-0003-000000000009', null, 'NFLX',  'Netflix Inc.',                             'stock', true, false),
('00000000-0000-0000-0003-000000000010', null, 'DIS',   'The Walt Disney Company',                  'stock', true, false),
('00000000-0000-0000-0003-000000000011', null, 'BA',    'Boeing Company',                           'stock', true, false),
('00000000-0000-0000-0003-000000000012', null, 'JPM',   'JPMorgan Chase & Co.',                     'stock', true, false),
('00000000-0000-0000-0003-000000000013', null, 'V',     'Visa Inc.',                                'stock', true, false),
('00000000-0000-0000-0003-000000000014', null, 'MA',    'Mastercard Incorporated',                  'stock', true, false),
('00000000-0000-0000-0003-000000000015', null, 'WMT',   'Walmart Inc.',                             'stock', true, false),
('00000000-0000-0000-0003-000000000016', null, 'KO',    'The Coca-Cola Company',                    'stock', true, false),
('00000000-0000-0000-0003-000000000017', null, 'PFE',   'Pfizer Inc.',                              'stock', true, false),
('00000000-0000-0000-0003-000000000018', null, 'JNJ',   'Johnson & Johnson',                        'stock', true, false),
('00000000-0000-0000-0003-000000000019', null, 'XOM',   'Exxon Mobil Corporation',                  'stock', true, false),
('00000000-0000-0000-0003-000000000020', null, 'INTC',  'Intel Corporation',                        'stock', true, false),

-- ── Futures ────────────────────────────────────────────────
('00000000-0000-0000-0004-000000000001', null, 'ES',  'E-mini S&P 500 Futures',                     'futures', true, false),
('00000000-0000-0000-0004-000000000002', null, 'NQ',  'E-mini NASDAQ-100 Futures',                  'futures', true, false),
('00000000-0000-0000-0004-000000000003', null, 'RTY', 'E-mini Russell 2000 Futures',                'futures', true, false),
('00000000-0000-0000-0004-000000000004', null, 'CL',  'Crude Oil Futures',                          'futures', true, false),
('00000000-0000-0000-0004-000000000005', null, 'GC',  'Gold Futures',                               'futures', true, false),
('00000000-0000-0000-0004-000000000006', null, 'SI',  'Silver Futures',                             'futures', true, false),
('00000000-0000-0000-0004-000000000007', null, 'ZB',  '30-Year US Treasury Bond Futures',           'futures', true, false)

on conflict (id) do nothing;
