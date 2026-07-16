import { useEffect } from "react";
import { updateElement } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import type { ToolId } from "@/modules/draw-tool/entities/tool";
import { toolStore } from "@/modules/draw-tool/entities/tool";
import { viewportStore, zoomAtPoint } from "@/modules/draw-tool/entities/viewport";
import { boardActions } from "@/modules/draw-tool/features/board-actions";
import { commandPaletteStore } from "@/modules/draw-tool/features/command-palette";
import { deleteSelectedElements } from "@/modules/draw-tool/features/delete-elements";
import { duplicateSelectedElements } from "@/modules/draw-tool/features/duplicate-elements";
import { textEditorStore } from "@/modules/draw-tool/features/edit-text";
import { editingLockStore } from "@/modules/draw-tool/features/lock-editing";
import {
  ROTATION_LARGE_STEP_ANGLE,
  ROTATION_SNAP_ANGLE,
  rotateSelectedElementBy,
} from "@/modules/draw-tool/features/rotate-elements";
import { toggleEditingLock } from "@/modules/draw-tool/features/lock-editing/model/toggleEditingLock";
import { saveScene } from "@/modules/draw-tool/features/save-scene";
import { shortcutsHelpStore } from "@/modules/draw-tool/features/shortcuts-help";
import { getToolFromShortcut } from "@/modules/draw-tool/features/shortcuts-help/model/shortcutDefinitions";
import { toolLockStore } from "@/modules/draw-tool/features/tool-lock";

function isEditingTextOrDialog(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(
    target.closest(
      "input, textarea, select, [contenteditable='true'], [role='dialog'], [aria-modal='true']",
    ),
  );
}

function nudgeSelection(deltaX: number, deltaY: number) {
  const selectedIds = new Set(selectionStore.get().elementIds);

  if (selectedIds.size === 0) {
    return false;
  }

  historyStore.begin();
  sceneStore.setElements(
    sceneStore.get().elements.map((element) => {
      if (!selectedIds.has(element.id)) {
        return element;
      }

      if (element.type === "freedraw" || element.type === "highlighter") {
        return updateElement(element, {
          x: element.x + deltaX,
          y: element.y + deltaY,
          points: element.points.map((point) => ({
            x: point.x + deltaX,
            y: point.y + deltaY,
          })),
        });
      }

      return updateElement(element, {
        x: element.x + deltaX,
        y: element.y + deltaY,
      });
    }),
  );
  historyStore.commit();
  return true;
}

function zoomFromViewportCenter(multiplier: number) {
  const viewport = viewportStore.get();
  const center = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };

  viewportStore.set(zoomAtPoint(viewport, center, viewport.zoom * multiplier));
}

function tryStartTextEditing() {
  const selectedIds = selectionStore.get().elementIds;

  if (selectedIds.length !== 1) {
    return false;
  }

  const element = sceneStore
    .get()
    .elements.find((item) => item.id === selectedIds[0]);

  if (!element || (element.type !== "text" && element.type !== "sticky" && element.type !== "callout")) {
    return false;
  }

  historyStore.begin();
  textEditorStore.open(element.id);
  return true;
}

export function useBoardShortcuts() {
  useEffect(() => {
    let spacePanRestoreTool: ToolId | null = null;

    function restoreSpacePan() {
      if (!spacePanRestoreTool) {
        return;
      }

      const toolToRestore = spacePanRestoreTool;
      spacePanRestoreTool = null;

      if (!editingLockStore.get().isLocked) {
        toolStore.set(toolToRestore);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      const modifierPressed = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      /*
       * Space must retain its normal behavior inside text fields. Other
       * commands are also suspended while any modal dialog is open.
       */
      if (isEditingTextOrDialog(event.target)) {
        return;
      }

      if (
        event.code === "Space" &&
        !modifierPressed &&
        !event.altKey &&
        !event.repeat
      ) {
        event.preventDefault();

        const activeTool = toolStore.get();
        if (activeTool !== "pan") {
          spacePanRestoreTool = activeTool;
          toolStore.set("pan");
        }
        return;
      }

      if (modifierPressed && event.shiftKey && key === "l") {
        event.preventDefault();
        toggleEditingLock();
        return;
      }

      if (modifierPressed && key === "z") {
        event.preventDefault();
        if (!editingLockStore.get().isLocked) {
          if (event.shiftKey) {
            historyStore.redo();
          } else {
            historyStore.undo();
          }
        }
        return;
      }

      if (modifierPressed && key === "y") {
        event.preventDefault();
        if (!editingLockStore.get().isLocked) {
          historyStore.redo();
        }
        return;
      }

      if (modifierPressed && !event.shiftKey && key === "d") {
        event.preventDefault();
        if (!editingLockStore.get().isLocked) {
          duplicateSelectedElements();
        }
        return;
      }

      if (modifierPressed && key === "a") {
        event.preventDefault();
        if (!editingLockStore.get().isLocked) {
          selectionStore.setElementIds(
            sceneStore.get().elements.map((element) => element.id),
          );
        }
        return;
      }

      if (modifierPressed && key === "s") {
        event.preventDefault();
        void saveScene();
        return;
      }

      if (modifierPressed && key === "0") {
        event.preventDefault();
        viewportStore.reset();
        return;
      }

      if (modifierPressed && (key === "+" || key === "=")) {
        event.preventDefault();
        zoomFromViewportCenter(1.1);
        return;
      }

      if (modifierPressed && key === "-") {
        event.preventDefault();
        zoomFromViewportCenter(1 / 1.1);
        return;
      }

      if (key === "?") {
        event.preventDefault();
        shortcutsHelpStore.toggle();
        return;
      }

      if (editingLockStore.get().isLocked) {
        if (event.key === "Escape") {
          selectionStore.clear();
          toolStore.set("pan");
        }
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        deleteSelectedElements();
        return;
      }

      if (event.key === "Escape") {
        selectionStore.clear();
        toolStore.set("selection");
        return;
      }

      if (event.key === "Enter" && tryStartTextEditing()) {
        event.preventDefault();
        return;
      }

      const rotationDirection =
        event.code === "BracketLeft" ? -1 : event.code === "BracketRight" ? 1 : 0;

      if (!modifierPressed && !event.altKey && rotationDirection !== 0) {
        const rotationStep = event.shiftKey
          ? ROTATION_LARGE_STEP_ANGLE
          : ROTATION_SNAP_ANGLE;

        if (rotateSelectedElementBy(rotationDirection * rotationStep)) {
          event.preventDefault();
          return;
        }
      }

      if (!modifierPressed && !event.altKey) {
        const amount = event.shiftKey ? 10 : 1;
        const nudgeByKey: Partial<Record<string, readonly [number, number]>> = {
          ArrowDown: [0, amount],
          ArrowLeft: [-amount, 0],
          ArrowRight: [amount, 0],
          ArrowUp: [0, -amount],
        };
        const nudge = nudgeByKey[event.key];

        if (nudge && nudgeSelection(nudge[0], nudge[1])) {
          event.preventDefault();
          return;
        }
      }

      if (!modifierPressed && !event.altKey && key === "q") {
        event.preventDefault();
        toolLockStore.toggle();
        return;
      }

      if (modifierPressed || event.altKey) {
        if (modifierPressed && key === "k") {
          event.preventDefault();
          commandPaletteStore.open();
          return;
        }

        if (modifierPressed && key === "c") {
          event.preventDefault();
          boardActions.copySelectionToClipboard();
          return;
        }

        if (modifierPressed && key === "v") {
          event.preventDefault();
          void boardActions.pasteElementsFromClipboard();
          return;
        }

        if (modifierPressed && key === "g") {
          event.preventDefault();
          if (event.shiftKey) {
            boardActions.ungroupSelection();
          } else {
            boardActions.groupSelection();
          }
          return;
        }

        if (modifierPressed && event.shiftKey && key === "k") {
          event.preventDefault();
          boardActions.toggleLockSelection();
          return;
        }

        return;
      }

      const nextTool = getToolFromShortcut(key);
      if (!nextTool) {
        return;
      }

      event.preventDefault();

      if (editingLockStore.get().isLocked && nextTool !== "pan") {
        return;
      }

      if (spacePanRestoreTool) {
        spacePanRestoreTool = nextTool;
        return;
      }

      toolStore.set(nextTool);
    }

    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") {
        restoreSpacePan();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", restoreSpacePan);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", restoreSpacePan);
    };
  }, []);
}

