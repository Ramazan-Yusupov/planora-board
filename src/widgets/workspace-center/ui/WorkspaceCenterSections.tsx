"use client";

import {
  Activity,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  FileText,
  GitBranch,
  PackageOpen,
  Plug,
  ShieldCheck,
  Tags,
  Workflow,
} from "lucide-react";
import { useMemo } from "react";

import type { Board } from "@/entities/board";
import type { Note } from "@/features/manage-notes";
import type {
  WorkspacePreflightReport,
  WorkspacePreflightTone,
} from "@/features/workspace-preflight";
import {
  BOARD_MARKETPLACE_TEMPLATES,
  BOARD_WORKFLOW_TEMPLATES,
  isBoardMarketplaceTemplateApplied,
  NOTE_TEMPLATES,
  type BoardMarketplaceTemplateId,
  type BoardWorkflowTemplateId,
  type NoteTemplateId,
} from "@/features/workspace-templates";
import { Button, Panel, StatusPill, ToolSurfaceHeader, ToolSurfaceRow } from "@/shared/ui";

import {
  agentRoles,
  integrationPipeline,
  integrations,
  type AgentRoleId,
} from "../model/workspaceCenterData";

const preflightToneLabels: Record<WorkspacePreflightTone, string> = {
  danger: "Ошибка",
  info: "Инфо",
  success: "Готово",
  warning: "Проверить",
};

const preflightStatusTone: Record<
  WorkspacePreflightTone,
  "accent" | "danger" | "success" | "warning"
> = {
  danger: "danger",
  info: "accent",
  success: "success",
  warning: "warning",
};

function getSignalLabel(count: number): string {
  if (count % 10 === 1 && count % 100 !== 11) {
    return `${count} сигнал`;
  }

  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) {
    return `${count} сигнала`;
  }

  return `${count} сигналов`;
}

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
  onOpenHealthCheck,
  onOpenWorkspaceData,
  preflightReport,
}: Readonly<{
  onOpenHealthCheck: () => void;
  onOpenWorkspaceData: () => void;
  preflightReport: WorkspacePreflightReport;
}>) {
  const hasIssues = preflightReport.totalSignals > 0;

  return (
    <Panel>
      <ToolSurfaceHeader
        action={<StatusPill tone={hasIssues ? "warning" : "success"}>{hasIssues ? getSignalLabel(preflightReport.totalSignals) : "Чисто"}</StatusPill>}
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

      <div className="mt-4 grid gap-3">
        {preflightReport.sections.map((section) => (
          <section
            className="rounded-xl border border-white/10 bg-slate-950/20 p-3"
            key={section.id}
          >
            <div className="flex items-start gap-3 border-b border-white/10 pb-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-control text-accent">
                <FileWarning aria-hidden="true" size={18} />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text">
                  {section.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  {section.description}
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {section.items.map((item) => (
                <div
                  className="rounded-lg border border-white/10 bg-control/25 px-3 py-2"
                  key={item.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-text-muted">
                        {item.description}
                      </p>
                    </div>
                    <StatusPill tone={preflightStatusTone[item.tone]}>
                      {item.count !== undefined
                        ? `${preflightToneLabels[item.tone]} · ${item.count}`
                        : preflightToneLabels[item.tone]}
                    </StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Panel>
  );
}

export function RolesTab({
  roleActions,
}: Readonly<{
  roleActions: Readonly<Record<AgentRoleId, () => void>>;
}>) {
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
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-text">{role.title}</h3>
                <p className="mt-1 text-xs leading-5 text-text-muted">{role.description}</p>
              </div>
              <StatusPill tone="accent">Role</StatusPill>
            </div>
            <ul className="mt-3 space-y-1">
              {role.checks.map((check) => (
                <li key={check} className="flex items-center gap-2 text-xs text-text-muted">
                  <CheckCircle2 aria-hidden="true" className="text-accent" size={14} />
                  <span className="min-w-0 truncate">{check}</span>
                </li>
              ))}
            </ul>
            <Button
              className="mt-3"
              size="sm"
              variant="secondary"
              onClick={roleActions[role.id]}
            >
              {role.primaryActionLabel}
            </Button>
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

      <div className="mt-4 grid gap-2 sm:grid-cols-4">
        {integrationPipeline.map((step, index) => (
          <div
            className="rounded-xl border border-white/10 bg-slate-950/20 p-3"
            key={step.title}
          >
            <div className="flex items-center justify-between gap-2">
              <StatusPill tone="accent">{index + 1}</StatusPill>
              {index < integrationPipeline.length - 1 ? (
                <ArrowRight aria-hidden="true" className="text-text-muted" size={16} />
              ) : null}
            </div>
            <h3 className="mt-3 text-sm font-semibold text-text">{step.title}</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        {integrations.map((integration) => (
          <ToolSurfaceRow
            key={integration.title}
            action={<StatusPill>{integration.status}</StatusPill>}
            description={integration.description}
            icon={<Plug aria-hidden="true" size={18} />}
            title={integration.title}
          >
            <div className="mt-2 grid gap-2 text-xs text-text-muted sm:grid-cols-2">
              <p className="rounded-lg border border-white/10 bg-control/20 px-2.5 py-2">
                <span className="font-semibold text-text">Источник:</span>{" "}
                {integration.source}
              </p>
              <p className="rounded-lg border border-white/10 bg-control/20 px-2.5 py-2">
                <span className="font-semibold text-text">Следующий шаг:</span>{" "}
                {integration.nextStep}
              </p>
            </div>
          </ToolSurfaceRow>
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
  activeBoard,
  onApplyMarketplaceTemplate,
  onCreateNoteTemplate,
}: Readonly<{
  activeBoard: Board;
  onApplyMarketplaceTemplate: (templateId: BoardMarketplaceTemplateId) => void;
  onCreateNoteTemplate: (templateId: NoteTemplateId) => void;
}>) {
  return (
    <Panel>
      <ToolSurfaceHeader
        description="Локальная библиотека наборов для доски и шаблонов заметок."
        icon={<PackageOpen aria-hidden="true" size={20} />}
        title="Template marketplace"
      />

      <div className="mt-4 space-y-4">
        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Board kits</h3>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                Добавляют недостающие labels, statuses, priorities, cover colors и templates.
              </p>
            </div>
            <StatusPill tone="accent">{BOARD_MARKETPLACE_TEMPLATES.length}</StatusPill>
          </div>

          <div className="mt-3 grid gap-2">
            {BOARD_MARKETPLACE_TEMPLATES.map((template) => {
              const isApplied = isBoardMarketplaceTemplateApplied(activeBoard, template.id);

              return (
                <ToolSurfaceRow
                  key={template.id}
                  action={
                    <Button
                      disabled={isApplied}
                      size="sm"
                      variant="secondary"
                      onClick={() => onApplyMarketplaceTemplate(template.id)}
                    >
                      {isApplied ? "Применено" : "Применить"}
                    </Button>
                  }
                  description={template.description}
                  icon={<Tags aria-hidden="true" size={18} />}
                  title={template.title}
                >
                  <p className="mt-2 text-xs text-text-muted">
                    {template.labels.length} метки · {template.statuses.length} статуса · {template.checklistTemplates.length} чек-листа
                  </p>
                </ToolSurfaceRow>
              );
            })}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-text">Note templates</h3>
              <p className="mt-1 text-xs leading-5 text-text-muted">
                Создают новую заметку, связанную с текущим проектом.
              </p>
            </div>
            <StatusPill tone="accent">{NOTE_TEMPLATES.length}</StatusPill>
          </div>

          <div className="mt-3 grid gap-2">
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
        </section>
      </div>
    </Panel>
  );
}
