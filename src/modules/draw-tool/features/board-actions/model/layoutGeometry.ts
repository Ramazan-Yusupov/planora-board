import { getElementBounds } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";

export type AlignCommand =
  | "left"
  | "center"
  | "right"
  | "top"
  | "middle"
  | "bottom";

export type DistributeCommand = "horizontal" | "vertical";

type Bounds = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export function getElementsBounds(elements: BoardElement[]) {
  if (elements.length === 0) {
    return null;
  }

  const bounds = elements.map(getElementBounds);
  const left = Math.min(...bounds.map((item) => item.x));
  const top = Math.min(...bounds.map((item) => item.y));
  const right = Math.max(...bounds.map((item) => item.x + item.width));
  const bottom = Math.max(...bounds.map((item) => item.y + item.height));

  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function getAlignedPositionPatch(
  command: AlignCommand,
  element: BoardElement,
  selectionBounds: Bounds,
): Partial<Pick<BoardElement, "x" | "y">> {
  const bounds = getElementBounds(element);

  switch (command) {
    case "left":
      return { x: element.x + selectionBounds.x - bounds.x };
    case "center":
      return {
        x:
          element.x +
          selectionBounds.x +
          selectionBounds.width / 2 -
          (bounds.x + bounds.width / 2),
      };
    case "right":
      return {
        x:
          element.x +
          selectionBounds.x +
          selectionBounds.width -
          (bounds.x + bounds.width),
      };
    case "top":
      return { y: element.y + selectionBounds.y - bounds.y };
    case "middle":
      return {
        y:
          element.y +
          selectionBounds.y +
          selectionBounds.height / 2 -
          (bounds.y + bounds.height / 2),
      };
    case "bottom":
      return {
        y:
          element.y +
          selectionBounds.y +
          selectionBounds.height -
          (bounds.y + bounds.height),
      };
  }
}

export function getDistributionTargets(
  elements: BoardElement[],
  command: DistributeCommand,
) {
  const sorted = [...elements].sort((a, b) => {
    const aBounds = getElementBounds(a);
    const bBounds = getElementBounds(b);
    return command === "horizontal"
      ? aBounds.x - bBounds.x
      : aBounds.y - bBounds.y;
  });
  const first = getElementBounds(sorted[0]);
  const last = getElementBounds(sorted[sorted.length - 1]);
  const span = command === "horizontal" ? last.x - first.x : last.y - first.y;
  const step = span / (sorted.length - 1);

  return new Map(
    sorted.map((element, index) => [
      element.id,
      (command === "horizontal" ? first.x : first.y) + step * index,
    ]),
  );
}

export function getAutoLayoutTargets(
  elements: BoardElement[],
  mode: "flow" | "grid" | "tree",
) {
  const bounds = getElementsBounds(elements);

  if (!bounds) {
    return null;
  }

  const columns =
    mode === "grid"
      ? Math.ceil(Math.sqrt(elements.length))
      : mode === "tree"
        ? 2
        : elements.length;
  const sorted = [...elements].sort(
    (left, right) => getElementBounds(left).x - getElementBounds(right).x,
  );

  return new Map(
    sorted.map((element, index) => {
      const column = index % columns;
      const row = Math.floor(index / columns);
      return [
        element.id,
        {
          x: bounds.x + column * 230,
          y: bounds.y + row * 140 + (mode === "tree" && column === 1 ? 44 : 0),
        },
      ];
    }),
  );
}

