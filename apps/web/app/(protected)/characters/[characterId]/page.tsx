"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";
import { useTranslations } from "next-intl";

type Character = { id: string; name: string; kind: "pc" | "npc"; status: string; campaignId: string | null; ownerUserId: string | null; sheetLabel: string | null; nex: number; origin: string | null; characterClass: string | null; path: string | null; concept: string | null; skills: Array<{ name: string; degree: "trained" | "veteran" | "expert" }>; powers: Array<{ name: string; rank: number }>; derived: Record<string, number | null> };
type Inventory = { id: string; name: string; quantity: number; isEquipped: boolean; notes: string | null };
type PlayState = { currentHp: number; currentSan: number; currentEp: number; conditions: string; temporaryEffects: string; gmNotes: string | null; inventory: Inventory[] };
type AuthUser = { id: string };
type CampaignDetail = { ownerUserId: string | null; members: Array<{ userId: string; role: "gm" | "player" | "spectator" }> };

const derivedLabels = {
  maxHp: "maxHp",
  maxSan: "maxSan",
  maxEp: "maxEp",
  epLimit: "epLimit",
  defense: "defense",
  dodge: "dodge",
  block: "block",
  movement: "movement",
  carryCapacity: "carryCapacity",
} as const;

const stateLabels = {
  currentHp: "currentHp",
  currentSan: "currentSan",
  currentEp: "currentEp",
} as const;

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("characters");
  const id = String(params.characterId);
  const apiUrl = getBrowserApiUrl();
  const [character, setCharacter] = useState<Character | null>(null);
  const [state, setState] = useState<PlayState | null>(null);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [canManageCampaign, setCanManageCampaign] = useState(false);
  const [item, setItem] = useState({ name: "", quantity: 1, notes: "" });

  async function load() {
    const response = await apiFetch(`${apiUrl}/characters/${id}`);
    if (!response.ok) {
      setError(t("unavailable"));
      return;
    }

    const sheet = await response.json() as Character;
    setCharacter(sheet);
    const meResponse = await apiFetch(`${apiUrl}/auth/me`);
    const me = meResponse.ok ? await meResponse.json() as AuthUser : null;
    setCurrentUser(me);

    if (!sheet.campaignId) return;

    const [play, campaign] = await Promise.all([
      apiFetch(`${apiUrl}/characters/${id}/play-state`),
      apiFetch(`${apiUrl}/campaigns/${sheet.campaignId}`),
    ]);
    if (play.ok) setState(await play.json() as PlayState);
    if (campaign.ok && me) {
      const detail = await campaign.json() as CampaignDetail;
      setCanManageCampaign(
        detail.ownerUserId === me.id || detail.members.some((member) => member.userId === me.id && member.role === "gm"),
      );
    }
  }

  useEffect(() => { void load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveState(event: FormEvent) {
    event.preventDefault();
    if (!state) return;
    const response = await apiFetch(`${apiUrl}/characters/${id}/play-state`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentHp: Number(state.currentHp), currentSan: Number(state.currentSan), currentEp: Number(state.currentEp), conditions: state.conditions, temporaryEffects: state.temporaryEffects }) });
    if (!response.ok) setError(t("ownerState")); else void load();
  }

  async function addItem(event: FormEvent) {
    event.preventDefault();
    const response = await apiFetch(`${apiUrl}/characters/${id}/inventory`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: item.name, quantity: Number(item.quantity), notes: item.notes }) });
    if (!response.ok) { setError(t("gmInventory")); return; }
    setItem({ name: "", quantity: 1, notes: "" });
    void load();
  }

  async function removeItem(inventoryId: string) {
    const response = await apiFetch(`${apiUrl}/characters/${id}/inventory/${inventoryId}`, { method: "DELETE" });
    if (!response.ok) setError(t("gmInventory")); else void load();
  }

  async function copy() {
    const label = window.prompt(t("copyPrompt"), character?.sheetLabel ?? "");
    if (label === null) return;
    const response = await apiFetch(`${apiUrl}/characters/${id}/copy`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sheetLabel: label }) });
    if (response.ok) router.push("/characters"); else setError(t("ownerCopy"));
  }

  async function archive() {
    if (!window.confirm(t("archiveConfirm"))) return;
    const response = await apiFetch(`${apiUrl}/characters/${id}/archive`, { method: "POST" });
    if (response.ok) void load(); else setError(t("ownerArchive"));
  }

  if (!character) return <p className="py-8 text-sm text-zinc-500">{t("loading")} {error}</p>;

  const isOwner = character.ownerUserId === currentUser?.id;
  return <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4"><Link href="/characters" className="text-xs uppercase tracking-widest text-zinc-500">← {t("sheets")}</Link><header className="flex flex-wrap justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-red-400">{character.kind === "pc" ? t("pc") : t("npc")}</p><h1 className="font-serif text-3xl text-zinc-100">{character.name}</h1><p className="mt-1 text-sm text-zinc-500">{character.characterClass ?? t("narrativeNpc")} · {character.path ?? t("noPath")} · {t("nexValue", { value: character.nex })}</p></div>{character.kind === "pc" && isOwner && <div className="flex gap-2"><button onClick={() => void copy()} className="rounded border border-zinc-700 px-3 py-2 text-sm text-zinc-200">{t("copy")}</button>{character.status !== "archived" && <button onClick={() => void archive()} className="rounded border border-red-900 px-3 py-2 text-sm text-red-300">{t("archive")}</button>}</div>}</header>{error && <p className="rounded border border-red-900 bg-red-950/20 p-3 text-sm text-red-200">{error}</p>}<section className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-5 sm:grid-cols-4">{Object.entries(character.derived ?? {}).map(([label, value]) => <div key={label}><p className="text-[10px] uppercase tracking-widest text-zinc-600">{label in derivedLabels ? t(`derived.${derivedLabels[label as keyof typeof derivedLabels]}`) : label}</p><p className="text-lg text-zinc-100">{value ?? t("unavailableValue")}</p></div>)}</section>{character.kind === "pc" && <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5"><h2 className="font-serif text-xl text-zinc-100">{t("skills")}</h2>{character.skills.length ? <ul className="mt-3 space-y-2">{character.skills.map((skill) => <li key={skill.name} className="flex items-center justify-between rounded border border-zinc-800 p-2 text-sm text-zinc-300"><span>{skill.name}</span><span className="text-xs text-zinc-500">{t(`degree.${skill.degree}`)}</span></li>)}</ul> : <p className="mt-3 text-sm text-zinc-500">{t("notSelected")}</p>}</section><section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5"><h2 className="font-serif text-xl text-zinc-100">{t("powers")}</h2>{character.powers.length ? <ul className="mt-3 space-y-2">{character.powers.map((power) => <li key={power.name} className="flex items-center justify-between rounded border border-zinc-800 p-2 text-sm text-zinc-300"><span>{power.name}</span><span className="text-xs text-zinc-500">{t("rank", { rank: power.rank })}</span></li>)}</ul> : <p className="mt-3 text-sm text-zinc-500">{t("noPowersSelected")}</p>}</section></div>}{state && <div className="grid gap-6 lg:grid-cols-2">{isOwner ? <form onSubmit={saveState} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5"><h2 className="font-serif text-xl text-zinc-100">{t("state")}</h2><div className="grid grid-cols-3 gap-3">{(["currentHp", "currentSan", "currentEp"] as const).map(key => <label key={key} className="grid gap-1 text-xs uppercase text-zinc-500">{t(stateLabels[key])}<input type="number" value={state[key]} onChange={e => setState({ ...state, [key]: Number(e.target.value) })} className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white" /></label>)}</div><label className="grid gap-1 text-xs uppercase text-zinc-500">{t("conditions")}<textarea value={state.conditions} onChange={e => setState({ ...state, conditions: e.target.value })} className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white" /></label><label className="grid gap-1 text-xs uppercase text-zinc-500">{t("temporaryEffects")}<textarea value={state.temporaryEffects} onChange={e => setState({ ...state, temporaryEffects: e.target.value })} className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white" /></label><button className="rounded bg-zinc-700 px-3 py-2 text-sm text-white">{t("saveState")}</button></form> : <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-500">{t("ownerState")}</section>}<section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5"><h2 className="font-serif text-xl text-zinc-100">{t("inventory")}</h2><ul className="space-y-2">{state.inventory.map(entry => <li key={entry.id} className="flex items-center justify-between rounded border border-zinc-800 p-2 text-sm text-zinc-300"><span>{entry.name} × {entry.quantity}{entry.notes ? ` — ${entry.notes}` : ""}</span>{canManageCampaign ? <button onClick={() => void removeItem(entry.id)} className="text-xs text-red-300">{t("remove")}</button> : null}</li>)}</ul>{canManageCampaign ? <form onSubmit={addItem} className="grid gap-2"><input required placeholder={t("itemName")} value={item.name} onChange={e => setItem({ ...item, name: e.target.value })} className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white" /><input type="number" min="1" value={item.quantity} onChange={e => setItem({ ...item, quantity: Number(e.target.value) })} className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white" /><input placeholder={t("gmNote")} value={item.notes} onChange={e => setItem({ ...item, notes: e.target.value })} className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white" /><button className="rounded bg-red-700 px-3 py-2 text-sm text-white">{t("addItem")}</button></form> : <p className="text-xs text-zinc-500">{t("gmInventory")}</p>}</section></div>}{!character.campaignId && <p className="rounded border border-zinc-800 p-4 text-sm text-zinc-500">{t("noCampaignState")}</p>}</main>;
}
