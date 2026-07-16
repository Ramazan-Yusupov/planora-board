import type { ArrowRouting, ElementStyle, TextAlign } from "@/modules/draw-tool/entities/element";

export type ToolSettings = {
  style: ElementStyle;
  snapToGrid: boolean;
  snapSize: number;
  arrowRouting: ArrowRouting;
  fontSize: number;
  fontFamily: string;
  textAlign: TextAlign;
};

