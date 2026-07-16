import { toolStore } from "@/modules/draw-tool/entities/tool";
import {
  DRAWTOOL_WORKSPACE_FORMAT,
  DRAWTOOL_WORKSPACE_VERSION,
} from "@/modules/draw-tool/entities/workspace";
import type { DrawToolWorkspace } from "@/modules/draw-tool/entities/workspace";
import { toolSettingsStore } from "@/modules/draw-tool/features/change-style";
import { projectStore } from "@/modules/draw-tool/features/projects";
import { createId } from "@/modules/draw-tool/shared/lib";

export async function createWorkspaceSnapshot(
  meta: Pick<DrawToolWorkspace, "workspaceId" | "revision"> = {
    workspaceId: createId("workspace"),
    revision: 0,
  },
): Promise<DrawToolWorkspace> {
  const projectState = projectStore.get();
  const projects = await projectStore.getWorkspaceProjects();

  return {
    format: DRAWTOOL_WORKSPACE_FORMAT,
    version: DRAWTOOL_WORKSPACE_VERSION,
    workspaceId: meta.workspaceId || createId("workspace"),
    revision: meta.revision,
    savedAt: new Date().toISOString(),
    activeProjectId: projectState.activeProjectId,
    projects,
    preferences: {
      activeTool: toolStore.get(),
      toolSettingsByTool: toolSettingsStore.getAll(),
    },
  };
}

