import { deserializeSceneState } from "@/modules/draw-tool/entities/scene";

/** Reads and validates a .json DrawTool scene before it touches the active board. */
export async function parseSceneFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
    throw new Error("Выберите JSON-файл сцены DrawTool.");
  }

  return deserializeSceneState(await file.text());
}

