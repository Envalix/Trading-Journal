-- ============================================================
-- Trading Journal - Initial Schema
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- Enums
-- ============================================================

create type market_type as enum (
  'stock',
  'crypto',
  'forex',
  'futures',
  'options',
  'cfd'
);

create type trade_direction as enum ('long', 'short');

create type trade_status as enum ('open', 'closed');

-- ============================================================
-- Tables
-- ============================================================

-- profiles: one row per auth user
create table profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text not null,
  full_name       text,
  default_currency text not null default 'USD',
  timezone        text not null default 'UTC',
  theme           text not null default 'dark',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- instruments: system defaults (user_id IS NULL) + user-custom
create table instruments (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references profiles (id) on delete cascade,
  symbol      text not null,
  name        text not null,
  market_type market_type not null,
  is_system   boolean not null default false,
  is_favorite boolean not null default false,
  created_at  timestamptz not null default now(),
  constraint  uq_instrument_user_symbol unique (user_id, symbol)
);

-- trades
create table trades (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references profiles (id) on delete cascade,
  instrument_id   uuid not null references instruments (id) on delete restrict,
  direction       trade_direction not null,
  status          trade_status not null default 'open',
  entry_price     decimal(20, 8) not null,
  exit_price      decimal(20, 8),
  quantity        decimal(20, 8) not null,
  stop_loss       decimal(20, 8),
  take_profit     decimal(20, 8),
  fees            decimal(20, 8) not null default 0,
  entry_date      timestamptz not null,
  exit_date       timestamptz,
  pnl             decimal(20, 8),
  pnl_percentage  decimal(10, 4),
  notes_pre       text,
  notes_post      text,
  emotional_state text,
  setup_type      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- trade_images: screenshot attachments per trade
create table trade_images (
  id         uuid primary key default uuid_generate_v4(),
  trade_id   uuid not null references trades (id) on delete cascade,
  image_url  text not null,
  caption    text,
  created_at timestamptz not null default now()
);

-- tags: user-defined labels
create table tags (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles (id) on delete cascade,
  name       text not null,
  color      text not null default '#6366f1',
  created_at timestamptz not null default now(),
  constraint uq_tag_user_name unique (user_id, name)
);

-- trade_tags: many-to-many junction
create table trade_tags (
  trade_id uuid not null references trades (id) on delete cascade,
  tag_id   uuid not null references tags (id) on delete cascade,
  primary key (trade_id, tag_id)
);

-- ============================================================
-- Indexes
-- ============================================================

create index idx_trades_user_id       on trades (user_id);
create index idx_trades_instrument_id on trades (instrument_id);
create index idx_trades_entry_date    on trades (entry_date desc);
create index idx_trades_status        on trades (status);
create index idx_trade_images_trade   on trade_images (trade_id);
create index idx_trade_tags_trade     on trade_tags (trade_id);
create index idx_trade_tags_tag       on trade_tags (tag_id);
create index idx_instruments_user     on instruments (user_id);

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-update updated_at timestamp
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on profiles
  for each row execute procedure handle_updated_at();

create trigger trg_trades_updated_at
  before update on trades
  for each row execute procedure handle_updated_at();

-- Auto-create profile on new auth user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Compute PnL on insert/update of trades
create or replace function compute_trade_pnl()
returns trigger language plpgsql as $$
begin
  if new.exit_price is not null and new.status = 'closed' then
    if new.direction = 'long' then
      new.pnl = (new.exit_price - new.entry_price) * new.quantity - new.fees;
    else
      new.pnl = (new.entry_price - new.exit_price) * new.quantity - new.fees;
    end if;

    if new.entry_price > 0 then
      new.pnl_percentage = (new.pnl / (new.entry_price * new.quantity)) * 100;
    else
      new.pnl_percentage = null;
    end if;
  else
    new.pnl = null;
    new.pnl_percentage = null;
  end if;

  return new;
end;
$$;

create trigger trg_compute_trade_pnl
  before insert or update on trades
  for each row execute procedure compute_trade_pnl();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles     enable row level security;
alter table instruments  enable row level security;
alter table trades       enable row level security;
alter table trade_images enable row level security;
alter table tags         enable row level security;
alter table trade_tags   enable row level security;

-- profiles: users access only their own row
create policy "profiles: owner access"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- instruments: users see system instruments + their own
create policy "instruments: read system and own"
  on instruments for select
  using (is_system = true or auth.uid() = user_id);

create policy "instruments: insert own"
  on instruments for insert
  with check (auth.uid() = user_id and is_system = false);

create policy "instruments: update own"
  on instruments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and is_system = false);

create policy "instruments: delete own"
  on instruments for delete
  using (auth.uid() = user_id and is_system = false);

-- trades: owner access only
create policy "trades: owner access"
  on trades for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- trade_images: owner access via trade ownership
create policy "trade_images: owner access"
  on trade_images for all
  using (
    exists (
      select 1 from trades
      where trades.id = trade_images.trade_id
        and trades.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from trades
      where trades.id = trade_images.trade_id
        and trades.user_id = auth.uid()
    )
  );

-- tags: owner access only
create policy "tags: owner access"
  on tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- trade_tags: owner access via trade ownership
create policy "trade_tags: owner access"
  on trade_tags for all
  using (
    exists (
      select 1 from trades
      where trades.id = trade_tags.trade_id
        and trades.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from trades
      where trades.id = trade_tags.trade_id
        and trades.user_id = auth.uid()
    )
  );
