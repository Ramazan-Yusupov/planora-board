import type { BoardElement } from "@/modules/draw-tool/entities/element";
import { createSvgDocument } from "../lib/createSvgDocument";
import type { ExportFile, ExportOptions } from "./types";

/** Exports visible board elements as a scalable SVG file. */
export function exportToSvg(elements: BoardElement[], options: ExportOptions = {}): ExportFile {
  return {
    blob: new Blob([createSvgDocument(elements, options.padding)], { type: "image/svg+xml" }),
    fileName: options.fileName ?? "drawtool-scene.svg",
    mimeType: "image/svg+xml",
  };
}

