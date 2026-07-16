import {
  createElement,
  DEFAULT_ELEMENT_STYLE,
  updateElement,
} from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import type { ShapeLibraryItem } from "./shapeLibraryItems";

function getInsertionPoint(width: number, height: number) {
  const viewport = viewportStore.get();
  return {
    x: viewport.x + window.innerWidth / viewport.zoom / 2 - width / 2,
    y: viewport.y + window.innerHeight / viewport.zoom / 2 - height / 2,
  };
}

function getLibraryShapeSize(item: ShapeLibraryItem) {
  if (item.elementType === "diamond") return { width: 180, height: 120 };
  if (item.elementType === "ellipse") return { width: 170, height: 86 };
  if (item.elementType === "advanced") return { width: 0, height: 0 };
  return { width: 220, height: 96 };
}

export function insertShapeLibraryItem(item: ShapeLibraryItem) {
  const size = getLibraryShapeSize(item);
  const point = getInsertionPoint(
    size.width || 260,
    size.height || 160,
  );
  const element =
    item.elementType === "advanced"
      ? createElement("advanced", {
          x: point.x,
          y: point.y,
          kind: item.kind,
          title: item.titleOverride,
          body: item.body,
        })
      : createElement(item.elementType, {
          x: point.x,
          y: point.y,
          width: size.width,
          height: size.height,
          style: {
            ...DEFAULT_ELEMENT_STYLE,
            backgroundColor: "#0f172a",
            cornerStyle: "rounded",
            fillStyle: "solid",
            strokeColor: "#cbd5e1",
          },
        });
  const inserted =
    "label" in element && item.label
      ? updateElement(element, { label: item.label })
      : element;

  historyStore.begin();
  sceneStore.setElements([...sceneStore.get().elements, inserted]);
  selectionStore.setElementIds([inserted.id]);
  historyStore.commit();
  return true;
}

