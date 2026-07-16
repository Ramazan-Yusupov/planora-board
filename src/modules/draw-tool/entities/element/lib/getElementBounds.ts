import type { Rect } from "@/modules/draw-tool/shared/types";
import type { BoardElement } from "../model/types";
import { getTextElementSize } from "./getTextSize";
import { getArrowPathPoints } from "./getArrowPathPoints";

export function getElementBounds(element: BoardElement): Rect {
  if (element.type === "arrow") {
    const points = getArrowPathPoints(element);
    const xValues = points.map((point) => point.x);
    const yValues = points.map((point) => point.y);
    const x = Math.min(...xValues);
    const y = Math.min(...yValues);

    return {
      x,
      y,
      width: Math.max(...xValues) - x,
      height: Math.max(...yValues) - y,
    };
  }

  if (element.type === "text") {
    const size = getTextElementSize(element);

    return {
      x: element.x,
      y: element.y,
      width: Math.max(element.width, size.width),
      height: Math.max(element.height, size.height),
    };
  }

  const x = Math.min(element.x, element.x + element.width);
  const y = Math.min(element.y, element.y + element.height);

  return {
    x,
    y,
    width: Math.abs(element.width),
    height: Math.abs(element.height),
  };
}

