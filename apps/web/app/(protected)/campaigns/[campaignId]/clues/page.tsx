"use client";

import { useParams } from "next/navigation";
import { ClueWorkspace } from "@/app/components/clues/clue-workspace";

export default function CampaignCluesPage() {
  const params = useParams<{ campaignId: string }>();
  return <ClueWorkspace campaignId={params.campaignId} />;
}
