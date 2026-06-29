"use client";

import { useState } from "react";
import { Plus, User, ArrowLeft, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type Character = {
  id: string;
  name: string;
  class: string;
  nex: number;
};

export default function JogadorPage() {
  const t = useTranslations("jogador");
  const [characters] = useState<Character[]>([]);

  function handleCreateClick() {
    toast.info(t("toastTitle"), {
      description: t("toastDescription"),
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-serif text-zinc-100">
              {t("title")}
            </h1>
            <p className="text-sm text-zinc-500">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="flex-1 min-h-[400px] border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto w-full my-auto">
          <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-6 shadow-inner">
            <User className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-zinc-300 mb-2">
            {t("emptyTitle")}
          </h2>
          <p className="text-sm text-zinc-500 max-w-xs mb-8">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters.map((char) => (
            <div
              key={char.id}
              className="p-6 rounded-xl border border-zinc-900 bg-zinc-950 flex flex-col gap-4"
            >
              <h3 className="font-bold text-lg text-zinc-200">{char.name}</h3>
              <div className="flex justify-between text-xs text-zinc-500 font-mono">
                <span>{char.class}</span>
                <span>NEX {char.nex}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={handleCreateClick}
        aria-label={t("createAriaLabel")}
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg shadow-red-950/40 hover:shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:scale-105 transition-all duration-300 z-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-950"
      >
        <Plus className="h-6 w-6 font-bold" />
      </button>
    </div>
  );
}
