import { getElementCenter } from "../lib/getElementCenter";
import { getElementRotation } from "../lib/getElementRotation";
import type { BoardElement } from "../model/types";
import { renderAdvanced } from "./renderAdvanced";
import { renderArrow } from "./renderArrow";
import { renderBadge } from "./renderBadge";
import { renderCloud } from "./renderCloud";
import { renderCallout } from "./renderCallout";
import { renderCodeSketch } from "./renderCodeSketch";
import { renderDiamond } from "./renderDiamond";
import { renderEllipse } from "./renderEllipse";
import { renderEmbed } from "./renderEmbed";
import { renderFrame } from "./renderFrame";
import { renderFreeDraw } from "./renderFreeDraw";
import { renderMeasure } from "./renderMeasure";
import { renderSticky } from "./renderSticky";
import { renderTable } from "./renderTable";
import { renderHexagon } from "./renderHexagon";
import { renderImageElement } from "./renderImageElement";
import { renderLine } from "./renderLine";
import { renderMarkdown } from "./renderMarkdown";
import { renderRectangle } from "./renderRectangle";
import { renderStar } from "./renderStar";
import { renderText } from "./renderText";
import { renderTriangle } from "./renderTriangle";

type RenderElementOptions = {
  hideLabel?: boolean;
};

function shouldRenderLabel(element: BoardElement) {
  return Boolean(
    element.label &&
      element.type !== "text" &&
      element.type !== "sticky" &&
      element.type !== "callout" &&
      element.type !== "table" &&
      element.type !== "code" &&
      element.type !== "embed" &&
      element.type !== "markdown" &&
      element.type !== "frame" &&
      element.type !== "badge" &&
      element.type !== "arrow" &&
      element.type !== "line" &&
      element.type !== "measure" &&
      element.type !== "image",
  );
}

function renderElementLabel(
  context: CanvasRenderingContext2D,
  element: BoardElement,
) {
  if (!shouldRenderLabel(element)) {
    return;
  }

  const label = element.label?.trim();
  if (!label) {
    return;
  }

  const center = getElementCenter(element);
  const fontSize = Math.max(11, Math.min(18, Math.min(Math.abs(element.width), Math.abs(element.height)) / 5 || 14));
  context.save();
  context.font = `600 ${fontSize}px Inter, ui-sans-serif, system-ui, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = element.type === "arrow" || element.type === "line" || element.type === "measure"
    ? element.style.strokeColor
    : element.style.strokeColor;

  context.globalAlpha = Math.min(1, element.style.opacity + 0.15);
  context.fillStyle = element.style.strokeColor;
  context.fillText(label, center.x, center.y + 0.5);
  context.restore();
}

function renderUnrotated(
  context: CanvasRenderingContext2D,
  element: BoardElement,
  options: RenderElementOptions = {},
) {
  switch (element.type) {
    case "rectangle":
      renderRectangle(context, element);
      return;
    case "ellipse":
      renderEllipse(context, element);
      return;
    case "diamond":
      renderDiamond(context, element);
      return;
    case "triangle":
      renderTriangle(context, element);
      return;
    case "hexagon":
      renderHexagon(context, element);
      return;
    case "badge":
      renderBadge(context, element, { hideLabel: options.hideLabel });
      return;
    case "star":
      renderStar(context, element);
      return;
    case "cloud":
      renderCloud(context, element);
      return;
    case "frame":
      renderFrame(context, element);
      return;
    case "sticky":
      renderSticky(context, element);
      return;
    case "callout":
      renderCallout(context, element);
      return;
    case "table":
      renderTable(context, element);
      return;
    case "embed":
      renderEmbed(context, element);
      return;
    case "markdown":
      renderMarkdown(context, element);
      return;
    case "code":
      if ("kind" in element) {
        renderAdvanced(context, element);
        return;
      }
      renderCodeSketch(context, element);
      return;
    case "image":
      renderImageElement(context, element);
      return;
    case "line":
      renderLine(context, options.hideLabel ? { ...element, label: undefined } : element);
      return;
    case "measure":
      renderMeasure(context, element);
      return;
    case "arrow":
      renderArrow(context, options.hideLabel ? { ...element, label: undefined } : element);
      return;
    case "freedraw":
    case "highlighter":
      renderFreeDraw(context, element);
      return;
    case "text":
      renderText(context, element);
      return;
  }
}

/** Renders every element around its own centre so rotation applies consistently. */
export function renderElement(
  context: CanvasRenderingContext2D,
  element: BoardElement,
  options: RenderElementOptions = {},
) {
  const angle = getElementRotation(element);

  if (angle === 0) {
    renderUnrotated(context, element, options);
    if (!options.hideLabel) {
      renderElementLabel(context, element);
    }
    return;
  }

  const center = getElementCenter(element);
  context.save();
  context.translate(center.x, center.y);
  context.rotate(angle);
  context.translate(-center.x, -center.y);
  renderUnrotated(context, element, options);
  if (!options.hideLabel) {
    renderElementLabel(context, element);
  }
  context.restore();
}

