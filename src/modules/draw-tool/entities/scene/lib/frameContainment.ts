import { getElementBounds, updateElement } from "@/modules/draw-tool/entities/element";
import type { BoardElement, FrameElement } from "@/modules/draw-tool/entities/element";
import type { Point, Rect } from "@/modules/draw-tool/shared/types";

/** A small inset keeps child content from overlapping a Frame border. */
export const FRAME_CONTENT_INSET = 10;

export function getFrameContentBounds(frame: FrameElement): Rect {
  const bounds = getElementBounds(frame);
  const inset = Math.min(
    FRAME_CONTENT_INSET,
    Math.max(0, Math.min(bounds.width, bounds.height) / 4),
  );

  return {
    x: bounds.x + inset,
    y: bounds.y + inset,
    width: Math.max(0, bounds.width - inset * 2),
    height: Math.max(0, bounds.height - inset * 2),
  };
}

function isInsideBounds(element: BoardElement, bounds: Rect) {
  const elementBounds = getElementBounds(element);

  return (
    elementBounds.x >= bounds.x &&
    elementBounds.y >= bounds.y &&
    elementBounds.x + elementBounds.width <= bounds.x + bounds.width &&
    elementBounds.y + elementBounds.height <= bounds.y + bounds.height
  );
}

export function getFrameDescendantIds(
  frameId: string,
  elements: BoardElement[],
) {
  const result = new Set<string>();
  const queue = [frameId];

  while (queue.length > 0) {
    const parentId = queue.shift();
    if (!parentId) continue;

    elements.forEach((element) => {
      if (element.parentId !== parentId || result.has(element.id)) return;
      result.add(element.id);
      if (element.type === "frame") queue.push(element.id);
    });
  }

  return result;
}

function isDescendantOf(
  candidateParentId: string,
  elementId: string,
  elements: BoardElement[],
) {
  return getFrameDescendantIds(elementId, elements).has(candidateParentId);
}

/** Finds the smallest Frame that fully contains an element. */
export function findContainingFrame(
  element: BoardElement,
  elements: BoardElement[],
): FrameElement | null {
  const candidates = elements
    .filter(
      (candidate): candidate is FrameElement =>
        candidate.type === "frame" &&
        candidate.id !== element.id &&
        !isDescendantOf(candidate.id, element.id, elements) &&
        isInsideBounds(element, getFrameContentBounds(candidate)),
    )
    .sort((left, right) => {
      const leftBounds = getElementBounds(left);
      const rightBounds = getElementBounds(right);
      return leftBounds.width * leftBounds.height - rightBounds.width * rightBounds.height;
    });

  return candidates[0] ?? null;
}

/**
 * Adds every unparented element completely inside a newly created Frame as a
 * direct child. Nested Frames remain supported.
 */
export function attachFrameChildren(
  elements: BoardElement[],
  frameId: string,
) {
  const frame = elements.find(
    (element): element is FrameElement => element.id === frameId && element.type === "frame",
  );

  if (!frame) return elements;

  const contentBounds = getFrameContentBounds(frame);

  return elements.map((element) => {
    if (
      element.id === frameId ||
      element.parentId ||
      !isInsideBounds(element, contentBounds)
    ) {
      return element;
    }

    return updateElement(element, { parentId: frameId });
  });
}

/** Re-evaluates a moved element's Frame membership after pointer-up. */
export function reparentElements(
  elements: BoardElement[],
  elementIds: string[],
) {
  const ids = new Set(elementIds);

  return elements.map((element) => {
    if (!ids.has(element.id)) return element;

    const frame = findContainingFrame(element, elements);
    const parentId = frame?.id;

    if (element.parentId === parentId) return element;
    return updateElement(element, { parentId });
  });
}

/**
 * Limits a child's drag delta so its full visible bounds stay within its Frame.
 * The parent itself may move without any clamping.
 */
export function clampDeltaToParentFrame(
  element: BoardElement,
  delta: Point,
  parentFrame: FrameElement,
): Point {
  const bounds = getElementBounds(element);
  const parentBounds = getFrameContentBounds(parentFrame);
  const movedX = bounds.x + delta.x;
  const movedY = bounds.y + delta.y;
  const maxX = parentBounds.x + Math.max(0, parentBounds.width - bounds.width);
  const maxY = parentBounds.y + Math.max(0, parentBounds.height - bounds.height);

  const clampedX = Math.min(Math.max(movedX, parentBounds.x), maxX);
  const clampedY = Math.min(Math.max(movedY, parentBounds.y), maxY);

  return {
    x: delta.x + (clampedX - movedX),
    y: delta.y + (clampedY - movedY),
  };
}

/** Scales a Frame child from the original Frame box into its new box. */
export function scaleFrameChild(
  child: BoardElement,
  initialFrame: FrameElement,
  nextFrame: FrameElement,
): BoardElement {
  const source = getElementBounds(initialFrame);
  const target = getElementBounds(nextFrame);
  const scaleX = target.width / Math.max(source.width, 1);
  const scaleY = target.height / Math.max(source.height, 1);
  const x = target.x + (child.x - source.x) * scaleX;
  const y = target.y + (child.y - source.y) * scaleY;
  const width = child.width * scaleX;
  const height = child.height * scaleY;

  if (child.type === "freedraw") {
    return updateElement(child, {
      x,
      y,
      width,
      height,
      points: child.points.map((point) => ({
        x: target.x + (point.x - source.x) * scaleX,
        y: target.y + (point.y - source.y) * scaleY,
      })),
    });
  }

  if (child.type === "text") {
    return updateElement(child, {
      x,
      y,
      width,
      height,
      fontSize: Math.max(8, child.fontSize * Math.min(scaleX, scaleY)),
    });
  }

  return updateElement(child, { x, y, width, height });
}


/**
 * Grows ancestor Frames just enough to include their direct children.
 *
 * This is primarily important for text: a text element can grow while the
 * user types, and clipping it would make its dashed editor/selection box seem
 * to escape the Frame. Frames never shrink here; they only grow when a child
 * needs more room. Nested Frames are processed from inner to outer parents.
 */
export function expandFramesToFitChildren(elements: BoardElement[]) {
  const byId = new Map(elements.map((element) => [element.id, element] as const));
  const childIdsByParent = new Map<string, string[]>();

  elements.forEach((element) => {
    if (!element.parentId || !byId.has(element.parentId)) return;
    const childIds = childIdsByParent.get(element.parentId) ?? [];
    childIds.push(element.id);
    childIdsByParent.set(element.parentId, childIds);
  });

  const getDepth = (element: BoardElement) => {
    let depth = 0;
    let parentId = element.parentId;
    const visited = new Set<string>();

    while (parentId && !visited.has(parentId)) {
      visited.add(parentId);
      const parent = byId.get(parentId);
      if (!parent) break;
      depth += 1;
      parentId = parent.parentId;
    }

    return depth;
  };

  const frames = elements
    .filter((element): element is FrameElement => element.type === "frame")
    .sort((left, right) => getDepth(right) - getDepth(left));

  let changed = false;

  frames.forEach((frame) => {
    const childIds = childIdsByParent.get(frame.id) ?? [];
    const children = childIds
      .map((childId) => byId.get(childId))
      .filter((child): child is BoardElement => Boolean(child));

    if (children.length === 0) return;

    const bounds = getElementBounds(frame);
    const childBounds = children.map(getElementBounds);
    const inset = Math.min(
      FRAME_CONTENT_INSET,
      Math.max(0, Math.min(bounds.width, bounds.height) / 4),
    );
    const nextLeft = Math.min(bounds.x, ...childBounds.map((child) => child.x - inset));
    const nextTop = Math.min(bounds.y, ...childBounds.map((child) => child.y - inset));
    const nextRight = Math.max(
      bounds.x + bounds.width,
      ...childBounds.map((child) => child.x + child.width + inset),
    );
    const nextBottom = Math.max(
      bounds.y + bounds.height,
      ...childBounds.map((child) => child.y + child.height + inset),
    );

    if (
      nextLeft === bounds.x &&
      nextTop === bounds.y &&
      nextRight === bounds.x + bounds.width &&
      nextBottom === bounds.y + bounds.height
    ) {
      return;
    }

    const nextFrame = updateElement(frame, {
      x: nextLeft,
      y: nextTop,
      width: nextRight - nextLeft,
      height: nextBottom - nextTop,
    });

    byId.set(frame.id, nextFrame);
    changed = true;
  });

  if (!changed) return elements;

  return elements.map((element) => byId.get(element.id) ?? element);
}


/** Assigns children for every Frame, starting from the smallest nested Frame. */
export function attachAllFrameChildren(elements: BoardElement[]) {
  const frames = elements
    .filter((element): element is FrameElement => element.type === "frame")
    .sort((left, right) => {
      const leftBounds = getElementBounds(left);
      const rightBounds = getElementBounds(right);
      return leftBounds.width * leftBounds.height - rightBounds.width * rightBounds.height;
    });

  return frames.reduce(
    (nextElements, frame) => attachFrameChildren(nextElements, frame.id),
    elements,
  );
}

