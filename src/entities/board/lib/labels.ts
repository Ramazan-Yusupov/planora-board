import type { Board, BoardCard, BoardLabel } from "../model/types";

export const BOARD_LABEL_COLOR_OPTIONS = [
  { value: "#38bdf8", label: "Голубой" },
  { value: "#a78bfa", label: "Фиолетовый" },
  { value: "#fb923c", label: "Оранжевый" },
  { value: "#34d399", label: "Зелёный" },
  { value: "#f472b6", label: "Розовый" },
  { value: "#facc15", label: "Жёлтый" },
  { value: "#fb7185", label: "Красный" },
  { value: "#94a3b8", label: "Серый" },
] as const;

type LegacyLabelValue = "none" | "blue" | "violet" | "orange" | "green";

type DefaultLabelTemplate = Readonly<{
  id: string;
  name: string;
  color: string;
  legacyValue: Exclude<LegacyLabelValue, "none">;
}>;

const defaultLabelTemplates: readonly DefaultLabelTemplate[] = [
  { id: "label-idea", name: "Идея", color: "#38bdf8", legacyValue: "blue" },
  {
    id: "label-progress",
    name: "В работе",
    color: "#a78bfa",
    legacyValue: "violet",
  },
  {
    id: "label-urgent",
    name: "Срочно",
    color: "#fb923c",
    legacyValue: "orange",
  },
  { id: "label-done", name: "Готово", color: "#34d399", legacyValue: "green" },
];

export const LEGACY_LABEL_ID_BY_VALUE: Readonly<
  Record<Exclude<LegacyLabelValue, "none">, string>
> = Object.freeze(
  Object.fromEntries(
    defaultLabelTemplates.map((template) => [template.legacyValue, template.id]),
  ) as Record<Exclude<LegacyLabelValue, "none">, string>,
);

export type BoardLabelCollection = Readonly<{
  labelIds: string[];
  labels: Record<string, BoardLabel>;
}>;

export function createDefaultBoardLabelCollection(
  timestamp: number,
): BoardLabelCollection {
  const labels = Object.fromEntries(
    defaultLabelTemplates.map((template) => [
      template.id,
      {
        id: template.id,
        name: template.name,
        color: template.color,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]),
  ) as Record<string, BoardLabel>;

  return {
    labelIds: defaultLabelTemplates.map((template) => template.id),
    labels,
  };
}

export function getOrderedBoardLabels(board: Board): BoardLabel[] {
  return board.labelIds.flatMap((labelId) => {
    const label = board.labels[labelId];
    return label ? [label] : [];
  });
}

export function getCardLabels(
  card: Pick<BoardCard, "labelIds">,
  labels: Readonly<Record<string, BoardLabel>>,
): BoardLabel[] {
  return card.labelIds.flatMap((labelId) => {
    const label = labels[labelId];
    return label ? [label] : [];
  });
}

export function normalizeBoardLabelName(value: string): string {
  return value.trim().replace(/\s+/g, " ").slice(0, 48);
}

export function normalizeBoardLabelColor(value: string): string | null {
  const normalized = value.trim();
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toUpperCase() : null;
}

export function normalizeCardLabelIds(
  labelIds: readonly string[],
  labels: Readonly<Record<string, BoardLabel>>,
): string[] {
  const uniqueLabelIds = new Set<string>();

  for (const labelId of labelIds) {
    if (labels[labelId]) {
      uniqueLabelIds.add(labelId);
    }
  }

  return [...uniqueLabelIds];
}
