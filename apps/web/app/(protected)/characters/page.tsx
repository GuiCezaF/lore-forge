"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CrudPanel } from "@/app/components/crud-panel";
import type { Character } from "@/app/types/entities";
import { getBrowserApiUrl } from "@/lib/api-url";

type CampaignOption = {
  id: string;
  name: string;
};

export default function CharactersPage() {
  const apiUrl = getBrowserApiUrl();
  const searchParams = useSearchParams();
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const kind = searchParams.get("kind");
  const kindLocked = kind === "pc" || kind === "npc";
  const pageTitle = kind === "npc" ? "NPCs" : kind === "pc" ? "Fichas de jogador" : "Fichas";
  const pageDescription =
    kind === "npc"
      ? "Mantenha apenas NPCs visíveis nessa tela."
      : kind === "pc"
        ? "Crie e edite só personagens jogáveis."
        : "Crie personagens e NPCs vinculados a uma campanha.";

  useEffect(() => {
    void (async () => {
      const response = await fetch(`${apiUrl}/campaigns`, {
        credentials: "include",
      });
      const data = await response.json();
      setCampaignOptions(Array.isArray(data) ? data : []);
    })();
  }, [apiUrl]);

  return (
    <div className="flex flex-1 flex-col gap-6 py-4">
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-3 w-3" />
        Voltar
      </Link>

      <CrudPanel<Character>
        title={pageTitle}
        description={pageDescription}
        endpoint="/characters"
        filterItems={(item) => (kindLocked ? item.kind === kind : true)}
        emptyValues={{
          campaignId: "",
          kind: kind === "npc" ? "npc" : "pc",
          name: "",
          description: "",
          data: "{}",
          imageAssetId: "",
        }}
        fields={[
          {
            name: "campaignId",
            label: "Campanha",
            type: "select",
            options: campaignOptions.map((campaign) => ({
              label: campaign.name,
              value: campaign.id,
            })),
          },
          {
            name: "kind",
            label: "Tipo",
            type: "select",
            visible: () => !kindLocked,
            options: [
              { label: "PC", value: "pc" },
              { label: "NPC", value: "npc" },
            ],
          },
          { name: "name", label: "Nome" },
          { name: "description", label: "Descrição", type: "textarea" },
          {
            name: "data",
            label: "Dados da ficha (JSON)",
            type: "json",
            placeholder: '{"nex":0,"attributes":{}}',
          },
          { name: "imageAssetId", label: "Image asset ID" },
        ]}
        itemLabel={(item) => item.name}
        itemMeta={(item) => `${item.kind} · campanha ${item.campaignId.slice(0, 8)}`}
        itemSubline={(item) => item.description || "Sem descrição"}
        buildPayload={(values) => ({
          campaignId: values.campaignId,
          kind: kindLocked ? kind : values.kind,
          name: values.name,
          description: values.description,
          data: values.data ? JSON.parse(values.data) : {},
          imageAssetId: values.imageAssetId || null,
        })}
        mapItemToForm={(item) => ({
          campaignId: item.campaignId ?? "",
          kind: item.kind ?? "pc",
          name: item.name ?? "",
          description: item.description ?? "",
          data: JSON.stringify(item.data ?? {}, null, 2),
          imageAssetId: item.imageAssetId ?? "",
        })}
      />
    </div>
  );
}
