"use client";

import {
  Activity,
  Bot,
  Command,
  PackageOpen,
  Plug,
  ShieldCheck,
  Workflow,
} from "lucide-react";
import { useMemo, useState } from "react";

import type { Board } from "@/entities/board";
import type { Note } from "@/features/manage-notes";
import { buildWorkspacePreflightReport } from "@/features/workspace-preflight";
import type {
  BoardMarketplaceTemplateId,
  BoardWorkflowTemplateId,
  NoteTemplateId,
} from "@/features/workspace-templates";
import type { WorkspaceHealthReport } from "@/features/workspace-health";
import { Modal, ToolSurfaceHeader } from "@/shared/ui";
import type { AgentRoleId } from "../model/workspaceCenterData";

import {
  ActivityTab,
  IntegrationsTab,
  MarketplaceTab,
  PreflightTab,
  RolesTab,
  WorkflowsTab,
} from "./WorkspaceCenterSections";
import {
  WorkspaceCenterTabs,
  type WorkspaceCenterTab,
  type WorkspaceCenterTabItem,
} from "./WorkspaceCenterTabs";

type WorkspaceCenterModalProps = Readonly<{
  activeBoard: Board;
  healthReport: WorkspaceHealthReport;
  initialTab?: WorkspaceCenterTab;
  isOpen: boolean;
  onApplyMarketplaceTemplate: (templateId: BoardMarketplaceTemplateId) => void;
  notes: readonly Note[];
  onApplyWorkflowTemplate: (templateId: BoardWorkflowTemplateId) => void;
  onClose: () => void;
  onCreateNoteTemplate: (templateId: NoteTemplateId) => void;
  onOpenHealthCheck: () => void;
  onOpenMyWork: () => void;
  onOpenNotes: () => void;
  onOpenTaskReview: () => void;
  onOpenWorkspaceData: () => void;
}>;

const tabs: readonly WorkspaceCenterTabItem[] = [
  { id: "workflows", icon: <Workflow aria-hidden="true" size={16} />, label: "Workflows" },
  { id: "preflight", icon: <ShieldCheck aria-hidden="true" size={16} />, label: "Preflight" },
  { id: "roles", icon: <Bot aria-hidden="true" size={16} />, label: "Роли" },
  { id: "integrations", icon: <Plug aria-hidden="true" size={16} />, label: "Интеграции" },
  { id: "activity", icon: <Activity aria-hidden="true" size={16} />, label: "Monitor" },
  { id: "marketplace", icon: <PackageOpen aria-hidden="true" size={16} />, label: "Templates" },
];

export function WorkspaceCenterModal({
  activeBoard,
  healthReport,
  initialTab = "workflows",
  isOpen,
  onApplyMarketplaceTemplate,
  notes,
  onApplyWorkflowTemplate,
  onClose,
  onCreateNoteTemplate,
  onOpenHealthCheck,
  onOpenMyWork,
  onOpenNotes,
  onOpenTaskReview,
  onOpenWorkspaceData,
}: WorkspaceCenterModalProps) {
  const [activeTab, setActiveTab] = useState<WorkspaceCenterTab>(initialTab);
  const preflightReport = useMemo(
    () =>
      buildWorkspacePreflightReport({
        activeBoard,
        healthReport,
        notes,
      }),
    [activeBoard, healthReport, notes],
  );
  const roleActions = useMemo(
    (): Readonly<Record<AgentRoleId, () => void>> => ({
      "data-reviewer": onOpenHealthCheck,
      "notes-editor": onOpenNotes,
      planner: onOpenMyWork,
      "risk-analyst": onOpenTaskReview,
    }),
    [onOpenHealthCheck, onOpenMyWork, onOpenNotes, onOpenTaskReview],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal title="Workspace Center" onClose={onClose} zIndexClassName="z-82">
      <div className="space-y-4">
        <section className="rounded-2xl border border-white/10 bg-control/20 p-3">
          <ToolSurfaceHeader
            description="Шаблоны, проверки, роли, интеграции и быстрые сценарии для текущего проекта."
            icon={<Command aria-hidden="true" size={20} />}
            title="Центр рабочих инструментов"
          />
        </section>

        <WorkspaceCenterTabs
          activeTab={activeTab}
          tabs={tabs}
          onSelect={setActiveTab}
        />

        {activeTab === "workflows" ? (
          <WorkflowsTab onApplyWorkflowTemplate={onApplyWorkflowTemplate} />
        ) : null}
        {activeTab === "preflight" ? (
          <PreflightTab
            preflightReport={preflightReport}
            onOpenHealthCheck={onOpenHealthCheck}
            onOpenWorkspaceData={onOpenWorkspaceData}
          />
        ) : null}
        {activeTab === "roles" ? <RolesTab roleActions={roleActions} /> : null}
        {activeTab === "integrations" ? <IntegrationsTab /> : null}
        {activeTab === "activity" ? (
          <ActivityTab activeBoard={activeBoard} notes={notes} />
        ) : null}
        {activeTab === "marketplace" ? (
          <MarketplaceTab
            activeBoard={activeBoard}
            onApplyMarketplaceTemplate={onApplyMarketplaceTemplate}
            onCreateNoteTemplate={onCreateNoteTemplate}
          />
        ) : null}
      </div>
    </Modal>
  );
}
