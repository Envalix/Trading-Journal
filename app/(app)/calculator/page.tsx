"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useAccounts } from "@/hooks/use-accounts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";
import type { Account } from "@/types/database";

const LEVERAGE_PRESETS = [1, 2, 3, 5, 10, 20, 25, 50, 100] as const;
const MARGIN_PCT_PRESETS = [1, 2, 5, 10, 25] as const;
const RISK_PCT_PRESETS = [0.5, 1, 2, 2.5, 5] as const;

interface TpRow {
  id: number;
  price: string;
}

function calcLiquidationPrice(
  entry: number,
  leverage: number,
  direction: "long" | "short"
): number {
  if (leverage <= 0) return 0;
  const pct = 1 / leverage;
  return direction === "long" ? entry * (1 - pct) : entry * (1 + pct);
}

function pctFromEntry(entry: number, price: number, direction: "long" | "short"): number {
  if (entry <= 0) return 0;
  return direction === "long"
    ? ((price - entry) / entry) * 100
    : ((entry - price) / entry) * 100;
}

export default function CalculatorPage() {
  const router = useRouter();
  const { accounts } = useAccounts();

  const [direction, setDirection] = useState<"long" | "short">("long");
  const [marginMode, setMarginMode] = useState<"isolated" | "cross">("isolated");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [capital, setCapital] = useState<string>("");
  const [leverage, setLeverage] = useState<string>("1");
  const [marginSize, setMarginSize] = useState<string>("");
  const [riskTolerance, setRiskTolerance] = useState<string>("");
  const [entryPrice, setEntryPrice] = useState<string>("");
  const [stopLoss, setStopLoss] = useState<string>("");
  const [tps, setTps] = useState<TpRow[]>([{ id: 1, price: "" }]);

  // Auto-fill capital from selected account
  useEffect(() => {
    if (!selectedAccountId) return;
    const acc = accounts.find((a) => a.id === selectedAccountId);
    if (acc) {
      setCapital(String(acc.current_balance - acc.reserved_margin));
    }
  }, [selectedAccountId, accounts]);

  // Auto-select default account
  useEffect(() => {
    const def = accounts.find((a) => a.is_default);
    if (def && !selectedAccountId) setSelectedAccountId(def.id);
  }, [accounts, selectedAccountId]);

  const lev = parseFloat(leverage) || 1;
  const cap = parseFloat(capital) || 0;
  const margin = parseFloat(marginSize) || 0;
  const risk = parseFloat(riskTolerance) || 0;
  const entry = parseFloat(entryPrice) || 0;
  const sl = parseFloat(stopLoss) || 0;

  const positionSize = entry > 0 ? (margin * lev) / entry : 0;
  const slPctFromEntry = sl > 0 && entry > 0 ? pctFromEntry(entry, sl, direction) : null;
  const slDistance = sl > 0 && entry > 0 ? Math.abs(entry - sl) : 0;
  const maxLoss = positionSize > 0 && slDistance > 0 ? positionSize * slDistance : 0;
  const riskPct = cap > 0 && maxLoss > 0 ? (maxLoss / cap) * 100 : 0;
  const liqPrice = entry > 0 && lev > 0 ? calcLiquidationPrice(entry, lev, direction) : 0;
  const exposure = cap > 0 && margin > 0 ? ((margin * lev) / cap) * 100 : 0;

  // Max leverage before liquidation = entry / |entry - SL|
  const maxLeverage = useMemo(() => {
    if (slDistance <= 0 || entry <= 0) return null;
    return Math.floor(entry / slDistance);
  }, [slDistance, entry]);

  // Best safe leverage = risk tolerance / (margin × SL% distance)
  // If margin is set, use it; otherwise calculate from risk tolerance
  const safeLeverage = useMemo(() => {
    if (slDistance <= 0 || entry <= 0) return null;
    const slPct = slDistance / entry;

    // If risk tolerance and margin are both set, derive safe leverage
    if (risk > 0 && margin > 0) {
      const suggested = risk / (margin * slPct);
      return Math.min(Math.max(1, Math.round(suggested)), 125);
    }

    // If only risk tolerance + capital, calculate margin as risk/slPct then derive
    if (risk > 0 && cap > 0) {
      // safeLev such that maxLoss = risk: risk = (margin * safeLev / entry) * slDistance
      // safeLev = risk * entry / (margin * slDistance)
      // Without margin, assume margin = risk (i.e., you risk what you put in)
      const suggested = entry / slDistance; // max theoretical
      return Math.min(Math.max(1, Math.round(suggested)), 125);
    }

    return null;
  }, [risk, slDistance, entry, margin, cap]);

  const isPerfectRisk = maxLoss > 0 && risk > 0 && Math.abs(maxLoss - risk) / risk < 0.02;

  const tpResults = useMemo(
    () =>
      tps.map((tp) => {
        const tpPrice = parseFloat(tp.price) || 0;
        if (tpPrice <= 0 || entry <= 0 || positionSize <= 0) {
          return { profit: 0, rr: null, pct: null };
        }
        const profit =
          direction === "long"
            ? (tpPrice - entry) * positionSize
            : (entry - tpPrice) * positionSize;
        const rr = maxLoss > 0 ? profit / maxLoss : null;
        const pct = pctFromEntry(entry, tpPrice, direction);
        return { profit, rr, pct };
      }),
    [tps, entry, positionSize, direction, maxLoss]
  );

  function addTp() {
    if (tps.length >= 5) return;
    setTps((prev) => [...prev, { id: Date.now(), price: "" }]);
  }

  function removeTp(id: number) {
    setTps((prev) => prev.filter((t) => t.id !== id));
  }

  function updateTp(id: number, price: string) {
    setTps((prev) => prev.map((t) => (t.id === id ? { ...t, price } : t)));
  }

  function applyMarginPct(pct: number) {
    if (cap <= 0) return;
    setMarginSize(((cap * pct) / 100).toFixed(2));
  }

  function applyRiskPct(pct: number) {
    if (cap <= 0) return;
    setRiskTolerance(((cap * pct) / 100).toFixed(2));
  }

  function handleUseSetup() {
    const params = new URLSearchParams({
      direction,
      leverage: String(lev),
      margin_mode: marginMode,
      entry_price: entryPrice,
      stop_loss: stopLoss,
      account_id: selectedAccountId,
    });
    if (positionSize > 0) params.set("quantity", positionSize.toFixed(8));
    if (marginSize) params.set("margin_size", marginSize);
    tps.forEach((tp, i) => {
      if (tp.price) params.set(`tp${i + 1}`, tp.price);
    });
    router.push(`/trades/new?${params.toString()}`);
  }

  const inputCls =
    "w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100";

  const presetBtnCls = (active: boolean) =>
    cn(
      "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
      active
        ? "bg-primary-600 text-white"
        : "bg-surface-100 text-surface-600 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-400 dark:hover:bg-surface-600"
    );

  const toggleCls = (active: boolean) =>
    cn(
      "flex-1 rounded-lg py-2 text-sm font-semibold transition-colors",
      active
        ? "bg-primary-600 text-white shadow"
        : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
    );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-50">
          Position Calculator
        </h1>
        <p className="mt-1 text-sm text-surface-500">
          Calculate position size, risk, and R:R before entering a trade.
        </p>
      </div>

      <div className="space-y-5 rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        {/* Direction + Margin Mode */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Direction</Label>
            <div className="mt-1 flex gap-1 rounded-xl bg-surface-100 p-1 dark:bg-surface-700">
              <button
                type="button"
                onClick={() => setDirection("long")}
                className={cn(
                  toggleCls(direction === "long"),
                  direction === "long" && "bg-profit"
                )}
              >
                Long
              </button>
              <button
                type="button"
                onClick={() => setDirection("short")}
                className={cn(
                  toggleCls(direction === "short"),
                  direction === "short" && "bg-loss"
                )}
              >
                Short
              </button>
            </div>
          </div>
          <div>
            <Label>Margin Mode</Label>
            <div className="mt-1 flex gap-1 rounded-xl bg-surface-100 p-1 dark:bg-surface-700">
              <button
                type="button"
                onClick={() => setMarginMode("isolated")}
                className={toggleCls(marginMode === "isolated")}
              >
                Isolated
              </button>
              <button
                type="button"
                onClick={() => setMarginMode("cross")}
                className={toggleCls(marginMode === "cross")}
              >
                Cross
              </button>
            </div>
          </div>
        </div>

        {/* Account + Capital */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="calc-account">Account</Label>
            <select
              id="calc-account"
              className={inputCls}
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
            >
              <option value="">— No account —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.current_balance - a.reserved_margin)} avail.)
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="calc-capital">Total Capital ($)</Label>
            <input
              id="calc-capital"
              type="number"
              min="0"
              step="any"
              className={inputCls}
              value={capital}
              onChange={(e) => setCapital(e.target.value)}
              placeholder="10000"
            />
          </div>
        </div>

        {/* Leverage */}
        <div>
          <Label>Leverage</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {LEVERAGE_PRESETS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLeverage(String(l))}
                className={presetBtnCls(lev === l)}
              >
                {l}x
              </button>
            ))}
            <input
              type="number"
              min="1"
              max="125"
              step="1"
              className="w-20 rounded-lg border border-surface-300 bg-white px-3 py-1 text-sm text-surface-900 shadow-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-surface-600 dark:bg-surface-700 dark:text-surface-100"
              value={leverage}
              onChange={(e) => setLeverage(e.target.value)}
              placeholder="Custom"
            />
          </div>
          {maxLeverage !== null && (
            <p className="mt-1.5 text-xs text-surface-400">
              Max safe leverage (from SL):{" "}
              <button
                type="button"
                className="font-medium text-primary-600 hover:underline"
                onClick={() => setLeverage(String(maxLeverage))}
              >
                {maxLeverage}x
              </button>
              {safeLeverage !== null && safeLeverage !== maxLeverage && (
                <>
                  {" · "}Risk-adjusted:{" "}
                  <button
                    type="button"
                    className="font-medium text-primary-600 hover:underline"
                    onClick={() => setLeverage(String(safeLeverage))}
                  >
                    {safeLeverage}x
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        {/* Margin Size */}
        <div>
          <Label htmlFor="calc-margin">Margin Size ($)</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {MARGIN_PCT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyMarginPct(p)}
                className={presetBtnCls(false)}
              >
                {p}%
              </button>
            ))}
          </div>
          <input
            id="calc-margin"
            type="number"
            min="0"
            step="any"
            className={cn(inputCls, "mt-2")}
            value={marginSize}
            onChange={(e) => setMarginSize(e.target.value)}
            placeholder="500"
          />
        </div>

        {/* Risk Tolerance */}
        <div>
          <Label htmlFor="calc-risk">Risk Tolerance ($)</Label>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {RISK_PCT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => applyRiskPct(p)}
                className={presetBtnCls(false)}
              >
                {p}%
              </button>
            ))}
          </div>
          <input
            id="calc-risk"
            type="number"
            min="0"
            step="any"
            className={cn(inputCls, "mt-2")}
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(e.target.value)}
            placeholder="100"
          />
        </div>

        {/* Entry + SL */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="calc-entry">Entry Price</Label>
            <input
              id="calc-entry"
              type="number"
              min="0"
              step="any"
              className={inputCls}
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <Label htmlFor="calc-sl">Stop Loss</Label>
            <input
              id="calc-sl"
              type="number"
              min="0"
              step="any"
              className={inputCls}
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="0.00"
            />
            {slPctFromEntry !== null && (
              <p className="mt-1 text-xs text-loss">
                {slPctFromEntry.toFixed(2)}% from entry
              </p>
            )}
          </div>
        </div>

        {/* Take Profits */}
        <div>
          <div className="flex items-center justify-between">
            <Label>Take Profit Levels</Label>
            {tps.length < 5 && (
              <button
                type="button"
                onClick={addTp}
                className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
              >
                <Plus className="h-3 w-3" /> Add TP
              </button>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {tps.map((tp, idx) => {
              const res = tpResults[idx];
              const tpPrice = parseFloat(tp.price) || 0;
              const pct = tpPrice > 0 && entry > 0 ? pctFromEntry(entry, tpPrice, direction) : null;
              return (
                <div key={tp.id} className="flex items-center gap-2">
                  <span className="shrink-0 rounded-md bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                    TP{idx + 1}
                  </span>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className={inputCls}
                      value={tp.price}
                      onChange={(e) => updateTp(tp.id, e.target.value)}
                      placeholder="0.00"
                    />
                    {(pct !== null || res.rr !== null) && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-surface-400">
                        {pct !== null ? `${pct.toFixed(2)}%` : ""}
                        {res.rr !== null ? ` · R:R ${res.rr.toFixed(2)}` : ""}
                      </span>
                    )}
                  </div>
                  {tps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTp(tp.id)}
                      className="shrink-0 rounded p-1 text-surface-400 hover:text-loss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calculated outputs */}
      <div className="rounded-xl border border-surface-200 bg-white p-6 shadow-sm dark:border-surface-700 dark:bg-surface-800">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-surface-500">
          Calculations
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <ResultRow
            label="Position Size"
            value={positionSize > 0 ? positionSize.toFixed(4) : "—"}
          />
          <ResultRow
            label="Max Loss"
            value={maxLoss > 0 ? formatCurrency(maxLoss) : "—"}
            valueClass={maxLoss > 0 ? "text-loss" : undefined}
          />
          <ResultRow
            label="Risk % of Capital"
            value={riskPct > 0 ? `${riskPct.toFixed(2)}%` : "—"}
            valueClass={
              riskPct > 5 ? "text-loss" : riskPct > 2 ? "text-yellow-600" : "text-profit"
            }
          />
          <ResultRow
            label="Liquidation Price"
            value={liqPrice > 0 ? formatCurrency(liqPrice) : "—"}
            valueClass="text-loss"
          />
          <ResultRow
            label="Exposure %"
            value={exposure > 0 ? `${exposure.toFixed(1)}%` : "—"}
          />
          {isPerfectRisk && (
            <div className="sm:col-span-2 flex items-center gap-2 rounded-lg bg-profit-light px-3 py-2">
              <span className="text-sm font-semibold text-profit">Perfect Risk</span>
              <span className="text-xs text-profit">Max loss matches risk tolerance</span>
            </div>
          )}
        </div>

        {tpResults.some((r) => r.profit > 0) && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-surface-400">
              Take Profit Estimates
            </p>
            {tpResults.map((res, idx) => {
              if (res.profit <= 0) return null;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-profit-light px-3 py-2"
                >
                  <span className="text-sm font-medium text-profit">TP{idx + 1}</span>
                  <span className="text-sm font-semibold text-profit">
                    +{formatCurrency(res.profit)}
                    {res.rr !== null && (
                      <span className="ml-2 text-xs font-normal">R:R {res.rr.toFixed(2)}</span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Best Safe Leverage — prominent display */}
      {maxLeverage !== null && (
        <div className="rounded-xl border border-surface-200 bg-white p-6 text-center shadow-sm dark:border-surface-700 dark:bg-surface-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-surface-400">
            Max Safe Leverage
          </p>
          <p className="mt-2 text-6xl font-extrabold text-primary-600">
            {maxLeverage}
            <span className="text-2xl font-bold text-surface-400">x</span>
          </p>
          <p className="mt-1 text-xs text-surface-400">
            Based on Entry ({entryPrice}) &amp; Stop Loss ({stopLoss}) — SL distance{" "}
            {slPctFromEntry !== null ? `${Math.abs(slPctFromEntry).toFixed(2)}%` : "—"}
          </p>
          {safeLeverage !== null && safeLeverage !== maxLeverage && (
            <p className="mt-2 text-sm text-surface-500">
              Risk-adjusted suggestion:{" "}
              <button
                type="button"
                className="font-bold text-primary-600 hover:underline"
                onClick={() => setLeverage(String(safeLeverage))}
              >
                {safeLeverage}x
              </button>
            </p>
          )}
          <button
            type="button"
            onClick={() => setLeverage(String(maxLeverage))}
            className="mt-3 rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            Use {maxLeverage}x Leverage
          </button>
        </div>
      )}

      {/* Use Setup button */}
      <div className="flex justify-end">
        <Button
          onClick={handleUseSetup}
          disabled={!entryPrice}
        >
          Use This Setup →
        </Button>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-50 px-3 py-2.5 dark:bg-surface-700/50">
      <span className="text-sm text-surface-500">{label}</span>
      <span className={cn("text-sm font-semibold text-surface-900 dark:text-surface-50", valueClass)}>
        {value}
      </span>
    </div>
  );
}
