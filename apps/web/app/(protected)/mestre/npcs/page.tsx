"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";
import { useTranslations } from "next-intl";

type Npc = {
  id: string;
  name: string;
  concept: string | null;
  status: string;
  npcMode: string | null;
  campaignId: string | null;
  campaignAttachedAt: string | null;
  campaignName: string | null;
};

export default function MestreNpcsPage() {
  const t = useTranslations("npc");
  const [items, setItems] = useState<Npc[]>([]);
  const [failed, setFailed] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const apiUrl = getBrowserApiUrl();
  async function load() {
    try {
      const response = await apiFetch(`${apiUrl}/characters/npcs`);
      if (!response.ok) {
        setFailed(true);
        return;
      }
      setItems((await response.json()) as Npc[]);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }
  useEffect(() => {
    void load();
  }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  function clearDraftIfMatching(characterId: string) {
    const raw = sessionStorage.getItem("lore-forge:npc-sheet-draft:v1");
    if (!raw) return;
    try {
      if ((JSON.parse(raw) as { id?: string }).id === characterId)
        sessionStorage.removeItem("lore-forge:npc-sheet-draft:v1");
    } catch {
      sessionStorage.removeItem("lore-forge:npc-sheet-draft:v1");
    }
  }
  async function deleteNpc(npc: Npc) {
    if (!window.confirm(t("deleteConfirm", { name: npc.name }))) return;
    setDeletingId(npc.id);
    const response = await apiFetch(`${apiUrl}/characters/${npc.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      clearDraftIfMatching(npc.id);
      setItems((current) => current.filter((item) => item.id !== npc.id));
    } else {
      setError(
        response.status === 409 ? t("deleteAttached") : t("deleteFailed"),
      );
      await load();
    }
    setDeletingId(null);
  }
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 py-4">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-red-500">
            Mestre
          </p>
          <h1 className="font-serif text-3xl text-zinc-100">Fichas de NPC</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Rascunhos, fichas disponíveis, vinculadas e arquivadas.
          </p>
        </div>
        <Link
          href="/characters/npc/new"
          className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white"
        >
          Criar ficha
        </Link>
      </header>
      {error ? (
        <p className="text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      {failed ? (
        <p className="text-red-300">
          Não foi possível carregar as fichas de NPC.
        </p>
      ) : items.length === 0 ? (
        <p className="rounded border border-zinc-800 p-5 text-zinc-400">
          Nenhuma ficha de NPC foi criada.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded border border-zinc-800 bg-zinc-950 p-5"
            >
              <Link href={`/mestre/npcs/${item.id}`}>
                <span className="text-xs text-red-300">
                  {item.status} · {item.campaignName ?? "Sem campanha"}
                </span>
                <h2 className="mt-3 font-serif text-xl text-zinc-100">
                  {item.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  {item.concept || "Sem descrição"}
                </p>
              </Link>
              {!item.campaignId && !item.campaignAttachedAt ? (
                <button
                  type="button"
                  disabled={deletingId === item.id}
                  onClick={() => void deleteNpc(item)}
                  className="mt-4 rounded border border-red-900 px-3 py-2 text-sm text-red-300 disabled:opacity-40"
                >
                  {deletingId === item.id ? t("deleting") : t("delete")}
                </button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
