import { getLineDash } from "@/modules/draw-tool/shared/lib/canvas/getLineDash";
import type { LineElement } from "../model/types";

function renderLineLabel(
  context: CanvasRenderingContext2D,
  element: LineElement,
) {
  const label = element.label?.trim();

  if (!label) {
    return;
  }

  const midpoint = {
    x: element.x + element.width / 2,
    y: element.y + element.height / 2,
  };
  let angle = Math.atan2(element.height, element.width);

  if (angle > Math.PI / 2 || angle < -Math.PI / 2) {
    angle += Math.PI;
  }

  context.save();
  context.translate(midpoint.x, midpoint.y);
  context.rotate(angle);
  context.font = "700 15px Inter, ui-sans-serif, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillStyle = element.style.strokeColor;
  context.fillText(label, 0, 0.5);
  context.restore();
}

export function renderLine(
  context: CanvasRenderingContext2D,
  element: LineElement,
) {
  const { style } = element;

  context.save();
  context.globalAlpha = style.opacity;
  context.lineCap = "round";
  context.lineWidth = style.strokeWidth;
  context.strokeStyle = style.strokeColor;
  context.setLineDash(getLineDash(style.strokeStyle, style.strokeWidth));

  context.beginPath();
  context.moveTo(element.x, element.y);
  context.lineTo(element.x + element.width, element.y + element.height);
  context.stroke();
  renderLineLabel(context, element);
  context.restore();
}

