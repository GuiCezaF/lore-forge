"use client";

import { ArrowLeft, Plus, Skull, Users, Map, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type ActionType = "campaign" | "monster" | "npc";

const actionNamespaces: Record<ActionType, "campaigns" | "monsters" | "npcs"> = {
  campaign: "campaigns",
  monster: "monsters",
  npc: "npcs",
};

export default function MestrePage() {
  const t = useTranslations("mestre");

  function handleActionClick(type: ActionType) {
    const namespace = actionNamespaces[type];

    toast.info(t(`${namespace}.toastTitle`), {
      description: t(`${namespace}.toastDescription`),
      icon: <ShieldAlert className="h-5 w-5 text-red-500" />,
      duration: 4000,
    });
  }

  return (
    <div className="flex-1 flex flex-col gap-6 py-4">
      <div className="flex flex-col gap-2">
        <Link
          href="/home"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
        >
          <ArrowLeft className="h-3 w-3" />
          {t("backToDashboard")}
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-serif text-zinc-100">
            {t("title")}
          </h1>
          <p className="text-sm text-zinc-500">{t("subtitle")}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-4 flex-1 items-start">
        <div className="group relative p-6 rounded-2xl border border-red-950/20 bg-zinc-950/60 backdrop-blur-sm flex flex-col justify-between gap-6 transition-all duration-300 hover:border-red-900/40">
          <div className="flex flex-col gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-950/20 border border-red-900/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform duration-300">
              <Map className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-zinc-200">
                {t("campaigns.title")}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {t("campaigns.description")}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleActionClick("campaign")}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-900/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-semibold hover:border-red-800 transition-all duration-200 focus:outline-none"
          >
            <Plus className="h-4 w-4" />
            {t("campaigns.create")}
          </button>
        </div>

        <div className="group relative p-6 rounded-2xl border border-red-950/20 bg-zinc-950/60 backdrop-blur-sm flex flex-col justify-between gap-6 transition-all duration-300 hover:border-red-900/40">
          <div className="flex flex-col gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-950/20 border border-red-900/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform duration-300">
              <Skull className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-zinc-200">
                {t("monsters.title")}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {t("monsters.description")}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleActionClick("monster")}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-900/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-semibold hover:border-red-800 transition-all duration-200 focus:outline-none"
          >
            <Plus className="h-4 w-4" />
            {t("monsters.create")}
          </button>
        </div>

        <div className="group relative p-6 rounded-2xl border border-red-950/20 bg-zinc-950/60 backdrop-blur-sm flex flex-col justify-between gap-6 transition-all duration-300 hover:border-red-900/40">
          <div className="flex flex-col gap-4">
            <div className="h-10 w-10 rounded-lg bg-red-950/20 border border-red-900/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform duration-300">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-zinc-200">
                {t("npcs.title")}
              </h2>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                {t("npcs.description")}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleActionClick("npc")}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-900/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 text-xs font-semibold hover:border-red-800 transition-all duration-200 focus:outline-none"
          >
            <Plus className="h-4 w-4" />
            {t("npcs.create")}
          </button>
        </div>
      </div>
    </div>
  );
}
