import { getElementBounds } from "@/modules/draw-tool/entities/element";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import { arrowBindingIndicatorStore } from "../model/arrowBindingIndicatorStore";

const HIGHLIGHT_COLOR = "#60a5fa";

/** Draws the target halo and attachment point while an arrow endpoint is held. */
export function renderArrowBindingIndicator(context: CanvasRenderingContext2D) {
  const indicator = arrowBindingIndicatorStore.get();

  if (!indicator) {
    return;
  }

  const target = sceneStore
    .get()
    .elements.find((element) => element.id === indicator.targetId);

  if (!target) {
    return;
  }

  const viewport = viewportStore.get();
  const bounds = getElementBounds(target);
  const scale = viewport.zoom;
  const radius = 7 / scale;
  const inset = 5 / scale;

  context.save();
  context.translate(-viewport.x * scale, -viewport.y * scale);
  context.scale(scale, scale);
  context.strokeStyle = HIGHLIGHT_COLOR;
  context.fillStyle = "#ffffff";
  context.lineWidth = 1.5 / scale;
  context.setLineDash([5 / scale, 4 / scale]);
  context.strokeRect(
    bounds.x - inset,
    bounds.y - inset,
    bounds.width + inset * 2,
    bounds.height + inset * 2,
  );
  context.setLineDash([]);
  context.beginPath();
  context.arc(indicator.anchorPoint.x, indicator.anchorPoint.y, radius, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.beginPath();
  context.arc(indicator.anchorPoint.x, indicator.anchorPoint.y, radius * 0.42, 0, Math.PI * 2);
  context.fillStyle = HIGHLIGHT_COLOR;
  context.fill();
  context.restore();
}

