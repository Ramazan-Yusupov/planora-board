import { toolStore } from "@/modules/draw-tool/entities/tool";
import type { DrawToolWorkspace } from "@/modules/draw-tool/entities/workspace";
import { toolSettingsStore } from "@/modules/draw-tool/features/change-style";
import { projectStore } from "@/modules/draw-tool/features/projects";

export async function restoreWorkspaceSnapshot(workspace: DrawToolWorkspace) {
  const restored = await projectStore.replaceWorkspaceProjects(
    workspace.projects,
    workspace.activeProjectId,
  );

  if (!restored) {
    throw new Error("Не удалось заменить проекты в локальном хранилище.");
  }

  toolStore.set(workspace.preferences.activeTool);
  toolSettingsStore.replaceAll(workspace.preferences.toolSettingsByTool);
}

