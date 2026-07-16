import {
  createArrowBinding,
  createElement,
  DEFAULT_ELEMENT_STYLE,
  getElementCenter,
  updateElement,
} from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";

export function createBoundArrow(
  startElement: BoardElement,
  endElement: BoardElement,
  label?: string,
) {
  const start = getElementCenter(startElement);
  const end = getElementCenter(endElement);
  const arrow = createElement("arrow", {
    x: start.x,
    y: start.y,
    width: end.x - start.x,
    height: end.y - start.y,
    routing: "curve",
    style: {
      ...DEFAULT_ELEMENT_STYLE,
      strokeColor: "#93c5fd",
      fillStyle: "transparent",
    },
  });

  if (arrow.type !== "arrow") {
    return arrow;
  }

  return updateElement(arrow, {
    label,
    startBinding: createArrowBinding(startElement, start),
    endBinding: createArrowBinding(endElement, end),
  });
}

function cleanDiagramNodeName(value: string) {
  return value
    .trim()
    .replace(/^[A-Za-z0-9_]+\s*\[/, "")
    .replace(/\]$/, "")
    .replace(/^[A-Za-z0-9_]+\s*\(/, "")
    .replace(/\)$/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
}

export function parseDiagramEdges(source: string) {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("%%") && !line.startsWith("#"))
    .map((line) => line.replace(/^flowchart\s+\w+/i, "").trim())
    .map((line) => {
      const match = line.match(/^(.+?)\s*(?:-->|---|->|=>)\s*(.+)$/);
      if (!match) return null;
      return {
        from: cleanDiagramNodeName(match[1]),
        to: cleanDiagramNodeName(match[2]),
      };
    })
    .filter((edge): edge is { from: string; to: string } =>
      Boolean(edge?.from && edge.to),
    );
}

export function createTemplateElements(
  template: "flowchart" | "mindmap" | "roadmap",
) {
  const baseStyle = {
    ...DEFAULT_ELEMENT_STYLE,
    strokeColor: "#93c5fd",
    backgroundColor: "#0f172a",
    fillStyle: "solid" as const,
    cornerStyle: "rounded" as const,
  };
  const now = Date.now();
  const make = (
    type: Exclude<BoardElement["type"], "image"> | "advanced",
    x: number,
    y: number,
    label: string,
  ) => ({
    ...createElement(type, {
      x,
      y,
      width: 180,
      height: 86,
      style: baseStyle,
      kind: type === "advanced" ? "mindmap-node" : undefined,
    }),
    label,
    createdAt: now,
    updatedAt: now,
  });

  if (template === "mindmap") {
    return [
      make("ellipse", 80, 80, "Main idea"),
      make("advanced", 340, 20, "Branch A"),
      make("advanced", 340, 160, "Branch B"),
    ];
  }

  if (template === "roadmap") {
    return [
      make("advanced", 80, 80, "Q1"),
      make("advanced", 340, 80, "Q2"),
      make("advanced", 600, 80, "Launch"),
    ];
  }

  return [
    make("rectangle", 80, 80, "Start"),
    make("diamond", 340, 80, "Decision"),
    make("rectangle", 600, 80, "Done"),
  ];
}

