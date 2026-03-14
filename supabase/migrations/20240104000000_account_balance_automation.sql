-- ============================================================
-- Migration: 20240104000000_account_balance_automation.sql
-- Auto-update account reserved_margin and current_balance
-- when trades are opened, closed, or deleted.
--
-- Balance model:
--   current_balance  = total balance (free + reserved)
--   reserved_margin  = margin locked in open ISOLATED trades
--   available        = current_balance - reserved_margin  (computed in UI)
--
-- Margin modes:
--   isolated → reserve specific margin per trade
--   cross    → whole account is the pool; skip reserved_margin updates
--              but still apply PnL on close
-- ============================================================

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

  -- ── Compute margin amounts ──────────────────────────────────
  -- Only meaningful for isolated mode; cross mode skips margin tracking.
  v_old_margin := case when TG_OP in ('UPDATE', 'DELETE')
    then (OLD.entry_price * OLD.quantity) / nullif(OLD.leverage, 0)
    else 0
  end;
  v_new_margin := case when TG_OP in ('INSERT', 'UPDATE')
    then (NEW.entry_price * NEW.quantity) / nullif(NEW.leverage, 0)
    else 0
  end;
  -- Defensive: if leverage is 0 or null, fall back to unlevered notional
  v_old_margin := coalesce(v_old_margin, OLD.entry_price * OLD.quantity);
  v_new_margin := coalesce(v_new_margin, NEW.entry_price * NEW.quantity);

  -- ── Determine state flags ───────────────────────────────────
  v_old_is_open  := (TG_OP <> 'INSERT') and (OLD.status = 'open');
  v_new_is_open  := (TG_OP <> 'DELETE') and (NEW.status = 'open');
  v_old_isolated := (TG_OP <> 'INSERT') and (coalesce(OLD.margin_mode, 'isolated') = 'isolated');
  v_new_isolated := (TG_OP <> 'DELETE') and (coalesce(NEW.margin_mode, 'isolated') = 'isolated');

  -- ── DELETE ──────────────────────────────────────────────────
  if TG_OP = 'DELETE' then
    -- Only release reserved_margin for open isolated trades
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
  -- Step A: Undo old account's margin contribution if trade was open.
  --         If trade is now closing, also apply PnL to current_balance.
  --         This applies to both isolated and cross on the PnL side.
  if v_old_is_open and OLD.account_id is not null then
    update accounts
      set
        -- Release reserved_margin only for isolated trades
        reserved_margin = case
          when v_old_isolated
            then greatest(0, reserved_margin - v_old_margin)
          else reserved_margin
        end,
        -- Apply PnL when trade closes (both isolated and cross)
        current_balance = case
          when NEW.status = 'closed' and NEW.pnl is not null
            then current_balance + NEW.pnl
          else current_balance
        end,
        updated_at = now()
      where id = OLD.account_id;
  end if;

  -- Step B: Reserve margin on new account if trade is (now) open and isolated.
  if v_new_is_open and NEW.account_id is not null and v_new_isolated then
    update accounts
      set reserved_margin = reserved_margin + v_new_margin,
          updated_at      = now()
      where id = NEW.account_id;
  end if;

  return NEW;
end;
$$;

-- Drop existing trigger (idempotent)
drop trigger if exists trg_sync_account_balance on trades;

create trigger trg_sync_account_balance
  after insert or update or delete on trades
  for each row
  execute procedure sync_account_balance_on_trade();

-- ── Backfill: sync reserved_margin for existing open isolated trades ──────
-- Recalculates from scratch so it is safe to re-run.
-- Only isolated trades contribute to reserved_margin.
-- Does NOT touch current_balance for historical closed trades
-- (user's manually set balance is assumed to already reflect past PnL).
update accounts a
  set reserved_margin = coalesce(sub.total_margin, 0),
      updated_at      = now()
  from (
    select
      account_id,
      sum((entry_price * quantity) / nullif(leverage, 0)) as total_margin
    from trades
    where status = 'open'
      and account_id is not null
      and coalesce(margin_mode, 'isolated') = 'isolated'
    group by account_id
  ) sub
  where a.id = sub.account_id;
