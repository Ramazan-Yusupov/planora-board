import type { Viewport } from "@/modules/draw-tool/entities/viewport";
import type { Point } from "@/modules/draw-tool/shared/types";
import { laserPointerStore } from "../model/laserPointerStore";

const FINAL_FADE_START = 0.78;

function interpolatePoint(start: Point, end: Point, progress: number) {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}

function getTrimmedPathPoints(points: Point[], progress: number) {
  if (points.length < 2 || progress <= 0) {
    return points;
  }

  const segmentLengths = points.slice(0, -1).map((point, index) =>
    Math.hypot(points[index + 1].x - point.x, points[index + 1].y - point.y),
  );
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);

  if (totalLength <= 0) {
    return points.slice(-1);
  }

  let distanceToTrim = totalLength * Math.min(progress, 1);

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];

    if (distanceToTrim > segmentLength) {
      distanceToTrim -= segmentLength;
      continue;
    }

    const start = points[index];
    const end = points[index + 1];
    const segmentProgress =
      segmentLength === 0 ? 1 : distanceToTrim / segmentLength;
    const trimmedStart = interpolatePoint(start, end, segmentProgress);

    return [trimmedStart, ...points.slice(index + 1)];
  }

  return points.slice(-1);
}

function getFadeOpacity(progress: number) {
  if (progress <= FINAL_FADE_START) {
    return 1;
  }

  return Math.max(0, 1 - (progress - FINAL_FADE_START) / (1 - FINAL_FADE_START));
}

export function renderLaserPointer(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
) {
  const { fadeProgress, points } = laserPointerStore.get();
  const endPoint = points.at(-1);
  if (points.length === 0 || !endPoint) {
    return;
  }
  const visiblePoints = getTrimmedPathPoints(points, fadeProgress);
  const opacity = getFadeOpacity(fadeProgress);

  context.save();
  context.translate(-viewport.x * viewport.zoom, -viewport.y * viewport.zoom);
  context.scale(viewport.zoom, viewport.zoom);
  context.globalAlpha = opacity;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "rgb(248 113 113 / 88%)";
  context.shadowBlur = 12 / viewport.zoom;
  context.shadowColor = "rgb(248 113 113 / 85%)";
  context.lineWidth = 2.5 / viewport.zoom;

  if (visiblePoints.length > 1) {
    context.beginPath();
    context.moveTo(visiblePoints[0].x, visiblePoints[0].y);
    visiblePoints.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
  }

  context.fillStyle = "#f87171";
  context.beginPath();
  context.arc(endPoint.x, endPoint.y, 5 / viewport.zoom, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

