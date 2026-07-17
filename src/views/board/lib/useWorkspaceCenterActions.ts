"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";

import type { Board } from "@/entities/board";
import type { BoardSaveMode } from "@/features/manage-board-workspace";
import {
  loadNotes,
  saveNotes,
  type Note,
} from "@/features/manage-notes";
import {
  applyBoardMarketplaceTemplate,
  applyBoardWorkflowTemplate,
  BOARD_MARKETPLACE_TEMPLATES,
  BOARD_WORKFLOW_TEMPLATES,
  createNoteFromTemplate,
  isBoardMarketplaceTemplateApplied,
  NOTE_TEMPLATES,
  type BoardMarketplaceTemplateId,
  type BoardWorkflowTemplateId,
  type NoteTemplateId,
} from "@/features/workspace-templates";
import type { ToastTone } from "@/shared/ui";

type ToastDraft = Readonly<{
  title: string;
  description?: string;
  tone?: ToastTone;
}>;

type UseWorkspaceCenterActionsOptions = Readonly<{
  activeBoardId: string;
  setNotesSnapshot: Dispatch<SetStateAction<Note[]>>;
  showToast: (draft: ToastDraft) => void;
  updateActiveBoard: (
    updater: (currentBoard: Board) => Board,
    saveMode?: BoardSaveMode,
  ) => void;
}>;

export function useWorkspaceCenterActions({
  activeBoardId,
  setNotesSnapshot,
  showToast,
  updateActiveBoard,
}: UseWorkspaceCenterActionsOptions) {
  const applyWorkflowTemplate = useCallback(
    (templateId: BoardWorkflowTemplateId) => {
      const template = BOARD_WORKFLOW_TEMPLATES.find(
        (item) => item.id === templateId,
      );

      updateActiveBoard(
        (board) => applyBoardWorkflowTemplate(board, templateId),
        "immediate",
      );
      showToast({
        title: "Workflow добавлен",
        description: template?.title ?? "Шаблон",
        tone: "success",
      });
    },
    [showToast, updateActiveBoard],
  );

  const createNoteTemplate = useCallback(
    (templateId: NoteTemplateId) => {
      const nextNote = createNoteFromTemplate(activeBoardId, templateId);
      const template = NOTE_TEMPLATES.find((item) => item.id === templateId);

      if (!nextNote) {
        return;
      }

      const nextNotes = [...loadNotes(), nextNote];

      saveNotes(nextNotes);
      setNotesSnapshot(nextNotes);
      showToast({
        title: "Заметка создана",
        description: template?.title ?? nextNote.title,
        tone: "success",
      });
    },
    [activeBoardId, setNotesSnapshot, showToast],
  );

  const applyMarketplaceTemplate = useCallback(
    (templateId: BoardMarketplaceTemplateId) => {
      const template = BOARD_MARKETPLACE_TEMPLATES.find(
        (item) => item.id === templateId,
      );
      let didApplyTemplate = false;

      updateActiveBoard(
        (board) => {
          if (isBoardMarketplaceTemplateApplied(board, templateId)) {
            return board;
          }

          didApplyTemplate = true;

          return applyBoardMarketplaceTemplate(board, templateId);
        },
        "immediate",
      );
      showToast({
        title: didApplyTemplate ? "Template kit применён" : "Template kit уже применён",
        description: template?.title ?? "Набор",
        tone: didApplyTemplate ? "success" : "info",
      });
    },
    [showToast, updateActiveBoard],
  );

  return {
    applyMarketplaceTemplate,
    applyWorkflowTemplate,
    createNoteTemplate,
  };
}
