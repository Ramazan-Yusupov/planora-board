import type { ColorOption } from "@/modules/draw-tool/shared/types";

export const STROKE_COLORS: readonly ColorOption[] = [
  { label: "Светлый", value: "#e5e7eb" },
  { label: "Тёмный", value: "#1e293b" },
  { label: "Синий", value: "#2563eb" },
  { label: "Зелёный", value: "#16a34a" },
  { label: "Красный", value: "#dc2626" },
  { label: "Фиолетовый", value: "#9333ea" },
  { label: "Оранжевый", value: "#ea580c" },
];

export const FILL_COLORS: readonly ColorOption[] = [
  { label: "Без заливки", value: "transparent" },
  { label: "Голубой", value: "#dbeafe" },
  { label: "Зелёный", value: "#dcfce7" },
  { label: "Жёлтый", value: "#fef3c7" },
  { label: "Красный", value: "#fee2e2" },
  { label: "Фиолетовый", value: "#f3e8ff" },
];

