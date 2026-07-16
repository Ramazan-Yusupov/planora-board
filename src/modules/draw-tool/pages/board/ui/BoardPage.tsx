import { BoardShell } from "@/modules/draw-tool/widgets/board-shell";
import { useBoardLifecycle } from "../model/useBoardLifecycle";

export function BoardPage() {
  useBoardLifecycle();

  return (
    <main
      aria-label="Рабочая область DrawTool"
      className="size-full bg-canvas"
    >
      <BoardShell />
    </main>
  );
}

