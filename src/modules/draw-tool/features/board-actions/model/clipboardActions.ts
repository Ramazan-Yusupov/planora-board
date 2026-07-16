import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { exportToPng, exportToSvg } from "@/modules/draw-tool/features/export-scene";
import { cloneElements } from "./elementPayload";

type ClipboardPayload = {
  format: "drawtool-elements";
  version: 1;
  elements: BoardElement[];
};

const CLIPBOARD_FORMAT = "drawtool-elements";

export function copyElementsToClipboard(elements: BoardElement[]) {
  if (elements.length === 0 || !navigator.clipboard?.writeText) return false;

  const payload: ClipboardPayload = {
    format: CLIPBOARD_FORMAT,
    version: 1,
    elements: cloneElements(elements),
  };
  void navigator.clipboard.writeText(JSON.stringify(payload));
  return true;
}

export async function readElementsFromClipboard() {
  const text = await navigator.clipboard?.readText?.();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as ClipboardPayload;
    if (
      parsed.format !== CLIPBOARD_FORMAT ||
      !Array.isArray(parsed.elements)
    ) {
      return null;
    }

    return parsed.elements;
  } catch {
    return null;
  }
}

export async function copyElementsAsPng(elements: BoardElement[]) {
  if (
    elements.length === 0 ||
    !navigator.clipboard?.write ||
    typeof ClipboardItem === "undefined"
  ) {
    return false;
  }

  const file = await exportToPng(elements, {
    fileName: "drawtool-selection.png",
  });
  await navigator.clipboard.write([
    new ClipboardItem({ [file.mimeType]: file.blob }),
  ]);
  return true;
}

export async function copyElementsAsSvg(elements: BoardElement[]) {
  if (elements.length === 0 || !navigator.clipboard?.writeText) return false;

  const file = exportToSvg(elements, { fileName: "drawtool-selection.svg" });
  await navigator.clipboard.writeText(await file.blob.text());
  return true;
}

