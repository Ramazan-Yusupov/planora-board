import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { SceneLayer } from "@/modules/draw-tool/entities/scene";

export type HistorySnapshot = {
  activeLayerId: string;
  elements: BoardElement[];
  layers: SceneLayer[];
};

export type HistoryState = {
  canRedo: boolean;
  canUndo: boolean;
  version: number;
};

