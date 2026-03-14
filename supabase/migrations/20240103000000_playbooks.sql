-- Playbook / Strategy Builder
-- Migration: 20240103000000_playbooks

-- 1. Playbooks table
CREATE TABLE playbooks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Playbook rules
CREATE TABLE playbook_rules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  rule_text   TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT true,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Trade playbook grades (discipline score per trade)
CREATE TABLE trade_playbook_grades (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id    UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  playbook_id UUID NOT NULL REFERENCES playbooks(id) ON DELETE CASCADE,
  grade_score DECIMAL(5,2),
  ai_feedback TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trade_id, playbook_id)
);

-- 4. Individual rule checks per trade
CREATE TABLE trade_rule_checks (
  trade_id    UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  rule_id     UUID NOT NULL REFERENCES playbook_rules(id) ON DELETE CASCADE,
  is_followed BOOLEAN NOT NULL,
  PRIMARY KEY (trade_id, rule_id)
);

-- 5. Add playbook_id to trades
ALTER TABLE trades ADD COLUMN playbook_id UUID REFERENCES playbooks(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbook_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_playbook_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_rule_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner" ON playbooks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "owner" ON playbook_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM playbooks WHERE id = playbook_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM playbooks WHERE id = playbook_id AND user_id = auth.uid())
  );

CREATE POLICY "owner" ON trade_playbook_grades
  FOR ALL USING (
    EXISTS (SELECT 1 FROM trades WHERE id = trade_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM trades WHERE id = trade_id AND user_id = auth.uid())
  );

CREATE POLICY "owner" ON trade_rule_checks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM trades WHERE id = trade_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM trades WHERE id = trade_id AND user_id = auth.uid())
  );

-- Auto-update updated_at on playbooks
CREATE TRIGGER set_playbooks_updated_at
  BEFORE UPDATE ON playbooks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
