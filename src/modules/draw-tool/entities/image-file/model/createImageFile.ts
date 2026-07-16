import { createId } from "@/modules/draw-tool/shared/lib";
import { loadImage } from "../lib/loadImage";
import { readFileAsDataUrl } from "../lib/readFileAsDataUrl";
import type { ImageFile } from "./types";

/** Converts a browser File into portable board image metadata. */
export async function createImageFile(file: File): Promise<ImageFile> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Поддерживаются только изображения.");
  }

  const url = await readFileAsDataUrl(file);
  const image = await loadImage(url);

  return {
    id: createId("image"),
    name: file.name || "image",
    mimeType: file.type,
    url,
    image,
    createdAt: Date.now(),
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

