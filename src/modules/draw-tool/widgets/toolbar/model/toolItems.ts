import {
  ArrowRight,
  Circle,
  Cloud,
  Diamond,
  Eraser,
  Frame,
  Hand,
  Hexagon,
  Minus,
  MousePointer2,
  Pencil,
  Square,
  Star,
  Tickets,
  Triangle,
  Type,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ToolId } from "@/modules/draw-tool/entities/tool";

export type ToolbarItem = {
  icon: LucideIcon;
  id: ToolId;
  label: string;
  /** Short label visible on the icon, mirroring Excalidraw's numeric toolbar. */
  shortcut: string;
  /** Full shortcut shown in the tooltip and announced to assistive technology. */
  shortcutHint: string;
  group?: "core" | "actions";
};

export const TOOL_ITEMS: readonly ToolbarItem[] = [
  {
    id: "pan",
    label: "Перемещение холста",
    shortcut: "H",
    shortcutHint: "H или удерживать Space",
    icon: Hand,
    group: "core",
  },
  {
    id: "selection",
    label: "Выбор",
    shortcut: "1",
    shortcutHint: "V или 1",
    icon: MousePointer2,
    group: "core",
  },
  {
    id: "rectangle",
    label: "Прямоугольник",
    shortcut: "2",
    shortcutHint: "R или 2",
    icon: Square,
    group: "core",
  },
  {
    id: "diamond",
    label: "Ромб",
    shortcut: "3",
    shortcutHint: "D или 3",
    icon: Diamond,
    group: "core",
  },
  {
    id: "ellipse",
    label: "Эллипс",
    shortcut: "4",
    shortcutHint: "O или 4",
    icon: Circle,
    group: "core",
  },
  {
    id: "arrow",
    label: "Стрелка",
    shortcut: "5",
    shortcutHint: "A или 5",
    icon: ArrowRight,
    group: "core",
  },
  {
    id: "line",
    label: "Линия",
    shortcut: "6",
    shortcutHint: "P или 6",
    icon: Minus,
    group: "core",
  },
  {
    id: "freedraw",
    label: "Карандаш",
    shortcut: "7",
    shortcutHint: "X или 7",
    icon: Pencil,
    group: "core",
  },
  {
    id: "text",
    label: "Текст",
    shortcut: "8",
    shortcutHint: "T или 8",
    icon: Type,
    group: "core",
  },
  {
    id: "eraser",
    label: "Ластик",
    shortcut: "0",
    shortcutHint: "E или 0",
    icon: Eraser,
    group: "actions",
  },
];

export const MORE_SHAPE_ITEMS: readonly ToolbarItem[] = [
  {
    id: "frame",
    label: "Фреймовый инструмент",
    shortcut: "F",
    shortcutHint: "F",
    icon: Frame,
  },
  {
    id: "embed",
    label: "Встроенная страница",
    shortcut: "B",
    shortcutHint: "B",
    icon: Square,
  },
  {
    id: "triangle",
    label: "Треугольник",
    shortcut: "G",
    shortcutHint: "G",
    icon: Triangle,
  },
  {
    id: "hexagon",
    label: "Шестиугольник",
    shortcut: "U",
    shortcutHint: "U",
    icon: Hexagon,
  },
  {
    id: "badge",
    label: "Badge",
    shortcut: "Y",
    shortcutHint: "Y",
    icon: Tickets,
  },
  {
    id: "star",
    label: "Звезда",
    shortcut: "S",
    shortcutHint: "S",
    icon: Star,
  },
  {
    id: "cloud",
    label: "Облако",
    shortcut: "C",
    shortcutHint: "C",
    icon: Cloud,
  },
];

