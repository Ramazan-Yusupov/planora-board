"use client";

import { ShieldAlert, ShieldCheck, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { AuthStatusButton, useAuth } from "@/features/auth";
import { getBoardRoute } from "@/shared/config/routes";
import { Button, Panel } from "@/shared/ui";

export function AdminPage() {
  const auth = useAuth();
  const router = useRouter();

  return (
    <main className="min-h-dvh bg-canvas px-4 py-6 text-text sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
              Planora
            </p>
            <h1 className="mt-1 text-2xl font-semibold">Админка</h1>
          </div>
          <div className="flex items-center gap-2">
            <AuthStatusButton />
            <Button variant="ghost" onClick={() => router.push(getBoardRoute("starter-board"))}>
              На доску
            </Button>
          </div>
        </header>

        {!auth.isConfigured ? (
          <Panel className="border-amber-300/25 bg-amber-950/25">
            <div className="flex gap-3 text-amber-100">
              <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
              <div>
                <h2 className="font-semibold">Supabase не настроен</h2>
                <p className="mt-1 text-sm leading-6">
                  Добавьте переменные окружения и примените SQL из
                  `supabase/schema.sql`.
                </p>
              </div>
            </div>
          </Panel>
        ) : null}

        {!auth.profile ? (
          <Panel>
            <div className="flex gap-3">
              <UserCircle aria-hidden="true" className="mt-0.5 shrink-0 text-accent" size={20} />
              <div>
                <h2 className="font-semibold">Войдите в аккаунт</h2>
                <p className="mt-1 text-sm leading-6 text-text-muted">
                  Админка доступна только аккаунтам из
                  `NEXT_PUBLIC_PLANORA_ADMIN_HANDLES`.
                </p>
              </div>
            </div>
          </Panel>
        ) : auth.profile.isAdmin ? (
          <Panel>
            <div className="flex gap-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-300" size={20} />
              <div>
                <h2 className="font-semibold">Доступ администратора активен</h2>
                <p className="mt-1 text-sm leading-6 text-text-muted">
                  Вы вошли как {auth.profile.handle}. Следующий шаг для этой
                  страницы — подключить серверные admin actions через Supabase
                  service role только на сервере.
                </p>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel className="border-red-400/20 bg-red-950/20">
            <div className="flex gap-3 text-red-100">
              <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0" size={20} />
              <div>
                <h2 className="font-semibold">Нет доступа</h2>
                <p className="mt-1 text-sm leading-6">
                  Аккаунт {auth.profile.handle} не входит в список
                  администраторов.
                </p>
              </div>
            </div>
          </Panel>
        )}

        <Panel>
          <h2 className="font-semibold">Что уже подключено</h2>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-text-muted">
            <li>Аккаунты через Supabase Auth password flow.</li>
            <li>Логин в формате Telegram-тега: `@name747`, только lowercase.</li>
            <li>Профиль сохраняется в таблицу `profiles` после входа/регистрации.</li>
            <li>Админ-доступ задаётся через `NEXT_PUBLIC_PLANORA_ADMIN_HANDLES`.</li>
          </ul>
        </Panel>
      </div>
    </main>
  );
}
