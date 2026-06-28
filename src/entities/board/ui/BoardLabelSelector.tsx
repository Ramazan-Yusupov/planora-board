"use client";

import { Check } from "lucide-react";

import { getReadableTextColor, type BoardLabel } from "@/entities/board";
import { cn } from "@/shared/lib";

type BoardLabelSelectorProps = Readonly<{
  labels: readonly BoardLabel[];
  selectedLabelIds: readonly string[];
  onChange: (labelIds: string[]) => void;
  emptyMessage?: string;
}>;

export function BoardLabelSelector({
  labels,
  selectedLabelIds,
  onChange,
  emptyMessage = "В проекте пока нет меток.",
}: BoardLabelSelectorProps) {
  const selectedLabelIdSet = new Set(selectedLabelIds);

  const toggleLabel = (labelId: string) => {
    if (selectedLabelIdSet.has(labelId)) {
      onChange(selectedLabelIds.filter((currentLabelId) => currentLabelId !== labelId));
      return;
    }

    onChange([...selectedLabelIds, labelId]);
  };

  if (labels.length === 0) {
    return <p className="text-sm text-text-muted">{emptyMessage}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Выбор меток">
      {labels.map((label) => {
        const isSelected = selectedLabelIdSet.has(label.id);

        return (
          <button
            key={label.id}
            aria-pressed={isSelected}
            className={cn(
              "inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium transition focus-visible:outline-offset-2",
              isSelected ? "ring-2 ring-white/80 ring-offset-2 ring-offset-panel" : "opacity-80 hover:opacity-100",
            )}
            style={{
              backgroundColor: label.color,
              color: getReadableTextColor(label.color),
            }}
            type="button"
            onClick={() => toggleLabel(label.id)}
          >
            {isSelected ? <Check aria-hidden="true" className="shrink-0" size={15} /> : null}
            <span className="truncate">{label.name}</span>
          </button>
        );
      })}
    </div>
  );
}
