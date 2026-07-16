import { loadImage } from "./loadImage";
import type { ImageDimensions } from "../model/types";

/** Reads intrinsic dimensions from a file or existing image URL. */
export async function getImageDimensions(source: Blob | string): Promise<ImageDimensions> {
  if (typeof source === "string") {
    const image = await loadImage(source);
    return { width: image.naturalWidth, height: image.naturalHeight };
  }

  const temporaryUrl = URL.createObjectURL(source);

  try {
    const image = await loadImage(temporaryUrl);
    return { width: image.naturalWidth, height: image.naturalHeight };
  } finally {
    URL.revokeObjectURL(temporaryUrl);
  }
}

