import type { ToolId } from "@/modules/draw-tool/entities/tool";

/**
 * Единая раскладка инструментов. Основные клавиши повторяют Excalidraw:
 * буквенная клавиша + цифра для панели инструментов.
 *
 * Дополнительные инструменты DrawTool получают свободные клавиши и не
 * перехватывают сочетания с Ctrl / Cmd.
 */
export const TOOL_BY_SHORTCUT: Readonly<Record<string, ToolId>> = {
  "0": "eraser",
  "1": "selection",
  "2": "rectangle",
  "3": "diamond",
  "4": "ellipse",
  "5": "arrow",
  "6": "line",
  "7": "freedraw",
  "8": "text",
  a: "arrow",
  b: "embed",
  c: "cloud",
  d: "diamond",
  e: "eraser",
  f: "frame",
  g: "triangle",
  h: "pan",
  k: "laser",
  i: "highlighter",
  j: "code",
  l: "lasso",
  m: "callout",
  n: "sticky",
  o: "ellipse",
  p: "line",
  r: "rectangle",
  s: "star",
  t: "text",
  u: "hexagon",
  v: "selection",
  x: "freedraw",
  y: "badge",
};

export function getToolFromShortcut(key: string): ToolId | null {
  return TOOL_BY_SHORTCUT[key.toLowerCase()] ?? null;
}

