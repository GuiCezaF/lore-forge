"use client";

import { Eye, ShieldAlert, Skull, UserRound, UserSearch } from "lucide-react";
import { Link } from "@/i18n/navigation";

const cards = [
  {
    href: "/mestre",
    eyebrow: "Mestre",
    title: "Organize a mesa",
    description:
      "Campanhas, monstros, documentos e NPCs ficam em um fluxo separado e direto.",
    action: "Entrar no painel",
    icon: Skull,
    accent: "red",
  },
  {
    href: "/characters?kind=pc",
    eyebrow: "Jogador",
    title: "Gerencie suas fichas",
    description:
      "A criação já está liberada. Entre direto na área de fichas e mantenha só o necessário em tela.",
    action: "Abrir fichas",
    icon: UserSearch,
    accent: "zinc",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col justify-center py-6 sm:py-12">
      <div className="text-center mb-10 max-w-lg mx-auto">
        <h2 className="text-sm font-mono uppercase tracking-widest text-red-500 mb-2 font-semibold">
          LoreForge
        </h2>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-serif text-zinc-100">
          Escolha o fluxo da mesa
        </h1>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto flex-1 items-stretch">
        {cards.map((card) => {
          const Icon = card.icon;
          const accentClasses =
            card.accent === "red"
              ? {
                  root: "border-red-950/20 hover:border-red-900/40 hover:shadow-[0_0_30px_rgba(185,28,28,0.08)]",
                  glow: "bg-red-900/5 group-hover:bg-red-900/10",
                  icon: "bg-red-950/20 border-red-900/30 text-red-500 group-hover:border-red-500/50",
                  title: "group-hover:text-red-500",
                  action: "text-red-500 group-hover:text-red-400",
                }
              : {
                  root: "border-zinc-900 hover:border-zinc-800 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)]",
                  glow: "bg-zinc-900/10 group-hover:bg-zinc-800/20",
                  icon: "bg-zinc-900 border-zinc-800 text-zinc-400 group-hover:border-zinc-500/30",
                  title: "group-hover:text-zinc-200",
                  action: "text-zinc-400 group-hover:text-zinc-300",
                };

          return (
            <Link
              key={card.href}
              href={card.href}
              className={`
                group relative flex flex-col justify-between items-start text-left p-8 sm:p-10 rounded-2xl
                bg-gradient-to-b from-zinc-950 to-zinc-950 transition-all duration-300 shadow-xl overflow-hidden
                ${accentClasses.root}
              `}
            >
              <div
                className={`absolute -top-32 -left-32 h-64 w-64 rounded-full blur-[80px] transition-all duration-300 pointer-events-none ${accentClasses.glow}`}
              />

              <div className="relative flex flex-col gap-6">
                <div
                  className={`h-12 w-12 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-all duration-300 ${accentClasses.icon}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                    {card.eyebrow}
                  </div>
                  <h2
                    className={`text-2xl font-bold font-serif text-zinc-100 transition-colors ${accentClasses.title}`}
                  >
                    {card.title}
                  </h2>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                    {card.description}
                  </p>
                </div>
              </div>

              <div
                className={`mt-8 flex items-center gap-2 text-xs font-mono uppercase tracking-widest font-semibold ${accentClasses.action}`}
              >
                <span>{card.action}</span>
                <Eye className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
