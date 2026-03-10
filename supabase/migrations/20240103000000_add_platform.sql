-- Add trading platform field to trades
ALTER TABLE trades ADD COLUMN IF NOT EXISTS platform TEXT;

-- Index for filtering trades by platform
CREATE INDEX IF NOT EXISTS idx_trades_platform ON trades (user_id, platform);
