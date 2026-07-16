import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { SceneLayer } from "@/modules/draw-tool/entities/scene";

export type BoardLayer = {
  element: BoardElement;
  index: number;
  label: string;
};

export type BoardLayerGroup = {
  elements: BoardLayer[];
  layer: SceneLayer;
};

const LAYER_LABELS: Record<BoardElement["type"], string> = {
  arrow: "Стрелка", badge: "Badge", cloud: "Облако", code: "Код", image: "Изображение", diamond: "Ромб", ellipse: "Эллипс", embed: "Встроенная страница", frame: "Фрейм", freedraw: "Карандаш", highlighter: "Маркер", sticky: "Стикер", callout: "Комментарий", markdown: "Markdown заметка", measure: "Измерение", table: "Таблица", hexagon: "Шестиугольник", line: "Линия", rectangle: "Прямоугольник", star: "Звезда", text: "Текст", triangle: "Треугольник",
};

function getElementRows(elements: BoardElement[]): BoardLayer[] {
  return elements.map((element, index) => ({
    element,
    index,
    label: element.type === "text" && element.text.trim() ? element.text.trim().slice(0, 32) : LAYER_LABELS[element.type],
  })).reverse();
}

/** Returns visual layers with topmost-first element rows inside each layer. */
export function getLayers(
  elements: BoardElement[],
  sceneLayers: SceneLayer[],
): BoardLayerGroup[] {
  return [...sceneLayers].reverse().map((layer) => ({
    layer,
    elements: getElementRows(
      elements.filter((element) => element.layerId === layer.id),
    ),
  }));
}

