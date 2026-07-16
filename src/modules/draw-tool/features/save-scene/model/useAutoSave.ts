import { useEffect } from "react";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import {
  cancelIdleCallback,
  debounce,
  scheduleIdleCallback,
} from "@/modules/draw-tool/shared/lib";
import { saveSceneToLocalStorage } from "../api/localSceneRepository";
import { saveScene } from "./saveScene";

/** Persists the active project and a local recovery copy after scene changes. */
export function useAutoSave() {
  useEffect(() => {
    let pendingSaveHandle: number | null = null;

    const persist = debounce(() => {
      saveSceneToLocalStorage(sceneStore.get().elements);

      if (pendingSaveHandle !== null) {
        cancelIdleCallback(pendingSaveHandle);
      }

      pendingSaveHandle = scheduleIdleCallback(() => {
        pendingSaveHandle = null;
        void saveScene();
      }, 800);
    }, 240);

    const unsubscribe = sceneStore.subscribe(persist);

    return () => {
      persist.flush();

      if (pendingSaveHandle !== null) {
        cancelIdleCallback(pendingSaveHandle);
      }

      unsubscribe();
    };
  }, []);
}

