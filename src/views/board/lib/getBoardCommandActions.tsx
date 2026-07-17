"use client";

import {
  Archive,
  Activity,
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardList,
  ClipboardCheck,
  Command,
  DatabaseBackup,
  FileSearch,
  FileText,
  Filter,
  GitBranch,
  LayoutDashboard,
  ListPlus,
  Palette,
  PenTool,
  Plus,
  Plug,
  ShieldCheck,
} from "lucide-react";

import type { Board } from "@/entities/board";
import {
  BOARD_WORKFLOW_TEMPLATES,
  type BoardWorkflowTemplateId,
} from "@/features/workspace-templates";
import type { CommandPaletteAction } from "@/widgets/command-palette";
import { agentRoles, type AgentRoleId } from "@/widgets/workspace-center";

type GetBoardCommandActionsOptions = Readonly<{
  board: Board;
  activeListsCount: number;
  onOpenArchive: () => void;
  onOpenAnalytics: () => void;
  onOpenActivityMonitor: () => void;
  onOpenAppearance: () => void;
  onOpenCalendar: () => void;
  onOpenDraw: () => void;
  onOpenMyWork: () => void;
  onOpenNotes: () => void;
  onOpenTaskReview: () => void;
  onOpenFilters: () => void;
  onOpenHealthCheck: () => void;
  onOpenIntegrations: () => void;
  onOpenProjects: () => void;
  onOpenWorkspaceData: () => void;
  onOpenWorkspaceCenter: () => void;
  onOpenCard: (cardId: string) => void;
  onOpenQuickCreateCard: () => void;
  onOpenQuickCreateList: () => void;
  onApplyWorkflowTemplate: (templateId: BoardWorkflowTemplateId) => void;
  onRunAgentRole: (roleId: AgentRoleId) => void;
}>;

export function getBoardCommandActions({
  board,
  activeListsCount,
  onOpenArchive,
  onOpenAnalytics,
  onOpenActivityMonitor,
  onOpenAppearance,
  onOpenCalendar,
  onOpenDraw,
  onOpenMyWork,
  onOpenNotes,
  onOpenTaskReview,
  onOpenFilters,
  onOpenHealthCheck,
  onOpenIntegrations,
  onOpenProjects,
  onOpenWorkspaceData,
  onOpenWorkspaceCenter,
  onOpenCard,
  onOpenQuickCreateCard,
  onOpenQuickCreateList,
  onApplyWorkflowTemplate,
  onRunAgentRole,
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
    ...BOARD_WORKFLOW_TEMPLATES.map(
      (template): CommandPaletteAction => ({
        id: `workflow-template-${template.id}`,
        label: `Добавить ${template.title}`,
        description: `${template.listTitles.length} списков · ${template.cards.length} карточек · ${template.checklistTemplates.length} чек-листа`,
        group: "Шаблоны",
        keywords: `workflow template шаблон сценарий ${template.description}`,
        icon: <GitBranch aria-hidden="true" size={18} />,
        onSelect: () => onApplyWorkflowTemplate(template.id),
      }),
    ),
    ...agentRoles.map(
      (role): CommandPaletteAction => ({
        id: `agent-role-${role.id}`,
        label: `Роль: ${role.title}`,
        description: role.description,
        group: "Роли",
        keywords: `${role.primaryActionLabel} ${role.checks.join(" ")}`,
        icon: <Bot aria-hidden="true" size={18} />,
        onSelect: () => onRunAgentRole(role.id),
      }),
    ),
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
      id: "task-review",
      label: "Обзор задач",
      description: "Открыть аудит просрочек, блокеров и задач без срока",
      group: "Навигация",
      icon: <ClipboardCheck aria-hidden="true" size={18} />,
      onSelect: onOpenTaskReview,
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
      id: "activity-monitor",
      label: "Monitor активности",
      description: "Открыть компактный журнал изменений workspace и заметок",
      group: "Инструменты",
      keywords: "activity monitor журнал история изменения conversation",
      icon: <Activity aria-hidden="true" size={18} />,
      onSelect: onOpenActivityMonitor,
    },
    {
      id: "workspace-data",
      label: "Экспорт и импорт",
      description: "Открыть backup, export/import и проверку данных workspace",
      group: "Инструменты",
      keywords: "backup import export json storage данные preflight",
      icon: <DatabaseBackup aria-hidden="true" size={18} />,
      onSelect: onOpenWorkspaceData,
    },
    {
      id: "integration-roadmap",
      label: "Интеграции",
      description: "Открыть roadmap внешних источников и безопасный import pipeline",
      group: "Инструменты",
      keywords: "plugin mcp roadmap source import permissions",
      icon: <Plug aria-hidden="true" size={18} />,
      onSelect: onOpenIntegrations,
    },
    {
      id: "plugin-dashboard",
      label: "Plugin dashboard",
      description: "Открыть permissions, connections, import drafts и disable policy",
      group: "Инструменты",
      keywords: "plugin permissions connections scopes disable disconnect import drafts",
      icon: <Plug aria-hidden="true" size={18} />,
      onSelect: onOpenIntegrations,
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
