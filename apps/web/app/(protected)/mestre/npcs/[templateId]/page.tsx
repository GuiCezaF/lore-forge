"use client";
import { useEffect, useState } from "react";
import { NpcSheetEditor } from "@/app/components/npc-template-editor";
import { apiFetch } from "@/lib/api-client";
import { getBrowserApiUrl } from "@/lib/api-url";
export default function NpcTemplatePage({ params }: { params: Promise<{ templateId: string }> }) { const [id, setId] = useState(""); const [value, setValue] = useState<Record<string, unknown>>(); useEffect(() => { void params.then(async ({ templateId }) => { setId(templateId); const response = await apiFetch(`${getBrowserApiUrl()}/characters/${templateId}`); if (response.ok) setValue(await response.json() as Record<string, unknown>); }); }, [params]); if (!id || !value) return null; return <NpcSheetEditor templateId={id} initialValues={value} />; }
