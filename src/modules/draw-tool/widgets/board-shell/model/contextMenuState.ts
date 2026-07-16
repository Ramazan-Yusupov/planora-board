import type { BoardElement } from "@/modules/draw-tool/entities/element";

export function canUseContextLabel(element: BoardElement) {
  return (
    element.type === "rectangle" ||
    element.type === "badge" ||
    element.type === "ellipse" ||
    element.type === "diamond" ||
    element.type === "triangle" ||
    element.type === "hexagon" ||
    element.type === "star" ||
    element.type === "cloud" ||
    element.type === "line" ||
    element.type === "arrow"
  );
}

export function getContextMenuPosition(left: number, top: number) {
  const width = 256;
  const gutter = 8;
  const maxHeight = Math.min(310, window.innerHeight - gutter * 2);
  return {
    left: Math.max(gutter, Math.min(left, window.innerWidth - width - gutter)),
    maxHeight,
    top: Math.max(gutter, Math.min(top, window.innerHeight - maxHeight - gutter)),
  };
}

export function getContextMenuFlags(selectedElements: BoardElement[]) {
  return {
    hasGroupSelection: selectedElements.length >= 2,
    hasGroupedSelection: selectedElements.some((element) => element.groupId),
    hasSelectedFrame: selectedElements.some((element) => element.type === "frame"),
    hasSelection: selectedElements.length > 0,
    showAlignActions: selectedElements.length >= 2,
    showDistributeActions: selectedElements.length >= 3,
    showLabelAction: selectedElements.some(canUseContextLabel),
  };
}

