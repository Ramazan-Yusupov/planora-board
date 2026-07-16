export type ExportFormat = "json" | "png" | "svg";

export type ExportFile = {
  blob: Blob;
  fileName: string;
  mimeType: string;
};

export type ExportOptions = {
  fileName?: string;
  padding?: number;
  scale?: number;
};

