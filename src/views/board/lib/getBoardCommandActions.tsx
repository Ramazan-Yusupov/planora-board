"use client";

import {
  Archive,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Command,
  FileSearch,
  FileText,
  Filter,
  LayoutDashboard,
  ListPlus,
  Palette,
  PenTool,
  Plus,
  ShieldCheck,
} from "lucide-react";

import type { Board } from "@/entities/board";
import type { CommandPaletteAction } from "@/widgets/command-palette";

type GetBoardCommandActionsOptions = Readonly<{
  board: Board;
  activeListsCount: number;
  onOpenArchive: () => void;
  onOpenAnalytics: () => void;
  onOpenAppearance: () => void;
  onOpenCalendar: () => void;
  onOpenDraw: () => void;
  onOpenMyWork: () => void;
  onOpenNotes: () => void;
  onOpenFilters: () => void;
  onOpenHealthCheck: () => void;
  onOpenProjects: () => void;
  onOpenWorkspaceCenter: () => void;
  onOpenCard: (cardId: string) => void;
  onOpenQuickCreateCard: () => void;
  onOpenQuickCreateList: () => void;
}>;

export function getBoardCommandActions({
  board,
  activeListsCount,
  onOpenArchive,
  onOpenAnalytics,
  onOpenAppearance,
  onOpenCalendar,
  onOpenDraw,
  onOpenMyWork,
  onOpenNotes,
  onOpenFilters,
  onOpenHealthCheck,
  onOpenProjects,
  onOpenWorkspaceCenter,
  onOpenCard,
  onOpenQuickCreateCard,
  onOpenQuickCreateList,
}: GetBoardCommandActionsOptions): CommandPaletteAction[] {
  const cardActions = Object.values(board.cards)
    .filter((card) => {
      const list = board.lists[card.listId];

      return !card.isArchived && list && !list.isArchived;
    })
    .sort((firstCard, secondCard) =>
      firstCard.title.localeCompare(secondCard.title, "ru-RU"),
    )
    .map((card): CommandPaletteAction => {
      const listTitle = board.lists[card.listId]?.title ?? "Список";
      const dueDate = card.dueDate ? ` · ${card.dueDate}` : "";

      return {
        id: `card-${card.id}`,
        label: card.title,
        description: `${listTitle}${dueDate}`,
        group: "Карточки",
        icon: <FileSearch aria-hidden="true" size={18} />,
        onSelect: () => onOpenCard(card.id),
      };
    });

  return [
    {
      id: "new-card",
      label: "Новая карточка",
      description: "Создать задачу в выбранном списке",
      group: "Создание",
      shortcut: "N",
      icon: <Plus aria-hidden="true" size={18} />,
      onSelect: onOpenQuickCreateCard,
      disabled: activeListsCount === 0,
    },
    {
      id: "new-list",
      label: "Новый список",
      description: "Добавить колонку на текущую доску",
      group: "Создание",
      shortcut: "L",
      icon: <ListPlus aria-hidden="true" size={18} />,
      onSelect: onOpenQuickCreateList,
    },
    {
      id: "projects",
      label: "Проекты",
      description: "Открыть список проектов",
      group: "Навигация",
      shortcut: "B",
      icon: <LayoutDashboard aria-hidden="true" size={18} />,
      onSelect: onOpenProjects,
    },
    {
      id: "calendar",
      label: "Календарь",
      description: "Открыть задачи по срокам",
      group: "Навигация",
      icon: <CalendarDays aria-hidden="true" size={18} />,
      onSelect: onOpenCalendar,
    },
    {
      id: "my-work",
      label: "Мои задачи",
      description: "Открыть просроченные и ближайшие задачи",
      group: "Навигация",
      icon: <ClipboardList aria-hidden="true" size={18} />,
      onSelect: onOpenMyWork,
    },
    {
      id: "analytics",
      label: "Аналитика",
      description: "Открыть сводку по задачам и прогрессу",
      group: "Навигация",
      icon: <BarChart3 aria-hidden="true" size={18} />,
      onSelect: onOpenAnalytics,
    },
    {
      id: "notes",
      label: "Заметки",
      description: "Открыть локальные markdown-заметки",
      group: "Навигация",
      icon: <FileText aria-hidden="true" size={18} />,
      onSelect: onOpenNotes,
    },
    {
      id: "draw",
      label: "DrawTool",
      description: "Открыть canvas-инструмент в отдельной странице",
      group: "Навигация",
      icon: <PenTool aria-hidden="true" size={18} />,
      onSelect: onOpenDraw,
    },
    {
      id: "filters",
      label: "Фильтры",
      description: "Открыть поиск и фильтры карточек",
      group: "Инструменты",
      icon: <Filter aria-hidden="true" size={18} />,
      onSelect: onOpenFilters,
    },
    {
      id: "workspace-center",
      label: "Workspace Center",
      description: "Открыть workflows, templates, integrations и preflight",
      group: "Инструменты",
      icon: <Command aria-hidden="true" size={18} />,
      onSelect: onOpenWorkspaceCenter,
    },
    {
      id: "health-check",
      label: "Диагностика workspace",
      description: "Проверить схему проектов, заметки и связи",
      group: "Инструменты",
      icon: <ShieldCheck aria-hidden="true" size={18} />,
      onSelect: onOpenHealthCheck,
    },
    {
      id: "archive",
      label: "Архив",
      description: "Открыть архив карточек и списков",
      group: "Инструменты",
      icon: <Archive aria-hidden="true" size={18} />,
      onSelect: onOpenArchive,
    },
    {
      id: "appearance",
      label: "Оформление",
      description: "Изменить фон и цвет карточек",
      group: "Инструменты",
      icon: <Palette aria-hidden="true" size={18} />,
      onSelect: onOpenAppearance,
    },
    ...cardActions,
  ];
}
