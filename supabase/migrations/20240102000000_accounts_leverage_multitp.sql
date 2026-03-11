-- accounts table
create table accounts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles (id) on delete cascade,
  name            text not null,
  exchange        text,
  currency        text not null default 'USDT',
  initial_balance decimal(20, 8) not null default 0,
  current_balance decimal(20, 8) not null default 0,
  reserved_margin decimal(20, 8) not null default 0,
  is_default      boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_accounts_user on accounts (user_id);

create trigger trg_accounts_updated_at
  before update on accounts
  for each row execute procedure handle_updated_at();

alter table accounts enable row level security;

create policy "accounts: owner access"
  on accounts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- trade_take_profits table
create table trade_take_profits (
  id           uuid primary key default uuid_generate_v4(),
  trade_id     uuid not null references trades (id) on delete cascade,
  level        int not null check (level between 1 and 5),
  price        decimal(20, 8) not null,
  quantity_pct decimal(5, 2) not null default 100,
  status       text not null default 'pending' check (status in ('pending','hit','cancelled')),
  hit_date     timestamptz,
  created_at   timestamptz not null default now(),
  unique (trade_id, level)
);

create index idx_trade_tps_trade on trade_take_profits (trade_id);

alter table trade_take_profits enable row level security;

create policy "trade_take_profits: owner access"
  on trade_take_profits for all
  using (
    exists (select 1 from trades where trades.id = trade_take_profits.trade_id and trades.user_id = auth.uid())
  )
  with check (
    exists (select 1 from trades where trades.id = trade_take_profits.trade_id and trades.user_id = auth.uid())
  );

-- alter trades table
alter table trades
  add column account_id    uuid references accounts (id) on delete set null,
  add column leverage      decimal(10, 2) not null default 1,
  add column margin_mode   text not null default 'isolated' check (margin_mode in ('isolated','cross'));

create index idx_trades_account on trades (account_id);
