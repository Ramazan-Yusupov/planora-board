import { Minus, Plus, RotateCcw } from "lucide-react";
import { IconButton, Panel, Tooltip } from "@/modules/draw-tool/shared/ui";
import { useZoomControls } from "../model/useZoomControls";
import { ZoomValue } from "./ZoomValue";

/** Compact viewport controls mounted at the bottom of the board. */
export function ZoomControls() {
  const { resetZoom, zoom, zoomIn, zoomOut } = useZoomControls();

  return (
    <Panel className="flex items-center gap-1 rounded-2xl border border-border/90 bg-panel/92 p-1.5 shadow-panel backdrop-blur-xl">
      <Tooltip content="Уменьшить масштаб" side="top">
        <IconButton
          aria-label="Уменьшить масштаб"
          className="grid size-8 place-items-center rounded-xl hover:bg-control/85"
          onClick={zoomOut}
          type="button"
        >
          <Minus size={16} />
        </IconButton>
      </Tooltip>

      <ZoomValue zoom={zoom} />

      <Tooltip content="Увеличить масштаб" side="top">
        <IconButton
          aria-label="Увеличить масштаб"
          className="grid size-8 place-items-center rounded-xl hover:bg-control/85"
          onClick={zoomIn}
          type="button"
        >
          <Plus size={16} />
        </IconButton>
      </Tooltip>

      <Tooltip content="Сбросить масштаб" side="top">
        <IconButton
          aria-label="Сбросить масштаб"
          className="grid size-8 place-items-center rounded-xl hover:bg-control/85"
          onClick={resetZoom}
          type="button"
        >
          <RotateCcw size={15} />
        </IconButton>
      </Tooltip>
    </Panel>
  );
}

