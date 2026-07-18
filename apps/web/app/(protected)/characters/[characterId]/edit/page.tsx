"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { NpcSheetEditor } from "@/app/components/npc-template-editor";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";

export default function CampaignNpcEditPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const [value, setValue] = useState<Record<string, unknown>>();
  useEffect(() => {
    void Promise.all([
      apiFetch(`${getBrowserApiUrl()}/characters/${characterId}`),
      apiFetch(
        `${getBrowserApiUrl()}/characters/${characterId}/npc-stat-block`,
      ),
    ]).then(async ([character, statBlock]) => {
      if (!character.ok) return;
      const data = (await character.json()) as Record<string, unknown>;
      if (statBlock.ok) data.npcStatBlock = await statBlock.json();
      setValue(data);
    });
  }, [characterId]);
  if (!value) return null;
  return <NpcSheetEditor npcId={characterId} initialValues={value as never} />;
}
