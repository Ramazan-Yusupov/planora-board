import { useEffect } from "react";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { toolStore } from "@/modules/draw-tool/entities/tool";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import { toolSettingsStore } from "@/modules/draw-tool/features/change-style";
import { projectStore } from "@/modules/draw-tool/features/projects";
import { debounce } from "@/modules/draw-tool/shared/lib";
import { workspacePersistenceStore } from "./workspacePersistenceStore";

/** Keeps browser projects and an optional connected backup folder in sync. */
export function useWorkspaceAutoSave() {
  useEffect(() => {
    void workspacePersistenceStore.initialize();

    const persist = debounce(() => {
      void workspacePersistenceStore.saveNow();
    }, 650);

    const unsubscribers = [
      sceneStore.subscribe(persist),
      viewportStore.subscribe(persist),
      projectStore.subscribe(persist),
      toolStore.subscribe(persist),
      toolSettingsStore.subscribe(persist),
    ];

    function flush() {
      persist.flush();
    }

    window.addEventListener("pagehide", flush);

    return () => {
      persist.flush();
      window.removeEventListener("pagehide", flush);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);
}

