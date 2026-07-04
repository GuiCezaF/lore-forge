"use client";

import { Eye, ShieldAlert } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "./locale-switcher";

type LandingHeroProps = {
  authUrl: string;
  bypassUrl: string;
  isDev: boolean;
  authError?: string;
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

export function LandingHero({
  authUrl,
  bypassUrl,
  isDev,
  authError,
}: LandingHeroProps) {
  const t = useTranslations("login");
  const authErrorMessage =
    authError === "failed" || authError === "missing" || authError === "session"
      ? t(`authError.${authError}`)
      : null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-red-950/40 bg-zinc-950 p-8 shadow-2xl shadow-black/80 sm:p-12 max-w-lg w-full mx-auto">
      <div className="absolute -top-40 -left-40 h-80 w-80 rounded-full bg-red-900/10 blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-red-950/15 blur-[100px] pointer-events-none" />

      <div className="absolute top-4 right-4">
        <LocaleSwitcher variant="landing" />
      </div>

      <div className="relative flex flex-col items-center text-center gap-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-red-900/30 bg-red-950/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-red-500 uppercase">
          <Eye className="h-3.5 w-3.5 animate-pulse text-red-600" />
          {t("badge")}
        </div>

        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-zinc-100 font-serif">
            Lore<span className="text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.5)]">Forge</span>
          </h1>
          <p className="text-zinc-400 max-w-sm mx-auto text-sm leading-relaxed">
            {t("tagline")}
          </p>
          {authErrorMessage ? (
            <p className="rounded-lg border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">
              {authErrorMessage}
            </p>
          ) : null}
        </div>

        <div className="w-full flex flex-col gap-4 items-center">
          <a
            href={authUrl}
            className="flex w-full h-11 items-center justify-center gap-3 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 font-semibold text-sm hover:bg-zinc-700 transition-all duration-200 shadow-md hover:shadow-[0_0_15px_rgba(255,255,255,0.06)] focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            <GoogleLogo />
            <span>{t("signInGoogle")}</span>
          </a>

          {isDev && (
            <a
              href={bypassUrl}
              className="flex w-full h-10 items-center justify-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 text-red-400 font-medium text-xs hover:bg-red-950/40 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-600"
            >
              <ShieldAlert className="h-4 w-4 text-red-500" />
              <span>{t("devBypass")}</span>
            </a>
          )}
        </div>

        <div className="text-[10px] text-zinc-600 border-t border-zinc-900 w-full pt-4 font-mono uppercase tracking-widest">
          {t("disclaimer")}
        </div>
      </div>
    </section>
  );
}
