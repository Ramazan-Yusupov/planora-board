"use client";

import { FileSearch, FileText, FolderKanban } from "lucide-react";

import type { Board, BoardCard, BoardList, BoardWorkspace } from "@/entities/board";
import type { Note, NoteBlock } from "@/features/manage-notes";

import type { CommandPaletteAction } from "../ui/CommandPalette";

type GetWorkspaceSearchActionsOptions = Readonly<{
  activeBoardId?: string | null;
  notes: readonly Note[];
  workspace: BoardWorkspace;
  onOpenBoard: (boardId: string) => void;
  onOpenCard: (boardId: string, cardId: string) => void;
  onOpenNote: (note: Note) => void;
}>;

function getActiveCards(board: Board): BoardCard[] {
  return Object.values(board.cards).filter((card) => {
    const list = board.lists[card.listId];

    return !card.isArchived && list && !list.isArchived;
  });
}

function getListTitle(board: Board, listId: string): string {
  return board.lists[listId]?.title ?? "Список";
}

function getCardKeywords(
  board: Board,
  card: BoardCard,
  list: BoardList | undefined,
): string {
  const labels = card.labelIds
    .map((labelId) => board.labels[labelId]?.name)
    .filter(Boolean)
    .join(" ");

  return [
    board.title,
    list?.title,
    card.description,
    card.status,
    card.priority,
    card.dueDate,
    labels,
  ]
    .filter(Boolean)
    .join(" ");
}

function getBlockText(block: NoteBlock): string {
  const tableText = block.tableCells?.flat().join(" ") ?? "";

  return [block.text, tableText].filter(Boolean).join(" ");
}

function getNoteKeywords(note: Note, boardTitle: string): string {
  return [boardTitle, note.title, ...note.blocks.map(getBlockText)].join(" ");
}

function getNoteDescription(note: Note, boardTitle: string): string {
  const snippet = note.blocks
    .map(getBlockText)
    .find((text) => text.trim().length > 0);
  const updatedAt = new Date(note.updatedAt).toLocaleDateString("ru-RU");

  return snippet
    ? `${boardTitle} · ${snippet.slice(0, 72)}`
    : `${boardTitle} · ${updatedAt}`;
}

export function getWorkspaceSearchActions({
  activeBoardId,
  notes,
  workspace,
  onOpenBoard,
  onOpenCard,
  onOpenNote,
}: GetWorkspaceSearchActionsOptions): CommandPaletteAction[] {
  const boardsById = new Map(workspace.boards.map((board) => [board.id, board]));
  const projectActions = workspace.boards.map((board): CommandPaletteAction => {
    const activeCardsCount = getActiveCards(board).length;

    return {
      id: `workspace-search-board-${board.id}`,
      label: board.title,
      description: `${activeCardsCount} активных задач`,
      group: "Проекты",
      icon: <FolderKanban aria-hidden="true" size={18} />,
      keywords: board.id,
      onSelect: () => onOpenBoard(board.id),
      disabled: board.id === activeBoardId,
    };
  });
  const cardActions = workspace.boards.flatMap((board) =>
    getActiveCards(board)
      .sort((firstCard, secondCard) =>
        firstCard.title.localeCompare(secondCard.title, "ru-RU"),
      )
      .map((card): CommandPaletteAction => {
        const list = board.lists[card.listId];
        const dueDate = card.dueDate ? ` · ${card.dueDate}` : "";

        return {
          id: `workspace-search-card-${board.id}-${card.id}`,
          label: card.title,
          description: `${board.title} / ${getListTitle(board, card.listId)}${dueDate}`,
          group: "Карточки workspace",
          icon: <FileSearch aria-hidden="true" size={18} />,
          keywords: getCardKeywords(board, card, list),
          onSelect: () => onOpenCard(board.id, card.id),
        };
      }),
  );
  const noteActions = notes
    .filter((note) => note.boardId && boardsById.has(note.boardId))
    .sort((firstNote, secondNote) => secondNote.updatedAt - firstNote.updatedAt)
    .map((note): CommandPaletteAction => {
      const boardTitle = boardsById.get(note.boardId ?? "")?.title ?? "Без доски";

      return {
        id: `workspace-search-note-${note.id}`,
        label: note.title || "Без названия",
        description: getNoteDescription(note, boardTitle),
        group: "Заметки workspace",
        icon: <FileText aria-hidden="true" size={18} />,
        keywords: getNoteKeywords(note, boardTitle),
        onSelect: () => onOpenNote(note),
      };
    });

  return [...projectActions, ...cardActions, ...noteActions];
}
