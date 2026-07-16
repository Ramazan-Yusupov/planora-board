import { deserializeScene } from "@/modules/draw-tool/entities/scene/lib/deserializeScene";
import { serializeScene } from "@/modules/draw-tool/entities/scene/lib/serializeScene";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { projectStore } from "@/modules/draw-tool/features/projects";

function getFileName() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `drawtool-scene-${timestamp}.json`;
}

function getProjectNameFromFileName(fileName: string) {
  const sanitized = fileName.replace(/\.json$/i, "").trim();
  return sanitized || "Импортированный проект";
}

export function downloadSceneFile() {
  const file = serializeScene(sceneStore.get().elements);
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getFileName();
  link.click();
  URL.revokeObjectURL(url);
}

/** Imports a JSON scene as a separate IndexedDB project. */
export async function restoreSceneFromFile(file: File) {
  const source = await file.text();
  const elements = deserializeScene(source);
  const result = await projectStore.createImportedProject(
    getProjectNameFromFileName(file.name),
    elements,
  );

  if (!result.ok) {
    throw new Error(
      result.reason === "limit"
        ? "Project limit reached"
        : "Unable to import project",
    );
  }
}

