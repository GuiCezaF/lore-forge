"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";
import { useTranslations } from "next-intl";

type Character = {
  id: string;
  name: string;
  kind: "pc" | "npc";
  status: string;
  campaignId: string | null;
  campaignAttachedAt: string | null;
  nex: number;
};

const characterStatuses = new Set(["active", "draft", "archived", "inactive"]);

export default function CharactersPage() {
  const t = useTranslations("characters");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const apiUrl = getBrowserApiUrl();

  async function load() {
    setError("");
    try {
      const response = await apiFetch(`${apiUrl}/characters`);
      if (!response.ok) {
        setError(t("deleteFailed"));
        return;
      }
      const responseCharacters = (await response.json()) as Character[];
      setCharacters(
        responseCharacters.filter((character) => character.kind === "pc"),
      );
    } catch {
      setError(t("deleteFailed"));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [apiUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearDraftIfMatching(characterId: string) {
    const raw = sessionStorage.getItem("lore-forge:pc-creator-draft:v1");
    if (!raw) return;
    try {
      if ((JSON.parse(raw) as { id?: string }).id === characterId)
        sessionStorage.removeItem("lore-forge:pc-creator-draft:v1");
    } catch {
      sessionStorage.removeItem("lore-forge:pc-creator-draft:v1");
    }
  }
  async function deleteCharacter(character: Character) {
    if (!window.confirm(t("deleteConfirm", { name: character.name }))) return;
    setDeletingId(character.id);
    const response = await apiFetch(`${apiUrl}/characters/${character.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      clearDraftIfMatching(character.id);
      setCharacters((current) =>
        current.filter((item) => item.id !== character.id),
      );
    } else {
      setError(
        response.status === 409 ? t("deleteAttached") : t("deleteFailed"),
      );
      await load();
    }
    setDeletingId(null);
  }

  const renderCharacter = (character: Character) => (
    <article
      key={character.id}
      className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-red-900"
    >
      <Link href={`/characters/${character.id}`}>
        <div className="flex items-center justify-between">
          <span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400">
            {t("pc")}
          </span>
          <span className="text-xs text-zinc-500">
            {t("nexValue", { value: character.nex })}
          </span>
        </div>
        <h2 className="mt-4 font-serif text-xl text-zinc-100">
          {character.name}
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {character.campaignId ? t("campaignSheet") : t("unassigned")}
        </p>
        <p className="mt-4 text-xs uppercase tracking-widest text-zinc-600">
          {characterStatuses.has(character.status)
            ? t(`status.${character.status}`)
            : character.status}
        </p>
      </Link>
      {!character.campaignId && !character.campaignAttachedAt ? (
        <button
          type="button"
          disabled={deletingId === character.id}
          onClick={() => void deleteCharacter(character)}
          className="mt-4 rounded border border-red-900 px-3 py-2 text-sm text-red-300 disabled:opacity-40"
        >
          {deletingId === character.id ? t("deleting") : t("delete")}
        </button>
      ) : null}
    </article>
  );

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-red-500">
            {t("badge")}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-zinc-100">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-zinc-400">{t("description")}</p>
        </div>
        <Link
          href="/characters/new"
          className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
        >
          {t("createPc")}
        </Link>
      </div>
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p className="text-sm text-zinc-500">{t("loading")}</p>
      ) : (
        <section className="grid gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">
            {t("pc")}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {characters.map(renderCharacter)}
          </div>
        </section>
      )}
    </div>
  );
}
