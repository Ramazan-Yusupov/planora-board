import { useEffect, useState, useSyncExternalStore } from "react";
import { Settings2 } from "lucide-react";
import { cn } from "@/modules/draw-tool/shared/lib";
import {
  getElementRotation,
  getTextSize,
  updateElement,
} from "@/modules/draw-tool/entities/element";
import type {
  AdvancedElement,
  ArrowRouting,
  BoardElement,
  ElementStyle,
  TextAlign,
} from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { useDuplicateElements } from "@/modules/draw-tool/features/duplicate-elements";
import {
  applyCopiedStyleToSelectedElements,
  copyElementStyle,
  styleClipboardStore,
} from "@/modules/draw-tool/features/style-clipboard";
import {
  updateTableCell,
  updateTableFontSize,
  updateTableStructure,
} from "@/modules/draw-tool/features/edit-table";
import {
  canChangeElementsLayer,
  reorderElementsByLayer,
  type LayerAction,
} from "@/modules/draw-tool/features/change-layer";
import { expandFramesToFitChildren, sceneStore } from "@/modules/draw-tool/entities/scene";
import { TOOL_LABELS } from "@/modules/draw-tool/entities/tool";
import {
  ToolStyleSection,
  TOOL_SETTINGS_CAPABILITIES,
  toolSettingsStore,
} from "@/modules/draw-tool/features/change-style";
import { Button, IconButton } from "@/modules/draw-tool/shared/ui";
import { useChangeStyle } from "@/modules/draw-tool/features/change-style/model/useChangeStyle";
import { useDeleteElements } from "@/modules/draw-tool/features/delete-elements";
import {
  degreesToRadians,
  setSelectedElementRotation,
} from "@/modules/draw-tool/features/rotate-elements";
import { ArrowSection } from "./ArrowSection";
import { ArrowRoutingSection } from "./ArrowRoutingSection";
import { CodeSection } from "./CodeSection";
import { EmbedSection } from "./EmbedSection";
import { ImageSection } from "./ImageSection";
import { ElementTitleSection, hasOwnTitle } from "./ElementTitleSection";
import { MarkdownSection } from "./MarkdownSection";
import { PremiumSection } from "./PremiumSection";
import { PropertiesPanelHeader } from "./PropertiesPanelHeader";
import { RotationSection } from "./RotationSection";
import { SelectionActionsSection } from "./SelectionActionsSection";
import { TableSection } from "./TableSection";
import { TextOptionsSection } from "./TextOptionsSection";
import { usePropertiesPanel } from "../model/usePropertiesPanel";

type StyleTarget = {
  style: ElementStyle;
  type: BoardElement["type"] | "tool";
};

function isAdvancedElement(
  element: BoardElement | null,
): element is AdvancedElement {
  return Boolean(element && element.type === "code" && "kind" in element);
}

function isCodeSketchElement(
  element: BoardElement | null,
): element is Extract<BoardElement, { type: "code"; code: string }> {
  return Boolean(element && element.type === "code" && !("kind" in element));
}

function hasTextSize(element: BoardElement | null): element is Extract<
  BoardElement,
  { type: "text" | "sticky" | "callout" }
> {
  return Boolean(
    element &&
      (element.type === "text" ||
        element.type === "sticky" ||
        element.type === "callout"),
  );
}

export function PropertiesPanel() {
  const [isCompactPanelOpen, setIsCompactPanelOpen] = useState(false);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");

    function closeCompactPanelOnDesktop() {
      if (desktopQuery.matches) {
        setIsCompactPanelOpen(false);
      }
    }

    closeCompactPanelOnDesktop();
    desktopQuery.addEventListener("change", closeCompactPanelOnDesktop);

    return () => {
      desktopQuery.removeEventListener("change", closeCompactPanelOnDesktop);
    };
  }, []);

  const { activeTool, primaryElement, scene, selectedElements } =
    usePropertiesPanel();
  const changeSelectedStyle = useChangeStyle();
  const deleteSelection = useDeleteElements();
  const duplicateSelection = useDuplicateElements();
  const styleClipboard = useSyncExternalStore(
    styleClipboardStore.subscribe,
    styleClipboardStore.get,
    styleClipboardStore.get,
  );

  const selectedElementIds = new Set(
    selectedElements.map((element) => element.id),
  );

  const settingsTool = primaryElement?.type ?? activeTool;

  const toolSettings = useSyncExternalStore(
    toolSettingsStore.subscribe,
    () => toolSettingsStore.get(settingsTool),
    () => toolSettingsStore.get(settingsTool),
  );

  const targetType = settingsTool;
  const capabilities = TOOL_SETTINGS_CAPABILITIES[targetType];

  const target: StyleTarget = {
    type: primaryElement?.type ?? "tool",
    style: primaryElement?.style ?? toolSettings.style,
  };

  const title = primaryElement
    ? TOOL_LABELS[primaryElement.type]
    : selectedElements.length > 1
      ? `Выбрано: ${selectedElements.length}`
      : `Инструмент: ${TOOL_LABELS[activeTool]}`;

  const canSendToBack = canChangeElementsLayer(
    scene.elements,
    selectedElementIds,
    "back",
  );
  const canMoveBackward = canChangeElementsLayer(
    scene.elements,
    selectedElementIds,
    "backward",
  );
  const canMoveForward = canChangeElementsLayer(
    scene.elements,
    selectedElementIds,
    "forward",
  );
  const canBringToFront = canChangeElementsLayer(
    scene.elements,
    selectedElementIds,
    "front",
  );

  function mutateScene(action: () => void) {
    historyStore.begin();
    action();
    historyStore.commit();
  }

  function patchSelectedStyle(patch: Partial<ElementStyle>) {
    if (selectedElements.length === 0) {
      toolSettingsStore.patchStyle(settingsTool, patch);
      return;
    }

    changeSelectedStyle(patch);
  }

  function changeEmbedUrl(url: string) {
    if (primaryElement?.type !== "embed") {
      return;
    }

    mutateScene(() => {
      sceneStore.updateById(primaryElement.id, (element) =>
        element.type === "embed" ? updateElement(element, { url }) : element,
      );
    });
  }

  function changeArrowRouting(routing: ArrowRouting) {
    if (primaryElement?.type === "arrow") {
      mutateScene(() => {
        sceneStore.updateById(primaryElement.id, (element) =>
          element.type === "arrow"
            ? updateElement(element, {
                routing,
                ...(routing === "straight"
                  ? {}
                  : { waypointBindings: undefined, waypoints: undefined }),
              })
            : element,
        );
      });

      return;
    }

    toolSettingsStore.setArrowRouting(settingsTool, routing);
  }

  function toggleArrowElbowAxis() {
    if (primaryElement?.type !== "arrow") {
      return;
    }

    mutateScene(() => {
      sceneStore.updateById(primaryElement.id, (element) =>
        element.type === "arrow"
          ? updateElement(element, {
              elbowAxis:
                element.elbowAxis === "horizontal" ? "vertical" : "horizontal",
            })
          : element,
      );
    });
  }

  function changeTextOptions(patch: {
    fontSize?: number;
    textAlign?: TextAlign;
  }) {
    if (hasTextSize(primaryElement)) {
      mutateScene(() => {
        sceneStore.updateById(primaryElement.id, (element) => {
          if (!hasTextSize(element)) {
            return element;
          }

          const fontSize = patch.fontSize ?? element.fontSize;

          if (element.type !== "text") {
            return updateElement(element, { fontSize });
          }

          const size = getTextSize(
            element.text || " ",
            fontSize,
            element.fontFamily,
          );

          return updateElement(element, {
            ...patch,
            width: size.width,
            height: size.height,
          });
        });

        const nextElements = expandFramesToFitChildren(
          sceneStore.get().elements,
        );

        if (nextElements !== sceneStore.get().elements) {
          sceneStore.setElements(nextElements);
        }
      });

      return;
    }

    toolSettingsStore.setTextOptions(settingsTool, {
      fontSize: patch.fontSize ?? toolSettings.fontSize,
      fontFamily: toolSettings.fontFamily,
      textAlign: patch.textAlign ?? toolSettings.textAlign,
    });
  }

  function changeLayer(action: LayerAction) {
    if (selectedElementIds.size === 0) {
      return;
    }

    const nextElements = reorderElementsByLayer(
      scene.elements,
      selectedElementIds,
      action,
    );

    // Do not create an empty history entry when the selected object is already
    // at the requested edge of its stacking context.
    if (nextElements === scene.elements) {
      return;
    }

    mutateScene(() => {
      sceneStore.setElements(nextElements);
    });
  }

  return (
    <>
      {!isCompactPanelOpen && (
        <IconButton
          aria-label="Открыть настройки"
          className="absolute right-[max(0.5rem,env(safe-area-inset-right))] top-20 z-30 grid size-11 place-items-center rounded-xl border border-border bg-panel text-text shadow-panel transition-colors hover:bg-control lg:hidden"
          onClick={() => setIsCompactPanelOpen(true)}
          title="Настройки"
          type="button"
        >
          <Settings2 aria-hidden size={19} />
        </IconButton>
      )}

      {isCompactPanelOpen && (
        <Button
          aria-label="Закрыть настройки"
          className="absolute inset-0 z-30 bg-black/30 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsCompactPanelOpen(false)}
          type="button"
        />
      )}

      <aside
        className={cn(
          "fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom))] z-40 max-h-[min(72dvh,34rem)] overflow-y-auto rounded-2xl border border-border bg-panel p-3 shadow-panel lg:absolute lg:right-4 lg:top-20 lg:z-20 lg:block lg:max-h-[calc(100dvh-13rem)] lg:w-[18rem] lg:rounded-xl",
          isCompactPanelOpen ? "max-lg:block" : "max-lg:hidden",
        )}
      >
        <PropertiesPanelHeader
          onClose={() => setIsCompactPanelOpen(false)}
          subtitle={
            primaryElement
              ? "Изменения применяются сразу"
              : "Стиль следующих объектов"
          }
          title={title}
        />

        <div className="space-y-5">
          {(capabilities.stroke ||
            capabilities.fill ||
            capabilities.corner ||
            capabilities.opacity) && (
            <ToolStyleSection
              capabilities={capabilities}
              onChange={patchSelectedStyle}
              style={target.style}
            />
          )}

          {capabilities.arrowRouting && (
            <ArrowRoutingSection
              onChange={changeArrowRouting}
              onToggleElbowAxis={toggleArrowElbowAxis}
              routing={
                primaryElement?.type === "arrow"
                  ? primaryElement.routing
                  : toolSettings.arrowRouting
              }
              showElbowAxisToggle={
                primaryElement?.type === "arrow" &&
                primaryElement.routing === "elbow"
              }
            />
          )}

          {primaryElement?.type === "arrow" &&
            primaryElement.routing === "straight" && (
              <ArrowSection element={primaryElement} />
            )}

          {capabilities.text && (
            <TextOptionsSection
              fontSize={
                hasTextSize(primaryElement)
                  ? primaryElement.fontSize
                  : toolSettings.fontSize
              }
              onChange={changeTextOptions}
              showAlign={capabilities.textAlign ?? true}
              textAlign={
                primaryElement?.type === "text"
                  ? primaryElement.textAlign
                  : toolSettings.textAlign
              }
            />
          )}

          {hasOwnTitle(primaryElement) && (
            <ElementTitleSection element={primaryElement} />
          )}

          {primaryElement?.type === "embed" && (
            <EmbedSection url={primaryElement.url} onChange={changeEmbedUrl} />
          )}

          {primaryElement?.type === "image" && (
            <ImageSection element={primaryElement} />
          )}

          {primaryElement?.type === "markdown" && (
            <MarkdownSection element={primaryElement} />
          )}

          {isCodeSketchElement(primaryElement) && (
            <CodeSection element={primaryElement} />
          )}

          {primaryElement?.type === "table" && (
            <TableSection
              onChangeCell={(cellIndex, value) =>
                updateTableCell(primaryElement.id, cellIndex, value)
              }
              onChangeFontSize={(fontSize) =>
                updateTableFontSize(primaryElement.id, fontSize)
              }
              onChangeStructure={(rows, columns) =>
                updateTableStructure(primaryElement.id, rows, columns)
              }
              table={primaryElement}
            />
          )}

          {isAdvancedElement(primaryElement) && (
            <PremiumSection element={primaryElement} />
          )}

          {primaryElement && primaryElement.type !== "arrow" && (
            <RotationSection
              angleRadians={getElementRotation(primaryElement)}
              onChange={(degrees) =>
                setSelectedElementRotation(degreesToRadians(degrees))
              }
            />
          )}

          {selectedElements.length > 0 && (
            <SelectionActionsSection
              canApplyStyle={Boolean(styleClipboard.style)}
              canBringToFront={canBringToFront}
              canMoveBackward={canMoveBackward}
              canMoveForward={canMoveForward}
              canSendToBack={canSendToBack}
              onApplyStyle={applyCopiedStyleToSelectedElements}
              onChangeLayer={changeLayer}
              onCopyStyle={() => {
                const source = primaryElement ?? selectedElements[0];
                if (source) copyElementStyle(source);
              }}
              onDeleteSelection={deleteSelection}
              onDuplicateSelection={duplicateSelection}
            />
          )}
        </div>
      </aside>
    </>
  );
}

