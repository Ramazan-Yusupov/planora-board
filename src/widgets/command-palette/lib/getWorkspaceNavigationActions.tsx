"use client";

import {
  BarChart3,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  LayoutDashboard,
  PenTool,
} from "lucide-react";

import type { CommandPaletteAction } from "../ui/CommandPalette";

type GetWorkspaceNavigationActionsOptions = Readonly<{
  onOpenAnalytics: () => void;
  onOpenBoard: () => void;
  onOpenCalendar: () => void;
  onOpenDraw: () => void;
  onOpenMyWork: () => void;
  onOpenNotes: () => void;
  onOpenTaskReview?: () => void;
}>;

export function getWorkspaceNavigationActions({
  onOpenAnalytics,
  onOpenBoard,
  onOpenCalendar,
  onOpenDraw,
  onOpenMyWork,
  onOpenNotes,
  onOpenTaskReview,
}: GetWorkspaceNavigationActionsOptions): CommandPaletteAction[] {
  const actions: CommandPaletteAction[] = [
    {
      id: "workspace-board",
      label: "Рабочая доска",
      description: "Перейти к активной доске проекта",
      icon: <LayoutDashboard aria-hidden="true" size={18} />,
      onSelect: onOpenBoard,
    },
    {
      id: "workspace-notes",
      label: "Заметки",
      description: "Открыть заметки активной доски",
      icon: <FileText aria-hidden="true" size={18} />,
      onSelect: onOpenNotes,
    },
    {
      id: "workspace-my-work",
      label: "Мои задачи",
      description: "Открыть фокус по срокам и активным задачам",
      icon: <ClipboardList aria-hidden="true" size={18} />,
      onSelect: onOpenMyWork,
    },
    ...(onOpenTaskReview
      ? [
          {
            id: "workspace-task-review",
            label: "Обзор задач",
            description: "Открыть аудит просрочек, блокеров и задач без срока",
            icon: <ClipboardCheck aria-hidden="true" size={18} />,
            onSelect: onOpenTaskReview,
          },
        ]
      : []),
    {
      id: "workspace-draw",
      label: "DrawTool",
      description: "Открыть изолированную страницу для схем и canvas",
      icon: <PenTool aria-hidden="true" size={18} />,
      onSelect: onOpenDraw,
    },
    {
      id: "workspace-calendar",
      label: "Календарь",
      description: "Открыть задачи с дедлайнами",
      icon: <CalendarDays aria-hidden="true" size={18} />,
      onSelect: onOpenCalendar,
    },
    {
      id: "workspace-analytics",
      label: "Аналитика",
      description: "Открыть прогресс и риски активной доски",
      icon: <BarChart3 aria-hidden="true" size={18} />,
      onSelect: onOpenAnalytics,
    },
  ];

  return actions;
}
