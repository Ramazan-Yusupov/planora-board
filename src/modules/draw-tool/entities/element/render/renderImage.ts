import { getImageObjectRect } from "../lib/getImageObjectRect";
import type { ImageObjectFit, ImageObjectPosition, ImageShape } from "../model/types";

type ImageSizeSource = {
  displayHeight?: number;
  displayWidth?: number;
  height?: number;
  naturalHeight?: number;
  naturalWidth?: number;
  videoHeight?: number;
  videoWidth?: number;
  width?: number;
};

type RenderImageOptions = {
  backgroundColor?: string;
  cornerRadius?: number;
  height: number;
  image: CanvasImageSource;
  objectFit?: ImageObjectFit;
  objectPosition?: ImageObjectPosition;
  opacity?: number;
  shape?: ImageShape;
  width: number;
  x: number;
  y: number;
};

function getSourceSize(image: CanvasImageSource) {
  const source = image as ImageSizeSource;

  if (source.naturalWidth && source.naturalHeight) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }

  if (source.videoWidth && source.videoHeight) {
    return { width: source.videoWidth, height: source.videoHeight };
  }

  if (source.displayWidth && source.displayHeight) {
    return { width: source.displayWidth, height: source.displayHeight };
  }

  return {
    width: source.width ?? 1,
    height: source.height ?? 1,
  };
}

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

function imageClipPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  shape: ImageShape,
  cornerRadius: number,
) {
  if (shape === "circle") {
    context.beginPath();
    context.ellipse(
      x + width / 2,
      y + height / 2,
      Math.abs(width) / 2,
      Math.abs(height) / 2,
      0,
      0,
      Math.PI * 2,
    );
    context.closePath();
    return;
  }

  roundedRectPath(context, x, y, width, height, cornerRadius);
}

/** Draws an already-loaded image without leaking image-specific logic into renderScene. */
export function renderImage(
  context: CanvasRenderingContext2D,
  {
    backgroundColor,
    cornerRadius = 0,
    image,
    objectFit = "fill",
    objectPosition = "center",
    shape = "rectangle",
    x,
    y,
    width,
    height,
    opacity = 1,
  }: RenderImageOptions,
) {
  const frame = {
    x: Math.min(x, x + width),
    y: Math.min(y, y + height),
    width: Math.abs(width),
    height: Math.abs(height),
  };
  const source = getSourceSize(image);
  const imageRect = getImageObjectRect(
    frame,
    Number(source.width) || frame.width,
    Number(source.height) || frame.height,
    objectFit,
    objectPosition,
  );

  context.save();
  context.globalAlpha *= opacity;
  imageClipPath(
    context,
    frame.x,
    frame.y,
    frame.width,
    frame.height,
    shape,
    cornerRadius,
  );
  context.clip();

  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fillRect(frame.x, frame.y, frame.width, frame.height);
  }

  context.drawImage(image, imageRect.x, imageRect.y, imageRect.width, imageRect.height);
  context.restore();
}

