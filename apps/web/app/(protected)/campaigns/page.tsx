"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Campaign = {
  id: string;
  ownerUserId: string | null;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type CampaignMember = {
  userId: string;
  shortCode: string;
  name: string;
  picture?: string;
  role: "gm" | "player" | "spectator";
};

type CampaignDetail = Campaign & {
  members: CampaignMember[];
};

const emptyForm = {
  name: "",
  description: "",
};

export default function CampaignsPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [memberShortCode, setMemberShortCode] = useState("");
  const [memberRole, setMemberRole] = useState<CampaignMember["role"]>("player");
  const [composerOpen, setComposerOpen] = useState(false);

  async function loadCampaigns() {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/campaigns`, {
        credentials: "include",
      });
      const data = await response.json();
      setCampaigns(Array.isArray(data) ? data : []);
      if (!Array.isArray(data) || data.length === 0) {
        setComposerOpen(true);
      }
      if (!selectedCampaign && data?.[0]?.id) {
        await loadCampaign(data[0].id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadCampaign(campaignId: string) {
    const response = await fetch(`${apiUrl}/campaigns/${campaignId}`, {
      credentials: "include",
    });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    setSelectedCampaign(data);
    setEditingId(data.id);
    setForm({
      name: data.name ?? "",
      description: data.description ?? "",
    });
    setComposerOpen(false);
  }

  useEffect(() => {
    async function run() {
      await loadCampaigns();
    }

    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `${apiUrl}/campaigns/${editingId}` : `${apiUrl}/campaigns`;

    await fetch(url, {
      method,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
      }),
    });

    setForm(emptyForm);
    setEditingId(null);
    setComposerOpen(false);
    await loadCampaigns();
  }

  async function deleteCampaign(campaignId: string) {
    await fetch(`${apiUrl}/campaigns/${campaignId}`, {
      method: "DELETE",
      credentials: "include",
    });
    setSelectedCampaign(null);
    setEditingId(null);
    setForm(emptyForm);
    await loadCampaigns();
  }

  async function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCampaign) {
      return;
    }

    await fetch(`${apiUrl}/campaigns/${selectedCampaign.id}/members`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shortCode: memberShortCode,
        role: memberRole,
      }),
    });

    setMemberShortCode("");
    setMemberRole("player");
    await loadCampaign(selectedCampaign.id);
  }

  async function removeMember(memberUserId: string) {
    if (!selectedCampaign) {
      return;
    }

    await fetch(
      `${apiUrl}/campaigns/${selectedCampaign.id}/members/${memberUserId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
    await loadCampaign(selectedCampaign.id);
  }

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/home"
            className="mb-3 inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="h-3 w-3" />
            Voltar
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-100">Campanhas</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Crie campanhas, edite a mesa e adicione jogadores pelo short code.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-zinc-900 bg-zinc-950/80">
          <div className="border-b border-zinc-900 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium text-zinc-100">Campanhas salvas</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Nome, descrição e membros. Sem detalhes extras na listagem.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm);
                setComposerOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Nova campanha
            </button>
          </div>
          <div className="px-5 py-4">
            {loading ? (
              <div className="text-sm text-zinc-500">Carregando...</div>
            ) : (
              <ul className="space-y-3">
                {campaigns.map((campaign) => (
                  <li
                    key={campaign.id}
                    className={`rounded-2xl border px-4 py-4 ${
                      selectedCampaign?.id === campaign.id
                        ? "border-red-900/60 bg-red-950/20"
                        : "border-zinc-800 bg-zinc-950/60"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => void loadCampaign(campaign.id)}
                      className="block w-full text-left"
                    >
                      <div className="font-medium text-zinc-100">{campaign.name}</div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {campaign.description || "Sem descrição"}
                      </div>
                    </button>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(campaign.id);
                          setForm({
                            name: campaign.name,
                            description: campaign.description ?? "",
                          });
                          setComposerOpen(true);
                        }}
                        className="rounded-md border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-900"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteCampaign(campaign.id)}
                        className="rounded-md border border-red-950/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-950/20"
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {composerOpen ? (
            <form className="space-y-4 border-t border-zinc-900 p-5" onSubmit={submitCampaign}>
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {editingId ? "Edição" : "Criação"}
                </div>
                <h3 className="mt-1 text-lg font-medium text-zinc-100">
                  {editingId ? "Editar campanha" : "Nova campanha"}
                </h3>
              </div>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Nome
                </span>
                <input
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  Descrição
                </span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </label>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(emptyForm);
                    setComposerOpen(campaigns.length === 0);
                  }}
                  className="text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"
                >
                  Cancelar
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                  <Plus className="h-4 w-4" />
                  Salvar
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section className="rounded-3xl border border-zinc-900 bg-zinc-950/80">
          <div className="border-b border-zinc-900 px-5 py-4">
            <h2 className="text-xl font-medium text-zinc-100">Membros da campanha</h2>
          </div>
          {selectedCampaign ? (
            <div className="space-y-5 p-5">
              <div>
                <div className="text-lg font-medium text-zinc-100">{selectedCampaign.name}</div>
                <div className="mt-1 text-sm text-zinc-500">
                  ID curto dos jogadores e papel na mesa.
                </div>
              </div>

              <form className="grid gap-3 sm:grid-cols-[1fr_140px_auto]" onSubmit={addMember}>
                <input
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  placeholder="Short code do usuário"
                  value={memberShortCode}
                  onChange={(event) => setMemberShortCode(event.target.value)}
                />
                <select
                  className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={memberRole}
                  onChange={(event) =>
                    setMemberRole(event.target.value as CampaignMember["role"])
                  }
                >
                  <option value="player">Player</option>
                  <option value="gm">GM</option>
                  <option value="spectator">Spectator</option>
                </select>
                <button className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                  Adicionar
                </button>
              </form>

              <div className="space-y-2">
                {selectedCampaign.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                  >
                    <div>
                      <div className="font-medium text-zinc-100">{member.name}</div>
                      <div className="text-xs text-zinc-500">
                        {member.shortCode} · {member.role}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void removeMember(member.userId)}
                      className="inline-flex items-center gap-1 rounded-md border border-red-950/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-950/20"
                    >
                      <Trash2 className="h-3 w-3" />
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-zinc-500">Selecione uma campanha para ver membros.</div>
          )}
        </section>
      </div>
    </div>
  );
}
