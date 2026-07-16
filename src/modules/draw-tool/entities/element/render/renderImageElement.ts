import { imageFileStore } from "@/modules/draw-tool/entities/image-file";
import type { ImageElement } from "../model/types";
import { renderImage } from "./renderImage";

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, Math.abs(width) / 2, Math.abs(height) / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function renderImagePlaceholder(
  context: CanvasRenderingContext2D,
  element: ImageElement,
) {
  const frame = {
    x: Math.min(element.x, element.x + element.width),
    y: Math.min(element.y, element.y + element.height),
    width: Math.abs(element.width),
    height: Math.abs(element.height),
  };

  context.save();
  context.globalAlpha *= Math.max(0.35, element.style.opacity);
  context.strokeStyle = element.style.strokeColor;
  context.lineWidth = Math.max(1, element.style.strokeWidth);
  context.setLineDash([6, 4]);

  if (element.shape === "circle") {
    context.beginPath();
    context.ellipse(
      frame.x + frame.width / 2,
      frame.y + frame.height / 2,
      frame.width / 2,
      frame.height / 2,
      0,
      0,
      Math.PI * 2,
    );
  } else {
    roundedRectPath(
      context,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      element.cornerRadius ?? 0,
    );
  }

  context.stroke();
  context.restore();
}

/** Resolves a persisted image source through the image cache before drawing it. */
export function renderImageElement(
  context: CanvasRenderingContext2D,
  element: ImageElement,
) {
  const image = imageFileStore.getLoadedImage(element.fileId, element.src);

  if (!image) {
    renderImagePlaceholder(context, element);
    return;
  }

  renderImage(context, {
    backgroundColor:
      element.style.fillStyle === "solid"
        ? element.style.backgroundColor
        : undefined,
    cornerRadius: element.cornerRadius ?? 0,
    image,
    objectFit: element.objectFit ?? "fill",
    objectPosition: element.objectPosition ?? "center",
    shape: element.shape ?? "rectangle",
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
    opacity: element.style.opacity,
  });
}

