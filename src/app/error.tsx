"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/shared/ui";

type AppErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function AppError({ error, reset }: AppErrorProps) {
  const router = useRouter();

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
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset}>Повторить</Button>
          <Button variant="secondary" onClick={() => router.back()}>
            Назад
          </Button>
        </div>
      </section>
    </main>
  );
}
