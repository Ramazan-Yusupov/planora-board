import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { SceneLayer } from "../model/types";

export type SceneFile = {
  activeLayerId?: string;
  format: "drawtool-scene";
  version: 1;
  savedAt: string;
  elements: BoardElement[];
  layers?: SceneLayer[];
};

export function serializeScene(
  elements: BoardElement[],
  layers?: SceneLayer[],
  activeLayerId?: string,
): SceneFile {
  return {
    activeLayerId,
    format: "drawtool-scene",
    version: 1,
    savedAt: new Date().toISOString(),
    elements: JSON.parse(JSON.stringify(elements)) as BoardElement[],
    layers: layers
      ? (JSON.parse(JSON.stringify(layers)) as SceneLayer[])
      : undefined,
  };
}

