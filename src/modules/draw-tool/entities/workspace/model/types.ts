import type { ArrowRouting, BoardElement, ElementStyle, TextAlign } from "@/modules/draw-tool/entities/element";
import type { ToolId } from "@/modules/draw-tool/entities/tool";
import type { Viewport } from "@/modules/draw-tool/entities/viewport";

export const DRAWTOOL_WORKSPACE_FORMAT = "drawtool-workspace" as const;
export const DRAWTOOL_WORKSPACE_VERSION = 1 as const;

export type PersistedToolSettings = {
  style: ElementStyle;
  snapToGrid: boolean;
  snapSize: number;
  arrowRouting: ArrowRouting;
  fontSize: number;
  fontFamily: string;
  textAlign: TextAlign;
};

export type WorkspaceProject = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  elements: BoardElement[];
  viewport: Viewport;
};

export type WorkspacePreferences = {
  activeTool: ToolId;
  toolSettingsByTool: Partial<Record<ToolId, PersistedToolSettings>>;
};

export type DrawToolWorkspace = {
  format: typeof DRAWTOOL_WORKSPACE_FORMAT;
  version: typeof DRAWTOOL_WORKSPACE_VERSION;
  workspaceId: string;
  revision: number;
  savedAt: string;
  activeProjectId: string | null;
  projects: WorkspaceProject[];
  preferences: WorkspacePreferences;
};

