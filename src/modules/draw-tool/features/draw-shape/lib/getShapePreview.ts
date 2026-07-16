import type { ArrowRouting, ElementStyle, TextAlign } from "@/modules/draw-tool/entities/element";
import type { ShapeToolId } from "@/modules/draw-tool/entities/tool";
import type { Point } from "@/modules/draw-tool/shared/types";
import { drawShape } from "../model/drawShape";
import { createElementByTool } from "../model/createElementByTool";

/** Creates a temporary element model for the active drawing gesture. */
export function getShapePreview(
  toolId: ShapeToolId,
  startPoint: Point,
  endPoint: Point,
  style: ElementStyle,
  arrowRouting?: ArrowRouting,
  textOptions?: { fontSize: number; fontFamily: string; textAlign: TextAlign },
) {
  const preview = createElementByTool({
    arrowRouting,
    fontFamily: textOptions?.fontFamily,
    fontSize: textOptions?.fontSize,
    startPoint,
    style,
    textAlign: textOptions?.textAlign,
    toolId,
  });

  return drawShape(preview, startPoint, endPoint);
}

