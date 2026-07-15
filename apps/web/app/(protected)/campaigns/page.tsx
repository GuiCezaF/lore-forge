"use client";

import { type FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getBrowserApiUrl } from "@/lib/api-url";
import { apiFetch } from "@/lib/api-client";
import { useTranslations } from "next-intl";

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
  role: "player";
};

type CampaignDetail = Campaign & {
  members: CampaignMember[];
  characters?: Array<{
    id: string;
    ownerUserId: string | null;
    name: string;
    status: string;
    archiveReason: string | null;
  }>;
};
type Invitation = {
  invitation: { id: string; expiresAt: string };
  campaignName: string;
  invitedByName: string;
};
type ManagedInvitation = {
  id: string;
  invitedUserId: string;
  invitedUserName: string;
  invitedUserShortCode: string;
  expiresAt: string;
};
type AuthUser = { id: string };

const emptyForm = {
  name: "",
  description: "",
};

export default function CampaignsPage() {
  const t = useTranslations("campaigns");
  const apiUrl = getBrowserApiUrl();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] =
    useState<CampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [sheets, setSheets] = useState<
    Array<{
      id: string;
      name: string;
      campaignId: string | null;
      kind: string;
      status: string;
    }>
  >([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [managedInvitations, setManagedInvitations] = useState<
    ManagedInvitation[]
  >([]);
  const [spectatorActive, setSpectatorActive] = useState(false);
  const [spectatorLink, setSpectatorLink] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [templates, setTemplates] = useState<
    Array<{ id: string; name: string; status: string }>
  >([]);
  const [addingNpc, setAddingNpc] = useState(false);

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
    const me = currentUser;
    const isOwner = Boolean(me && data.ownerUserId === me.id);
    if (isOwner) {
      const invitationsResponse = await apiFetch(
        `${apiUrl}/campaigns/${campaignId}/invitations`,
      );
      if (invitationsResponse.ok)
        setManagedInvitations(
          (await invitationsResponse.json()) as ManagedInvitation[],
        );
      const spectatorResponse = await apiFetch(
        `${apiUrl}/campaigns/${campaignId}/spectator-access`,
      );
      if (spectatorResponse.ok) {
        const status = (await spectatorResponse.json()) as {
          isActive: boolean;
        };
        setSpectatorActive(status.isActive);
      }
    } else {
      setManagedInvitations([]);
      setSpectatorActive(false);
      setSpectatorLink(null);
    }
  }

  useEffect(() => {
    async function run() {
      await loadCampaigns();
    }

    void run();
    void apiFetch(`${apiUrl}/auth/me`).then(async (response) => {
      if (response.ok) setCurrentUser((await response.json()) as AuthUser);
    });
    void apiFetch(`${apiUrl}/campaigns/invitations/mine`).then(
      async (response) => {
        if (response.ok)
          setInvitations((await response.json()) as Invitation[]);
      },
    );
    void apiFetch(`${apiUrl}/characters`).then(async (response) => {
      if (response.ok) setSheets((await response.json()) as typeof sheets);
    });
    void apiFetch(`${apiUrl}/npc-templates`).then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json()) as Array<{
        id: string;
        name: string;
        status: string;
      }>;
      setTemplates(data.filter((template) => template.status === "active"));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentUser && selectedCampaign) void loadCampaign(selectedCampaign.id);
    // Re-read the selected campaign once the identity is available so owner-only
    // administration data is never fetched for a player.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function invitePlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCampaign || !inviteCode.trim()) return;
    const response = await apiFetch(
      `${apiUrl}/campaigns/${selectedCampaign.id}/invitations`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shortCode: inviteCode.trim() }),
      },
    );
    setNotice(response.ok ? t("inviteSent") : t("inviteFailed"));
    if (response.ok) {
      setInviteCode("");
      await loadCampaign(selectedCampaign.id);
    }
  }
  async function respond(invitationId: string, accepted: boolean) {
    const response = await apiFetch(
      `${apiUrl}/campaigns/invitations/${invitationId}/respond`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted }),
      },
    );
    if (!response.ok) {
      setNotice(t("respondFailed"));
      return;
    }
    setNotice(accepted ? t("joined") : t("declined"));
    const invitationsResponse = await apiFetch(
      `${apiUrl}/campaigns/invitations/mine`,
    );
    if (invitationsResponse.ok)
      setInvitations((await invitationsResponse.json()) as Invitation[]);
    await loadCampaigns();
  }
  async function cancelInvitation(invitationId: string) {
    if (!selectedCampaign) return;
    const response = await apiFetch(
      `${apiUrl}/campaigns/${selectedCampaign.id}/invitations/${invitationId}`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setNotice(t("cancelFailed"));
      return;
    }
    await loadCampaign(selectedCampaign.id);
  }

  async function createSpectatorAccess(path = "") {
    if (!selectedCampaign) return;
    const response = await apiFetch(
      `${apiUrl}/campaigns/${selectedCampaign.id}/spectator-access${path}`,
      { method: "POST" },
    );
    if (!response.ok) {
      setNotice("Não foi possível gerar o link de espectador.");
      return;
    }
    const { token } = (await response.json()) as { token: string };
    setSpectatorActive(true);
    setSpectatorLink(`${window.location.origin}/spectate/${token}`);
  }

  async function rotateSpectatorAccess() {
    if (
      !window.confirm(
        "Rotacionar o link? O link atual deixará de funcionar imediatamente.",
      )
    )
      return;
    setSpectatorLink(null);
    await createSpectatorAccess("/rotate");
  }

  async function revokeSpectatorAccess() {
    if (
      !selectedCampaign ||
      !window.confirm(
        "Revogar o link de espectador? Esta ação não pode ser desfeita.",
      )
    )
      return;
    setSpectatorLink(null);
    const response = await apiFetch(
      `${apiUrl}/campaigns/${selectedCampaign.id}/spectator-access`,
      { method: "DELETE" },
    );
    if (!response.ok) {
      setNotice("Não foi possível revogar o link de espectador.");
      return;
    }
    setSpectatorActive(false);
  }

  async function copySpectatorLink() {
    if (!spectatorLink) return;
    await navigator.clipboard.writeText(spectatorLink);
    setNotice("Link de espectador copiado.");
  }

  async function submitCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = editingId ? "PATCH" : "POST";
    const url = editingId
      ? `${apiUrl}/campaigns/${editingId}`
      : `${apiUrl}/campaigns`;

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

  async function removeMember(memberUserId: string) {
    if (!selectedCampaign) {
      return;
    }
    if (
      !window.confirm(
        "Remover este jogador o deixará sem ficha ativa nesta campanha. Continuar?",
      )
    )
      return;

    await fetch(
      `${apiUrl}/campaigns/${selectedCampaign.id}/members/${memberUserId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
    await loadCampaign(selectedCampaign.id);
  }

  async function activateCharacter(
    characterId: string,
    replacesInactive: boolean,
  ) {
    if (!selectedCampaign) return;
    if (
      replacesInactive &&
      !window.confirm(
        "Esta substituição arquivará permanentemente a ficha inativa anterior. Continuar?",
      )
    )
      return;
    const response = await apiFetch(
      `${apiUrl}/campaigns/${selectedCampaign.id}/characters/active`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      },
    );
    if (!response.ok) {
      setNotice("Não foi possível vincular esta ficha.");
      return;
    }
    setNotice("Ficha ativa vinculada à campanha.");
    await loadCampaign(selectedCampaign.id);
    const charactersResponse = await apiFetch(`${apiUrl}/characters`);
    if (charactersResponse.ok)
      setSheets((await charactersResponse.json()) as typeof sheets);
  }

  async function archiveCampaignCharacter(
    characterId: string,
    reason: "retired" | "deceased",
  ) {
    if (
      !selectedCampaign ||
      !window.confirm(
        "Esta ação torna a ficha somente leitura permanentemente. Continuar?",
      )
    )
      return;
    const response = await apiFetch(
      `${apiUrl}/campaigns/${selectedCampaign.id}/characters/${characterId}/archive`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      },
    );
    if (!response.ok) {
      setNotice("Não foi possível arquivar a ficha.");
      return;
    }
    await loadCampaign(selectedCampaign.id);
  }

  const isOwner = Boolean(
    selectedCampaign &&
    currentUser &&
    selectedCampaign.ownerUserId === currentUser.id,
  );
  const campaignNpcs = selectedCampaign
    ? sheets.filter(
        (sheet) =>
          sheet.kind === "npc" && sheet.campaignId === selectedCampaign.id,
      )
    : [];
  const campaignPlayers = selectedCampaign
    ? sheets.filter(
        (sheet) =>
          sheet.kind === "pc" && sheet.campaignId === selectedCampaign.id,
      )
    : [];
  const activeCampaignNpcs = campaignNpcs.filter(
    (character) => character.status === "active",
  );
  const archivedCampaignNpcs = campaignNpcs.filter(
    (character) => character.status === "archived",
  );
  async function addNpc(templateId: string) {
    if (!selectedCampaign) return;
    const response = await apiFetch(
      `${apiUrl}/campaigns/${selectedCampaign.id}/npcs`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId }),
      },
    );
    if (!response.ok) {
      setNotice("Não foi possível adicionar o NPC.");
      return;
    }
    const npc = (await response.json()) as { id: string };
    window.location.assign(`/characters/${npc.id}/edit`);
  }
  const isMember = Boolean(
    selectedCampaign &&
    currentUser &&
    selectedCampaign.members.some((member) => member.userId === currentUser.id),
  );
  const hasInactiveOwnCharacter = Boolean(
    selectedCampaign?.characters?.some(
      (character) =>
        character.ownerUserId === currentUser?.id &&
        character.status === "inactive",
    ),
  );
  const eligibleSheets =
    selectedCampaign && currentUser && isMember
      ? sheets.filter(
          (sheet) =>
            sheet.kind === "pc" &&
            ((sheet.status === "active" && sheet.campaignId === null) ||
              (sheet.status === "inactive" &&
                sheet.campaignId === selectedCampaign.id)),
        )
      : [];

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link
            href="/home"
            className="mb-3 inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"
          >
            <ArrowLeft className="h-3 w-3" />
            {t("back")}
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-100">{t("title")}</h1>
          <p className="mt-1 text-sm text-zinc-500">{t("description")}</p>
        </div>
      </div>

      {notice ? (
        <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-300">
          {notice}
        </p>
      ) : null}
      {invitations.length > 0 ? (
        <section className="rounded-2xl border border-red-900/60 bg-red-950/10 p-5">
          <h2 className="font-serif text-xl text-zinc-100">{t("pending")}</h2>
          <div className="mt-3 grid gap-3">
            {invitations.map(({ invitation, campaignName, invitedByName }) => (
              <article
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              >
                <div>
                  <p className="font-medium text-zinc-100">{campaignName}</p>
                  <p className="text-xs text-zinc-500">
                    {t("invitedBy", {
                      name: invitedByName,
                      date: new Date(invitation.expiresAt).toLocaleDateString(),
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void respond(invitation.id, true)}
                    className="rounded bg-red-700 px-3 py-2 text-sm text-white"
                  >
                    {t("accept")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void respond(invitation.id, false)}
                    className="rounded border border-zinc-700 px-3 py-2 text-sm text-zinc-300"
                  >
                    {t("decline")}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-zinc-900 bg-zinc-950/80">
          <div className="border-b border-zinc-900 px-5 py-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-medium text-zinc-100">
                {t("saved")}
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {t("savedDescription")}
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
              {t("new")}
            </button>
          </div>
          <div className="px-5 py-4">
            {loading ? (
              <div className="text-sm text-zinc-500">{t("loading")}</div>
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
                      <div className="font-medium text-zinc-100">
                        {campaign.name}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">
                        {campaign.description || t("noDescription")}
                      </div>
                    </button>
                    {currentUser && campaign.ownerUserId === currentUser.id ? (
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
                          {t("edit")}
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteCampaign(campaign.id)}
                          className="rounded-md border border-red-950/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-950/20"
                        >
                          {t("delete")}
                        </button>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {composerOpen ? (
            <form
              className="space-y-4 border-t border-zinc-900 p-5"
              onSubmit={submitCampaign}
            >
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {editingId ? t("editing") : t("creating")}
                </div>
                <h3 className="mt-1 text-lg font-medium text-zinc-100">
                  {editingId ? t("editCampaign") : t("newCampaign")}
                </h3>
              </div>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {t("name")}
                </span>
                <input
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block space-y-2">
                <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                  {t("descriptionLabel")}
                </span>
                <textarea
                  className="min-h-24 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
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
                  {t("cancel")}
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white">
                  <Plus className="h-4 w-4" />
                  {t("save")}
                </button>
              </div>
            </form>
          ) : null}
        </section>

        <section className="rounded-3xl border border-zinc-900 bg-zinc-950/80">
          <div className="border-b border-zinc-900 px-5 py-4">
            <h2 className="text-xl font-medium text-zinc-100">
              {t("members")}
            </h2>
          </div>
          {selectedCampaign ? (
            <div className="space-y-5 p-5">
              <div>
                <div className="text-lg font-medium text-zinc-100">
                  {selectedCampaign.name}
                </div>
                <div className="mt-1 text-sm text-zinc-500">
                  {t("memberDescription")}
                </div>
              </div>
              {isOwner ? (
                <Link
                  href={`/campaigns/${selectedCampaign.id}/clues`}
                  className="inline-flex rounded border border-red-900 px-3 py-2 text-xs text-red-200 hover:bg-red-950/20"
                >
                  Gerenciar pistas
                </Link>
              ) : null}
              {isOwner ? (
                <form
                  onSubmit={invitePlayer}
                  className="rounded-xl border border-zinc-800 p-4"
                >
                  <p className="text-sm font-medium text-zinc-100">
                    {t("invitePlayer")}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {t("inviteDescription")}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <input
                      required
                      value={inviteCode}
                      onChange={(event) => setInviteCode(event.target.value)}
                      placeholder={t("shortCode")}
                      className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 p-2 text-sm text-white"
                    />
                    <button className="rounded bg-red-700 px-3 text-sm text-white">
                      {t("invite")}
                    </button>
                  </div>
                </form>
              ) : null}

              {isOwner ? (
                <section className="rounded-xl border border-zinc-800 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-zinc-100">
                        Convites pendentes
                      </p>
                      <p className="text-xs text-zinc-500">
                        Apenas o dono da campanha pode cancelar um convite não
                        respondido.
                      </p>
                    </div>
                  </div>
                  {managedInvitations.length ? (
                    <ul className="mt-3 space-y-2">
                      {managedInvitations.map((invitation) => (
                        <li
                          key={invitation.id}
                          className="flex items-center justify-between gap-3 rounded border border-zinc-800 p-2 text-sm"
                        >
                          <span className="text-zinc-300">
                            {invitation.invitedUserName}{" "}
                            <span className="text-zinc-500">
                              ({invitation.invitedUserShortCode})
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => void cancelInvitation(invitation.id)}
                            className="text-xs text-red-300"
                          >
                            Cancelar
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs text-zinc-500">
                      Não há convites pendentes.
                    </p>
                  )}
                </section>
              ) : null}

              {isOwner ? (
                <section className="rounded-xl border border-zinc-800 p-4">
                  <p className="text-sm font-medium text-zinc-100">
                    Acesso de espectador
                  </p>
                  {!spectatorActive ? (
                    <>
                      <p className="mt-1 text-xs text-zinc-500">
                        Gere um link público de leitura para nome, descrição e
                        capa desta campanha.
                      </p>
                      <button
                        type="button"
                        onClick={() => void createSpectatorAccess()}
                        className="mt-3 rounded border border-red-900 px-3 py-2 text-xs text-red-200 hover:bg-red-950/20"
                      >
                        Gerar link
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="mt-1 text-xs text-zinc-500">
                        O link só é revelado ao gerar ou rotacionar. Se ele foi
                        perdido, rotacione-o.
                      </p>
                      {spectatorLink ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <input
                            readOnly
                            value={spectatorLink}
                            aria-label="Link de espectador"
                            className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-900 p-2 text-xs text-zinc-200"
                          />
                          <button
                            type="button"
                            onClick={() => void copySpectatorLink()}
                            className="rounded border border-zinc-700 px-3 py-2 text-xs text-zinc-200"
                          >
                            Copiar
                          </button>
                        </div>
                      ) : null}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void rotateSpectatorAccess()}
                          className="rounded border border-zinc-700 px-3 py-2 text-xs text-zinc-200"
                        >
                          Rotacionar
                        </button>
                        <button
                          type="button"
                          onClick={() => void revokeSpectatorAccess()}
                          className="rounded border border-red-950/40 px-3 py-2 text-xs text-red-300"
                        >
                          Revogar
                        </button>
                      </div>
                    </>
                  )}
                </section>
              ) : null}

              <section className="rounded-xl border border-zinc-800 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">
                      Personagens da campanha
                    </p>
                    <p className="text-xs text-zinc-500">
                      O estado e o inventário pertencem apenas a esta campanha.
                    </p>
                  </div>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => setAddingNpc((current) => !current)}
                      className="rounded border border-red-900 px-3 py-2 text-xs text-red-200"
                    >
                      Adicionar NPC
                    </button>
                  ) : null}
                </div>
                {isOwner && addingNpc ? (
                  <div className="mt-3 rounded border border-zinc-800 p-3">
                    {templates.length ? (
                      <div className="flex flex-wrap gap-2">
                        {templates.map((template) => (
                          <button
                            key={template.id}
                            type="button"
                            onClick={() => void addNpc(template.id)}
                            className="rounded border border-zinc-700 px-3 py-2 text-sm text-zinc-200"
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-400">
                        Nenhum template publicado.{" "}
                        <Link
                          className="text-red-300"
                          href="/characters/npc/new"
                        >
                          Crie ou publique um template.
                        </Link>
                      </p>
                    )}
                  </div>
                ) : null}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {campaignPlayers.map((sheet) => (
                    <Link
                      key={sheet.id}
                      href={`/characters/${sheet.id}`}
                      className="rounded border border-zinc-800 p-2 text-sm text-zinc-300"
                    >
                      PJ · {sheet.name}
                    </Link>
                  ))}
                  {activeCampaignNpcs.map((sheet) => (
                    <Link
                      key={sheet.id}
                      href={`/characters/${sheet.id}`}
                      className="rounded border border-zinc-800 p-2 text-sm text-zinc-300"
                    >
                      NPC · {sheet.name}
                    </Link>
                  ))}
                  {!campaignPlayers.length && !activeCampaignNpcs.length ? (
                    <p className="text-xs text-zinc-500">
                      Nenhuma ficha está vinculada ainda.
                    </p>
                  ) : null}
                </div>
                {archivedCampaignNpcs.length ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs uppercase tracking-wider text-zinc-500">
                      NPCs arquivados
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {archivedCampaignNpcs.map((sheet) => (
                        <Link
                          key={sheet.id}
                          href={`/characters/${sheet.id}`}
                          className="rounded border border-zinc-800 p-2 text-sm text-zinc-500"
                        >
                          NPC · {sheet.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              {isMember ? (
                <section className="rounded-xl border border-zinc-800 p-4">
                  <p className="text-sm font-medium text-zinc-100">
                    Sua ficha ativa
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Escolha uma ficha finalizada sem campanha. Se você tem uma
                    ficha inativa aqui, ela será substituída permanentemente.
                  </p>
                  <div className="mt-3 grid gap-2">
                    {eligibleSheets.map((sheet) => (
                      <button
                        key={sheet.id}
                        type="button"
                        onClick={() =>
                          void activateCharacter(
                            sheet.id,
                            sheet.status !== "inactive" &&
                              hasInactiveOwnCharacter,
                          )
                        }
                        className="rounded border border-zinc-700 px-3 py-2 text-left text-sm text-zinc-200 hover:border-red-800"
                      >
                        Usar {sheet.name}
                      </button>
                    ))}
                    {!eligibleSheets.length ? (
                      <p className="text-xs text-zinc-500">
                        Não há fichas elegíveis no momento.
                      </p>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {isOwner && selectedCampaign.characters?.length ? (
                <section className="rounded-xl border border-zinc-800 p-4">
                  <p className="text-sm font-medium text-zinc-100">
                    Histórico de personagens
                  </p>
                  <div className="mt-3 grid gap-2">
                    {selectedCampaign.characters.map((character) => (
                      <div
                        key={character.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-800 p-2 text-sm text-zinc-300"
                      >
                        <span>
                          {character.name} · {character.status}
                          {character.archiveReason
                            ? ` (${character.archiveReason})`
                            : ""}
                        </span>
                        {character.status !== "archived" ? (
                          <span className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void archiveCampaignCharacter(
                                  character.id,
                                  "retired",
                                )
                              }
                              className="text-xs text-amber-200"
                            >
                              Aposentar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void archiveCampaignCharacter(
                                  character.id,
                                  "deceased",
                                )
                              }
                              className="text-xs text-red-300"
                            >
                              Falecimento
                            </button>
                          </span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <div className="space-y-2">
                {selectedCampaign.members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3"
                  >
                    <div>
                      <div className="font-medium text-zinc-100">
                        {member.name}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {member.shortCode} · {t("player")}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {selectedCampaign.characters?.find(
                          (character) =>
                            character.ownerUserId === member.userId,
                        )?.status ?? "sem ficha ativa"}
                      </div>
                    </div>
                    {isOwner &&
                    member.userId !== selectedCampaign.ownerUserId ? (
                      <button
                        type="button"
                        onClick={() => void removeMember(member.userId)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-950/40 px-2.5 py-1 text-xs text-red-300 hover:bg-red-950/20"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remover
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-5 text-sm text-zinc-500">
              {t("selectCampaign")}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
