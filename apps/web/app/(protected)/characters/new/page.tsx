"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";
import { useTranslations } from "next-intl";

const steps = ["Identity", "Origin & class", "Attributes", "Review"];
const attributes = ["agility", "strength", "intellect", "presence", "vigor"] as const;
const DRAFT_KEY = "lore-forge:pc-creator-draft:v1";

export default function NewPlayerCharacterPage() {
  const t = useTranslations("characters");
  const router = useRouter();
  const apiUrl = getBrowserApiUrl();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<{ origins: Array<{ slug: string; name: string }>; classes: Array<{ slug: string; name: string; paths: Array<{ slug: string; name: string; minNex: number }> }> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState({ name: "", sheetLabel: "", concept: "", origin: "", characterClass: "", path: "", nex: 5, agility: 1, strength: 1, intellect: 1, presence: 1, vigor: 1, imageAssetId: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<"saving" | "saved" | "idle">("idle");
  const [draftId, setDraftId] = useState<string | null>(null);
  const points = useMemo(() => attributes.reduce((total, key) => total + values[key], 0) - 5, [values]);
  const update = (key: keyof typeof values, value: string | number) => setValues((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    void apiFetch(`${apiUrl}/characters/ruleset`).then(async response => { if (response.ok) setRules(await response.json()); });
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { values?: typeof values; preview?: string | null; step?: number; draftId?: string };
      if (draft.values) setValues(draft.values);
      if (draft.preview) setPreview(draft.preview);
      if (typeof draft.step === "number") setStep(draft.step);
      if (draft.draftId) setDraftId(draft.draftId);
      setDraftStatus("saved");
    } catch { sessionStorage.removeItem(DRAFT_KEY); }
  // Intentionally restore once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);
  useEffect(() => {
    setDraftStatus("saving");
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, preview, step, draftId }));
      // Server drafts are the source of truth; session storage merely keeps the
      // form responsive while an expired session is being renewed.
      void (async () => {
        const body = { ...values, kind: "pc", imageAssetId: values.imageAssetId || null };
        const response = draftId
          ? await apiFetch(`${apiUrl}/characters/${draftId}/draft`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          : await apiFetch(`${apiUrl}/characters/drafts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (response.ok) {
          const saved = await response.json() as { id: string };
          if (!draftId) setDraftId(saved.id);
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, preview, step, draftId: saved.id }));
          setDraftStatus("saved");
        } else setDraftStatus("idle");
      })();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [values, preview, step, draftId, apiUrl]);
  async function uploadPortrait(file: File) {
    setError(null);
    const form = new FormData(); form.append("file", file);
    const response = await apiFetch(`${apiUrl}/media`, { method: "POST", body: form });
    if (!response.ok) { setError(t("uploadFailed")); return; }
    const asset = await response.json() as { id: string; url: string };
    // The draft update releases the old asset after its character reference is
    // changed. Deleting it here would briefly leave an already-saved draft
    // pointing at a soft-deleted portrait (and could break copied sheets).
    update("imageAssetId", asset.id); setPreview(`${apiUrl}${asset.url}`);
  }
  async function removePortrait() {
    update("imageAssetId", ""); setPreview(null);
  }
  async function submit(event: FormEvent) { event.preventDefault(); setSaving(true); setError(null); const body = JSON.stringify({ ...values, kind: "pc", status: "active", imageAssetId: values.imageAssetId || null }); const response = draftId ? await apiFetch(`${apiUrl}/characters/${draftId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body }) : await apiFetch(`${apiUrl}/characters`, { method: "POST", headers: { "Content-Type": "application/json" }, body }); if (!response.ok) { setError(t("validation")); setSaving(false); return; } sessionStorage.removeItem(DRAFT_KEY); router.push("/characters"); }
  const selectedClass = rules?.classes.find(item => item.slug === values.characterClass);
  return <form onSubmit={submit} className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4"><Link href="/characters" className="text-xs uppercase tracking-widest text-zinc-500">← Sheets</Link><header className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-red-500">Guided creator</p><h1 className="font-serif text-3xl text-zinc-100">Create a player character</h1></div><span className="text-xs text-zinc-500">Draft {draftStatus === "saving" ? "saving…" : draftStatus === "saved" ? "saved" : ""}</span></header><ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">{steps.map((label, index) => <li key={label}><button type="button" onClick={() => setStep(index)} className={`w-full rounded-lg border p-3 text-left text-xs ${step === index ? "border-red-700 bg-red-950/30 text-red-200" : "border-zinc-800 text-zinc-500"}`}>{index + 1}. {label}</button></li>)}</ol><section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">{step === 0 && <div className="grid gap-4 sm:grid-cols-2"><Field label="Character name" value={values.name} onChange={(value) => update("name", value)} required /><Field label="Private sheet label" value={values.sheetLabel} onChange={(value) => update("sheetLabel", value)} /><Field label="Concept" value={values.concept} onChange={(value) => update("concept", value)} /><label className="grid gap-2 text-sm text-zinc-300">Portrait<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPortrait(file); }} />{preview && <div className="flex items-end gap-3"><img src={preview} alt="Portrait preview" className="h-28 w-28 rounded object-cover" /><button type="button" onClick={() => void removePortrait()} className="text-xs text-red-300">Remove portrait</button></div>}</label></div>}{step === 1 && <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm text-zinc-300">Origin<select required value={values.origin} onChange={event => update("origin", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-900 p-2"><option value="">Select origin</option>{rules?.origins.map(origin => <option key={origin.slug} value={origin.slug}>{origin.name}</option>)}</select></label><label className="grid gap-2 text-sm text-zinc-300">Class<select required value={values.characterClass} onChange={(event) => { update("characterClass", event.target.value); update("path", ""); }} className="rounded-md border border-zinc-700 bg-zinc-900 p-2"><option value="">Select class</option>{rules?.classes.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label><label className="grid gap-2 text-sm text-zinc-300">Path<select required value={values.path} onChange={(event) => update("path", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-900 p-2"><option value="">Select path</option>{selectedClass?.paths.filter(path => values.nex >= path.minNex).map(path => <option key={path.slug} value={path.slug}>{path.name}</option>)}</select></label><label className="grid gap-2 text-sm text-zinc-300">NEX<select value={values.nex} onChange={(event) => update("nex", Number(event.target.value))} className="rounded-md border border-zinc-700 bg-zinc-900 p-2">{Array.from({ length: 20 }, (_, index) => (index + 1) * 5).map((nex) => <option key={nex} value={nex}>{nex}%</option>)}</select></label></div>}{step === 2 && <div><p className="mb-4 text-sm text-zinc-400">Distribute four points; every attribute starts at 1. Points used: {points}/4.</p><div className="grid gap-4 sm:grid-cols-5">{attributes.map((key) => <label key={key} className="grid gap-2 rounded-lg border border-zinc-800 p-3 text-sm capitalize text-zinc-300">{key}<input type="number" min="0" max="5" value={values[key]} onChange={(event) => update(key, Number(event.target.value))} className="rounded bg-zinc-900 p-2" /></label>)}</div></div>}{step === 3 && <div className="grid gap-3 text-sm text-zinc-300"><p><b>{values.name || "Unnamed agent"}</b> · {selectedClass?.name ?? "No class"} · NEX {values.nex}%</p><p>Derived values are calculated by the API when this sheet is saved.</p></div>}</section>{error && <p className="rounded-md border border-red-900 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}<footer className="flex justify-between"><button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-md px-4 py-2 text-sm text-zinc-400 disabled:opacity-30">Back</button>{step < steps.length - 1 ? <button type="button" onClick={() => setStep(step + 1)} className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white">Continue</button> : <button disabled={saving} className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white">{saving ? "Saving…" : "Finalize sheet"}</button>}</footer></form>;
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) { return <label className="grid gap-2 text-sm text-zinc-300">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-900 p-2" /></label>; }
