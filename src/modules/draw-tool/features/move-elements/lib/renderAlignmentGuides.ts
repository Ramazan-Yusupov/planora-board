import { alignmentGuidesStore } from "../model/alignmentGuidesStore";
import type { Viewport } from "@/modules/draw-tool/entities/viewport";

const GUIDE_COLOR = "#fb7185";

function drawEndMarker(
  context: CanvasRenderingContext2D,
  axis: "horizontal" | "vertical",
  coordinate: number,
  position: number,
  size: number,
) {
  context.beginPath();

  if (axis === "horizontal") {
    context.moveTo(position, coordinate - size);
    context.lineTo(position, coordinate + size);
  } else {
    context.moveTo(coordinate - size, position);
    context.lineTo(coordinate + size, position);
  }

  context.stroke();
}

export function renderAlignmentGuides(
  context: CanvasRenderingContext2D,
  viewport: Viewport,
) {
  const { horizontal, vertical } = alignmentGuidesStore.get();

  if (!horizontal && !vertical) {
    return;
  }

  const markerSize = 4 / viewport.zoom;

  context.save();
  context.translate(-viewport.x * viewport.zoom, -viewport.y * viewport.zoom);
  context.scale(viewport.zoom, viewport.zoom);
  context.strokeStyle = GUIDE_COLOR;
  context.lineWidth = 1.5 / viewport.zoom;
  context.lineCap = "round";
  context.setLineDash([]);

  if (vertical) {
    context.beginPath();
    context.moveTo(vertical.coordinate, vertical.start);
    context.lineTo(vertical.coordinate, vertical.end);
    context.stroke();
    drawEndMarker(
      context,
      "vertical",
      vertical.coordinate,
      vertical.start,
      markerSize,
    );
    drawEndMarker(
      context,
      "vertical",
      vertical.coordinate,
      vertical.end,
      markerSize,
    );
  }

  if (horizontal) {
    context.beginPath();
    context.moveTo(horizontal.start, horizontal.coordinate);
    context.lineTo(horizontal.end, horizontal.coordinate);
    context.stroke();
    drawEndMarker(
      context,
      "horizontal",
      horizontal.coordinate,
      horizontal.start,
      markerSize,
    );
    drawEndMarker(
      context,
      "horizontal",
      horizontal.coordinate,
      horizontal.end,
      markerSize,
    );
  }

  context.restore();
}

