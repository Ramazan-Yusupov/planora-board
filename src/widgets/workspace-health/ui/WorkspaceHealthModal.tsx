"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  FileText,
  Link2,
  ShieldCheck,
  TriangleAlert,
  Wrench,
} from "lucide-react";

import type {
  WorkspaceHealthFixPlan,
  WorkspaceHealthIssue,
  WorkspaceHealthReport,
  WorkspaceHealthScope,
  WorkspaceHealthSeverity,
} from "@/features/workspace-health";
import { cn } from "@/shared/lib";
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Modal,
  Panel,
  StatusPill,
  ToolIcon,
  ToolSurfaceHeader,
} from "@/shared/ui";

type WorkspaceHealthModalProps = Readonly<{
  fixPlan: WorkspaceHealthFixPlan;
  isOpen: boolean;
  onApplyFixes: () => void;
  onClose: () => void;
  report: WorkspaceHealthReport;
}>;

const scopeLabels: Record<WorkspaceHealthScope, string> = {
  workspace: "Workspace",
  board: "Board",
  notes: "Notes",
  links: "Связи",
  backup: "Backup",
};

const severityLabels: Record<WorkspaceHealthSeverity, string> = {
  danger: "Ошибка",
  warning: "Внимание",
};

function getIssueIcon(issue: WorkspaceHealthIssue) {
  if (issue.severity === "danger") {
    return <TriangleAlert aria-hidden="true" size={17} />;
  }

  return <AlertTriangle aria-hidden="true" size={17} />;
}

function getScopeIcon(scope: WorkspaceHealthScope) {
  if (scope === "notes") {
    return <FileText aria-hidden="true" size={18} />;
  }

  if (scope === "links") {
    return <Link2 aria-hidden="true" size={18} />;
  }

  if (scope === "backup") {
    return <Database aria-hidden="true" size={18} />;
  }

  return <ShieldCheck aria-hidden="true" size={18} />;
}

function getSummaryTone(report: WorkspaceHealthReport): {
  label: string;
  tone: "danger" | "success" | "warning";
} {
  if (report.dangerCount > 0) {
    return { label: "Нужна проверка", tone: "danger" };
  }

  if (report.warningCount > 0) {
    return { label: "Есть предупреждения", tone: "warning" };
  }

  return { label: "Данные в порядке", tone: "success" };
}

function SummaryCard({
  label,
  value,
}: Readonly<{ label: string; value: number | string }>) {
  return (
    <div className="rounded-xl border border-white/10 bg-control/45 px-3 py-3">
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-text">{value}</p>
    </div>
  );
}

function IssueRow({ issue }: Readonly<{ issue: WorkspaceHealthIssue }>) {
  return (
    <li className="rounded-xl border border-white/10 bg-slate-950/20 p-3">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
            issue.severity === "danger"
              ? "bg-red-500/12 text-red-200"
              : "bg-amber-400/12 text-amber-100",
          )}
        >
          {getIssueIcon(issue)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-text">{issue.title}</h3>
            <StatusPill tone={issue.severity === "danger" ? "danger" : "warning"}>
              {severityLabels[issue.severity]}
            </StatusPill>
          </div>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            {issue.description}
          </p>
        </div>
      </div>
    </li>
  );
}

function FixPlanPanel({
  fixPlan,
  onApply,
}: Readonly<{
  fixPlan: WorkspaceHealthFixPlan;
  onApply: () => void;
}>) {
  if (fixPlan.totalCount === 0) {
    return null;
  }

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <ToolSurfaceHeader
          description="Доступны только безопасные исправления: без удаления досок, карточек и вложений."
          icon={<Wrench aria-hidden="true" size={20} />}
          title="Auto-fix"
        />
        <Button className="shrink-0" onClick={onApply}>
          Исправить доступное
        </Button>
      </div>

      <ul className="mt-3 space-y-2">
        {fixPlan.fixes.map((fix) => (
          <li
            className="rounded-xl border border-white/10 bg-slate-950/20 px-3 py-2"
            key={fix.kind}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">{fix.title}</p>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  {fix.description}
                </p>
              </div>
              <StatusPill tone="accent">{fix.count}</StatusPill>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function WorkspaceHealthModal({
  fixPlan,
  isOpen,
  onApplyFixes,
  onClose,
  report,
}: WorkspaceHealthModalProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  if (!isOpen) {
    return null;
  }

  const summaryTone = getSummaryTone(report);
  const checkedAt = new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
  }).format(report.checkedAt);
  const issuesByScope = report.issues.reduce(
    (groups, issue) => ({
      ...groups,
      [issue.scope]: [...(groups[issue.scope] ?? []), issue],
    }),
    {} as Partial<Record<WorkspaceHealthScope, WorkspaceHealthIssue[]>>,
  );

  return (
    <>
      <Modal title="Диагностика workspace" onClose={onClose}>
        <div className="space-y-4">
          <Panel>
            <ToolSurfaceHeader
              action={<StatusPill tone={summaryTone.tone}>{summaryTone.label}</StatusPill>}
              description="Проверяет схему проектов, связи заметок с задачами, вложенность блоков Notes и готовность данных к backup/import."
              icon={<ShieldCheck aria-hidden="true" size={20} />}
              title="Health Check"
            />

            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <SummaryCard label="Проекты" value={report.boardsCount} />
              <SummaryCard label="Активные задачи" value={report.activeCardsCount} />
              <SummaryCard label="Заметки" value={report.notesCount} />
              <SummaryCard label="Проверка" value={checkedAt} />
            </div>
          </Panel>

          <FixPlanPanel
            fixPlan={fixPlan}
            onApply={() => setIsConfirmOpen(true)}
          />

          {report.issues.length === 0 ? (
            <Panel>
              <EmptyState
                description="Workspace, board schema и связи Notes ↔ Board выглядят готовыми к работе, backup и import/export."
                icon={<CheckCircle2 aria-hidden="true" size={24} />}
                title="Критичных проблем не найдено"
              />
            </Panel>
          ) : (
            <div className="space-y-3">
              {(Object.keys(scopeLabels) as WorkspaceHealthScope[]).flatMap(
                (scope) => {
                  const scopeIssues = issuesByScope[scope] ?? [];

                  if (scopeIssues.length === 0) {
                    return [];
                  }

                  return [
                    <Panel key={scope}>
                      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                        <ToolIcon>
                          {getScopeIcon(scope)}
                        </ToolIcon>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-semibold text-text">
                            {scopeLabels[scope]}
                          </h3>
                          <p className="text-xs text-text-muted">
                            {scopeIssues.length} проблем
                          </p>
                        </div>
                      </div>

                      <ul className="mt-3 space-y-2">
                        {scopeIssues.map((issue) => (
                          <IssueRow key={issue.id} issue={issue} />
                        ))}
                      </ul>
                    </Panel>,
                  ];
                },
              )}
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Закрыть
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        confirmLabel="Применить исправления"
        description={`Будет применено исправлений: ${fixPlan.totalCount}. Доски, карточки и вложения не удаляются; битые linked-card блоки в Notes станут обычным текстом.`}
        isOpen={isConfirmOpen}
        title="Исправить доступные проблемы?"
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          onApplyFixes();
        }}
      />
    </>
  );
}
