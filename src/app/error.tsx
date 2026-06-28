"use client";

import { useEffect } from "react";

import { Button } from "@/shared/ui";

type AppErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid h-dvh min-h-dvh place-items-center bg-canvas p-6 text-text">
      <section className="w-full max-w-md rounded-2xl border border-white/10 bg-panel p-6 shadow-xl">
        <h1 className="text-lg font-semibold">Не удалось открыть страницу</h1>
        <p className="mt-2 text-sm leading-6 text-text-muted">
          Попробуйте открыть страницу снова. Ваши локальные данные не будут удалены.
        </p>
        <Button className="mt-5" onClick={reset}>
          Повторить
        </Button>
      </section>
    </main>
  );
}
