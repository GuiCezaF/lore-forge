"use client";

import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CrudPanel } from "@/app/components/crud-panel";
import type { Item } from "@/app/types/entities";
import { getBrowserApiUrl } from "@/lib/api-url";

type CampaignOption = {
  id: string;
  name: string;
};

export default function ItemsPage() {
  const apiUrl = getBrowserApiUrl();
  const searchParams = useSearchParams();
  const [campaignOptions, setCampaignOptions] = useState<CampaignOption[]>([]);
  const kind = searchParams.get("kind");
  const kindLocked = kind === "item" || kind === "document";
  const pageTitle =
    kind === "document" ? "Documentos" : kind === "item" ? "Itens" : "Itens";
  const pageDescription =
    kind === "document"
      ? "Apenas documentos de campanha e pistas narrativas."
      : "Itens comuns, documentos de campanha e cópias privadas.";

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

      <CrudPanel<Item>
        title={pageTitle}
        description={pageDescription}
        endpoint="/items"
        filterItems={(item) => (kindLocked ? item.kind === kind : true)}
        emptyValues={{
          scope: "user",
          kind: kind === "document" ? "document" : "item",
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
            name: "kind",
            label: "Tipo",
            type: "select",
            visible: () => !kindLocked,
            options: [
              { label: "Item", value: "item" },
              { label: "Documento", value: "document" },
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
            label: "Dados do item (JSON)",
            type: "json",
            placeholder: '{"raridade":"comum"}',
          },
          { name: "imageAssetId", label: "ID do recurso de imagem" },
        ]}
        itemLabel={(item) => item.name}
        itemMeta={(item) => `${item.kind} · ${item.scope}`}
        itemSubline={(item) => item.description || "Sem descrição"}
        cloneEndpoint={() => null}
        buildPayload={(values) => ({
          scope: values.scope || "user",
          kind: kindLocked ? kind : values.kind || "item",
          campaignId:
            values.scope === "campaign" ? values.campaignId || null : null,
          name: values.name,
          description: values.description,
          data: values.data ? JSON.parse(values.data) : {},
          imageAssetId: values.imageAssetId || null,
        })}
        mapItemToForm={(item) => ({
          scope: item.scope ?? "user",
          kind: item.kind ?? "item",
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
