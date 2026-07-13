"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";

type Npc = {
  id: string;
  campaignId: string;
  name: string;
  concept: string | null;
  nex: number;
  npcMode: "narrative" | "threat" | null;
  status: string;
};

export default function MestreNpcsPage() {
  const apiUrl = getBrowserApiUrl();
  const [npcs, setNpcs] = useState<Npc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    void apiFetch(`${apiUrl}/characters/npcs`).then(async (response) => {
      if (response.ok) {
        setNpcs(await response.json() as Npc[]);
      } else {
        setHasError(true);
      }
      setIsLoading(false);
    }).catch(() => {
      setHasError(true);
      setIsLoading(false);
    });
  }, [apiUrl]);

  return <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 py-4">
    <Link href="/mestre" className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300">
      <ArrowLeft className="h-3 w-3" /> Voltar ao painel do Mestre
    </Link>
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs uppercase tracking-[0.2em] text-red-500">Mestre</p><h1 className="mt-1 font-serif text-3xl text-zinc-100">NPCs da campanha</h1><p className="mt-2 text-sm text-zinc-400">Apenas NPCs das campanhas que você administra.</p></div>
      <Link href="/characters/npc/new" className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"><Plus className="h-4 w-4" /> Criar NPC</Link>
    </header>
    {isLoading ? <p className="text-sm text-zinc-500">Carregando NPCs…</p> : hasError ? <p className="rounded border border-red-900 bg-red-950/20 p-3 text-sm text-red-200">Não foi possível carregar os NPCs.</p> : npcs.length === 0 ? <p className="rounded border border-zinc-800 p-5 text-sm text-zinc-500">Nenhum NPC foi criado nas suas campanhas.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{npcs.map((npc) => <Link key={npc.id} href={`/characters/${npc.id}`} className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 transition hover:border-red-900"><div className="flex items-center justify-between"><span className="rounded-full border border-red-900 px-2 py-1 text-[10px] uppercase tracking-wider text-red-300">NPC</span><span className="text-xs text-zinc-500">{npc.npcMode === "threat" ? `NEX ${npc.nex}%` : "Narrativo"}</span></div><h2 className="mt-4 font-serif text-xl text-zinc-100">{npc.name}</h2><p className="mt-1 text-sm text-zinc-500">{npc.concept || "Sem descrição"}</p><p className="mt-4 text-xs uppercase tracking-widest text-zinc-600">{npc.status}</p></Link>)}</div>}
  </main>;
}
