"use client";

import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";
import {
  getAttributeBudget,
  getAttributeCap,
  getAttributeSpent,
  getAvailablePaths,
  getAvailablePowers,
  getGrantedSkillNames,
  getNexOptions,
  getPowerSelectionLimit,
  getRequiredSkillCount,
  getTrainingUpgradeCount,
  getTrainingUpgradeLimit,
  normalizeAttributes,
  type CharacterAttributes,
  type CharacterClass,
  type CharacterOrigin,
  type CharacterPower,
  type CharacterSkill,
  type NexRules,
  type RulesetSkill,
} from "@/lib/character-creation";
import { useTranslations } from "next-intl";

const attributes = ["agility", "strength", "intellect", "presence", "vigor"] as const;
const DRAFT_KEY = "lore-forge:pc-creator-draft:v1";

type RulesCatalog = {
  nex: NexRules;
  origins: CharacterOrigin[];
  classes: CharacterClass[];
  skills: RulesetSkill[];
  powers: CharacterPower[];
};

type CharacterSelection = { category: "power"; name: string; rank: number };

type AttributeErrorField = keyof CharacterAttributes | "attributes";

type CharacterDerived = {
  maxHp: number | null;
  maxSan: number | null;
  maxEp: number | null;
  epLimit: number | null;
  defense: number | null;
  dodge: number | null;
  block: number | null;
  movement: number | null;
  carryCapacity: number | null;
};

const derivedLabels = [
  "maxHp",
  "maxSan",
  "maxEp",
  "epLimit",
  "defense",
  "dodge",
  "block",
  "movement",
  "carryCapacity",
] as const satisfies readonly (keyof CharacterDerived)[];

type ApiErrorResponse = {
  field?: AttributeErrorField;
  message?: string | string[] | { field?: AttributeErrorField; message?: string };
};

export default function NewPlayerCharacterPage() {
  const t = useTranslations("characters");
  const router = useRouter();
  const apiUrl = getBrowserApiUrl();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<RulesCatalog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attributeError, setAttributeError] = useState<string | null>(null);
  const [attributeErrorField, setAttributeErrorField] = useState<AttributeErrorField | null>(null);
  const [values, setValues] = useState({ name: "", sheetLabel: "", concept: "", origin: "", characterClass: "", path: "", nex: 5, agility: 1, strength: 1, intellect: 1, presence: 1, vigor: 1, imageAssetId: "" });
  const [skills, setSkills] = useState<CharacterSkill[]>([]);
  const [powers, setPowers] = useState<CharacterSelection[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [derived, setDerived] = useState<CharacterDerived | null>(null);
  const [draftStatus, setDraftStatus] = useState<"saving" | "saved" | "idle">("idle");
  const [draftId, setDraftId] = useState<string | null>(null);
  const characterAttributes = useMemo<CharacterAttributes>(() => ({
    agility: values.agility,
    strength: values.strength,
    intellect: values.intellect,
    presence: values.presence,
    vigor: values.vigor,
  }), [values]);
  const attributeBudget = getAttributeBudget(values.nex);
  const attributeCap = getAttributeCap(values.nex);
  const attributeSpent = getAttributeSpent(characterAttributes);
  const attributeAvailable = attributeBudget - attributeSpent;
  const update = (key: keyof typeof values, value: string | number) => {
    setDerived(null);
    setValues((current) => ({ ...current, [key]: value }));
  };
  function updateAttribute(key: keyof CharacterAttributes, value: number) {
    if (!Number.isInteger(value) || value < 0 || value > attributeCap) {
      setAttributeError(t("attributeCapError", { attribute: t(`attribute.${key}`), cap: attributeCap }));
      setAttributeErrorField(key);
      return;
    }
    const nextAttributes = { ...characterAttributes, [key]: value };
    if (getAttributeSpent(nextAttributes) > attributeBudget) {
      setAttributeError(t("attributeBudgetError", { attribute: t(`attribute.${key}`), budget: attributeBudget }));
      setAttributeErrorField(key);
      return;
    }
    setAttributeError(null);
    setAttributeErrorField(null);
    update(key, value);
  }
  function updateNex(nex: number) {
    const normalizedAttributes = normalizeAttributes(characterAttributes, nex);
    const didNormalize = attributes.some((key) => normalizedAttributes[key] !== characterAttributes[key]);
    setDerived(null);
    setValues((current) => ({ ...current, nex, ...normalizedAttributes }));
    setAttributeError(didNormalize ? t("attributesNormalized", { nex }) : null);
    setAttributeErrorField(didNormalize ? "attributes" : null);
    if (!getAvailablePaths(selectedClass?.paths ?? [], nex).some((path) => path.slug === values.path)) {
      update("path", "");
    }
  }
  function toggleSkill(name: string, isRequired: boolean) {
    if (isRequired) return;

    setSkills((current) => current.some((skill) => skill.name === name)
      ? current.filter((skill) => skill.name !== name)
      : [...current, { name, degree: "trained" }]);
  }
  function updateSkillDegree(name: string, degree: CharacterSkill["degree"]) {
    setSkills((current) => current.map((skill) => skill.name === name ? { ...skill, degree } : skill));
  }
  function togglePower(power: CharacterPower) {
    setPowers((current) => current.some((selection) => selection.name === power.slug)
      ? current.filter((selection) => selection.name !== power.slug)
      : current.length >= getPowerSelectionLimit(values.nex)
        ? current
        : [...current, { category: "power", name: power.slug, rank: 1 }]);
  }
  function updatePowerRank(name: string, rank: number) {
    setPowers((current) => current.map((selection) => selection.name === name ? { ...selection, rank } : selection));
  }
  useEffect(() => {
    void apiFetch(`${apiUrl}/characters/ruleset`).then(async (response) => {
      if (response.ok) setRules(await response.json() as RulesCatalog);
    });
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { values?: typeof values; skills?: CharacterSkill[]; powers?: CharacterSelection[]; preview?: string | null; step?: number; draftId?: string; derived?: CharacterDerived | null };
      if (draft.values) setValues(draft.values);
      if (draft.skills) setSkills(draft.skills);
      if (draft.powers) setPowers(draft.powers);
      if (draft.preview) setPreview(draft.preview);
      if (typeof draft.step === "number") setStep(draft.step);
      if (draft.draftId) setDraftId(draft.draftId);
      if (draft.derived) setDerived(draft.derived);
      setDraftStatus("saved");
    } catch { sessionStorage.removeItem(DRAFT_KEY); }
  // Intentionally restore once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);
  useEffect(() => {
    const origin = rules?.origins.find((item) => item.slug === values.origin);
    const characterClass = rules?.classes.find((item) => item.slug === values.characterClass);
    const granted = getGrantedSkillNames(origin, characterClass);
    const knownSkills = new Set((rules?.skills ?? []).map((skill) => skill.slug));
    const availablePowerNames = new Set(getAvailablePowers(rules?.powers ?? [], values.nex, values.characterClass).map((power) => power.slug));

    setSkills((current) => {
      const merged = new Map(current.filter((skill) => knownSkills.has(skill.name)).map((skill) => [skill.name, skill]));
      granted.forEach((name) => merged.set(name, merged.get(name) ?? { name, degree: "trained" }));
      const next = [...merged.values()].map((skill) => ({
        ...skill,
        degree: skill.degree === "expert" && values.nex < 70
          ? "trained"
          : skill.degree === "veteran" && values.nex < 35
            ? "trained"
            : skill.degree,
      }));
      return sameSkills(current, next) ? current : next;
    });
    setPowers((current) => {
      const next = current
        .filter((selection) => availablePowerNames.has(selection.name))
        .slice(0, getPowerSelectionLimit(values.nex));
      return samePowers(current, next) ? current : next;
    });
  }, [rules, values.origin, values.characterClass, values.nex]);
  useEffect(() => {
    setDraftStatus("saving");
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, skills, powers, preview, step, draftId, derived }));
      // Server drafts are the source of truth; session storage merely keeps the
      // form responsive while an expired session is being renewed.
      void (async () => {
        const body = { ...values, kind: "pc", skills, selections: powers, imageAssetId: values.imageAssetId || null };
        const response = draftId
          ? await apiFetch(`${apiUrl}/characters/${draftId}/draft`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
          : await apiFetch(`${apiUrl}/characters/drafts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (response.ok) {
          const saved = await response.json() as { id: string; derived: CharacterDerived };
          if (!draftId) setDraftId(saved.id);
          setDerived(saved.derived);
          sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ values, skills, powers, preview, step, draftId: saved.id, derived: saved.derived }));
          setDraftStatus("saved");
        } else setDraftStatus("idle");
      })();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [values, skills, powers, preview, step, draftId, apiUrl]);
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
  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setAttributeError(null);
    setAttributeErrorField(null);
    const body = JSON.stringify({ ...values, kind: "pc", status: "active", skills, selections: powers, imageAssetId: values.imageAssetId || null });
    const response = draftId
      ? await apiFetch(`${apiUrl}/characters/${draftId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body })
      : await apiFetch(`${apiUrl}/characters`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as ApiErrorResponse | null;
      const details = payload && typeof payload.message === "object" && !Array.isArray(payload.message)
        ? payload.message
        : payload;
      const message = typeof details?.message === "string"
        ? details.message
        : Array.isArray(details?.message)
          ? details.message.join(" ")
          : undefined;
      if (details?.field) {
        setAttributeError(message ?? t("validation"));
        setAttributeErrorField(details.field);
        setStep(2);
      } else {
        setError(message ?? t("validation"));
      }
      setSaving(false);
      return;
    }
    sessionStorage.removeItem(DRAFT_KEY);
    router.push("/characters");
  }
  const selectedClass = rules?.classes.find(item => item.slug === values.characterClass);
  const selectedOrigin = rules?.origins.find(item => item.slug === values.origin);
  const availablePaths = getAvailablePaths(selectedClass?.paths ?? [], values.nex);
  const selectedPath = availablePaths.find((path) => path.slug === values.path);
  const grantedSkillNames = getGrantedSkillNames(selectedOrigin, selectedClass);
  const requiredSkillCount = getRequiredSkillCount(selectedOrigin, selectedClass, values.intellect);
  const trainingUpgradeLimit = getTrainingUpgradeLimit(selectedClass, values.intellect);
  const trainingUpgradeCount = getTrainingUpgradeCount(skills);
  const choiceGroups = [...(selectedOrigin?.skillChoices ?? []), ...(selectedClass?.skillChoices ?? [])];
  const choiceSkillNames = new Set(choiceGroups.flatMap((group) => group.skills));
  const selectedSkillNames = new Set(skills.map((skill) => skill.name));
  const freeSkillNames = (rules?.skills ?? [])
    .map((skill) => skill.slug)
    .filter((name) => !grantedSkillNames.includes(name) && !choiceSkillNames.has(name));
  const selectedFreeCount = skills.filter((skill) => !grantedSkillNames.includes(skill.name) && !choiceSkillNames.has(skill.name)).length;
  const freeSkillCount = selectedClass ? selectedClass.trainedSkills + Math.max(0, values.intellect) : 0;
  const availablePowers = getAvailablePowers(rules?.powers ?? [], values.nex, values.characterClass);
  const powerSelectionLimit = getPowerSelectionLimit(values.nex);
  const nexOptions = getNexOptions(rules?.nex);
  const steps = [t("identity"), t("originClass"), t("attributes"), t("review")];

  return <form onSubmit={submit} className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4"><Link href="/characters" className="text-xs uppercase tracking-widest text-zinc-500">← {t("sheets")}</Link><header className="flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-red-500">{t("guided")}</p><h1 className="font-serif text-3xl text-zinc-100">{t("createTitle")}</h1></div><span className="text-xs text-zinc-500">{t("draft")} {draftStatus === "saving" ? t("saving") : draftStatus === "saved" ? t("saved") : ""}</span></header><ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">{steps.map((label, index) => <li key={label}><button type="button" onClick={() => setStep(index)} className={`w-full rounded-lg border p-3 text-left text-xs ${step === index ? "border-red-700 bg-red-950/30 text-red-200" : "border-zinc-800 text-zinc-500"}`}>{index + 1}. {label}</button></li>)}</ol><section className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">{step === 0 && <div className="grid gap-4 sm:grid-cols-2"><Field label={t("name")} value={values.name} onChange={(value) => update("name", value)} required /><Field label={t("privateLabel")} value={values.sheetLabel} onChange={(value) => update("sheetLabel", value)} /><Field label={t("concept")} value={values.concept} onChange={(value) => update("concept", value)} /><label className="grid gap-2 text-sm text-zinc-300">{t("portrait")}<input type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) void uploadPortrait(file); }} />{preview && <div className="flex items-end gap-3"><img src={preview} alt={t("portrait")} className="h-28 w-28 rounded object-cover" /><button type="button" onClick={() => void removePortrait()} className="text-xs text-red-300">{t("removePortrait")}</button></div>}</label></div>}{step === 1 && <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm text-zinc-300">{t("origin")}<select required value={values.origin} onChange={event => update("origin", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-900 p-2"><option value="">{t("selectOrigin")}</option>{rules?.origins.map(origin => <option key={origin.slug} value={origin.slug}>{origin.name}</option>)}</select></label><label className="grid gap-2 text-sm text-zinc-300">{t("class")}<select required value={values.characterClass} onChange={(event) => { update("characterClass", event.target.value); update("path", ""); }} className="rounded-md border border-zinc-700 bg-zinc-900 p-2"><option value="">{t("selectClass")}</option>{rules?.classes.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>{availablePaths.length > 0 && <label className="grid gap-2 text-sm text-zinc-300">{t("path")}<select required value={values.path} onChange={(event) => update("path", event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-900 p-2"><option value="">{t("selectPath")}</option>{availablePaths.map(path => <option key={path.slug} value={path.slug}>{path.name}</option>)}</select></label>}<label className="grid gap-2 text-sm text-zinc-300">{t("nex")}<select value={values.nex} onChange={(event) => updateNex(Number(event.target.value))} className="rounded-md border border-zinc-700 bg-zinc-900 p-2">{nexOptions.map((nex) => <option key={nex} value={nex}>{nex}%</option>)}</select></label></div>}{step === 2 && <div className="grid gap-8"><div><p className="mb-4 text-sm text-zinc-400">{t("attributeHelp", { spent: attributeSpent, budget: attributeBudget, available: attributeAvailable, cap: attributeCap })}</p>{attributeError && <p className="mb-4 rounded-md border border-red-900 bg-red-950/30 p-3 text-sm text-red-200" role="alert">{attributeError}</p>}<div className="grid gap-4 sm:grid-cols-5">{attributes.map((key) => <label key={key} className={`grid gap-2 rounded-lg border p-3 text-sm text-zinc-300 ${attributeErrorField === key ? "border-red-700" : "border-zinc-800"}`}>{t(`attribute.${key}`)}<input type="number" min="0" max={attributeCap} value={values[key]} onChange={(event) => updateAttribute(key, Number(event.target.value))} aria-invalid={attributeErrorField === key || undefined} className="rounded bg-zinc-900 p-2" /></label>)}</div></div><SkillAndPowerSelection skills={skills} powers={powers} grantedSkillNames={grantedSkillNames} choiceGroups={choiceGroups} freeSkillNames={freeSkillNames} selectedSkillNames={selectedSkillNames} selectedFreeCount={selectedFreeCount} freeSkillCount={freeSkillCount} requiredSkillCount={requiredSkillCount} trainingUpgradeCount={trainingUpgradeCount} trainingUpgradeLimit={trainingUpgradeLimit} availablePowers={availablePowers} powerSelectionLimit={powerSelectionLimit} skillNames={Object.fromEntries((rules?.skills ?? []).map((skill) => [skill.slug, skill.name]))} nex={values.nex} onToggleSkill={toggleSkill} onUpdateSkillDegree={updateSkillDegree} onTogglePower={togglePower} onUpdatePowerRank={updatePowerRank} t={t} /></div>}{step === 3 && <Review values={values} preview={preview} origin={selectedOrigin?.name ?? t("notSelected")} characterClass={selectedClass?.name ?? t("noClass")} path={selectedPath?.name ?? t("notSelected")} derived={derived} attributes={characterAttributes} attributeLabels={Object.fromEntries(attributes.map((key) => [key, t(`attribute.${key}`)])) as Record<keyof CharacterAttributes, string>} skills={skills} powers={powers} skillNames={Object.fromEntries((rules?.skills ?? []).map((skill) => [skill.slug, skill.name]))} powerNames={Object.fromEntries((rules?.powers ?? []).map((power) => [power.slug, power.name]))} t={t} />}</section>{error && <p className="rounded-md border border-red-900 bg-red-950/30 p-3 text-sm text-red-200">{error}</p>}<footer className="flex justify-between"><button type="button" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0} className="rounded-md px-4 py-2 text-sm text-zinc-400 disabled:opacity-30">{t("back")}</button>{step < steps.length - 1 ? <button type="button" onClick={() => setStep(step + 1)} className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-white">{t("continue")}</button> : <button disabled={saving} className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white">{saving ? t("saving") : t("finalize")}</button>}</footer></form>;
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (value: string) => void; required?: boolean }) { return <label className="grid gap-2 text-sm text-zinc-300">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} className="rounded-md border border-zinc-700 bg-zinc-900 p-2" /></label>; }

function SkillAndPowerSelection({
  skills, powers, grantedSkillNames, choiceGroups, freeSkillNames, selectedSkillNames,
  selectedFreeCount, freeSkillCount, requiredSkillCount,
  trainingUpgradeCount, trainingUpgradeLimit, availablePowers, powerSelectionLimit, skillNames, nex,
  onToggleSkill, onUpdateSkillDegree, onTogglePower, onUpdatePowerRank, t,
}: {
  skills: CharacterSkill[]; powers: CharacterSelection[]; grantedSkillNames: string[];
  choiceGroups: Array<{ slug: string; selectionCount: number; skills: string[] }>;
  freeSkillNames: string[]; selectedSkillNames: Set<string>;
  selectedFreeCount: number; freeSkillCount: number; requiredSkillCount: number;
  trainingUpgradeCount: number; trainingUpgradeLimit: number; availablePowers: CharacterPower[]; powerSelectionLimit: number;
  skillNames: Record<string, string>; nex: number;
  onToggleSkill: (name: string, isRequired: boolean) => void;
  onUpdateSkillDegree: (name: string, degree: CharacterSkill["degree"]) => void;
  onTogglePower: (power: CharacterPower) => void;
  onUpdatePowerRank: (name: string, rank: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const degreeFor = (name: string) => skills.find((skill) => skill.name === name)?.degree ?? "trained";
  return <div className="grid gap-6 border-t border-zinc-800 pt-6 text-sm text-zinc-300">
    <section className="grid gap-3"><div><h2 className="font-semibold text-zinc-100">{t("skills")}</h2><p className="text-zinc-500">{t("skillsHelp", { selected: skills.length, required: requiredSkillCount })}</p></div>
      {grantedSkillNames.length > 0 && <div className="grid gap-2"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{t("grantedSkills")}</p>{grantedSkillNames.map((name) => <SkillRow key={name} name={name} label={skillNames[name] ?? name} checked degree={degreeFor(name)} disabled nex={nex} onToggle={() => onToggleSkill(name, true)} onDegreeChange={(degree) => onUpdateSkillDegree(name, degree)} t={t} />)}</div>}
      {choiceGroups.map((group) => { const count = group.skills.filter((name) => selectedSkillNames.has(name) && !grantedSkillNames.includes(name)).length; return <div key={group.slug} className="grid gap-2"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{t("skillChoiceGroup", { group: group.slug, selected: count, required: group.selectionCount })}</p>{group.skills.map((name) => <SkillRow key={name} name={name} label={skillNames[name] ?? name} checked={selectedSkillNames.has(name)} degree={degreeFor(name)} disabled={!selectedSkillNames.has(name) && count >= group.selectionCount} nex={nex} onToggle={() => onToggleSkill(name, false)} onDegreeChange={(degree) => onUpdateSkillDegree(name, degree)} t={t} />)}</div>; })}
      {freeSkillNames.length > 0 && <div className="grid gap-2"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{t("freeSkills", { selected: selectedFreeCount, required: freeSkillCount })}</p>{freeSkillNames.map((name) => <SkillRow key={name} name={name} label={skillNames[name] ?? name} checked={selectedSkillNames.has(name)} degree={degreeFor(name)} disabled={!selectedSkillNames.has(name) && selectedFreeCount >= freeSkillCount} nex={nex} onToggle={() => onToggleSkill(name, false)} onDegreeChange={(degree) => onUpdateSkillDegree(name, degree)} t={t} />)}</div>}
      <p className={trainingUpgradeCount > trainingUpgradeLimit ? "text-red-300" : "text-zinc-500"}>{t("trainingUpgrades", { used: trainingUpgradeCount, limit: trainingUpgradeLimit })}</p>
    </section>
    <section className="grid gap-3"><div><h2 className="font-semibold text-zinc-100">{t("powers")}</h2><p className="text-zinc-500">{t("powersHelp", { selected: powers.length, limit: powerSelectionLimit })}</p></div>{powerSelectionLimit === 0 ? <p className="text-zinc-500">{t("noPowerSlots")}</p> : availablePowers.length === 0 ? <p className="text-zinc-500">{t("noPowers")}</p> : availablePowers.map((power) => { const selection = powers.find((item) => item.name === power.slug); const isDisabled = !selection && powers.length >= powerSelectionLimit; return <label key={power.slug} className="flex flex-wrap items-center gap-3 rounded border border-zinc-800 p-3"><input type="checkbox" checked={Boolean(selection)} disabled={isDisabled} onChange={() => onTogglePower(power)} /><span className="flex-1">{power.name}</span>{selection && power.maxRank > 1 && <select aria-label={t("powerRank", { power: power.name })} value={selection.rank} onChange={(event) => onUpdatePowerRank(power.slug, Number(event.target.value))} className="rounded bg-zinc-900 p-1">{Array.from({ length: power.maxRank }, (_, index) => index + 1).map((rank) => <option key={rank} value={rank}>{t("rank", { rank })}</option>)}</select>}</label>; })}</section>
  </div>;
}

function SkillRow({ name, label, checked, degree, disabled, nex, onToggle, onDegreeChange, t }: { name: string; label: string; checked: boolean; degree: CharacterSkill["degree"]; disabled: boolean; nex: number; onToggle: () => void; onDegreeChange: (degree: CharacterSkill["degree"]) => void; t: ReturnType<typeof useTranslations> }) {
  return <label className="flex flex-wrap items-center gap-3 rounded border border-zinc-800 p-3"><input type="checkbox" checked={checked} disabled={disabled} onChange={onToggle} /><span className="flex-1">{label}</span>{checked && <select aria-label={t("skillDegree", { skill: label })} value={degree} onChange={(event) => onDegreeChange(event.target.value as CharacterSkill["degree"])} className="rounded bg-zinc-900 p-1"><option value="trained">{t("degree.trained")}</option><option value="veteran" disabled={nex < 35}>{t("degree.veteran")}</option><option value="expert" disabled={nex < 70}>{t("degree.expert")}</option></select>}</label>;
}

function Review({
  values,
  preview,
  origin,
  characterClass,
  path,
  derived,
  attributes: characterAttributes,
  attributeLabels,
  skills,
  powers,
  skillNames,
  powerNames,
  t,
}: {
  values: { name: string; sheetLabel: string; concept: string; nex: number };
  preview: string | null;
  origin: string;
  characterClass: string;
  path: string;
  derived: CharacterDerived | null;
  attributes: CharacterAttributes;
  attributeLabels: Record<keyof CharacterAttributes, string>;
  skills: CharacterSkill[];
  powers: CharacterSelection[];
  skillNames: Record<string, string>;
  powerNames: Record<string, string>;
  t: ReturnType<typeof useTranslations>;
}) {
  return <div className="grid gap-6 text-sm text-zinc-300">
    <p className="text-zinc-400">{derived ? t("derivedHelp") : t("calculatingDerived")}</p>
    <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
      {preview ? <img src={preview} alt={t("portrait")} className="h-28 w-28 rounded-lg object-cover" /> : null}
      <dl className="grid gap-3 sm:grid-cols-2">
        <ReviewValue label={t("name")} value={values.name || t("unnamed")} />
        <ReviewValue label={t("privateLabel")} value={values.sheetLabel || t("notProvided")} />
        <ReviewValue label={t("concept")} value={values.concept || t("notProvided")} />
      </dl>
    </div>
    <ReviewGroup title={t("originClass")}>
      <ReviewValue label={t("origin")} value={origin} />
      <ReviewValue label={t("class")} value={characterClass} />
      <ReviewValue label={t("path")} value={path} />
      <ReviewValue label={t("nex")} value={t("nexValue", { value: values.nex })} />
    </ReviewGroup>
    <ReviewGroup title={t("attributes")}>
      {attributes.map((key) => <ReviewValue key={key} label={attributeLabels[key]} value={String(characterAttributes[key])} />)}
    </ReviewGroup>
    <ReviewGroup title={t("skills")}>
      {skills.map((skill) => <ReviewValue key={skill.name} label={skillNames[skill.name] ?? skill.name} value={t(`degree.${skill.degree}`)} />)}
    </ReviewGroup>
    <ReviewGroup title={t("powers")}>
      {powers.length > 0 ? powers.map((power) => <ReviewValue key={power.name} label={powerNames[power.name] ?? power.name} value={t("rank", { rank: power.rank })} />) : <ReviewValue label={t("powers")} value={t("noPowersSelected")} />}
    </ReviewGroup>
    <ReviewGroup title={t("derivedValues")}>
      {derived ? derivedLabels.map((key) => <ReviewValue key={key} label={t(`derived.${key}`)} value={derived[key] === null ? t("notAvailable") : String(derived[key])} />) : <ReviewValue label={t("derivedValues")} value={t("calculatingDerived")} />}
    </ReviewGroup>
  </div>;
}

function ReviewGroup({ title, children }: { title: string; children: ReactNode }) {
  return <section className="rounded-lg border border-zinc-800 p-4"><h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">{title}</h2><dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</dl></section>;
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-zinc-500">{label}</dt><dd className="mt-1 text-zinc-100">{value}</dd></div>;
}

function sameSkills(current: CharacterSkill[], next: CharacterSkill[]): boolean {
  return current.length === next.length && current.every((skill, index) => (
    skill.name === next[index]?.name && skill.degree === next[index]?.degree
  ));
}

function samePowers(current: CharacterSelection[], next: CharacterSelection[]): boolean {
  return current.length === next.length && current.every((power, index) => (
    power.name === next[index]?.name && power.rank === next[index]?.rank
  ));
}
