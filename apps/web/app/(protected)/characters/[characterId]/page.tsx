"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";
import { useTranslations } from "next-intl";

const attributeKeys = [
  "agility",
  "strength",
  "intellect",
  "presence",
  "vigor",
] as const;
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
const CAMPAIGN_STATE_POLL_INTERVAL_MS = 3_000;
const LOW_RESOURCE_PERCENTAGE = 25;
const resourceDefinitions = [
  {
    currentKey: "currentHp",
    maximumKey: "maxHp",
    colorClass: "bg-red-600",
    label: "PV",
  },
  {
    currentKey: "currentSan",
    maximumKey: "maxSan",
    colorClass: "bg-purple-600",
    label: "SAN",
  },
  {
    currentKey: "currentEp",
    maximumKey: "maxEp",
    colorClass: "bg-amber-500",
    label: "PE",
  },
] as const;

type Attributes = Record<(typeof attributeKeys)[number], number>;
type Skill = { name: string; degree: "trained" | "veteran" | "expert" };
type Power = { name: string; rank: number };
type Derived = Record<keyof typeof derivedLabels, number | null>;
type Permissions = {
  canCopy: boolean;
  canViewCampaignState: boolean;
  canEditPermanentData: boolean;
  canEditPlayState: boolean;
  canManageRituals: boolean;
  canManageInventory: boolean;
};
type Character = {
  id: string;
  name: string;
  kind: "pc" | "npc";
  status: string;
  campaignId: string | null;
  campaignName: string | null;
  nex: number;
  origin: string | null;
  characterClass: string | null;
  path: string | null;
  concept: string | null;
  gender: string | null;
  age: number | null;
  appearance: string | null;
  personality: string | null;
  history: string | null;
  objective: string | null;
  playerNotes: string | null;
  imageAssetId: string | null;
  updatedAt: string;
  attributes: Attributes;
  skills: Skill[];
  powers: Power[];
  derived: Derived;
  permissions: Permissions;
  hasEditDraft: boolean;
};
type EditDraft = Omit<
  Character,
  | "id"
  | "kind"
  | "status"
  | "campaignId"
  | "campaignName"
  | "permissions"
  | "hasEditDraft"
  | "derived"
> & {
  id: string;
  characterId: string;
  rulesetVersion: string;
  derived: Derived;
  conflicts: Conflict[];
  updatedAt: string;
};
type Conflict = {
  code: string;
  field: string;
  optionId?: string;
  message: string;
};
type Inventory = {
  id: string;
  name: string;
  quantity: number;
  isEquipped: boolean;
  notes: string | null;
};
type PlayState = {
  currentHp: number | null;
  maxHp: number | null;
  currentSan: number | null;
  maxSan: number | null;
  currentEp: number | null;
  maxEp: number | null;
  conditions: string;
  temporaryEffects: string;
  gmNotes: string | null;
  updatedAt: string;
  rituals: Array<{ slug: string; name: string; rank: number; maxRank: number }>;
  inventory: Inventory[];
};
type RulesCatalog = {
  nex: { min: number; max: number; step: number };
  origins: Array<{ slug: string; name: string }>;
  classes: Array<{
    slug: string;
    name: string;
    paths: Array<{ slug: string; name: string }>;
  }>;
  skills: Array<{ slug: string; name: string }>;
  powers: Array<{ slug: string; name: string; maxRank: number }>;
  rituals: Array<{
    slug: string;
    name: string;
    minNex: number;
    maxRank: number;
    requiredClassSlug: string | null;
  }>;
};
type SaveStatus = "idle" | "saving" | "saved" | "error";

function getDraftPayload(draft: EditDraft) {
  return {
    name: draft.name,
    concept: draft.concept,
    gender: draft.gender,
    age: draft.age,
    appearance: draft.appearance,
    personality: draft.personality,
    history: draft.history,
    objective: draft.objective,
    playerNotes: draft.playerNotes,
    origin: draft.origin,
    characterClass: draft.characterClass,
    path: draft.path,
    nex: draft.nex,
    ...draft.attributes,
    imageAssetId: draft.imageAssetId,
    skills: draft.skills,
    selections: draft.powers.map((power) => ({ category: "power", ...power })),
  };
}

export default function CharacterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("characters");
  const id = String(params.characterId);
  const apiUrl = getBrowserApiUrl();
  const [character, setCharacter] = useState<Character | null>(null);
  const [playState, setPlayState] = useState<PlayState | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [rules, setRules] = useState<RulesCatalog | null>(null);
  const [tab, setTab] = useState<"sheet" | "build" | "description">("sheet");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const [item, setItem] = useState({ name: "", quantity: 1, notes: "" });
  const saveChain = useRef(Promise.resolve());
  const playStateSaveChain = useRef(Promise.resolve());
  const playStateVersion = useRef(0);
  const saveTimer = useRef<number | null>(null);
  const draftRef = useRef<EditDraft | null>(null);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(
    () => () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    },
    [],
  );

  async function load() {
    const response = await apiFetch(`${apiUrl}/characters/${id}`);
    if (!response.ok) {
      setError(t("unavailable"));
      return;
    }
    const sheet = (await response.json()) as Character;
    setCharacter(sheet);
    if (sheet.campaignId) {
      const stateResponse = await apiFetch(
        `${apiUrl}/characters/${id}/play-state`,
      );
      if (stateResponse.ok)
        setPlayState((await stateResponse.json()) as PlayState);
    } else setPlayState(null);
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => void load());
    return () => window.clearTimeout(timeout);
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if ((draft || character?.permissions.canManageRituals) && !rules)
      void apiFetch(`${apiUrl}/characters/ruleset`).then(async (response) => {
        if (response.ok) setRules((await response.json()) as RulesCatalog);
      });
  }, [apiUrl, character?.permissions.canManageRituals, draft, rules]);

  useEffect(() => {
    if (
      !character?.campaignId ||
      !character.permissions.canViewCampaignState ||
      character.permissions.canEditPlayState ||
      character.status !== "active"
    )
      return;
    const refresh = () => {
      if (document.visibilityState === "visible") void load();
    };
    const interval = window.setInterval(
      refresh,
      CAMPAIGN_STATE_POLL_INTERVAL_MS,
    );
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [
    character?.campaignId,
    character?.permissions.canEditPlayState,
    character?.permissions.canViewCampaignState,
    character?.status,
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  function queueSave(nextDraft: EditDraft) {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    setSaveStatus("saving");
    saveTimer.current = window.setTimeout(() => {
      void saveDraft(nextDraft);
    }, 500);
  }

  async function saveDraft(snapshot = draftRef.current): Promise<boolean> {
    if (!snapshot) return true;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const payload = getDraftPayload(snapshot);
    const request = async () => {
      const response = await apiFetch(`${apiUrl}/characters/${id}/edit-draft`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setSaveStatus("error");
        setError(t("validation"));
        return false;
      }
      const saved = (await response.json()) as EditDraft;
      setDraft((current) =>
        current?.updatedAt === snapshot.updatedAt ? saved : current,
      );
      setSaveStatus("saved");
      return true;
    };
    const chained = saveChain.current.then(request, request);
    saveChain.current = chained.then(
      () => undefined,
      () => undefined,
    );
    return chained;
  }

  function updateDraft(update: (current: EditDraft) => EditDraft) {
    setDraft((current) => {
      if (!current) return current;
      const next = { ...update(current), updatedAt: current.updatedAt };
      queueSave(next);
      return next;
    });
  }

  async function startEditing() {
    setError("");
    const response = await apiFetch(`${apiUrl}/characters/${id}/edit-draft`, {
      method: "POST",
    });
    if (!response.ok) {
      setError(t("validation"));
      return;
    }
    setDraft((await response.json()) as EditDraft);
    setSaveStatus("saved");
    setTab("sheet");
  }

  async function cancelEditing() {
    const didSave = await saveDraft();
    if (didSave) setDraft(null);
  }

  async function discardEditing() {
    const response = await apiFetch(`${apiUrl}/characters/${id}/edit-draft`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError(t("validation"));
      return;
    }
    setDraft(null);
    setSaveStatus("idle");
    await load();
  }

  async function publish() {
    if (!draft || draft.conflicts.length) return;
    if (!(await saveDraft())) return;
    const response = await apiFetch(
      `${apiUrl}/characters/${id}/edit-draft/publish`,
      { method: "POST" },
    );
    if (response.ok) {
      setDraft(null);
      setSaveStatus("idle");
      await load();
      return;
    }
    if (response.status === 422) {
      const body = (await response.json()) as { conflicts?: Conflict[] };
      setDraft((current) =>
        current
          ? { ...current, conflicts: body.conflicts ?? current.conflicts }
          : current,
      );
    }
    setError(t("validation"));
  }

  async function uploadPortrait(file: File) {
    const form = new FormData();
    form.append("file", file);
    const response = await apiFetch(`${apiUrl}/media`, {
      method: "POST",
      body: form,
    });
    if (!response.ok) {
      setError(t("uploadFailed"));
      return;
    }
    const asset = (await response.json()) as { id: string };
    updateDraft((current) => ({ ...current, imageAssetId: asset.id }));
  }

  function queuePlayStateUpdate(patch: Record<string, string | number>) {
    const version = ++playStateVersion.current;
    const snapshot = playState;
    if (!snapshot) return;
    setPlayState({ ...snapshot, ...patch });
    const request = async () => {
      const response = await apiFetch(`${apiUrl}/characters/${id}/play-state`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!response.ok) {
        setError(t("ownerState"));
        await load();
        return;
      }
      const canonical = (await response.json()) as PlayState;
      if (playStateVersion.current === version) setPlayState(canonical);
    };
    const chained = playStateSaveChain.current.then(request, request);
    playStateSaveChain.current = chained.then(
      () => undefined,
      () => undefined,
    );
  }

  async function putRitual(ritualSlug: string, rank: number) {
    const response = await apiFetch(
      `${apiUrl}/characters/${id}/rituals/${encodeURIComponent(ritualSlug)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rank }),
      },
    );
    if (!response.ok) setError(t("ownerState"));
    else await load();
  }
  async function removeRitual(ritualSlug: string) {
    const response = await apiFetch(
      `${apiUrl}/characters/${id}/rituals/${encodeURIComponent(ritualSlug)}`,
      { method: "DELETE" },
    );
    if (!response.ok) setError(t("ownerState"));
    else await load();
  }
  async function addItem(event: FormEvent) {
    event.preventDefault();
    const response = await apiFetch(`${apiUrl}/characters/${id}/inventory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!response.ok) {
      setError(t("gmInventory"));
      return;
    }
    setItem({ name: "", quantity: 1, notes: "" });
    void load();
  }
  async function removeItem(inventoryId: string) {
    const response = await apiFetch(
      `${apiUrl}/characters/${id}/inventory/${inventoryId}`,
      { method: "DELETE" },
    );
    if (!response.ok) setError(t("gmInventory"));
    else void load();
  }
  async function copy() {
    const response = await apiFetch(`${apiUrl}/characters/${id}/copy`, {
      method: "POST",
    });
    if (response.ok) router.push("/characters");
    else setError(t("ownerCopy"));
  }
  async function archive() {
    if (!window.confirm(t("archiveConfirm"))) return;
    const response = await apiFetch(`${apiUrl}/characters/${id}/archive`, {
      method: "POST",
    });
    if (response.ok) void load();
    else setError(t("ownerArchive"));
  }

  if (!character)
    return (
      <p className="py-8 text-sm text-zinc-500">
        {t("loading")} {error}
      </p>
    );
  const isEditing = draft !== null;
  const viewed = draft ?? character;
  const isArchived = character.status === "archived";
  const canEdit =
    character.kind === "pc" &&
    character.permissions.canEditPermanentData &&
    !isArchived;
  const selectedClass = rules?.classes.find(
    (entry) => entry.slug === draft?.characterClass,
  );
  const paths = selectedClass?.paths ?? [];
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-4">
      <Link
        href="/characters"
        className="text-xs uppercase tracking-widest text-zinc-500"
      >
        ← {t("sheets")}
      </Link>
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-red-400">
            {character.kind === "pc" ? t("pc") : t("npc")}
          </p>
          <h1 className="font-serif text-3xl text-zinc-100">{viewed.name}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {viewed.characterClass ?? t("narrativeNpc")} ·{" "}
            {viewed.path ?? t("noPath")} ·{" "}
            {t("nexValue", { value: viewed.nex })}
          </p>
          {character.campaignName ? (
            <p className="mt-1 text-xs text-zinc-500">
              Campanha: {character.campaignName} · {character.status}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && !isEditing && (
            <button
              onClick={() => void startEditing()}
              className="rounded bg-red-700 px-3 py-2 text-sm text-white"
            >
              {character.hasEditDraft ? "Retomar edição" : "Editar ficha"}
            </button>
          )}
          {canEdit && character.hasEditDraft && !isEditing && (
            <button
              onClick={() => void discardEditing()}
              className="rounded border border-red-900 px-3 py-2 text-sm text-red-300"
            >
              Descartar alterações
            </button>
          )}
          {character.kind === "pc" && character.permissions.canCopy && (
            <button
              onClick={() => void copy()}
              className="rounded border border-zinc-700 px-3 py-2 text-sm text-zinc-200"
            >
              {t("copy")}
            </button>
          )}
          {character.kind === "pc" &&
          !character.campaignId &&
          !isArchived &&
          character.permissions.canEditPermanentData ? (
            <button
              onClick={() => void archive()}
              className="rounded border border-red-900 px-3 py-2 text-sm text-red-300"
            >
              {t("archive")}
            </button>
          ) : null}
          {character.kind === "npc" &&
          character.permissions.canEditPermanentData &&
          !isArchived ? (
            <>
              <Link
                href={`/characters/${character.id}/edit`}
                className="rounded bg-red-700 px-3 py-2 text-sm text-white"
              >
                Editar NPC
              </Link>
              <button
                onClick={() => void archive()}
                className="rounded border border-red-900 px-3 py-2 text-sm text-red-300"
              >
                {t("archive")}
              </button>
            </>
          ) : null}
        </div>
      </header>
      {error && (
        <p
          className="rounded border border-red-900 bg-red-950/20 p-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </p>
      )}
      {isEditing && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-red-900 bg-red-950/20 p-3 text-sm text-zinc-200">
          <span>
            {saveStatus === "saving"
              ? t("saving")
              : saveStatus === "saved"
                ? t("saved")
                : saveStatus === "error"
                  ? "Erro ao salvar"
                  : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => void cancelEditing()}
              className="rounded border border-zinc-700 px-3 py-1"
            >
              Cancelar
            </button>
            <button
              onClick={() => void discardEditing()}
              className="rounded border border-red-900 px-3 py-1 text-red-300"
            >
              Descartar alterações
            </button>
            <button
              disabled={saveStatus === "saving" || draft.conflicts.length > 0}
              onClick={() => void publish()}
              className="rounded bg-red-700 px-3 py-1 disabled:opacity-40"
            >
              Salvar alterações
            </button>
          </div>
        </div>
      )}
      <nav aria-label="Ficha" className="flex gap-2 border-b border-zinc-800">
        {(
          [
            ["sheet", "Ficha"],
            ["build", "Perícias e poderes"],
            ["description", "Descrição e histórico"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-selected={tab === key}
            className={`border-b-2 px-3 py-2 text-sm ${tab === key ? "border-red-600 text-zinc-100" : "border-transparent text-zinc-500"}`}
          >
            {label}
          </button>
        ))}
      </nav>
      <section className="grid gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-5 sm:grid-cols-3">
        {Object.entries(character.derived).map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
              {t(
                `derived.${derivedLabels[label as keyof typeof derivedLabels]}`,
              )}
            </p>
            <p className="text-lg text-zinc-100">
              {value ?? t("unavailableValue")}
            </p>
          </div>
        ))}
      </section>
      {tab === "sheet" && (
        <SheetTab
          character={viewed}
          draft={draft}
          rules={rules}
          paths={paths}
          onUpdate={updateDraft}
          onUpload={uploadPortrait}
          t={t}
          apiUrl={apiUrl}
        />
      )}
      {tab === "build" && (
        <BuildTab
          draft={draft}
          character={character}
          rules={rules}
          onUpdate={updateDraft}
          t={t}
        />
      )}
      {tab === "description" && (
        <DescriptionTab
          character={viewed}
          draft={draft}
          onUpdate={updateDraft}
          t={t}
        />
      )}
      {isEditing && draft.conflicts.length > 0 && (
        <ConflictList conflicts={draft.conflicts} />
      )}
      {playState && (
        <div className="space-y-6">
          <ResourcePanel
            state={playState}
            canEdit={character.permissions.canEditPlayState && !isArchived}
            onChange={queuePlayStateUpdate}
            t={t}
          />
          {character.kind === "pc" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <EffectsPanel
                state={playState}
                canEdit={character.permissions.canEditPlayState && !isArchived}
                onChange={queuePlayStateUpdate}
                t={t}
              />
              <RitualPanel
                state={playState}
                rules={rules}
                characterClass={character.characterClass}
                nex={character.nex}
                canManage={
                  character.permissions.canManageRituals && !isArchived
                }
                onPut={putRitual}
                onRemove={removeRitual}
              />
              <InventoryPanel
                state={playState}
                canManage={
                  character.permissions.canManageInventory && !isArchived
                }
                item={item}
                setItem={setItem}
                onAdd={addItem}
                onRemove={removeItem}
                t={t}
              />
            </div>
          )}
        </div>
      )}
      {!character.campaignId && <p className="rounded border border-zinc-800 p-4 text-sm text-zinc-500">{t("noCampaignState")}</p>}
    </main>
  );
}

function SheetTab({
  character,
  draft,
  rules,
  paths,
  onUpdate,
  onUpload,
  t,
  apiUrl,
}: {
  character: Character | EditDraft;
  draft: EditDraft | null;
  rules: RulesCatalog | null;
  paths: Array<{ slug: string; name: string }>;
  onUpdate: (update: (current: EditDraft) => EditDraft) => void;
  onUpload: (file: File) => Promise<void>;
  t: ReturnType<typeof useTranslations>;
  apiUrl: string;
}) {
  const editable = draft !== null;
  const set = (key: keyof EditDraft, value: string | number | null) =>
    onUpdate((current) => ({ ...current, [key]: value }));
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        {character.imageAssetId ? (
          <img
            src={`${apiUrl}/media/${character.imageAssetId}/file`}
            alt={t("portrait")}
            className="h-44 w-full rounded object-cover"
          />
        ) : (
          <div className="grid h-44 place-items-center rounded bg-zinc-900 text-sm text-zinc-500">
            {t("portrait")}
          </div>
        )}
        {editable && (
          <label className="mt-3 block text-sm text-zinc-300">
            {t("portrait")}
            <input
              className="mt-2 block w-full text-xs"
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onUpload(file);
              }}
            />
          </label>
        )}
      </section>
      <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label={t("name")}
            value={character.name}
            editable={editable}
            onChange={(value) => set("name", value)}
          />
          <SelectField
            label={t("origin")}
            value={character.origin ?? ""}
            editable={editable}
            options={rules?.origins ?? []}
            onChange={(value) => set("origin", value || null)}
          />
          <SelectField
            label={t("class")}
            value={character.characterClass ?? ""}
            editable={editable}
            options={rules?.classes ?? []}
            onChange={(value) => set("characterClass", value || null)}
          />
          <SelectField
            label={t("path")}
            value={character.path ?? ""}
            editable={editable}
            options={paths}
            onChange={(value) => set("path", value || null)}
          />
          <Field
            label={t("nex")}
            value={String(character.nex)}
            editable={editable}
            type="number"
            onChange={(value) => set("nex", Number(value))}
          />
        </div>
        <h2 className="font-serif text-xl text-zinc-100">{t("attributes")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(5,minmax(0,1fr))]">
          {attributeKeys.map((key) => (
            <Field
              key={key}
              label={t(`attribute.${key}`)}
              value={String(character.attributes[key])}
              editable={editable}
              type="number"
              onChange={(value) =>
                onUpdate((current) => ({
                  ...current,
                  attributes: { ...current.attributes, [key]: Number(value) },
                }))
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
function BuildTab({
  draft,
  character,
  rules,
  onUpdate,
  t,
}: {
  draft: EditDraft | null;
  character: Character;
  rules: RulesCatalog | null;
  onUpdate: (update: (current: EditDraft) => EditDraft) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const build = draft ?? character;
  const toggleSkill = (name: string) =>
    onUpdate((current) => ({
      ...current,
      skills: current.skills.some((skill) => skill.name === name)
        ? current.skills.filter((skill) => skill.name !== name)
        : [...current.skills, { name, degree: "trained" }],
    }));
  const togglePower = (name: string) =>
    onUpdate((current) => ({
      ...current,
      powers: current.powers.some((power) => power.name === name)
        ? current.powers.filter((power) => power.name !== name)
        : [...current.powers, { name, rank: 1 }],
    }));
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <SelectionList
        title={t("skills")}
        entries={
          rules?.skills ??
          build.skills.map((skill) => ({ slug: skill.name, name: skill.name }))
        }
        selected={build.skills}
        editable={Boolean(draft)}
        onToggle={toggleSkill}
        onDegree={(name, degree) =>
          onUpdate((current) => ({
            ...current,
            skills: current.skills.map((skill) =>
              skill.name === name ? { ...skill, degree } : skill,
            ),
          }))
        }
      />
      <SelectionList
        title={t("powers")}
        entries={
          rules?.powers ??
          build.powers.map((power) => ({
            slug: power.name,
            name: power.name,
            maxRank: 5,
          }))
        }
        selected={build.powers}
        editable={Boolean(draft)}
        onToggle={togglePower}
        onRank={(name, rank) =>
          onUpdate((current) => ({
            ...current,
            powers: current.powers.map((power) =>
              power.name === name ? { ...power, rank } : power,
            ),
          }))
        }
      />
    </div>
  );
}
function SelectionList({
  title,
  entries,
  selected,
  editable,
  onToggle,
  onDegree,
  onRank,
}: {
  title: string;
  entries: Array<{ slug: string; name: string; maxRank?: number }>;
  selected: Skill[] | Power[];
  editable: boolean;
  onToggle: (name: string) => void;
  onDegree?: (name: string, degree: Skill["degree"]) => void;
  onRank?: (name: string, rank: number) => void;
}) {
  const isSkill = onDegree !== undefined;
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="font-serif text-xl text-zinc-100">{title}</h2>
      <ul className="mt-3 space-y-2">
        {entries.map((entry) => {
          const choice = selected.find((value) => value.name === entry.slug);
          return (
            <li
              key={entry.slug}
              className="flex flex-wrap items-center gap-2 rounded border border-zinc-800 p-2 text-sm text-zinc-300"
            >
              <input
                type="checkbox"
                checked={Boolean(choice)}
                disabled={!editable}
                onChange={() => onToggle(entry.slug)}
              />
              <span className="flex-1">{entry.name}</span>
              {choice && isSkill ? (
                <select
                  value={(choice as Skill).degree}
                  disabled={!editable}
                  onChange={(event) =>
                    onDegree?.(
                      entry.slug,
                      event.target.value as Skill["degree"],
                    )
                  }
                  className="rounded bg-zinc-900 p-1"
                >
                  <option value="trained">Treinada</option>
                  <option value="veteran">Veterana</option>
                  <option value="expert">Expert</option>
                </select>
              ) : choice ? (
                <input
                  type="number"
                  min="1"
                  max={entry.maxRank ?? 5}
                  value={(choice as Power).rank}
                  disabled={!editable}
                  onChange={(event) =>
                    onRank?.(entry.slug, Number(event.target.value))
                  }
                  className="w-14 rounded bg-zinc-900 p-1"
                />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
function DescriptionTab({
  character,
  draft,
  onUpdate,
  t,
}: {
  character: Character | EditDraft;
  draft: EditDraft | null;
  onUpdate: (update: (current: EditDraft) => EditDraft) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const editable = draft !== null;
  const fields: Array<[keyof EditDraft, string, boolean]> = [
    ["concept", t("concept"), false],
    ["gender", "Gênero", false],
    ["age", "Idade", false],
    ["appearance", "Aparência", true],
    ["personality", "Personalidade", true],
    ["history", "História", true],
    ["objective", "Objetivo", true],
    ["playerNotes", "Notas do jogador", true],
  ];
  return (
    <section className="grid gap-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5 sm:grid-cols-2">
      {fields.map(([key, label, multiline]) => (
        <label
          key={key}
          className={`grid gap-1 text-sm text-zinc-300 ${multiline ? "sm:col-span-2" : ""}`}
        >
          {label}
          {multiline ? (
            <textarea
              value={String((character as Partial<EditDraft>)[key] ?? "")}
              readOnly={!editable}
              onChange={(event) =>
                onUpdate((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              className="min-h-24 rounded border border-zinc-700 bg-zinc-900 p-2 text-white"
            />
          ) : (
            <input
              type={key === "age" ? "number" : "text"}
              value={String((character as Partial<EditDraft>)[key] ?? "")}
              readOnly={!editable}
              onChange={(event) =>
                onUpdate((current) => ({
                  ...current,
                  [key]:
                    key === "age" && event.target.value
                      ? Number(event.target.value)
                      : event.target.value || null,
                }))
              }
              className="rounded border border-zinc-700 bg-zinc-900 p-2 text-white"
            />
          )}
        </label>
      ))}
    </section>
  );
}
function ConflictList({ conflicts }: { conflicts: Conflict[] }) {
  const grouped = Object.groupBy(conflicts, (conflict) => conflict.field);
  return (
    <section
      className="rounded-xl border border-red-900 bg-red-950/20 p-5"
      role="alert"
    >
      <h2 className="font-serif text-xl text-red-100">Conflitos a resolver</h2>
      {Object.entries(grouped).map(([field, fieldConflicts]) => (
        <div key={field} className="mt-3">
          <h3 className="text-sm font-semibold text-red-200">{field}</h3>
          <ul className="list-disc pl-5 text-sm text-red-100">
            {fieldConflicts?.map((conflict) => (
              <li key={`${conflict.code}-${conflict.optionId ?? ""}`}>
                {conflict.message}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
function ResourcePanel({
  state,
  canEdit,
  onChange,
  t,
}: {
  state: PlayState;
  canEdit: boolean;
  onChange: (patch: Record<string, number>) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="font-serif text-xl text-zinc-100">{t("state")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {resourceDefinitions.map(
          ({ currentKey, maximumKey, colorClass, label }) => {
            const current = state[currentKey];
            const maximum = state[maximumKey];
            if (current === null || maximum === null) return null;
            const percentage = maximum ? (current / maximum) * 100 : 0;
            const status =
              current === 0
                ? "Crítico"
                : percentage <= LOW_RESOURCE_PERCENTAGE
                  ? "Baixo"
                  : null;
            return (
              <div
                key={currentKey}
                className="rounded border border-zinc-800 p-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
                    {label}
                  </span>
                  <span className="text-sm text-zinc-100">
                    {current} / {maximum}
                  </span>
                </div>
                <div
                  role="progressbar"
                  aria-label={label}
                  aria-valuemin={0}
                  aria-valuemax={maximum}
                  aria-valuenow={current}
                  className="mt-2 h-3 overflow-hidden rounded bg-zinc-800"
                >
                  <div
                    className={`h-full ${colorClass}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                {status && (
                  <p
                    className={`mt-2 text-xs font-semibold ${current === 0 ? "text-red-300" : "text-amber-300"}`}
                  >
                    {status}
                  </p>
                )}
                {canEdit ? (
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={`Diminuir ${label}`}
                      onClick={() =>
                        onChange({ [currentKey]: Math.max(0, current - 1) })
                      }
                      className="rounded border border-zinc-700 px-2 py-1 text-sm text-zinc-100"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="0"
                      max={maximum}
                      value={current}
                      onChange={(event) =>
                        onChange({ [currentKey]: Number(event.target.value) })
                      }
                      className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 p-1 text-center text-sm text-white"
                    />
                    <button
                      type="button"
                      aria-label={`Aumentar ${label}`}
                      onClick={() =>
                        onChange({
                          [currentKey]: Math.min(maximum, current + 1),
                        })
                      }
                      className="rounded border border-zinc-700 px-2 py-1 text-sm text-zinc-100"
                    >
                      +
                    </button>
                  </div>
                ) : null}
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}
function EffectsPanel({
  state,
  canEdit,
  onChange,
  t,
}: {
  state: PlayState;
  canEdit: boolean;
  onChange: (patch: Record<string, string>) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="font-serif text-xl text-zinc-100">Efeitos e condições</h2>
      <label className="grid gap-1 text-xs uppercase text-zinc-500">
        {t("conditions")}
        <textarea
          key={`conditions-${state.updatedAt}`}
          defaultValue={state.conditions}
          readOnly={!canEdit}
          onBlur={(event) =>
            canEdit && onChange({ conditions: event.target.value })
          }
          className="min-h-20 rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
        />
      </label>
      <label className="grid gap-1 text-xs uppercase text-zinc-500">
        {t("temporaryEffects")}
        <textarea
          key={`temporary-effects-${state.updatedAt}`}
          defaultValue={state.temporaryEffects}
          readOnly={!canEdit}
          onBlur={(event) =>
            canEdit && onChange({ temporaryEffects: event.target.value })
          }
          className="min-h-20 rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
        />
      </label>
    </section>
  );
}
function RitualPanel({
  state,
  rules,
  characterClass,
  nex,
  canManage,
  onPut,
  onRemove,
}: {
  state: PlayState;
  rules: RulesCatalog | null;
  characterClass: string | null;
  nex: number;
  canManage: boolean;
  onPut: (slug: string, rank: number) => Promise<void>;
  onRemove: (slug: string) => Promise<void>;
}) {
  const [selectedSlug, setSelectedSlug] = useState("");
  const availableRituals = (rules?.rituals ?? []).filter(
    (ritual) =>
      ritual.minNex <= nex &&
      (!ritual.requiredClassSlug ||
        ritual.requiredClassSlug === characterClass),
  );
  const selected = availableRituals.find(
    (ritual) => ritual.slug === selectedSlug,
  );
  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="font-serif text-xl text-zinc-100">Rituais</h2>
      <ul className="space-y-2">
        {state.rituals.map((ritual) => (
          <li
            key={ritual.slug}
            className="flex items-center gap-2 rounded border border-zinc-800 p-2 text-sm text-zinc-300"
          >
            <span className="flex-1">{ritual.name}</span>
            {canManage ? (
              <select
                aria-label={`Grau de ${ritual.name}`}
                value={ritual.rank}
                onChange={(event) =>
                  void onPut(ritual.slug, Number(event.target.value))
                }
                className="rounded bg-zinc-900 p-1"
              >
                {Array.from(
                  { length: ritual.maxRank },
                  (_, index) => index + 1,
                ).map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            ) : (
              <span>Grau {ritual.rank}</span>
            )}
            {canManage && (
              <button
                type="button"
                onClick={() => void onRemove(ritual.slug)}
                className="text-xs text-red-300"
              >
                Remover
              </button>
            )}
          </li>
        ))}
      </ul>
      {canManage && rules ? (
        <div className="flex gap-2">
          <select
            value={selectedSlug}
            onChange={(event) => setSelectedSlug(event.target.value)}
            className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
          >
            <option value="">Selecionar ritual</option>
            {availableRituals
              .filter(
                (ritual) =>
                  !state.rituals.some((entry) => entry.slug === ritual.slug),
              )
              .map((ritual) => (
                <option key={ritual.slug} value={ritual.slug}>
                  {ritual.name}
                </option>
              ))}
          </select>
          <button
            type="button"
            disabled={!selected}
            onClick={() => selected && void onPut(selected.slug, 1)}
            className="rounded bg-red-700 px-3 text-sm text-white disabled:opacity-40"
          >
            Adicionar
          </button>
        </div>
      ) : null}
    </section>
  );
}
function InventoryPanel({
  state,
  canManage,
  item,
  setItem,
  onAdd,
  onRemove,
  t,
}: {
  state: PlayState;
  canManage: boolean;
  item: { name: string; quantity: number; notes: string };
  setItem: (item: { name: string; quantity: number; notes: string }) => void;
  onAdd: (event: FormEvent) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="font-serif text-xl text-zinc-100">{t("inventory")}</h2>
      <ul className="space-y-2">
        {state.inventory.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center justify-between rounded border border-zinc-800 p-2 text-sm text-zinc-300"
          >
            <span>
              {entry.name} × {entry.quantity}
              {entry.notes ? ` — ${entry.notes}` : ""}
            </span>
            {canManage && (
              <button
                onClick={() => void onRemove(entry.id)}
                className="text-xs text-red-300"
              >
                {t("remove")}
              </button>
            )}
          </li>
        ))}
      </ul>
      {canManage ? (
        <form onSubmit={(event) => void onAdd(event)} className="grid gap-2">
          <input
            required
            placeholder={t("itemName")}
            value={item.name}
            onChange={(event) => setItem({ ...item, name: event.target.value })}
            className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
          />
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(event) =>
              setItem({ ...item, quantity: Number(event.target.value) })
            }
            className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
          />
          <input
            placeholder={t("gmNote")}
            value={item.notes}
            onChange={(event) =>
              setItem({ ...item, notes: event.target.value })
            }
            className="rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
          />
          <button className="rounded bg-red-700 px-3 py-2 text-sm text-white">
            {t("addItem")}
          </button>
        </form>
      ) : (
        <p className="text-xs text-zinc-500">{t("gmInventory")}</p>
      )}
    </section>
  );
}
function Field({
  label,
  value,
  editable,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  editable: boolean;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="grid min-w-0 gap-1 text-sm text-zinc-300">
      {label}
      <input
        type={type}
        value={value}
        readOnly={!editable}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 w-full rounded border border-zinc-700 bg-zinc-900 p-2 text-white"
      />
    </label>
  );
}
function SelectField({
  label,
  value,
  options,
  editable,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ slug: string; name: string }>;
  editable: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1 text-sm text-zinc-300">
      {label}
      <select
        value={value}
        disabled={!editable}
        onChange={(event) => onChange(event.target.value)}
        className="rounded border border-zinc-700 bg-zinc-900 p-2 text-white"
      >
        <option value="">—</option>
        {options.map((option) => (
          <option key={option.slug} value={option.slug}>
            {option.name}
          </option>
        ))}
      </select>
    </label>
  );
}
