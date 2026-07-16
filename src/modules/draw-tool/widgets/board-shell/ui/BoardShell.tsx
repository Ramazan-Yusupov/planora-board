import { useRef, useState, useSyncExternalStore } from "react";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { toolStore } from "@/modules/draw-tool/entities/tool";
import { TOOL_SETTINGS_CAPABILITIES } from "@/modules/draw-tool/features/change-style";
import { TextEditorOverlay } from "@/modules/draw-tool/features/edit-text";
import { CommandPalette } from "@/modules/draw-tool/features/command-palette";
import { ComponentLibraryDialog } from "@/modules/draw-tool/features/component-library";
import { editingLockStore } from "@/modules/draw-tool/features/lock-editing";
import {
  FramePresentationOverlay,
  ProductivityToolsDialog,
} from "@/modules/draw-tool/features/productivity-tools";
import { ProjectsSidebar } from "@/modules/draw-tool/features/projects";
import { SceneStorageControls } from "@/modules/draw-tool/features/save-scene";
import { ShapeLibraryDialog } from "@/modules/draw-tool/features/shape-library";
import { ShortcutsDialog } from "@/modules/draw-tool/features/shortcuts-help";
import { UndoRedoButtons } from "@/modules/draw-tool/features/undo-redo";
import { LayersPanel } from "@/modules/draw-tool/widgets/layers-panel";
import { PropertiesPanel } from "@/modules/draw-tool/widgets/properties-panel";
import { Toolbar } from "@/modules/draw-tool/widgets/toolbar";
import { ZoomControls } from "@/modules/draw-tool/widgets/zoom-controls";
import { BoardCanvas } from "./BoardCanvas";
import { BoardSelectionFrame } from "./BoardSelectionFrame";
import { useBoardRenderer } from "../model/useBoardRenderer";

const UTILITY_TOOLS_WITHOUT_PROPERTIES = new Set([
  "pan",
  "eraser",
  "laser",
  "lasso",
]);

export function BoardShell() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isLayersOpen, setIsLayersOpen] = useState(false);

  useBoardRenderer(canvasRef);

  const activeTool = useSyncExternalStore(
    toolStore.subscribe,
    toolStore.get,
    toolStore.get,
  );

  const selectedElementIds = useSyncExternalStore(
    selectionStore.subscribeElementIds,
    () => selectionStore.get().elementIds,
    () => selectionStore.get().elementIds,
  );

  const { isLocked } = useSyncExternalStore(
    editingLockStore.subscribe,
    editingLockStore.get,
    editingLockStore.get,
  );

  const hasSelectedElements = selectedElementIds.length > 0;
  const toolCapabilities = TOOL_SETTINGS_CAPABILITIES[activeTool];
  const toolHasSettings = Object.values(toolCapabilities).some(Boolean);

  const shouldShowProperties =
    !isLocked &&
    !UTILITY_TOOLS_WITHOUT_PROPERTIES.has(activeTool) &&
    (hasSelectedElements || (activeTool !== "selection" && toolHasSettings));

  return (
    <section className="relative size-full overflow-hidden bg-canvas">
      <BoardCanvas canvasRef={canvasRef} />
      <BoardSelectionFrame />

      <TextEditorOverlay />
      <ProductivityToolsDialog />
      <FramePresentationOverlay />
      <CommandPalette />
      <ComponentLibraryDialog />
      <ShapeLibraryDialog />
      <ShortcutsDialog />
      <ProjectsSidebar />

      <UndoRedoButtons />
      <SceneStorageControls
        isLayersOpen={isLayersOpen}
        onToggleLayers={() => setIsLayersOpen((open) => !open)}
      />
      <Toolbar />

      <div className="absolute bottom-4 right-4 z-20 max-[1100px]:bottom-20">
        <ZoomControls />
      </div>

      {isLayersOpen && (
        <div className="absolute left-4 top-20 z-30 max-lg:left-[max(0.5rem,env(safe-area-inset-left))] max-lg:top-34">
          <LayersPanel onClose={() => setIsLayersOpen(false)} />
        </div>
      )}

      {shouldShowProperties && <PropertiesPanel />}
    </section>
  );
}

