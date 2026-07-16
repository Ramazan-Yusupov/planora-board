import { deserializeSceneState, serializeScene } from "@/modules/draw-tool/entities/scene";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { SnapshotItem } from "./storage";

const DRAWTOOL_FILE_FORMAT = "drawtool-file";

export function createDrawToolFile(elements: BoardElement[], snapshots: SnapshotItem[]) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const payload = {
    format: DRAWTOOL_FILE_FORMAT,
    version: 1,
    savedAt: new Date().toISOString(),
    scene: serializeScene(
      elements,
      sceneStore.get().layers,
      sceneStore.get().activeLayerId,
    ),
    snapshots,
  };

  return {
    blob: new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    }),
    fileName: `drawtool-project-${timestamp}.drawtool`,
  };
}

export function parseDrawToolFile(source: string) {
  const parsed = JSON.parse(source) as {
    format?: string;
    scene?: ReturnType<typeof serializeScene>;
    snapshots?: SnapshotItem[];
  };
  const scene =
    parsed.format === DRAWTOOL_FILE_FORMAT && parsed.scene
      ? deserializeSceneState(JSON.stringify(parsed.scene))
      : deserializeSceneState(source);

  return {
    elements: scene.elements,
    scene,
    snapshots: Array.isArray(parsed.snapshots)
      ? parsed.snapshots.slice(0, 12)
      : undefined,
  };
}

