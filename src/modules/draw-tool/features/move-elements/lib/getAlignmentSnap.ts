import { getElementBounds } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { Rect } from "@/modules/draw-tool/shared/types";
import type { AlignmentGuide, AlignmentGuides } from "../model/alignmentGuidesStore";

type Axis = "x" | "y";
type CandidateKind = "start" | "center" | "end";

type AxisCandidate = {
  kind: CandidateKind;
  value: number;
};

type AlignmentMatch = {
  candidate: AxisCandidate;
  offset: number;
  targetBounds: Rect;
  targetCandidate: AxisCandidate;
};

export type AlignmentSnapOptions = {
  allowHorizontal: boolean;
  allowVertical: boolean;
  movingBounds: Rect;
  staticElements: BoardElement[];
  threshold: number;
};

export type AlignmentSnapResult = {
  deltaX: number;
  deltaY: number;
  guides: AlignmentGuides;
};

function getCandidates(bounds: Rect, axis: Axis): AxisCandidate[] {
  const start = axis === "x" ? bounds.x : bounds.y;
  const size = axis === "x" ? bounds.width : bounds.height;

  return [
    { kind: "start", value: start },
    { kind: "center", value: start + size / 2 },
    { kind: "end", value: start + size },
  ];
}

function findClosestMatch(
  movingBounds: Rect,
  staticElements: BoardElement[],
  axis: Axis,
  threshold: number,
): AlignmentMatch | null {
  const movingCandidates = getCandidates(movingBounds, axis);
  let closestMatch: AlignmentMatch | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const element of staticElements) {
    const targetBounds = getElementBounds(element);
    const targetCandidates = getCandidates(targetBounds, axis);

    for (const candidate of movingCandidates) {
      for (const targetCandidate of targetCandidates) {
        const offset = targetCandidate.value - candidate.value;
        const distance = Math.abs(offset);

        if (distance > threshold || distance >= closestDistance) {
          continue;
        }

        closestDistance = distance;
        closestMatch = {
          candidate,
          offset,
          targetBounds,
          targetCandidate,
        };
      }
    }
  }

  return closestMatch;
}

function getVerticalGuide(
  coordinate: number,
  movingBounds: Rect,
  targetBounds: Rect,
): AlignmentGuide {
  const movingBottom = movingBounds.y + movingBounds.height;
  const targetBottom = targetBounds.y + targetBounds.height;

  let start: number;
  let end: number;

  if (movingBottom < targetBounds.y) {
    start = movingBottom;
    end = targetBounds.y;
  } else if (targetBottom < movingBounds.y) {
    start = targetBottom;
    end = movingBounds.y;
  } else {
    start = Math.min(movingBounds.y, targetBounds.y);
    end = Math.max(movingBottom, targetBottom);
  }

  if (Math.abs(end - start) < 12) {
    start -= 6;
    end += 6;
  }

  return { axis: "vertical", coordinate, start, end };
}

function getHorizontalGuide(
  coordinate: number,
  movingBounds: Rect,
  targetBounds: Rect,
): AlignmentGuide {
  const movingRight = movingBounds.x + movingBounds.width;
  const targetRight = targetBounds.x + targetBounds.width;

  let start: number;
  let end: number;

  if (movingRight < targetBounds.x) {
    start = movingRight;
    end = targetBounds.x;
  } else if (targetRight < movingBounds.x) {
    start = targetRight;
    end = movingBounds.x;
  } else {
    start = Math.min(movingBounds.x, targetBounds.x);
    end = Math.max(movingRight, targetRight);
  }

  if (Math.abs(end - start) < 12) {
    start -= 6;
    end += 6;
  }

  return { axis: "horizontal", coordinate, start, end };
}

export function getAlignmentSnap({
  allowHorizontal,
  allowVertical,
  movingBounds,
  staticElements,
  threshold,
}: AlignmentSnapOptions): AlignmentSnapResult {
  const xMatch = allowHorizontal
    ? findClosestMatch(movingBounds, staticElements, "x", threshold)
    : null;
  const yMatch = allowVertical
    ? findClosestMatch(movingBounds, staticElements, "y", threshold)
    : null;

  const deltaX = xMatch?.offset ?? 0;
  const deltaY = yMatch?.offset ?? 0;
  const snappedBounds: Rect = {
    x: movingBounds.x + deltaX,
    y: movingBounds.y + deltaY,
    width: movingBounds.width,
    height: movingBounds.height,
  };

  return {
    deltaX,
    deltaY,
    guides: {
      vertical: xMatch
        ? getVerticalGuide(
            xMatch.targetCandidate.value,
            snappedBounds,
            xMatch.targetBounds,
          )
        : null,
      horizontal: yMatch
        ? getHorizontalGuide(
            yMatch.targetCandidate.value,
            snappedBounds,
            yMatch.targetBounds,
          )
        : null,
    },
  };
}

