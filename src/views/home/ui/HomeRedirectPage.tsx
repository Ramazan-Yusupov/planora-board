"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useBoardWorkspace } from "@/features/manage-board-workspace";
import { getBoardRoute } from "@/shared/config/routes";

export function HomeRedirectPage() {
  const router = useRouter();
  const { activeBoard, isReady } = useBoardWorkspace();

  useEffect(() => {
    if (isReady && activeBoard) {
      router.replace(getBoardRoute(activeBoard.id));
    }
  }, [activeBoard, isReady, router]);

  return (
    <main className="grid h-dvh min-h-dvh place-items-center bg-canvas px-4 text-text">
      <p
        aria-busy="true"
        aria-live="polite"
        className="rounded-xl border border-white/15 bg-slate-950/35 px-4 py-3 text-sm text-white/80 backdrop-blur-sm"
      >
        Открываем проект…
      </p>
    </main>
  );
}
