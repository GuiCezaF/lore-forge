"use client";

import { ArrowLeft, Plus, ShieldAlert, UserSearch } from "lucide-react";
import { Link } from "@/i18n/navigation";

export default function JogadorPage() {
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
            Painel do jogador
          </h1>
          <p className="text-sm text-zinc-500">
            Entre direto na área de fichas. Só personagens jogáveis aparecem
            nesse fluxo.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1.2fr_0.8fr] gap-8 mt-4 items-stretch">
        <Link
          href="/characters?kind=pc"
          className="group relative flex flex-col justify-between items-start text-left p-8 sm:p-10 rounded-2xl border border-zinc-900 bg-gradient-to-b from-zinc-950 to-zinc-950 hover:to-zinc-900/40 hover:border-zinc-800 transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] overflow-hidden"
        >
          <div className="absolute -top-32 -left-32 h-64 w-64 rounded-full bg-zinc-900/10 group-hover:bg-zinc-800/20 blur-[80px] transition-all duration-300 pointer-events-none" />

          <div className="relative flex flex-col gap-6">
            <div className="h-12 w-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:scale-110 group-hover:border-zinc-500/30 transition-all duration-300">
              <UserSearch className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-serif text-zinc-100 group-hover:text-zinc-200 transition-colors">
                Abrir fichas
              </h2>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                Criação, edição e remoção já estão disponíveis. O CRUD foi
                mantido em uma tela separada para não poluir o painel inicial.
              </p>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-zinc-400 group-hover:text-zinc-300 font-semibold">
            <Plus className="h-3.5 w-3.5" />
            <span>Gerenciar personagens</span>
          </div>
        </Link>

        <div className="rounded-2xl border border-zinc-900 bg-zinc-950/60 p-6">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-xl font-bold font-serif text-zinc-200">
            Fluxo focado
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            O jogador vê apenas o que precisa: campanha, nome, descrição, dados
            da ficha e imagem opcional.
          </p>
        </div>
      </div>
    </div>
  );
}
