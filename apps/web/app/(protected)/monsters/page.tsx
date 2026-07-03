"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CrudPanel } from "@/app/components/crud-panel";

type CampaignOption = {
  id: string;
  name: string;
};

export default function MonstersPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);

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

      <CrudPanel
        title="Monstros"
        description="Templates do sistema e variantes privadas ou de campanha."
        endpoint="/monsters"
        emptyValues={{
          scope: "user",
          campaignId: "",
          name: "",
          description: "",
          data: "{}",
          imageAssetId: "",
        }}
        fields={[
          {
            name: "scope",
            label: "Escopo",
            type: "select",
            options: [
              { label: "Usuário", value: "user" },
              { label: "Campanha", value: "campaign" },
            ],
          },
          {
            name: "campaignId",
            label: "Campanha",
            type: "select",
            visible: (values) => values.scope === "campaign",
            options: campaignOptions.map((campaign) => ({
              label: campaign.name,
              value: campaign.id,
            })),
          },
          { name: "name", label: "Nome" },
          { name: "description", label: "Descrição", type: "textarea" },
          {
            name: "data",
            label: "Dados do monstro (JSON)",
            type: "json",
            placeholder: '{"hp":0,"attacks":[]}',
          },
          { name: "imageAssetId", label: "Image asset ID" },
        ]}
        itemLabel={(item) => item.name}
        itemMeta={(item) => `${item.scope} · ${item.locked ? "bloqueado" : "editável"}`}
        itemSubline={(item) => item.description || "Sem descrição"}
        cloneEndpoint={(item) =>
          item.campaignId ? `/monsters/${item.id}/clone` : `/monsters/${item.id}/clone`
        }
        buildPayload={(values) => ({
          scope: values.scope || "user",
          campaignId: values.scope === "campaign" ? values.campaignId || null : null,
          name: values.name,
          description: values.description,
          data: values.data ? JSON.parse(values.data) : {},
          imageAssetId: values.imageAssetId || null,
        })}
        mapItemToForm={(item) => ({
          scope: item.scope ?? "user",
          campaignId: item.campaignId ?? "",
          name: item.name ?? "",
          description: item.description ?? "",
          data: JSON.stringify(item.data ?? {}, null, 2),
          imageAssetId: item.imageAssetId ?? "",
        })}
      />
    </div>
  );
}
