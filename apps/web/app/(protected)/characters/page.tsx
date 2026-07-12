"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";
import { useTranslations } from "next-intl";

type Character = { id: string; name: string; kind: "pc" | "npc"; status: string; sheetLabel: string | null; campaignId: string | null; nex: number };
type Campaign = { id: string; ownerUserId: string | null; members?: Array<{ userId: string; role: string }> };
type AuthUser = { id: string };

const characterStatuses = new Set(["active", "draft", "archived", "inactive"]);

export default function CharactersPage() {
  const t = useTranslations("characters");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [canManageNpcs, setCanManageNpcs] = useState(false);
  const [loading, setLoading] = useState(true);
  const apiUrl = getBrowserApiUrl();

  useEffect(() => {
    void Promise.all([
      apiFetch(`${apiUrl}/characters`),
      apiFetch(`${apiUrl}/campaigns`),
      apiFetch(`${apiUrl}/auth/me`),
    ]).then(async ([charactersResponse, campaignsResponse, userResponse]) => {
      if (charactersResponse.ok) setCharacters(await charactersResponse.json());
      if (campaignsResponse.ok && userResponse.ok) {
        const user = await userResponse.json() as AuthUser;
        const campaigns = await campaignsResponse.json() as Campaign[];
        const details = await Promise.all(campaigns.map(async (campaign) => {
          const response = await apiFetch(`${apiUrl}/campaigns/${campaign.id}`);
          return response.ok ? response.json() as Promise<Campaign> : campaign;
        }));
        setCanManageNpcs(details.some((campaign) =>
          campaign.ownerUserId === user.id || campaign.members?.some((member) => member.userId === user.id && member.role === "gm"),
        ));
      }
      setLoading(false);
    });
  }, [apiUrl]);

  return <div className="flex flex-1 flex-col gap-6 py-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[0.2em] text-red-500">{t("badge")}</p><h1 className="mt-1 font-serif text-3xl text-zinc-100">{t("title")}</h1><p className="mt-2 text-sm text-zinc-400">{t("description")}</p></div>
      <div className="flex gap-2"><Link href="/characters/new" className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">{t("createPc")}</Link>{canManageNpcs && <Link href="/characters/npc/new" className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900">{t("createNpc")}</Link>}</div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {loading ? <p className="text-sm text-zinc-500">{t("loading")}</p> : characters.map((character) => <Link key={character.id} href={`/characters/${character.id}`} className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-red-900"><div className="flex items-center justify-between"><span className="rounded-full border border-zinc-700 px-2 py-1 text-[10px] uppercase tracking-wider text-zinc-400">{character.kind === "pc" ? t("pc") : t("npc")}</span><span className="text-xs text-zinc-500">{t("nexValue", { value: character.nex })}</span></div><h2 className="mt-4 font-serif text-xl text-zinc-100">{character.name}</h2><p className="mt-1 text-sm text-zinc-500">{character.sheetLabel ?? (character.campaignId ? t("campaignSheet") : t("unassigned"))}</p><p className="mt-4 text-xs uppercase tracking-widest text-zinc-600">{characterStatuses.has(character.status) ? t(`status.${character.status}`) : character.status}</p></Link>)}
    </div>
  </div>;
}
