export {
  evaluateWorkspaceHealth,
  type WorkspaceHealthIssue,
  type WorkspaceHealthReport,
  type WorkspaceHealthScope,
  type WorkspaceHealthSeverity,
} from "./lib/workspaceHealth";
export {
  applyWorkspaceHealthFixes,
  getWorkspaceHealthFixPlan,
  type WorkspaceHealthFixPlan,
  type WorkspaceHealthFixResult,
  type WorkspaceHealthFixSummary,
} from "./lib/workspaceHealthFixes";
