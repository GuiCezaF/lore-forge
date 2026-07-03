"use client";

import { FormEvent, useEffect, useState } from "react";
import { Pencil, Plus, Trash2, RefreshCw, Copy } from "lucide-react";
import {
  PageSection,
  cx,
  dangerButtonClassName,
  fieldCaptionClassName,
  fieldLabelClassName,
  inputClassName,
  primaryButtonClassName,
  secondaryButtonClassName,
  subtleButtonClassName,
  textareaClassName,
} from "@/app/components/app-ui";

type FieldType = "text" | "textarea" | "select" | "json";
type CrudItem = { id: string; [key: string]: unknown };

export type CrudField = {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
  visible?: (values: Record<string, string>) => boolean;
};

export type CrudPanelProps = {
  title: string;
  description?: string;
  endpoint: string;
  fields: CrudField[];
  emptyValues: Record<string, string>;
  itemLabel: (item: CrudItem) => string;
  itemMeta?: (item: CrudItem) => string;
  itemSubline?: (item: CrudItem) => string;
  cloneEndpoint?: (item: CrudItem) => string | null;
  filterItems?: (item: CrudItem) => boolean;
  buildPayload: (values: Record<string, string>) => Record<string, unknown>;
  mapItemToForm: (item: CrudItem) => Record<string, string>;
};

function buildHeaders() {
  return {
    "Content-Type": "application/json",
  };
}

export function CrudPanel({
  title,
  description,
  endpoint,
  fields,
  emptyValues,
  itemLabel,
  itemMeta,
  itemSubline,
  cloneEndpoint,
  filterItems,
  buildPayload,
  mapItemToForm,
}: CrudPanelProps) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const [items, setItems] = useState<CrudItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyValues);
  const [error, setError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const visibleItems = filterItems ? items.filter(filterItems) : items;

  async function loadItems() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}${endpoint}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to load ${endpoint}`);
      }
      const data = await response.json();
      const nextItems = Array.isArray(data) ? (data as CrudItem[]) : [];
      setItems(nextItems);
      if (nextItems.length === 0) {
        setComposerOpen(true);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load data");
      setItems([]);
      setComposerOpen(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function run() {
      await loadItems();
    }

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, apiUrl]);

  function startCreate() {
    setSelectedId(null);
    setForm(emptyValues);
    setComposerOpen(true);
  }

  function startEdit(item: CrudItem) {
    setSelectedId(item.id);
    setForm(mapItemToForm(item));
    setComposerOpen(true);
  }

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = buildPayload(form);
      const response = await fetch(
        `${apiUrl}${selectedId ? `${endpoint}/${selectedId}` : endpoint}`,
        {
          method: selectedId ? "PATCH" : "POST",
          credentials: "include",
          headers: buildHeaders(),
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to save ${title}`);
      }
      await loadItems();
      startCreate();
      setComposerOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : `Failed to save ${title}`,
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(itemId: string) {
    setError(null);
    try {
      const response = await fetch(`${apiUrl}${endpoint}/${itemId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete ${title}`);
      }
      if (selectedId === itemId) {
        startCreate();
      }
      await loadItems();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : `Failed to delete ${title}`,
      );
    }
  }

  async function handleClone(item: CrudItem) {
    if (!cloneEndpoint) {
      return;
    }
    const target = cloneEndpoint(item);
    if (!target) {
      return;
    }

    setError(null);
    try {
      const response = await fetch(`${apiUrl}${target}`, {
        method: "POST",
        credentials: "include",
        headers: buildHeaders(),
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        throw new Error(`Failed to clone ${title}`);
      }
      await loadItems();
    } catch (cloneError) {
      setError(cloneError instanceof Error ? cloneError.message : `Failed to clone ${title}`);
    }
  }

  return (
    <PageSection
      title={title}
      description={description}
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadItems()}
            className={secondaryButtonClassName}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </button>
          <button
            type="button"
            onClick={startCreate}
            className={cx(
              secondaryButtonClassName,
              "border-red-900/40 bg-red-950/30 text-red-300 hover:bg-red-950/50",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
            Novo
          </button>
        </div>
      }
    >
      <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="border-b border-zinc-900 lg:border-b-0 lg:border-r">
          <div className="border-b border-zinc-900 px-6 py-4">
            <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              {visibleItems.length} registro{visibleItems.length === 1 ? "" : "s"}
            </div>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-zinc-500">Carregando...</div>
          ) : visibleItems.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">Nenhum registro encontrado.</div>
          ) : (
            <ul className="space-y-3 p-4">
              {visibleItems.map((item) => {
                const clonePath = cloneEndpoint?.(item);
                const active = selectedId === item.id;

                return (
                  <li
                    key={item.id}
                    className={cx(
                      "rounded-2xl border p-4 transition",
                      active
                        ? "border-red-900/50 bg-red-950/20"
                        : "border-zinc-900 bg-zinc-950/50 hover:border-zinc-800",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="block w-full text-left"
                    >
                      <div className="font-medium text-zinc-100">{itemLabel(item)}</div>
                      {itemSubline ? (
                        <div className="mt-1 text-sm text-zinc-500">{itemSubline(item)}</div>
                      ) : null}
                      {itemMeta ? (
                        <div className="mt-3 text-[11px] uppercase tracking-[0.2em] text-zinc-600">
                          {itemMeta(item)}
                        </div>
                      ) : null}
                    </button>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className={cx(secondaryButtonClassName, "px-2.5 py-1.5")}
                      >
                        <Pencil className="h-3 w-3" />
                        Editar
                      </button>
                      {clonePath ? (
                        <button
                          type="button"
                          onClick={() => void handleClone(item)}
                          className={cx(secondaryButtonClassName, "px-2.5 py-1.5")}
                        >
                          <Copy className="h-3 w-3" />
                          Clonar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        className={cx(dangerButtonClassName, "px-2.5 py-1.5 text-xs")}
                      >
                        <Trash2 className="h-3 w-3" />
                        Excluir
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-6">
          {composerOpen ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {selectedId ? "Edição" : "Criação"}
                </div>
                <h3 className="text-xl font-semibold text-zinc-100">
                  {selectedId ? "Editar registro" : "Novo registro"}
                </h3>
              </div>

              {fields
                .filter((field) => field.visible?.(form) ?? true)
                .map((field) => {
                  return (
                    <label key={field.name} className={fieldLabelClassName}>
                      <span className={fieldCaptionClassName}>{field.label}</span>
                      {field.type === "textarea" || field.type === "json" ? (
                        <textarea
                          value={form[field.name] ?? ""}
                          onChange={(event) => updateField(field.name, event.target.value)}
                          placeholder={field.placeholder}
                          rows={field.type === "json" ? 8 : 4}
                          className={cx(
                            textareaClassName,
                            field.type === "json" && "font-mono text-xs",
                          )}
                        />
                      ) : field.type === "select" ? (
                        <select
                          value={form[field.name] ?? ""}
                          onChange={(event) => updateField(field.name, event.target.value)}
                          className={inputClassName}
                        >
                          <option value="">Selecione</option>
                          {field.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={form[field.name] ?? ""}
                          onChange={(event) => updateField(field.name, event.target.value)}
                          placeholder={field.placeholder}
                          className={inputClassName}
                        />
                      )}
                    </label>
                  );
                })}

              {error ? (
                <div className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => {
                    startCreate();
                    setComposerOpen(visibleItems.length === 0);
                  }}
                  className={subtleButtonClassName}
                >
                  Limpar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={primaryButtonClassName}
                >
                  {saving ? "Salvando..." : selectedId ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex h-full min-h-56 flex-col justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center">
              <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Fluxo enxuto
              </div>
              <h3 className="mt-3 text-xl font-semibold text-zinc-100">
                Abra o editor só quando precisar
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                A lista fica limpa por padrão. Use editar em um registro existente ou crie um novo item.
              </p>
              <button
                type="button"
                onClick={startCreate}
                className={cx(primaryButtonClassName, "mt-6 self-center")}
              >
                <Plus className="h-4 w-4" />
                Criar novo
              </button>
            </div>
          )}
        </div>
      </div>
    </PageSection>
  );
}
