"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useInstruments } from "@/hooks/use-instruments";
import { InstrumentCard } from "@/components/instruments/instrument-card";
import { MarketTypeTabs, type MarketTypeFilter } from "@/components/instruments/market-type-tabs";
import { AddInstrumentModal } from "@/components/instruments/add-instrument-modal";
import { Button } from "@/components/ui/button";
import type { Instrument } from "@/types/database";

export default function InstrumentsPage() {
  const { instruments, favoriteIds, loading, toggleFavorite, addCustom, updateCustom, deleteCustom } =
    useInstruments();

  const [tab, setTab] = useState<MarketTypeFilter>("all");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Instrument | null>(null);

  // Filter instruments
  const filtered = useMemo(() => {
    let list = instruments;
    if (tab !== "all") list = list.filter((i) => i.market_type === tab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q));
    }
    return list;
  }, [instruments, tab, search]);

  // Sort: favorites first, then alphabetical
  const sorted = useMemo(
    () => [
      ...filtered.filter((i) => favoriteIds.has(i.id)),
      ...filtered.filter((i) => !favoriteIds.has(i.id)),
    ],
    [filtered, favoriteIds]
  );

  const existingSymbols = instruments.map((i) => i.symbol);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(instrument: Instrument) {
    setEditing(instrument);
    setModalOpen(true);
  }

  async function handleSave(data: { symbol: string; name: string; market_type: Instrument["market_type"] }) {
    if (editing) {
      await updateCustom(editing.id, data);
    } else {
      await addCustom(data);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this instrument? It cannot be undone.")) return;
    await deleteCustom(id);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Instruments</h1>
          <p className="mt-1 text-sm text-surface-500">
            {instruments.length} instruments · {favoriteIds.size} favorited
          </p>
        </div>
        <Button onClick={openAdd} size="sm" className="shrink-0">
          <Plus className="h-4 w-4" />
          Add Custom
        </Button>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <MarketTypeTabs value={tab} onChange={setTab} />
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol or name…"
            className="w-full rounded-lg border border-surface-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
      </div>

      {/* Instruments grid */}
      {loading ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-100" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-surface-200">
          <p className="text-sm text-surface-400">
            {search ? `No instruments match "${search}"` : "No instruments found"}
          </p>
        </div>
      ) : (
        <>
          {/* Favorites section header */}
          {favoriteIds.size > 0 && !search && (
            <div className="mb-2">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-surface-400">
                Favorites
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {sorted
                  .filter((i) => favoriteIds.has(i.id))
                  .map((instrument) => (
                    <InstrumentCard
                      key={instrument.id}
                      instrument={instrument}
                      isFavorite
                      onToggleFavorite={() => toggleFavorite(instrument.id)}
                      onEdit={!instrument.is_system ? () => openEdit(instrument) : undefined}
                      onDelete={!instrument.is_system ? () => handleDelete(instrument.id) : undefined}
                    />
                  ))}
              </div>

              <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-surface-400">
                All instruments
              </p>
            </div>
          )}

          {/* Main grid */}
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sorted
              .filter((i) => search || !favoriteIds.has(i.id))
              .map((instrument) => (
                <InstrumentCard
                  key={instrument.id}
                  instrument={instrument}
                  isFavorite={favoriteIds.has(instrument.id)}
                  onToggleFavorite={() => toggleFavorite(instrument.id)}
                  onEdit={!instrument.is_system ? () => openEdit(instrument) : undefined}
                  onDelete={!instrument.is_system ? () => handleDelete(instrument.id) : undefined}
                />
              ))}
          </div>
        </>
      )}

      {/* Modal */}
      <AddInstrumentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingInstrument={editing}
        existingSymbols={existingSymbols}
      />
    </div>
  );
}
