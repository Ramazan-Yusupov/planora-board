"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="grid h-dvh min-h-dvh place-items-center bg-canvas p-6 text-text">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
          404
        </p>
        <h1 className="mt-3 text-lg font-semibold">Страница не найдена</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Такой страницы в Planora нет или ссылка устарела. Локальные проекты,
          заметки и вложения не будут изменены.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => router.push("/")}>На главную</Button>
          <Button variant="secondary" onClick={() => router.back()}>
            Назад
          </Button>
        </div>
      </section>
    </main>
  );
}
