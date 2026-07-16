import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { Point } from "@/modules/draw-tool/shared/types";
import type { ResizeHandle, ResizeModifiers } from "../model/types";

const MIN_SIZE = 8;

const DEFAULT_MODIFIERS: ResizeModifiers = {
  snapToGrid: false,
  keepAspectRatio: false,
  resizeFromCenter: false,
};

type GeometryPatch = Pick<BoardElement, "x" | "y" | "width" | "height">;

function getAspectRatio(element: BoardElement) {
  return Math.max(Math.abs(element.width), MIN_SIZE) / Math.max(Math.abs(element.height), MIN_SIZE);
}

function applyAspectRatio(
  element: BoardElement,
  handle: ResizeHandle,
  patch: GeometryPatch,
): GeometryPatch {
  const ratio = getAspectRatio(element);
  const originalRight = element.x + element.width;
  const originalBottom = element.y + element.height;
  const originalCenterX = element.x + element.width / 2;
  const originalCenterY = element.y + element.height / 2;
  const changesHorizontal = handle.includes("e") || handle.includes("w");
  const changesVertical = handle.includes("n") || handle.includes("s");

  let width = Math.max(MIN_SIZE, patch.width);
  let height = Math.max(MIN_SIZE, patch.height);

  if (changesHorizontal && changesVertical) {
    const widthScale = width / Math.max(element.width, MIN_SIZE);
    const heightScale = height / Math.max(element.height, MIN_SIZE);
    const scale = Math.max(widthScale, heightScale);
    width = Math.max(MIN_SIZE, element.width * scale);
    height = Math.max(MIN_SIZE, element.height * scale);
  } else if (changesHorizontal) {
    height = Math.max(MIN_SIZE, width / ratio);
  } else if (changesVertical) {
    width = Math.max(MIN_SIZE, height * ratio);
  }

  const x = handle.includes("w")
    ? originalRight - width
    : changesHorizontal
      ? element.x
      : originalCenterX - width / 2;
  const y = handle.includes("n")
    ? originalBottom - height
    : changesVertical
      ? element.y
      : originalCenterY - height / 2;

  return { x, y, width, height };
}

function calculateCenteredResize(
  element: BoardElement,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
): GeometryPatch {
  const centerX = element.x + element.width / 2;
  const centerY = element.y + element.height / 2;
  const changesHorizontal = handle.includes("e") || handle.includes("w");
  const changesVertical = handle.includes("n") || handle.includes("s");

  const width = changesHorizontal
    ? Math.max(
        MIN_SIZE,
        element.width + (handle.includes("e") ? deltaX : -deltaX) * 2,
      )
    : element.width;
  const height = changesVertical
    ? Math.max(
        MIN_SIZE,
        element.height + (handle.includes("s") ? deltaY : -deltaY) * 2,
      )
    : element.height;

  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
  };
}

export function calculateResize(
  element: BoardElement,
  handle: ResizeHandle,
  startPoint: Point,
  currentPoint: Point,
  modifiers: ResizeModifiers = DEFAULT_MODIFIERS,
) {
  const deltaX = currentPoint.x - startPoint.x;
  const deltaY = currentPoint.y - startPoint.y;

  if (element.type === "line" || element.type === "arrow" || element.type === "measure") {
    if (handle === "start") {
      return {
        x: element.x + deltaX,
        y: element.y + deltaY,
        width: element.width - deltaX,
        height: element.height - deltaY,
      };
    }

    if (handle === "end") {
      return { width: element.width + deltaX, height: element.height + deltaY };
    }

    return {};
  }

  let patch: GeometryPatch;

  if (modifiers.resizeFromCenter) {
    patch = calculateCenteredResize(element, handle, deltaX, deltaY);
  } else {
    let x = element.x;
    let y = element.y;
    let width = element.width;
    let height = element.height;

    if (handle.includes("e")) {
      width = Math.max(MIN_SIZE, element.width + deltaX);
    }

    if (handle.includes("s")) {
      height = Math.max(MIN_SIZE, element.height + deltaY);
    }

    if (handle.includes("w")) {
      const nextWidth = Math.max(MIN_SIZE, element.width - deltaX);
      x = element.x + (element.width - nextWidth);
      width = nextWidth;
    }

    if (handle.includes("n")) {
      const nextHeight = Math.max(MIN_SIZE, element.height - deltaY);
      y = element.y + (element.height - nextHeight);
      height = nextHeight;
    }

    patch = { x, y, width, height };
  }

  return modifiers.keepAspectRatio
    ? applyAspectRatio(element, handle, patch)
    : patch;
}

