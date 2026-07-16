import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import {
  getArrowCurveControlPoint,
  getArrowPathPoints,
} from "../lib/getArrowPathPoints";
import { roundedPolylineCommands } from "../lib/getRoundedPolylinePath";
import type { ArrowElement } from "../model/types";

const ARROW_HEAD_LENGTH = 12;
const ARROW_HEAD_ANGLE = Math.PI / 7;

function getMidPathLabelPlacement(points: { x: number; y: number }[]) {
  if (points.length < 2) {
    return null;
  }

  const segments = points.slice(0, -1).map((start, index) => {
    const end = points[index + 1];
    return {
      start,
      end,
      length: Math.hypot(end.x - start.x, end.y - start.y),
    };
  });
  const totalLength = segments.reduce((sum, segment) => sum + segment.length, 0);
  let remaining = totalLength / 2;

  for (const segment of segments) {
    if (remaining <= segment.length || segment === segments.at(-1)) {
      const progress = segment.length <= 0 ? 0 : remaining / segment.length;
      let angle = Math.atan2(
        segment.end.y - segment.start.y,
        segment.end.x - segment.start.x,
      );

      if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
        angle += Math.PI;
      }

      return {
        angle,
        point: {
          x: segment.start.x + (segment.end.x - segment.start.x) * progress,
          y: segment.start.y + (segment.end.y - segment.start.y) * progress,
        },
      };
    }

    remaining -= segment.length;
  }

  return null;
}

function renderArrowLabel(
  context: CanvasRenderingContext2D,
  element: ArrowElement,
  points: { x: number; y: number }[],
) {
  const label = element.label?.trim();
  const placement = label ? getMidPathLabelPlacement(points) : null;

  if (!label || !placement) {
    return;
  }

  context.save();
  context.translate(placement.point.x, placement.point.y);
  context.rotate(placement.angle);
  context.font = "700 15px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  const metrics = context.measureText(label);
  const width = metrics.width + 14;
  const height = 24;
  context.fillStyle = "rgb(15 23 42 / 86%)";
  context.fillRect(-width / 2, -height / 2, width, height);
  context.fillStyle = element.style.strokeColor;
  context.fillText(label, 0, 0.5);
  context.restore();
}

function getArrowHeadAngle(element: ArrowElement) {
  const end = {
    x: element.x + element.width,
    y: element.y + element.height,
  };
  const points = getArrowPathPoints(element);
  const previousPoint = points.at(-2);

  if (element.routing === "straight" && element.waypoints?.length && previousPoint) {
    return Math.atan2(end.y - previousPoint.y, end.x - previousPoint.x);
  }

  if (element.routing === "curve") {
    const control = getArrowCurveControlPoint(element);
    return Math.atan2(end.y - control.y, end.x - control.x);
  }

  return previousPoint
    ? Math.atan2(end.y - previousPoint.y, end.x - previousPoint.x)
    : 0;
}

function renderRoundedPolyline(
  context: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
) {
  const commands = roundedPolylineCommands(points);

  commands.forEach((command) => {
    if (command.type === "move") {
      context.moveTo(command.point.x, command.point.y);
    } else if (command.type === "line") {
      context.lineTo(command.point.x, command.point.y);
    } else {
      context.quadraticCurveTo(
        command.control.x,
        command.control.y,
        command.point.x,
        command.point.y,
      );
    }
  });
}

export function renderArrow(
  context: CanvasRenderingContext2D,
  element: ArrowElement,
) {
  const { style } = element;
  const start = { x: element.x, y: element.y };
  const end = {
    x: element.x + element.width,
    y: element.y + element.height,
  };
  const points = getArrowPathPoints(element);

  if (points.length < 2) {
    return;
  }

  const angle = getArrowHeadAngle(element);

  context.save();
  context.globalAlpha = style.opacity;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));

  context.beginPath();
  context.moveTo(start.x, start.y);

  if (element.routing === "curve") {
    const control = getArrowCurveControlPoint(element);
    context.quadraticCurveTo(control.x, control.y, end.x, end.y);
  } else if (
    element.routing === "straight" &&
    element.routeCornerStyle === "rounded" &&
    points.length > 2
  ) {
    renderRoundedPolyline(context, points);
  } else {
    points.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  }

  context.stroke();

  context.setLineDash([]);
  context.beginPath();
  context.moveTo(end.x, end.y);
  context.lineTo(
    end.x - ARROW_HEAD_LENGTH * Math.cos(angle - ARROW_HEAD_ANGLE),
    end.y - ARROW_HEAD_LENGTH * Math.sin(angle - ARROW_HEAD_ANGLE),
  );
  context.moveTo(end.x, end.y);
  context.lineTo(
    end.x - ARROW_HEAD_LENGTH * Math.cos(angle + ARROW_HEAD_ANGLE),
    end.y - ARROW_HEAD_LENGTH * Math.sin(angle + ARROW_HEAD_ANGLE),
  );
  context.stroke();
  renderArrowLabel(context, element, points);
  context.restore();
}

