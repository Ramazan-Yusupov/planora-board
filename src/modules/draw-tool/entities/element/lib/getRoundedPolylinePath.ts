import type { Point } from "@/modules/draw-tool/shared/types";

const DEFAULT_RADIUS = 18;

function moveToward(start: Point, end: Point, distance: number): Point {
  const length = Math.hypot(end.x - start.x, end.y - start.y);

  if (length < 0.001) {
    return { ...start };
  }

  const progress = Math.min(distance / length, 1);

  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
  };
}

export function roundedPolylineCommands(points: Point[], radius = DEFAULT_RADIUS) {
  if (points.length < 2) {
    return [];
  }

  const commands: Array<
    | { type: "move"; point: Point }
    | { type: "line"; point: Point }
    | { type: "quadratic"; control: Point; point: Point }
  > = [{ type: "move", point: points[0] }];

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1];
    const current = points[index];
    const next = points[index + 1];
    const incomingLength = Math.hypot(current.x - previous.x, current.y - previous.y);
    const outgoingLength = Math.hypot(next.x - current.x, next.y - current.y);
    const cornerRadius = Math.min(radius, incomingLength / 2, outgoingLength / 2);

    if (cornerRadius < 1) {
      commands.push({ type: "line", point: current });
      continue;
    }

    const beforeCorner = moveToward(current, previous, cornerRadius);
    const afterCorner = moveToward(current, next, cornerRadius);

    commands.push({ type: "line", point: beforeCorner });
    commands.push({ type: "quadratic", control: current, point: afterCorner });
  }

  commands.push({ type: "line", point: points[points.length - 1] });

  return commands;
}

export function roundedPolylineSvgPath(points: Point[], radius = DEFAULT_RADIUS) {
  return roundedPolylineCommands(points, radius)
    .map((command) => {
      if (command.type === "move") {
        return `M ${command.point.x} ${command.point.y}`;
      }

      if (command.type === "line") {
        return `L ${command.point.x} ${command.point.y}`;
      }

      return `Q ${command.control.x} ${command.control.y} ${command.point.x} ${command.point.y}`;
    })
    .join(" ");
}

