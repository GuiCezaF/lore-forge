import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerApiUrl } from "@/lib/api-url";

type SpectatorCampaign = {
  name: string;
  description: string | null;
  hasCoverImage: boolean;
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

async function getCampaign(token: string): Promise<SpectatorCampaign | null> {
  const response = await fetch(
    `${getServerApiUrl()}/spectator-access/${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  return response.json() as Promise<SpectatorCampaign>;
}

export default async function SpectatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const campaign = await getCampaign(token);
  if (!campaign) notFound();

  const coverUrl = `/api/backend/spectator-access/${encodeURIComponent(token)}/cover`;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-5 py-10 sm:py-16">
      <article className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/30">
        {campaign.hasCoverImage ? (
          <img
            src={coverUrl}
            alt={`Capa da campanha ${campaign.name}`}
            className="aspect-[16/8] w-full object-cover"
          />
        ) : null}
        <div className="space-y-4 p-6 sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
            Acesso de espectador
          </p>
          <h1 className="text-3xl font-semibold text-zinc-100 sm:text-4xl">
            {campaign.name}
          </h1>
          {campaign.description ? (
            <p className="whitespace-pre-wrap text-base leading-7 text-zinc-300">
              {campaign.description}
            </p>
          ) : null}
        </div>
      </article>
      <p className="text-center text-xs text-zinc-500">
        LoreForge é uma plataforma VTT não oficial.
      </p>
    </main>
  );
}
