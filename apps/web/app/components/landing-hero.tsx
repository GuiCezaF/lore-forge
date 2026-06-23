type LandingHeroProps = {
  authUrl: string;
};

function GoogleLogo() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#4285F4"
        d="M43.611 20.083H42V20H24v8h11.303C33.655 32.057 29.326 35 24 35c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.055 0 5.831 1.152 7.938 3.04l5.657-5.657C34.034 5.077 29.335 3 24 3 12.955 3 4 11.955 4 23s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
      />
      <path
        fill="#34A853"
        d="M6.306 14.691 12.88 19.5A11.99 11.99 0 0 1 24 11c3.054 0 5.83 1.152 7.938 3.04l5.657-5.657C34.034 5.077 29.335 3 24 3c-7.818 0-14.58 4.426-17.694 10.691Z"
      />
      <path
        fill="#FBBC05"
        d="M24 43c5.229 0 9.928-1.999 13.523-5.245l-6.24-5.271C29.226 34.217 26.8 35 24 35c-5.306 0-9.62-2.928-11.299-7.266l-6.53 5.02C9.259 38.645 16.038 43 24 43Z"
      />
      <path
        fill="#EA4335"
        d="M43.611 20.083H42V20H24v8h11.303a11.96 11.96 0 0 1-4.02 5.484l.003-.002 6.24 5.271C36.082 38.74 44 33 44 23c0-1.341-.138-2.65-.389-3.917Z"
      />
    </svg>
  );
}

export function LandingHero({ authUrl }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden rounded-4xl border border-white/10 bg-[#0b1220] p-8 shadow-2xl shadow-slate-950/40 sm:p-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.28),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.18),transparent_28%)]" />
      <div className="relative flex flex-col items-start gap-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          LoreForge
        </div>

        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-6xl">
            Entre com sua conta Google
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Autenticação OAuth2 com access token, refresh token e sessão
            rotacionada no backend.
          </p>
        </div>

        <a
          href={authUrl}
          className="inline-flex h-12 items-center justify-center gap-3 rounded-full bg-white px-6 text-sm "
        >
          <GoogleLogo />
          <span className="font-semibold text-slate-950 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/70 focus:ring-offset-2 focus:ring-offset-slate-950">Logar com o Google</span>
        </a>
      </div>
    </section>
  );
}

