import { useEffect, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { boardActions } from "@/modules/draw-tool/features/board-actions";
import { Button, IconButton } from "@/modules/draw-tool/shared/ui";
import { framePresentationStore } from "../model/framePresentationStore";

export function FramePresentationOverlay() {
  const state = useSyncExternalStore(
    framePresentationStore.subscribe,
    framePresentationStore.get,
    framePresentationStore.get,
  );
  const frames = boardActions.getFrames();
  const activeIndex = Math.max(
    0,
    frames.findIndex((frame) => frame.id === state.frameId),
  );
  const activeFrame = frames[activeIndex];

  useEffect(() => {
    if (state.isOpen && activeFrame) {
      boardActions.focusElement(activeFrame.id);
    }
  }, [activeFrame, state.isOpen]);

  useEffect(() => {
    if (!state.isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        framePresentationStore.close();
      }

      if (event.key === "ArrowRight") {
        const next = frames[Math.min(activeIndex + 1, frames.length - 1)];
        if (next) framePresentationStore.setFrame(next.id);
      }

      if (event.key === "ArrowLeft") {
        const previous = frames[Math.max(activeIndex - 1, 0)];
        if (previous) framePresentationStore.setFrame(previous.id);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, frames, state.isOpen]);

  if (!state.isOpen || !activeFrame) {
    return null;
  }

  const previous = frames[Math.max(activeIndex - 1, 0)];
  const next = frames[Math.min(activeIndex + 1, frames.length - 1)];

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-50 flex justify-center px-4 max-[1100px]:bottom-24">
      <div className="pointer-events-auto flex max-w-[min(36rem,calc(100dvw-1rem))] items-center gap-2 rounded-xl border border-border bg-panel/95 px-2 py-2 shadow-float backdrop-blur-xl">
        <IconButton
          aria-label="Предыдущий frame"
          className="grid size-9 place-items-center rounded-lg text-text hover:bg-control disabled:opacity-40"
          disabled={activeIndex === 0}
          onClick={() => previous && framePresentationStore.setFrame(previous.id)}
          type="button"
        >
          <ChevronLeft size={18} />
        </IconButton>

        <Button
          className="min-w-0 flex-1 rounded-lg px-3 py-1.5 text-left text-sm text-text"
          onClick={() => boardActions.focusElement(activeFrame.id)}
          type="button"
        >
          <span className="block truncate font-semibold">{activeFrame.name}</span>
          <span className="block text-xs text-text-muted">
            {activeIndex + 1} / {frames.length}
          </span>
        </Button>

        <IconButton
          aria-label="Следующий frame"
          className="grid size-9 place-items-center rounded-lg text-text hover:bg-control disabled:opacity-40"
          disabled={activeIndex >= frames.length - 1}
          onClick={() => next && framePresentationStore.setFrame(next.id)}
          type="button"
        >
          <ChevronRight size={18} />
        </IconButton>

        <IconButton
          aria-label="Закрыть presentation mode"
          className="grid size-9 place-items-center rounded-lg text-text-muted hover:bg-control hover:text-text"
          onClick={framePresentationStore.close}
          type="button"
        >
          <X size={18} />
        </IconButton>
      </div>
    </div>
  );
}

