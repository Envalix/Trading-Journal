-- ============================================================
-- Trading Journal - Per-user instrument favorites
-- Allows users to favorite system instruments without modifying
-- the shared system rows.
-- ============================================================

create table user_instrument_favorites (
  user_id       uuid not null references profiles (id) on delete cascade,
  instrument_id uuid not null references instruments (id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (user_id, instrument_id)
);

create index idx_uif_user on user_instrument_favorites (user_id);

-- RLS
alter table user_instrument_favorites enable row level security;

create policy "user_instrument_favorites: owner access"
  on user_instrument_favorites for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
