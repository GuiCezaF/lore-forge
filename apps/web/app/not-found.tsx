export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-5 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
        Erro 404
      </p>
      <h1 className="text-3xl font-semibold text-zinc-100">
        Página não encontrada
      </h1>
      <p className="text-sm text-zinc-400">
        O conteúdo solicitado não está disponível.
      </p>
    </main>
  );
}
