import { useEffect } from "react";
import { useAutoSave, useRestoreScene } from "@/modules/draw-tool/features/save-scene";
import { useWorkspaceAutoSave } from "@/modules/draw-tool/features/workspace-backup";
import { preventBrowserZoom } from "@/modules/draw-tool/shared/lib";
import { useBoardShortcuts } from "./useBoardShortcuts";

export function useBoardLifecycle() {
  useRestoreScene();
  useAutoSave();
  useWorkspaceAutoSave();
  useBoardShortcuts();

  useEffect(() => preventBrowserZoom(), []);
}

