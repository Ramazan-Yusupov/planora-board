import type { Rect } from "@/modules/draw-tool/shared/types";

export type SelectionState = {
  elementIds: string[];
  selectionBox: Rect | null;
};

