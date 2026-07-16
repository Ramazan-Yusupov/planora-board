import { useEffect } from "react";
import { projectStore } from "@/modules/draw-tool/features/projects";

/** Restores the active IndexedDB project once at app startup. */
export function useRestoreScene() {
  useEffect(() => {
    void projectStore.initialize();
  }, []);
}

