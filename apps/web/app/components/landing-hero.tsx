import Link from "next/link";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1220] p-8 shadow-2xl shadow-slate-950/40 sm:p-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.32),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.24),_transparent_28%)]" />
      <div className="relative flex flex-col gap-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-100">
          <span className="h-2 w-2 rounded-full bg-cyan-300" />
          LoreForge web shell
        </div>

        <div className="max-w-3xl space-y-5">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Mesa virtual com mapa, fichas e documentos em um só lugar.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            O frontend já nasce com uma base para campanhas, tempo real e
            documentação integrada ao backend.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-cyan-300 px-6 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Explorar base
          </Link>
          <div className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/5 px-6 text-sm text-slate-200">
            Vitest pronto para rodar
          </div>
        </div>
      </div>
    </section>
  );
}
