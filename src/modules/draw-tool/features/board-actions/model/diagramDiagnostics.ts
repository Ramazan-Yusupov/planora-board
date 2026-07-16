import { getElementBounds } from "@/modules/draw-tool/entities/element";
import type { BoardElement } from "@/modules/draw-tool/entities/element";

export function getDiagramDiagnostics(elements: BoardElement[]) {
  const emptyLabels = elements.filter(
    (element) =>
      ["arrow", "diamond", "advanced"].includes(element.type) &&
      !element.label &&
      !("title" in element),
  ).length;
  const locked = elements.filter((element) => element.locked).length;
  const tiny = elements.filter((element) => {
    const bounds = getElementBounds(element);
    return bounds.width < 12 || bounds.height < 12;
  }).length;

  return [
    `Элементов: ${elements.length}`,
    `Locked: ${locked}`,
    `Очень маленьких: ${tiny}`,
    `Без подписи: ${emptyLabels}`,
  ];
}

