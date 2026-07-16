import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  createArrowBinding,
  findArrowBindingTarget,
  getArrowBindingAnchor,
  hitTestElement,
  updateElement,
} from "@/modules/draw-tool/entities/element";
import type { BoardElement, ElementBinding } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import type { ShapeToolId, ToolId } from "@/modules/draw-tool/entities/tool";
import { toolStore } from "@/modules/draw-tool/entities/tool";
import { attachFrameChildren, findContainingFrame, sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import { arrowBindingIndicatorStore } from "@/modules/draw-tool/features/arrow-binding";
import { toolSettingsStore } from "@/modules/draw-tool/features/change-style";
import { toolLockStore } from "@/modules/draw-tool/features/tool-lock";
import { snapPointToGrid } from "@/modules/draw-tool/shared/lib/math/snapPointToGrid";
import type { Point } from "@/modules/draw-tool/shared/types";
import { getDrawingPoints } from "../lib/getDrawingPoints";
import { getWorldPointerPosition } from "../lib/getWorldPointerPosition";
import { getShapePreview } from "../lib/getShapePreview";
import { drawShape } from "./drawShape";
import { snapIndicatorStore } from "./snapIndicatorStore";

type DrawingState = {
  elementId: string;
  pointerId: number;
  startPoint: Point;
  startBinding?: ElementBinding;
  endBinding?: ElementBinding;
  toolId: ShapeToolId;
};

const MIN_ELEMENT_SIZE = 2;
const ARROW_BINDING_RADIUS = 18;

const CLICK_DEFAULT_SIZES: Partial<Record<ShapeToolId, { width: number; height: number }>> = {
  sticky: { width: 220, height: 160 },
  callout: { width: 260, height: 120 },
  table: { width: 420, height: 210 },
  markdown: { width: 340, height: 240 },
  code: { width: 360, height: 220 },
  advanced: { width: 320, height: 220 },
  badge: { width: 240, height: 96 },
};

function getElementAtPoint(point: Point, excludedId: string) {
  return [...sceneStore.get().elements]
    .reverse()
    .find((candidate) => candidate.id !== excludedId && hitTestElement(candidate, point));
}

function getArrowBindingAtPoint(point: Point, excludedElementId?: string) {
  const target = findArrowBindingTarget(
    sceneStore.get().elements,
    point,
    excludedElementId,
    ARROW_BINDING_RADIUS / viewportStore.get().zoom,
  );

  if (!target) {
    return undefined;
  }

  const binding = createArrowBinding(target, point);
  const anchorPoint = getArrowBindingAnchor(target, binding, point);

  return { anchorPoint, binding, targetId: target.id };
}

function isShapeTool(toolId: ToolId): toolId is ShapeToolId {
  return [
    "rectangle",
    "ellipse",
    "diamond",
    "triangle",
    "hexagon",
    "badge",
    "star",
    "cloud",
    "frame",
    "embed",
    "line",
    "arrow",
    "measure",
    "sticky",
    "callout",
    "table",
    "markdown",
    "code",
    "advanced",
  ].includes(toolId);
}

function getConstraint(toolId: ShapeToolId) {
  return toolId === "line" || toolId === "arrow" || toolId === "measure" ? "angle" : "square";
}

function isTooSmall(width: number, height: number, toolId: ShapeToolId) {
  if (toolId === "line" || toolId === "arrow" || toolId === "measure") {
    return Math.hypot(width, height) < MIN_ELEMENT_SIZE;
  }

  return (
    Math.abs(width) < MIN_ELEMENT_SIZE || Math.abs(height) < MIN_ELEMENT_SIZE
  );
}

function resizeClickCreatedElement(element: BoardElement, drawing: DrawingState) {
  if (!isTooSmall(element.width, element.height, drawing.toolId)) {
    return;
  }

  const defaultSize = CLICK_DEFAULT_SIZES[drawing.toolId];

  if (!defaultSize) {
    sceneStore.removeById(element.id);
    return;
  }

  sceneStore.updateById(element.id, (current) =>
    updateElement(current, {
      x:
        drawing.toolId === "callout"
          ? drawing.startPoint.x + 42
          : drawing.startPoint.x,
      y:
        drawing.toolId === "callout"
          ? drawing.startPoint.y + 34
          : drawing.startPoint.y,
      width: defaultSize.width,
      height: defaultSize.height,
    }),
  );
}

function getSceneElement(elementId: string) {
  return sceneStore.get().elements.find((element) => element.id === elementId);
}

function finalizeArrowBindings(element: BoardElement, drawing: DrawingState) {
  if (element.type !== "arrow") {
    return;
  }

  sceneStore.updateById(element.id, (current) =>
    current.type === "arrow"
      ? updateElement(current, {
          startBinding: drawing.startBinding,
          endBinding: drawing.endBinding,
        })
      : current,
  );
}

function attachCalloutTarget(element: BoardElement, drawing: DrawingState) {
  if (element.type !== "callout") {
    return;
  }

  const target = getElementAtPoint(drawing.startPoint, element.id);

  if (!target) {
    return;
  }

  sceneStore.updateById(element.id, (current) =>
    current.type === "callout"
      ? updateElement(current, { targetId: target.id })
      : current,
  );
}

function attachElementToFrame(element: BoardElement) {
  if (element.type === "frame") {
    sceneStore.setElements(attachFrameChildren(sceneStore.get().elements, element.id));
    return;
  }

  const parentFrame = findContainingFrame(element, sceneStore.get().elements);

  if (parentFrame) {
    sceneStore.updateById(element.id, (current) =>
      updateElement(current, { parentId: parentFrame.id }),
    );
  }
}

function selectCreatedElement(elementId: string) {
  selectionStore.setElementIds([elementId]);

  if (!toolLockStore.get()) {
    toolStore.set("selection");
  }
}

export function useDrawShape() {
  const drawingRef = useRef<DrawingState | null>(null);

  function updateIdleIndicator(event: ReactPointerEvent<HTMLCanvasElement>) {
    const activeTool = toolStore.get();

    if (!isShapeTool(activeTool)) {
      snapIndicatorStore.clear();
      arrowBindingIndicatorStore.clear();
      return;
    }

    const settings = toolSettingsStore.get(activeTool);

    if (!settings.snapToGrid) {
      snapIndicatorStore.clear();
      return;
    }

    const point = getWorldPointerPosition(event);
    snapIndicatorStore.set(snapPointToGrid(point, settings.snapSize));
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    const activeTool = toolStore.get();

    if (event.button !== 0 || !isShapeTool(activeTool)) {
      return;
    }

    const rawStartPoint = getWorldPointerPosition(event);
    const settings = toolSettingsStore.get(activeTool);
    const constraint = getConstraint(activeTool);

    let { startPoint } = getDrawingPoints(
      rawStartPoint,
      rawStartPoint,
      event.shiftKey,
      settings.snapToGrid,
      settings.snapSize,
      constraint,
    );
    let startBinding: ElementBinding | undefined;

    if (activeTool === "arrow") {
      const candidate = getArrowBindingAtPoint(startPoint);
      if (candidate) {
        startPoint = candidate.anchorPoint;
        startBinding = candidate.binding;
        arrowBindingIndicatorStore.set({
          targetId: candidate.targetId,
          anchorPoint: candidate.anchorPoint,
        });
      } else {
        arrowBindingIndicatorStore.clear();
      }
    }

    historyStore.begin();

    const preview = getShapePreview(
      activeTool,
      startPoint,
      startPoint,
      settings.style,
      settings.arrowRouting,
      {
        fontFamily: settings.fontFamily,
        fontSize: settings.fontSize,
        textAlign: settings.textAlign,
      },
    );
    const element =
      preview.type === "arrow" && startBinding
        ? updateElement(preview, { startBinding })
        : preview;

    drawingRef.current = {
      elementId: element.id,
      pointerId: event.pointerId,
      startPoint,
      startBinding,
      toolId: activeTool,
    };

    sceneStore.add(element);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drawing = drawingRef.current;

    if (!drawing || drawing.pointerId !== event.pointerId) {
      updateIdleIndicator(event);
      return;
    }

    const currentPoint = getWorldPointerPosition(event);
    const settings = toolSettingsStore.get(drawing.toolId);

    const points = getDrawingPoints(
      drawing.startPoint,
      currentPoint,
      event.shiftKey,
      settings.snapToGrid,
      settings.snapSize,
      getConstraint(drawing.toolId),
    );

    let endPoint = points.endPoint;

    if (drawing.toolId === "arrow") {
      const candidate = getArrowBindingAtPoint(currentPoint, drawing.elementId);

      if (candidate) {
        endPoint = candidate.anchorPoint;
        drawing.endBinding = candidate.binding;
        arrowBindingIndicatorStore.set({
          targetId: candidate.targetId,
          anchorPoint: candidate.anchorPoint,
        });
      } else {
        drawing.endBinding = undefined;
        arrowBindingIndicatorStore.clear();
      }
    }

    sceneStore.updateById(drawing.elementId, (element) =>
      drawShape(element, points.startPoint, endPoint),
    );

    if (event.shiftKey || settings.snapToGrid) {
      snapIndicatorStore.set(endPoint);
    } else {
      snapIndicatorStore.clear();
    }
  }

  function finishDrawing(event: ReactPointerEvent<HTMLCanvasElement>) {
    const drawing = drawingRef.current;

    if (!drawing || drawing.pointerId !== event.pointerId) {
      return;
    }

    const element = sceneStore
      .get()
      .elements.find((item) => item.id === drawing.elementId);

    drawingRef.current = null;
    snapIndicatorStore.clear();
    arrowBindingIndicatorStore.clear();

    if (element) {
      resizeClickCreatedElement(element, drawing);

      const normalizedElement = getSceneElement(element.id);

      if (normalizedElement) {
        finalizeArrowBindings(normalizedElement, drawing);
        attachCalloutTarget(normalizedElement, drawing);
        attachElementToFrame(normalizedElement);
        selectCreatedElement(element.id);
      }
    }

    historyStore.commit();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    onPointerDown,
    onPointerLeave: () => {
      snapIndicatorStore.clear();
      arrowBindingIndicatorStore.clear();
    },
    onPointerMove,
    onPointerUp: finishDrawing,
    onPointerCancel: finishDrawing,
  };
}

