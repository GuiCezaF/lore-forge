"use client";

import type { ComponentType } from "react";
import { ArrowLeft, BookOpenText, Map, Plus, Skull, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";

const actions: Array<{
  href: string;
  label: string;
  title: string;
  description: string;
  action: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  {
    href: "/campaigns",
    label: "Campanhas",
    title: "Mesa e membros",
    description: "Crie a campanha, edite o básico e convide jogadores pelo short code.",
    action: "Gerenciar campanha",
    icon: Map,
  },
  {
    href: "/monsters",
    label: "Monstros",
    title: "Bestiário",
    description: "Cadastre monstros privados ou vinculados a uma campanha e clone quando precisar.",
    action: "Abrir monstros",
    icon: Skull,
  },
  {
    href: "/items?kind=document",
    label: "Documentos",
    title: "Pistas e arquivos",
    description: "Mantenha só os documentos da mesa em uma tela dedicada, sem misturar com outros itens.",
    action: "Abrir documentos",
    icon: BookOpenText,
  },
  {
    href: "/characters?kind=npc",
    label: "NPCs",
    title: "Elenco da campanha",
    description: "Gerencie apenas NPCs da mesa, com criação e edição no mesmo fluxo.",
    action: "Abrir NPCs",
    icon: Users,
  },
];

export default function MestrePage() {
  return (
    <div className="flex-1 flex flex-col gap-6 py-4">
      <div className="flex flex-col gap-2">
        <Link
          href="/home"
          className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-zinc-500 hover:text-zinc-300 transition-colors mb-2"
        >
          <ArrowLeft className="h-3 w-3" />
          Voltar para a home
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-serif text-zinc-100">
            Painel do mestre
          </h1>
          <p className="text-sm text-zinc-500">
            Escolha a área que precisa de atenção e entre direto no CRUD correspondente.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="group relative p-6 rounded-2xl border border-red-950/20 bg-zinc-950/60 backdrop-blur-sm flex flex-col justify-between gap-6 transition-all duration-300 hover:border-red-900/40"
            >
              <div className="flex flex-col gap-4">
                <div className="h-10 w-10 rounded-lg bg-red-950/20 border border-red-900/20 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform duration-300">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">
                    {action.label}
                  </div>
                  <h2 className="mt-2 text-xl font-bold font-serif text-zinc-200">
                    {action.title}
                  </h2>
                  <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
              <div className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-900/30 bg-red-950/20 group-hover:bg-red-950/40 text-red-400 text-xs font-semibold group-hover:border-red-800 transition-all duration-200">
                <Plus className="h-4 w-4" />
                {action.action}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
