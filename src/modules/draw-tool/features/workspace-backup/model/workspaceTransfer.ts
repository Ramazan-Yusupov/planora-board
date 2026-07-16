import type { DrawToolWorkspace } from "@/modules/draw-tool/entities/workspace";
import { downloadFile } from "@/modules/draw-tool/features/export-scene";
import { createWorkspaceSnapshot } from "./createWorkspaceSnapshot";

export async function downloadWorkspaceExport() {
  const workspace = await createWorkspaceSnapshot();
  const blob = new Blob([JSON.stringify(workspace, null, 2)], {
    type: "application/json",
  });
  downloadFile(blob, "drawtool-workspace-backup.json");
}

export function getWorkspaceProjectCount(workspace: DrawToolWorkspace) {
  return workspace.projects.length;
}

