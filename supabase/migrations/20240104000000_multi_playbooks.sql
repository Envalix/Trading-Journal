-- Multi-playbook support: replace single trades.playbook_id with a junction table
-- Migration: 20240104000000_multi_playbooks

-- Junction table: one trade can use multiple playbooks
CREATE TABLE trade_playbooks (
  trade_id    UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, playbook_id)
);

ALTER TABLE trade_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON trade_playbooks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM trades WHERE id = trade_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM trades WHERE id = trade_id AND user_id = auth.uid())
  );

-- Remove old single FK column
ALTER TABLE trades DROP COLUMN IF EXISTS playbook_id;
