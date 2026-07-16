import { createImage } from "@/modules/draw-tool/entities/element";
import type { ImageElement } from "@/modules/draw-tool/entities/element";
import { createImageFile, imageFileStore } from "@/modules/draw-tool/entities/image-file";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { findContainingFrame, sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import type { Point } from "@/modules/draw-tool/shared/types";

const MAX_INSERTED_IMAGE_DIMENSION = 720;
const IMAGE_STACK_OFFSET = 28;

type ImagePlacement = {
  height: number;
  width: number;
  x: number;
  y: number;
};

function getImagePlacement(
  intrinsicWidth: number,
  intrinsicHeight: number,
  anchor: Point,
  index: number,
): ImagePlacement {
  const largestDimension = Math.max(intrinsicWidth, intrinsicHeight, 1);
  const scale = Math.min(1, MAX_INSERTED_IMAGE_DIMENSION / largestDimension);
  const width = Math.max(8, Math.round(intrinsicWidth * scale));
  const height = Math.max(8, Math.round(intrinsicHeight * scale));
  const offset = index * IMAGE_STACK_OFFSET;

  return {
    width,
    height,
    x: Math.round(anchor.x - width / 2 + offset),
    y: Math.round(anchor.y - height / 2 + offset),
  };
}

/** Returns image files only, so drag-and-drop and clipboard handlers share one filter. */
export function getSupportedImageFiles(files: Iterable<File>) {
  return [...files].filter((file) => file.type.startsWith("image/"));
}

/** Adds local images as portable scene elements in one undoable history entry. */
export async function addImageFiles(files: Iterable<File>, anchor: Point) {
  const supportedFiles = getSupportedImageFiles(files);

  if (supportedFiles.length === 0) {
    throw new Error("Выберите изображение в формате PNG, JPG, WebP, GIF или SVG.");
  }

  const imageFiles = await Promise.all(supportedFiles.map(createImageFile));
  const existingElements = sceneStore.get().elements;

  const elements = imageFiles.map((file, index) => {
    const placement = getImagePlacement(file.width, file.height, anchor, index);
    const image = createImage({
      ...placement,
      fileId: file.id,
      src: file.url,
      name: file.name,
      mimeType: file.mimeType,
      originalWidth: file.width,
      originalHeight: file.height,
    });
    const parent = findContainingFrame(image, existingElements);

    return parent ? { ...image, parentId: parent.id } : image;
  });

  imageFiles.forEach((file) => imageFileStore.add(file));

  historyStore.begin();
  sceneStore.setElements([...existingElements, ...elements]);
  selectionStore.setElementIds(elements.map((element) => element.id));
  historyStore.commit();

  return elements satisfies ImageElement[];
}

