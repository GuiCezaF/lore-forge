"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, Pencil, Trash2, User, UserRound } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import {
  dangerButtonClassName,
  fieldCaptionClassName,
  fieldLabelClassName,
  inputClassName,
  pageClassName,
  primaryButtonClassName,
  surfaceClassName,
} from "@/app/components/app-ui";

type Profile = {
  id: string;
  email: string;
  shortCode: string;
  name: string;
  picture?: string | null;
  provider: string;
  role: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  lastLoginAt?: string | null;
};

export default function ProfilePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [picture, setPicture] = useState("");
  const [editing, setEditing] = useState(searchParams.get("edit") === "1");

  useEffect(() => {
    void (async () => {
      const response = await fetch(`${apiUrl}/users/me`, {
        credentials: "include",
      });
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setProfile(data);
      setName(data.name ?? "");
      setPicture(data.picture ?? "");
    })();
  }, [apiUrl]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`${apiUrl}/users/me`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        picture: picture || null,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      setProfile(data);
      setName(data.name ?? "");
      setPicture(data.picture ?? "");
      setEditing(false);
    }
  }

  async function deleteAccount() {
    await fetch(`${apiUrl}/users/me`, {
      method: "DELETE",
      credentials: "include",
    });
    router.push("/");
  }

  return (
    <div className={pageClassName}>
      <Link
        href="/home"
        className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"
      >
        <ArrowLeft className="h-3 w-3" />
        Voltar
      </Link>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className={`${surfaceClassName} p-6`}>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex w-full items-center gap-4 rounded-2xl border border-zinc-900 bg-zinc-950/60 p-4 text-left transition hover:border-zinc-800"
          >
            {profile?.picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.picture}
                alt={profile.name}
                className="h-14 w-14 rounded-2xl border border-zinc-800 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-300">
                <UserRound className="h-7 w-7" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-semibold text-zinc-100">
                {profile?.name ?? "Carregando..."}
              </div>
              <div className="truncate text-sm text-zinc-500">{profile?.email}</div>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </div>
          </button>

          <dl className="mt-6 space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <dt className="text-zinc-500">Short code</dt>
              <dd className="font-medium text-zinc-200">{profile?.shortCode}</dd>
            </div>
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <dt className="text-zinc-500">Login</dt>
              <dd className="font-medium text-zinc-200">{profile?.provider}</dd>
            </div>
          </dl>

          <button
            type="button"
            onClick={() => void deleteAccount()}
            className={`mt-6 ${dangerButtonClassName}`}
          >
            <Trash2 className="h-4 w-4" />
            Excluir conta
          </button>
        </div>

        <div className={`${surfaceClassName} p-6`}>
          {editing ? (
            <>
              <h2 className="text-xl font-medium text-zinc-100">Editar perfil</h2>
              <form className="mt-6 space-y-4" onSubmit={saveProfile}>
                <label className={fieldLabelClassName}>
                  <span className={fieldCaptionClassName}>Nome</span>
                  <input
                    className={inputClassName}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </label>
                <label className={fieldLabelClassName}>
                  <span className={fieldCaptionClassName}>Foto</span>
                  <input
                    className={inputClassName}
                    value={picture}
                    onChange={(event) => setPicture(event.target.value)}
                    placeholder="URL da imagem"
                  />
                </label>
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setName(profile?.name ?? "");
                      setPicture(profile?.picture ?? "");
                      setEditing(false);
                    }}
                    className="text-xs uppercase tracking-[0.2em] text-zinc-500 hover:text-zinc-300"
                  >
                    Cancelar
                  </button>
                  <button className={primaryButtonClassName}>
                    Salvar alterações
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex h-full min-h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/40 p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400">
                <User className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-xl font-medium text-zinc-100">
                Clique no nome ou na foto
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                O perfil abre em modo de edição quando você usa o bloco superior ou o atalho no cabeçalho.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
