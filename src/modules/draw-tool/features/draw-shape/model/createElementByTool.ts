import { createElement } from "@/modules/draw-tool/entities/element";
import type { BoardElement, ElementStyle, TextAlign } from "@/modules/draw-tool/entities/element";
import type { ShapeToolId } from "@/modules/draw-tool/entities/tool";
import { advancedShapeStore } from "@/modules/draw-tool/features/advanced-shapes";
import type { Point } from "@/modules/draw-tool/shared/types";

type CreateElementByToolParams = {
  startPoint: Point;
  style: ElementStyle;
  toolId: ShapeToolId;
  arrowRouting?: "straight" | "elbow" | "curve";
  fontSize?: number;
  fontFamily?: string;
  textAlign?: TextAlign;
};

export function createElementByTool({
  startPoint,
  style,
  toolId,
  arrowRouting,
  fontSize,
  fontFamily,
  textAlign,
}: CreateElementByToolParams): BoardElement {
  return createElement(toolId, {
    x: startPoint.x,
    y: startPoint.y,
    width: 0,
    height: 0,
    style,
    fontSize,
    fontFamily,
    textAlign,
    kind: toolId === "advanced" ? advancedShapeStore.get() : undefined,
    routing: arrowRouting,
  });
}

