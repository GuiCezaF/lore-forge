"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { routing, type Locale } from "@/i18n/routing";
import { LOCALE_COOKIE } from "@/i18n/constants";

type LocaleSwitcherProps = {
  variant?: "landing" | "header";
};

export function LocaleSwitcher({ variant = "header" }: LocaleSwitcherProps) {
  const t = useTranslations("locale");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLocaleChange(nextLocale: Locale) {
    if (nextLocale === locale) return;

    startTransition(() => {
      document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    });
  }

  const selectClassName =
    variant === "landing"
      ? "rounded-lg border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 disabled:opacity-50"
      : "rounded-lg border border-zinc-900 bg-zinc-950 px-2 py-1.5 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-red-500 hover:border-red-950/40 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-red-600 disabled:opacity-50";

  return (
    <div className="flex items-center gap-2">
      <Languages
        className={`h-3.5 w-3.5 ${variant === "landing" ? "text-zinc-500" : "text-zinc-500"}`}
        aria-hidden="true"
      />
      <label className="sr-only" htmlFor="locale-select">
        {t("label")}
      </label>
      <select
        id="locale-select"
        value={locale}
        disabled={isPending}
        onChange={(event) => handleLocaleChange(event.target.value as Locale)}
        className={selectClassName}
        aria-label={t("label")}
      >
        {routing.locales.map((loc) => (
          <option key={loc} value={loc}>
            {t(loc)}
          </option>
        ))}
      </select>
    </div>
  );
}
