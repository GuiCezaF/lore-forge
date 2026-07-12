"use client";

import { useEffect, useState } from "react";
import { LogOut, User, Compass, Home as HomeIcon } from "lucide-react";
import { Toaster } from "sonner";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { getBrowserApiUrl } from "@/lib/api-url";
import { apiFetch } from "@/lib/api-client";

type AuthUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  role: string;
  plan: string;
};

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("layout");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = getBrowserApiUrl();

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await apiFetch(`${apiUrl}/auth/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          setUser(null);
          router.push("/?auth=session");
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch {
        setUser(null);
        router.push("/?auth=session");
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [apiUrl, router]);

  async function handleLogout() {
    try {
      await apiFetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Ignora erros de logout e força redirecionamento
    }
    router.push("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400 font-mono text-xs uppercase tracking-widest gap-4">
        <div className="h-6 w-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
        {t("loading")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <header className="sticky top-0 z-50 border-b border-red-950/20 bg-zinc-950/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/home"
              className="flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <Compass className="h-6 w-6 text-red-600 drop-shadow-[0_0_5px_rgba(220,38,38,0.4)]" />
              <span className="font-serif font-bold text-xl tracking-tight">
                Lore<span className="text-red-600">Forge</span>
              </span>
            </Link>

            <nav className="hidden sm:flex items-center gap-4 text-xs uppercase font-mono tracking-wider text-zinc-400">
              <Link
                href="/home"
                className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
              >
                <HomeIcon className="h-3.5 w-3.5" />
                {t("home")}
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <Link
                href="/profile?edit=1"
                className="flex items-center gap-3 rounded-xl border border-transparent pr-4 transition hover:border-zinc-900 hover:bg-zinc-900/50"
              >
                <div className="flex items-center gap-3 border-r border-zinc-900 pr-4">
                  {user.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.picture}
                      alt={user.name}
                      className="h-8 w-8 rounded-full border border-red-950 object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full border border-red-950 bg-zinc-900 flex items-center justify-center text-zinc-400">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-sm font-semibold text-zinc-200">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                      {t("investigator")}
                    </span>
                  </div>
                </div>
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-red-500 hover:border-red-950/40 hover:bg-red-950/10 transition-all duration-200"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("logout")}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto p-6 sm:p-8">
        {children}
      </main>

      <Toaster position="top-right" theme="dark" richColors />
    </div>
  );
}
