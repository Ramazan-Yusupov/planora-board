/** Metadata and a ready-to-render cache entry for a board image. */
export type ImageFile = {
  createdAt: number;
  height: number;
  id: string;
  /** Preloaded only in memory; it is never written into the scene JSON. */
  image?: HTMLImageElement;
  mimeType: string;
  name: string;
  /** A portable data URL so projects and JSON exports keep the actual image. */
  url: string;
  width: number;
};

export type ImageDimensions = Pick<ImageFile, "width" | "height">;

