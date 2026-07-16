import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { imageFileStore } from "@/modules/draw-tool/entities/image-file";
import { getElementBounds, renderElement } from "@/modules/draw-tool/entities/element";
import type { ExportFile, ExportOptions } from "./types";

function getBounds(elements: BoardElement[], padding: number) {
  if (elements.length === 0) return { x: 0, y: 0, width: 1, height: 1 };
  const bounds = elements.map(getElementBounds);
  const left = Math.min(...bounds.map((item) => item.x)) - padding;
  const top = Math.min(...bounds.map((item) => item.y)) - padding;
  const right = Math.max(...bounds.map((item) => item.x + item.width)) + padding;
  const bottom = Math.max(...bounds.map((item) => item.y + item.height)) + padding;
  return { x: left, y: top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) };
}

/** Renders an opaque PNG snapshot of the board without changing live canvas state. */
export async function exportToPng(elements: BoardElement[], options: ExportOptions = {}): Promise<ExportFile> {
  const padding = options.padding ?? 24;
  const scale = options.scale ?? 1;

  await Promise.all(
    elements
      .filter((element): element is Extract<BoardElement, { type: "image" }> => element.type === "image")
      .map((element) => imageFileStore.preload(element.fileId, element.src)),
  );
  const bounds = getBounds(elements, padding);
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(bounds.width * scale);
  canvas.height = Math.ceil(bounds.height * scale);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Не удалось подготовить PNG-экспорт.");
  context.scale(scale, scale);
  context.translate(-bounds.x, -bounds.y);
  elements.forEach((element) => renderElement(context, element));
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Не удалось создать PNG.")), "image/png"));
  return { blob, fileName: options.fileName ?? "drawtool-scene.png", mimeType: "image/png" };
}

