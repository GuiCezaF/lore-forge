"use client";

import { Skull, ShieldAlert, Eye, UserSearch } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations("home");

  return (
    <div className="flex-1 flex flex-col justify-center py-6 sm:py-12">
      <div className="text-center mb-10 max-w-lg mx-auto">
        <h2 className="text-sm font-mono uppercase tracking-widest text-red-500 mb-2 font-semibold">
          {t("subtitle")}
        </h2>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-zinc-100">
          {t("title")}
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto flex-1 items-stretch">
        <button
          onClick={() => router.push("/mestre")}
          className="group relative flex flex-col justify-between items-start text-left p-8 sm:p-10 rounded-2xl border border-red-950/20 bg-gradient-to-b from-zinc-950 to-zinc-950 hover:to-red-950/10 hover:border-red-900/40 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(185,28,28,0.08)] cursor-pointer overflow-hidden"
        >
          <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-red-900/5 group-hover:bg-red-900/10 blur-[80px] transition-all duration-300 pointer-events-none" />

          <div className="relative flex flex-col gap-6">
            <div className="h-12 w-12 rounded-xl bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-500 group-hover:scale-110 group-hover:border-red-500/50 transition-all duration-300">
              <Skull className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-serif text-zinc-100 group-hover:text-red-500 transition-colors">
                {t("gm.title")}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                {t("gm.description")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-red-500 group-hover:text-red-400 font-semibold">
            <span>{t("gm.action")}</span>
            <Eye className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button
          onClick={() => router.push("/jogador")}
          className="group relative flex flex-col justify-between items-start text-left p-8 sm:p-10 rounded-2xl border border-zinc-900 bg-gradient-to-b from-zinc-950 to-zinc-950 hover:to-zinc-900/40 hover:border-zinc-800 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] cursor-pointer overflow-hidden"
        >
          <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-zinc-900/10 group-hover:bg-zinc-800/20 blur-[80px] transition-all duration-300 pointer-events-none" />

          <div className="relative flex flex-col gap-6">
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-110 group-hover:border-zinc-500/30 transition-all duration-300">
              <UserSearch className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-bold font-serif text-zinc-100 group-hover:text-zinc-200 transition-colors">
                {t("player.title")}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                {t("player.description")}
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 group-hover:text-zinc-300 font-semibold">
            <span>{t("player.action")}</span>
            <ShieldAlert className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>
    </div>
  );
}
