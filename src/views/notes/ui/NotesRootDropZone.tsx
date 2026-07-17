"use client";

import { useDroppable } from "@dnd-kit/core";

import { cn } from "@/shared/lib";

import { NOTES_ROOT_DROP_ZONE_ID } from "../lib/notesEditorModel";

type NotesRootDropZoneProps = Readonly<{
  isDraggingNestedBlock: boolean;
}>;

export function NotesRootDropZone({
  isDraggingNestedBlock,
}: NotesRootDropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: NOTES_ROOT_DROP_ZONE_ID,
    data: { type: "notes-root-drop-zone" },
  });

  if (!isDraggingNestedBlock) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "mb-2 ml-26 rounded-lg border border-dashed border-white/14 bg-control/20 px-3 py-2 text-xs font-medium text-text-muted transition",
        isOver && "border-accent/70 bg-accent/12 text-text",
      )}
    >
      Отпустите здесь, чтобы вынести блок на корневой уровень
    </div>
  );
}
