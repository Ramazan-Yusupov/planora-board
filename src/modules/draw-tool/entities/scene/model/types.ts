import type { BoardElement } from "@/modules/draw-tool/entities/element";

export const DEFAULT_LAYER_ID = "layer-default";

export type SceneLayer = {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  createdAt: number;
  updatedAt: number;
};

export type SceneState = {
  activeLayerId: string;
  elements: BoardElement[];
  layers: SceneLayer[];
  version: number;
};

