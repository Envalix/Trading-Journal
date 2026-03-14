-- ============================================================
-- Migration: 20240105000000_add_margin_column.sql
-- Adds additional_margin to trades for isolated margin top-ups.
-- Also replaces the trigger function to include additional_margin
-- in the total margin calculation.
-- ============================================================

alter table trades
  add column additional_margin decimal(20, 8) not null default 0;

-- Replace trigger function: total margin = base + additional_margin
create or replace function sync_account_balance_on_trade()
returns trigger
language plpgsql
security definer
as $$
declare
  v_old_margin    decimal(20, 8);
  v_new_margin    decimal(20, 8);
  v_old_is_open   boolean;
  v_new_is_open   boolean;
  v_old_isolated  boolean;
  v_new_isolated  boolean;
begin

  -- ── Total margin = base margin + additional margin ─────────
  -- isolated: base = (entry_price × quantity) / leverage
  -- cross:    margin tracking skipped entirely
  v_old_margin := case when TG_OP in ('UPDATE', 'DELETE')
    then (OLD.entry_price * OLD.quantity) / nullif(OLD.leverage, 0)
         + coalesce(OLD.additional_margin, 0)
    else 0
  end;
  v_new_margin := case when TG_OP in ('INSERT', 'UPDATE')
    then (NEW.entry_price * NEW.quantity) / nullif(NEW.leverage, 0)
         + coalesce(NEW.additional_margin, 0)
    else 0
  end;
  -- Defensive null-safety if leverage is 0/null
  v_old_margin := coalesce(v_old_margin,
    OLD.entry_price * OLD.quantity + coalesce(OLD.additional_margin, 0));
  v_new_margin := coalesce(v_new_margin,
    NEW.entry_price * NEW.quantity + coalesce(NEW.additional_margin, 0));

  -- ── State flags ─────────────────────────────────────────────
  v_old_is_open  := (TG_OP <> 'INSERT') and (OLD.status = 'open');
  v_new_is_open  := (TG_OP <> 'DELETE') and (NEW.status = 'open');
  v_old_isolated := (TG_OP <> 'INSERT') and (coalesce(OLD.margin_mode, 'isolated') = 'isolated');
  v_new_isolated := (TG_OP <> 'DELETE') and (coalesce(NEW.margin_mode, 'isolated') = 'isolated');

  -- ── DELETE ──────────────────────────────────────────────────
  if TG_OP = 'DELETE' then
    if OLD.status = 'open' and OLD.account_id is not null and v_old_isolated then
      update accounts
        set reserved_margin = greatest(0, reserved_margin - v_old_margin),
            updated_at      = now()
        where id = OLD.account_id;
    end if;
    return OLD;
  end if;

  -- ── INSERT ──────────────────────────────────────────────────
  if TG_OP = 'INSERT' then
    if NEW.status = 'open' and NEW.account_id is not null and v_new_isolated then
      update accounts
        set reserved_margin = reserved_margin + v_new_margin,
            updated_at      = now()
        where id = NEW.account_id;
    end if;
    return NEW;
  end if;

  -- ── UPDATE ──────────────────────────────────────────────────
  -- Step A: Undo old margin + apply PnL if closing
  if v_old_is_open and OLD.account_id is not null then
    update accounts
      set
        reserved_margin = case
          when v_old_isolated
            then greatest(0, reserved_margin - v_old_margin)
          else reserved_margin
        end,
        current_balance = case
          when NEW.status = 'closed' and NEW.pnl is not null
            then current_balance + NEW.pnl
          else current_balance
        end,
        updated_at = now()
      where id = OLD.account_id;
  end if;

  -- Step B: Reserve new margin if trade is (now) open and isolated
  if v_new_is_open and NEW.account_id is not null and v_new_isolated then
    update accounts
      set reserved_margin = reserved_margin + v_new_margin,
          updated_at      = now()
      where id = NEW.account_id;
  end if;

  return NEW;
end;
$$;
