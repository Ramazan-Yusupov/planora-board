"use client";

import {
  Activity,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GitBranch,
  PackageOpen,
  Plug,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";

import type { Board } from "@/entities/board";
import type { Note } from "@/features/manage-notes";
import {
  BOARD_WORKFLOW_TEMPLATES,
  NOTE_TEMPLATES,
  type BoardWorkflowTemplateId,
  type NoteTemplateId,
} from "@/features/workspace-templates";
import type { WorkspaceHealthReport } from "@/features/workspace-health";
import { Button, Panel, StatusPill, ToolSurfaceHeader, ToolSurfaceRow } from "@/shared/ui";

import { agentRoles, integrations } from "../model/workspaceCenterData";

export function WorkflowsTab({
  onApplyWorkflowTemplate,
}: Readonly<{
  onApplyWorkflowTemplate: (templateId: BoardWorkflowTemplateId) => void;
}>) {
  return (
    <Panel>
      <ToolSurfaceHeader
        description="Добавляют списки, стартовые карточки, checklist templates и custom fields в текущий проект."
        icon={<Workflow aria-hidden="true" size={20} />}
        title="Workflow templates"
      />

      <div className="mt-4 grid gap-2">
        {BOARD_WORKFLOW_TEMPLATES.map((template) => (
          <ToolSurfaceRow
            key={template.id}
            action={
              <Button size="sm" variant="secondary" onClick={() => onApplyWorkflowTemplate(template.id)}>
                Добавить
              </Button>
            }
            description={template.description}
            icon={<GitBranch aria-hidden="true" size={18} />}
            title={template.title}
          >
            <p className="mt-2 text-xs text-text-muted">
              {template.listTitles.length} списков · {template.cards.length} карточек · {template.checklistTemplates.length} чек-листа
            </p>
          </ToolSurfaceRow>
        ))}
      </div>
    </Panel>
  );
}

export function PreflightTab({
  healthReport,
  onOpenHealthCheck,
  onOpenWorkspaceData,
}: Readonly<{
  healthReport: WorkspaceHealthReport;
  onOpenHealthCheck: () => void;
  onOpenWorkspaceData: () => void;
}>) {
  const hasIssues = healthReport.issues.length > 0;

  return (
    <Panel>
      <ToolSurfaceHeader
        action={<StatusPill tone={hasIssues ? "warning" : "success"}>{hasIssues ? `${healthReport.issues.length} сигналов` : "Чисто"}</StatusPill>}
        description="Preflight перед import, backup, удалением проекта и массовыми изменениями."
        icon={<ShieldCheck aria-hidden="true" size={20} />}
        title="Hooks-style checks"
      />

      <div className="mt-4 grid gap-2">
        <ToolSurfaceRow
          action={<Button size="sm" variant="secondary" onClick={onOpenHealthCheck}>Открыть</Button>}
          description="Проверить schema, Notes links, таблицы и orphan-связи перед backup/import."
          icon={<ShieldCheck aria-hidden="true" size={18} />}
          title="Workspace Health Check"
        />
        <ToolSurfaceRow
          action={<Button size="sm" variant="secondary" onClick={onOpenWorkspaceData}>Backup</Button>}
          description="Создать JSON backup или подключить folder storage после диагностики."
          icon={<ClipboardCheck aria-hidden="true" size={18} />}
          title="Backup/import gate"
        />
      </div>
    </Panel>
  );
}

export function RolesTab() {
  return (
    <Panel>
      <ToolSurfaceHeader
        description="Внутренние роли как рабочие чек-листы для ревью проекта."
        icon={<Bot aria-hidden="true" size={20} />}
        title="Agent-like roles"
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {agentRoles.map((role) => (
          <div key={role.title} className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
            <h3 className="text-sm font-semibold text-text">{role.title}</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">{role.description}</p>
            <ul className="mt-3 space-y-1">
              {role.checks.map((check) => (
                <li key={check} className="flex items-center gap-2 text-xs text-text-muted">
                  <CheckCircle2 aria-hidden="true" className="text-accent" size={14} />
                  <span className="min-w-0 truncate">{check}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function IntegrationsTab() {
  return (
    <Panel>
      <ToolSurfaceHeader
        description="Roadmap внешних подключений. Пока без доступа к внешним данным и без permissions."
        icon={<Plug aria-hidden="true" size={20} />}
        title="Plugin / integration dashboard"
      />

      <div className="mt-4 grid gap-2">
        {integrations.map((integration) => (
          <ToolSurfaceRow
            key={integration.title}
            action={<StatusPill>{integration.status}</StatusPill>}
            description={integration.description}
            icon={<Plug aria-hidden="true" size={18} />}
            title={integration.title}
          />
        ))}
      </div>
    </Panel>
  );
}

export function ActivityTab({
  activeBoard,
  notes,
}: Readonly<{ activeBoard: Board; notes: readonly Note[] }>) {
  const activityItems = useMemo(() => {
    const boardItems = activeBoard.activityIds.flatMap((activityId) => {
      const activity = activeBoard.activities[activityId];
      const card = activity ? activeBoard.cards[activity.cardId] : undefined;

      return activity
        ? [
            {
              id: activity.id,
              meta: card?.title ?? "Карточка",
              timestamp: activity.createdAt,
              title: activity.message,
              type: "Board",
            },
          ]
        : [];
    });
    const noteItems = notes
      .filter((note) => !note.boardId || note.boardId === activeBoard.id)
      .map((note) => ({
        id: note.id,
        meta: "Notes",
        timestamp: note.updatedAt,
        title: `Обновлена заметка «${note.title}»`,
        type: "Note",
      }));

    return [...boardItems, ...noteItems]
      .sort((first, second) => second.timestamp - first.timestamp)
      .slice(0, 10);
  }, [activeBoard, notes]);

  return (
    <Panel>
      <ToolSurfaceHeader
        description="Компактный журнал workspace без возвращения громоздкой истории в карточку."
        icon={<Activity aria-hidden="true" size={20} />}
        title="Conversation / activity monitor"
      />

      <div className="mt-4 space-y-2">
        {activityItems.map((item) => (
          <div key={`${item.type}-${item.id}`} className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-text">{item.title}</p>
              <StatusPill>{item.type}</StatusPill>
            </div>
            <p className="mt-1 truncate text-xs text-text-muted">{item.meta}</p>
          </div>
        ))}
        {activityItems.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/15 px-3 py-5 text-center text-sm text-text-muted">
            Пока нет активности для текущего проекта.
          </p>
        ) : null}
      </div>
    </Panel>
  );
}

export function MarketplaceTab({
  onCreateNoteTemplate,
}: Readonly<{
  onCreateNoteTemplate: (templateId: NoteTemplateId) => void;
}>) {
  return (
    <Panel>
      <ToolSurfaceHeader
        description="Локальная библиотека шаблонов заметок. Следующий слой сюда же добавит шаблоны статусов, labels и boards."
        icon={<PackageOpen aria-hidden="true" size={20} />}
        title="Template marketplace"
      />

      <div className="mt-4 grid gap-2">
        {NOTE_TEMPLATES.map((template) => (
          <ToolSurfaceRow
            key={template.id}
            action={
              <Button size="sm" variant="secondary" onClick={() => onCreateNoteTemplate(template.id)}>
                Создать
              </Button>
            }
            description={template.description}
            icon={<FileText aria-hidden="true" size={18} />}
            title={template.title}
          />
        ))}
      </div>
    </Panel>
  );
}
