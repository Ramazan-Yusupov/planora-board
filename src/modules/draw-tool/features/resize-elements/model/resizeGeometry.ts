import { getElementRotation } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { CANVAS_CONFIG } from "@/modules/draw-tool/shared/config";
import { rotatePoint } from "@/modules/draw-tool/shared/lib";
import { snapPointToGrid } from "@/modules/draw-tool/shared/lib/math/snapPointToGrid";
import type { ResizeHandle } from "./types";

export type GeometryPatch = Partial<
  Pick<BoardElement, "x" | "y" | "width" | "height">
>;

export function getGeometry(element: BoardElement, patch: GeometryPatch) {
  return {
    x: patch.x ?? element.x,
    y: patch.y ?? element.y,
    width: patch.width ?? element.width,
    height: patch.height ?? element.height,
  };
}

function getGeometryCenter(
  geometry: Pick<BoardElement, "x" | "y" | "width" | "height">,
) {
  return {
    x: geometry.x + geometry.width / 2,
    y: geometry.y + geometry.height / 2,
  };
}

function getFixedResizeAnchor(
  geometry: Pick<BoardElement, "x" | "y" | "width" | "height">,
  handle: ResizeHandle,
) {
  const center = getGeometryCenter(geometry);
  const right = geometry.x + geometry.width;
  const bottom = geometry.y + geometry.height;

  return {
    x: handle.includes("w")
      ? right
      : handle.includes("e")
        ? geometry.x
        : center.x,
    y: handle.includes("n")
      ? bottom
      : handle.includes("s")
        ? geometry.y
        : center.y,
  };
}

export function anchorRotatedPatch(
  element: BoardElement,
  handle: ResizeHandle,
  patch: GeometryPatch,
  resizeFromCenter: boolean,
): GeometryPatch {
  const angle = getElementRotation(element);

  if (
    angle === 0 ||
    resizeFromCenter ||
    element.type === "line" ||
    element.type === "arrow" ||
    element.type === "measure"
  ) {
    return patch;
  }

  const initialGeometry = getGeometry(element, {});
  const nextGeometry = getGeometry(element, patch);
  const initialCenter = getGeometryCenter(initialGeometry);
  const nextCenter = getGeometryCenter(nextGeometry);
  const fixedAnchor = getFixedResizeAnchor(initialGeometry, handle);
  const fixedAnchorWorld = rotatePoint(fixedAnchor, initialCenter, angle);
  const nextFixedAnchor = getFixedResizeAnchor(nextGeometry, handle);
  const nextAnchorOffset = {
    x: nextFixedAnchor.x - nextCenter.x,
    y: nextFixedAnchor.y - nextCenter.y,
  };
  const rotatedOffset = rotatePoint(nextAnchorOffset, { x: 0, y: 0 }, angle);
  const anchoredCenter = {
    x: fixedAnchorWorld.x - rotatedOffset.x,
    y: fixedAnchorWorld.y - rotatedOffset.y,
  };

  return {
    ...patch,
    x: anchoredCenter.x - nextGeometry.width / 2,
    y: anchoredCenter.y - nextGeometry.height / 2,
  };
}

export function snapShapePatch(
  element: BoardElement,
  handle: ResizeHandle,
  patch: GeometryPatch,
): GeometryPatch {
  const geometry = getGeometry(element, patch);
  const originalRight = element.x + element.width;
  const originalBottom = element.y + element.height;
  const next = { ...geometry };

  if (handle.includes("e")) {
    next.width = Math.max(
      8,
      snapPointToGrid(
        { x: geometry.x + geometry.width, y: 0 },
        CANVAS_CONFIG.defaultSnapSize,
      ).x - geometry.x,
    );
  }

  if (handle.includes("s")) {
    next.height = Math.max(
      8,
      snapPointToGrid(
        { x: 0, y: geometry.y + geometry.height },
        CANVAS_CONFIG.defaultSnapSize,
      ).y - geometry.y,
    );
  }

  if (handle.includes("w")) {
    next.x = snapPointToGrid(
      { x: geometry.x, y: 0 },
      CANVAS_CONFIG.defaultSnapSize,
    ).x;
    next.width = Math.max(8, originalRight - next.x);
  }

  if (handle.includes("n")) {
    next.y = snapPointToGrid(
      { x: 0, y: geometry.y },
      CANVAS_CONFIG.defaultSnapSize,
    ).y;
    next.height = Math.max(8, originalBottom - next.y);
  }

  return next;
}

export function snapConnectorPatch(
  element: BoardElement,
  handle: ResizeHandle,
  patch: GeometryPatch,
): GeometryPatch {
  const geometry = getGeometry(element, patch);
  const start = { x: geometry.x, y: geometry.y };
  const end = {
    x: geometry.x + geometry.width,
    y: geometry.y + geometry.height,
  };

  if (handle === "start") {
    const snappedStart = snapPointToGrid(start, CANVAS_CONFIG.defaultSnapSize);
    return {
      x: snappedStart.x,
      y: snappedStart.y,
      width: end.x - snappedStart.x,
      height: end.y - snappedStart.y,
    };
  }

  if (handle === "end") {
    const snappedEnd = snapPointToGrid(end, CANVAS_CONFIG.defaultSnapSize);
    return {
      x: start.x,
      y: start.y,
      width: snappedEnd.x - start.x,
      height: snappedEnd.y - start.y,
    };
  }

  return patch;
}

