"use client";

import { type FormEvent, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";

type InventoryItem = {
  id: string;
  name: string;
  quantity: number;
  spacePerUnit: number;
  totalSpace: number;
  isEquipped: boolean;
  visibleNotes: string | null;
  gmNotes?: string | null;
};
export type CampaignInventory = {
  load: {
    capacity: number;
    used: number;
    excess: number;
    isOverloaded: boolean;
  };
  items: InventoryItem[];
};
type CatalogItem = {
  id: string;
  name: string;
  kind: "item" | "document";
  space: number;
};

export function CampaignInventoryPanel({
  characterId,
  inventory,
  canManage,
  isHistorical,
  onChanged,
}: {
  characterId: string;
  inventory: CampaignInventory;
  canManage: boolean;
  isHistorical: boolean;
  onChanged: () => Promise<void>;
}) {
  const apiUrl = getBrowserApiUrl();
  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [form, setForm] = useState({
    sourceItemId: "",
    name: "",
    spacePerUnit: 0,
    quantity: 1,
    isEquipped: false,
    visibleNotes: "",
    gmNotes: "",
  });
  const [error, setError] = useState("");
  useEffect(() => {
    if (!canManage) return;
    void apiFetch(`${apiUrl}/items`).then(async (response) =>
      setCatalog(
        response.ok
          ? ((await response.json()) as CatalogItem[]).filter(
              (item) => item.kind === "item",
            )
          : [],
      ),
    );
  }, [apiUrl, canManage]);
  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    const shared = {
      quantity: form.quantity,
      isEquipped: form.isEquipped,
      visibleNotes: form.visibleNotes || null,
      gmNotes: form.gmNotes || null,
    };
    const payload =
      mode === "catalog"
        ? { sourceItemId: form.sourceItemId, ...shared }
        : { name: form.name, spacePerUnit: form.spacePerUnit, ...shared };
    const response = await apiFetch(
      `${apiUrl}/characters/${characterId}/inventory`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      setError("Não foi possível salvar o item.");
      return;
    }
    setForm({
      sourceItemId: "",
      name: "",
      spacePerUnit: 0,
      quantity: 1,
      isEquipped: false,
      visibleNotes: "",
      gmNotes: "",
    });
    await onChanged();
  }
  async function remove(id: string) {
    if (!window.confirm("Remover este item?")) return;
    const response = await apiFetch(
      `${apiUrl}/characters/${characterId}/inventory/${id}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setError("Não foi possível remover o item.");
      return;
    }
    await onChanged();
  }
  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <div>
        <h2 className="font-serif text-xl text-zinc-100">Itens</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Carga: {inventory.load.used} / {inventory.load.capacity}
        </p>
        {inventory.load.isOverloaded && (
          <p className="mt-2 rounded border border-amber-700 bg-amber-950/30 p-2 text-sm text-amber-200">
            Sobrecarga: excesso de {inventory.load.excess}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {inventory.items.map((entry) => (
          <article
            key={entry.id}
            className="rounded border border-zinc-800 p-3 text-sm text-zinc-300"
          >
            <div className="flex justify-between gap-2">
              <strong className="text-zinc-100">{entry.name}</strong>
              {canManage && !isHistorical && (
                <button
                  onClick={() => void remove(entry.id)}
                  className="text-xs text-red-300"
                >
                  Remover
                </button>
              )}
            </div>
            <p>
              Quantidade: {entry.quantity} · Espaço: {entry.spacePerUnit} cada (
              {entry.totalSpace} total)
            </p>
            <p>{entry.isEquipped ? "Equipado" : "Não equipado"}</p>
            {entry.visibleNotes && (
              <p className="mt-2 whitespace-pre-wrap">{entry.visibleNotes}</p>
            )}
            {entry.gmNotes !== undefined && (
              <p className="mt-2 border-t border-zinc-800 pt-2 text-amber-200">
                Somente Mestre: {entry.gmNotes || "—"}
              </p>
            )}
          </article>
        ))}
      </div>
      {inventory.items.length === 0 && (
        <p className="text-sm text-zinc-500">Nenhum item no inventário.</p>
      )}
      {isHistorical && canManage && (
        <p className="text-sm text-zinc-500">Inventário somente leitura.</p>
      )}
      {canManage && !isHistorical && (
        <form
          onSubmit={(event) => void submit(event)}
          className="grid gap-2 rounded border border-zinc-800 p-3"
        >
          <div className="flex gap-3 text-sm">
            <label>
              <input
                type="radio"
                checked={mode === "catalog"}
                onChange={() => setMode("catalog")}
              />{" "}
              Item cadastrado
            </label>
            <label>
              <input
                type="radio"
                checked={mode === "custom"}
                onChange={() => setMode("custom")}
              />{" "}
              Entrada avulsa
            </label>
          </div>
          {mode === "catalog" ? (
            <select
              required
              value={form.sourceItemId}
              onChange={(event) =>
                setForm({ ...form, sourceItemId: event.target.value })
              }
              className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
            >
              <option value="">Selecione um item</option>
              {catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.space})
                </option>
              ))}
            </select>
          ) : (
            <>
              <input
                required
                maxLength={200}
                placeholder="Nome"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
              />
              <input
                required
                type="number"
                min="0"
                max="9999"
                step="1"
                value={form.spacePerUnit}
                onChange={(event) =>
                  setForm({ ...form, spacePerUnit: Number(event.target.value) })
                }
                className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
              />
            </>
          )}
          <input
            required
            type="number"
            min="1"
            max="9999"
            step="1"
            value={form.quantity}
            onChange={(event) =>
              setForm({ ...form, quantity: Number(event.target.value) })
            }
            className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
          />
          <label className="text-sm">
            <input
              type="checkbox"
              checked={form.isEquipped}
              onChange={(event) =>
                setForm({ ...form, isEquipped: event.target.checked })
              }
            />{" "}
            Equipado
          </label>
          <input
            maxLength={2000}
            placeholder="Observação visível"
            value={form.visibleNotes}
            onChange={(event) =>
              setForm({ ...form, visibleNotes: event.target.value })
            }
            className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
          />
          <textarea
            maxLength={10000}
            placeholder="Notas privadas (Somente Mestre)"
            value={form.gmNotes}
            onChange={(event) =>
              setForm({ ...form, gmNotes: event.target.value })
            }
            className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
          />
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button className="rounded bg-red-700 px-3 py-2 text-sm text-white">
            Adicionar item
          </button>
        </form>
      )}
    </section>
  );
}
