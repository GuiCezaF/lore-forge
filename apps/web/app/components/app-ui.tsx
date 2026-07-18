"use client";

import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export const pageClassName = "flex flex-1 flex-col gap-6 py-4";
export const surfaceClassName =
  "rounded-3xl border border-zinc-900 bg-zinc-950/80 shadow-2xl shadow-black/20";
export const sectionHeaderClassName =
  "border-b border-zinc-900 px-6 py-5 flex items-start justify-between gap-4";
export const fieldLabelClassName = "block space-y-2";
export const fieldCaptionClassName =
  "text-xs uppercase tracking-[0.2em] text-zinc-500";
export const inputClassName =
  "w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition focus:border-red-800";
export const textareaClassName = cx(inputClassName, "min-h-24");
export const selectClassName = inputClassName;
export const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-60";
export const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-900";
export const subtleButtonClassName =
  "text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 transition hover:text-zinc-300";
export const dangerButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-red-950/40 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-950/20";

export function PageBackLink({
  href,
  children = "Voltar",
}: {
  href: string;
  children?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500 transition hover:text-zinc-300"
    >
      <ArrowLeft className="h-3 w-3" />
      {children}
    </Link>
  );
}

export function PageSection({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={surfaceClassName}>
      <header className={sectionHeaderClassName}>
        <div>
          <h2 className="text-2xl font-semibold text-zinc-100">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-zinc-500">{description}</p>
          ) : null}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "rounded-full border px-4 py-2 text-sm font-medium transition",
        active
          ? "border-red-900/50 bg-red-950/30 text-red-200"
          : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200",
      )}
    >
      {children}
    </button>
  );
}
