"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, FilePlus2, Pencil, Save } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";
import { ClueDocument } from "./clue-document";
import { ClueEditor } from "./clue-editor";
import { clueStyles, emptyClueDraft, type CampaignClue, type CampaignClueSummary, type ClueDraft, type ClueStyle } from "./clue-types";

type ClueWorkspaceProps = { campaignId: string };
type MobilePanel = "edit" | "preview";

const styleLabels: Record<ClueStyle, string> = {
  "plain-document": "Documento simples",
  "handwritten-letter": "Carta manuscrita",
  "typewritten-report": "Relatório datilografado",
  "newspaper-clipping": "Recorte de jornal",
  "confidential-dossier": "Dossiê confidencial",
};

function toDraft(clue: CampaignClue): ClueDraft {
  return { gmLabel: clue.gmLabel, title: clue.title ?? "", privateNotes: clue.privateNotes ?? "", style: clue.style, content: clue.content };
}

function toPayload(draft: ClueDraft) {
  return { gmLabel: draft.gmLabel, title: draft.title.trim() || null, privateNotes: draft.privateNotes.trim() || null, style: draft.style, content: draft.content };
}

export function ClueWorkspace({ campaignId }: ClueWorkspaceProps) {
  const router = useRouter();
  const apiUrl = getBrowserApiUrl();
  const [clues, setClues] = useState<CampaignClueSummary[]>([]);
  const [selectedClue, setSelectedClue] = useState<CampaignClue | null>(null);
  const [draft, setDraft] = useState<ClueDraft>(emptyClueDraft);
  const [savedDraft, setSavedDraft] = useState<ClueDraft>(emptyClueDraft);
  const [isComposing, setIsComposing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("edit");
  const isDirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(savedDraft), [draft, savedDraft]);

  useEffect(() => {
    async function loadClues() {
      setIsLoading(true);
      setError("");
      try {
        const response = await apiFetch(`${apiUrl}/campaigns/${campaignId}/clues`);
        if (!response.ok) throw new Error("Não foi possível carregar as pistas.");
        const data = await response.json() as CampaignClueSummary[];
        setClues(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar as pistas.");
      } finally { setIsLoading(false); }
    }
    void loadClues();
  }, [apiUrl, campaignId]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const confirmInternalNavigation = (event: MouseEvent) => {
      if (!isDirty || event.defaultPrevented || event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey) return;
      if (!window.confirm("Há alterações não salvas. Deseja descartá-las?")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    document.addEventListener("click", confirmInternalNavigation, true);
    return () => document.removeEventListener("click", confirmInternalNavigation, true);
  }, [isDirty]);

  function shouldDiscardChanges(): boolean {
    return !isDirty || window.confirm("Há alterações não salvas. Deseja descartá-las?");
  }

  async function selectClue(clueId: string) {
    if (!shouldDiscardChanges()) return;
    setError("");
    const response = await apiFetch(`${apiUrl}/campaigns/${campaignId}/clues/${clueId}`);
    if (!response.ok) { setError("Não foi possível carregar esta pista."); return; }
    const clue = await response.json() as CampaignClue;
    const nextDraft = toDraft(clue);
    setSelectedClue(clue);
    setDraft(nextDraft);
    setSavedDraft(nextDraft);
    setIsComposing(true);
    setMobilePanel("edit");
  }

  function createClue() {
    if (!shouldDiscardChanges()) return;
    setSelectedClue(null);
    setDraft(emptyClueDraft);
    setSavedDraft(emptyClueDraft);
    setIsComposing(true);
    setMobilePanel("edit");
    setError("");
  }

  function cancelComposition() {
    if (!shouldDiscardChanges()) return;
    setSelectedClue(null);
    setDraft(emptyClueDraft);
    setSavedDraft(emptyClueDraft);
    setIsComposing(false);
    setError("");
  }

  async function saveClue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    const isUpdating = selectedClue !== null;
    const url = isUpdating ? `${apiUrl}/campaigns/${campaignId}/clues/${selectedClue.id}` : `${apiUrl}/campaigns/${campaignId}/clues`;
    try {
      const response = await apiFetch(url, { method: isUpdating ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(toPayload(draft)) });
      if (!response.ok) throw new Error("Não foi possível salvar a pista. Verifique os campos e tente novamente.");
      const clue = await response.json() as CampaignClue;
      const nextDraft = toDraft(clue);
      setSelectedClue(clue);
      setDraft(nextDraft);
      setSavedDraft(nextDraft);
      setClues((current) => [clue, ...current.filter((item) => item.id !== clue.id)].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Não foi possível salvar a pista.");
    } finally { setIsSaving(false); }
  }

  function leaveWorkspace() {
    if (!shouldDiscardChanges()) return;
    router.push("/campaigns");
  }

  return <div className="flex flex-1 flex-col gap-6 py-4">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div><button type="button" onClick={leaveWorkspace} className="mb-3 inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"><ArrowLeft className="h-3 w-3" />Campanhas</button><h1 className="text-3xl font-semibold text-zinc-100">Gerenciar pistas</h1><p className="mt-1 text-sm text-zinc-500">Crie documentos privados e visualize a apresentação que será usada pelos jogadores.</p></div>
      <button type="button" onClick={createClue} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"><FilePlus2 className="h-4 w-4" />Nova pista</button>
    </div>
    {error ? <p role="alert" className="rounded-lg border border-red-900/70 bg-red-950/30 p-3 text-sm text-red-200">{error}</p> : null}
    {!isComposing ? <section className="rounded-3xl border border-zinc-900 bg-zinc-950/80"><div className="border-b border-zinc-900 px-5 py-4"><h2 className="text-xl font-medium text-zinc-100">Coleção</h2></div><div className="p-5">{isLoading ? <p className="text-sm text-zinc-500">Carregando pistas…</p> : clues.length === 0 ? <p className="text-sm text-zinc-500">Nenhuma pista criada ainda.</p> : <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{clues.map((clue) => <li key={clue.id}><button type="button" onClick={() => void selectClue(clue.id)} className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-left transition hover:border-red-900/70"><div className="flex items-center justify-between gap-3"><span className="text-xs uppercase tracking-[0.16em] text-red-300">{clue.gmLabel}</span><span className="text-[10px] uppercase text-zinc-500">{styleLabels[clue.style]}</span></div><h3 className="mt-3 font-serif text-lg text-zinc-100">{clue.title || "Sem título"}</h3><p className="mt-2 text-xs text-zinc-500">Atualizada em {new Date(clue.updatedAt).toLocaleDateString("pt-BR")}</p></button></li>)}</ul>}</div></section> : <form onSubmit={saveClue} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className={`space-y-4 ${mobilePanel === "preview" ? "hidden lg:block" : "block"}`}><div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5 space-y-4"><div className="flex items-center gap-2 text-sm font-medium text-zinc-100"><Pencil className="h-4 w-4 text-red-400" />Dados do mestre</div><label className="block space-y-1"><span className="text-xs text-zinc-400">Label privada</span><input required minLength={1} maxLength={120} value={draft.gmLabel} onChange={(event) => setDraft((current) => ({ ...current, gmLabel: event.target.value }))} className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" /></label><label className="block space-y-1"><span className="text-xs text-zinc-400">Título público</span><input maxLength={200} value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" /></label><label className="block space-y-1"><span className="text-xs text-zinc-400">Estilo</span><select value={draft.style} onChange={(event) => setDraft((current) => ({ ...current, style: event.target.value as ClueStyle }))} className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100">{clueStyles.map((style) => <option value={style} key={style}>{styleLabels[style]}</option>)}</select></label><label className="block space-y-1"><span className="text-xs text-zinc-400">Notas privadas</span><textarea maxLength={10000} value={draft.privateNotes} onChange={(event) => setDraft((current) => ({ ...current, privateNotes: event.target.value }))} className="min-h-28 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100" /></label></div><ClueEditor key={selectedClue?.id ?? "new"} content={draft.content} onChange={(content) => setDraft((current) => ({ ...current, content }))} /></section>
        <section className={`${mobilePanel === "edit" ? "hidden lg:block" : "block"}`}><div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300"><Eye className="h-4 w-4 text-red-400" />Prévia pública</div><ClueDocument title={draft.title.trim() || null} content={draft.content} style={draft.style} /></section>
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-zinc-800 pt-4"><button type="button" onClick={cancelComposition} className="text-xs uppercase tracking-[0.2em] text-zinc-400 hover:text-zinc-200">Cancelar</button><button disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save className="h-4 w-4" />{isSaving ? "Salvando…" : "Salvar pista"}</button></div>
      <div className="fixed inset-x-0 bottom-0 z-40 flex border-t border-zinc-700 bg-zinc-950 p-2 lg:hidden"><button type="button" aria-pressed={mobilePanel === "edit"} onClick={() => setMobilePanel("edit")} className="flex-1 rounded px-3 py-2 text-sm text-zinc-200 aria-pressed:bg-zinc-800">Editar</button><button type="button" aria-pressed={mobilePanel === "preview"} onClick={() => setMobilePanel("preview")} className="flex-1 rounded px-3 py-2 text-sm text-zinc-200 aria-pressed:bg-zinc-800">Prévia</button></div>
    </form>}
  </div>;
}
