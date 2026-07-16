import { deserializeScene } from "@/modules/draw-tool/entities/scene";
import {
  DRAWTOOL_WORKSPACE_FORMAT,
  DRAWTOOL_WORKSPACE_VERSION,
} from "@/modules/draw-tool/entities/workspace";
import type {
  DrawToolWorkspace,
  PersistedToolSettings,
  WorkspacePreferences,
  WorkspaceProject,
} from "@/modules/draw-tool/entities/workspace";
import type { ToolId } from "@/modules/draw-tool/entities/tool";
import { createToolSettings } from "@/modules/draw-tool/features/change-style/model/createToolSettings";
import { MAX_PROJECTS } from "@/modules/draw-tool/features/projects";
import { createId } from "@/modules/draw-tool/shared/lib";

const TOOL_IDS = new Set<ToolId>([
  "pan", "selection", "text", "freedraw", "highlighter", "eyedropper",
  "eraser", "laser", "lasso", "code", "image", "markdown", "advanced", "rectangle", "ellipse", "diamond",
  "triangle", "hexagon", "badge", "star", "cloud", "line", "arrow", "measure", "sticky",
  "callout", "table", "frame", "embed",
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseViewport(value: unknown) {
  if (!isObject(value)) return { x: 0, y: 0, zoom: 1 };
  const x = typeof value.x === "number" && Number.isFinite(value.x) ? value.x : 0;
  const y = typeof value.y === "number" && Number.isFinite(value.y) ? value.y : 0;
  const zoom = typeof value.zoom === "number" && Number.isFinite(value.zoom) && value.zoom > 0 ? value.zoom : 1;
  return { x, y, zoom };
}

function parseSettings(value: unknown): PersistedToolSettings | null {
  if (!isObject(value) || !isObject(value.style)) return null;
  const fallback = createToolSettings();
  const style = value.style;
  const strokeWidth = typeof style.strokeWidth === "number" ? style.strokeWidth : fallback.style.strokeWidth;
  const opacity = typeof style.opacity === "number" ? style.opacity : fallback.style.opacity;
  const arrowRouting = value.arrowRouting === "straight" || value.arrowRouting === "curve" || value.arrowRouting === "elbow" ? value.arrowRouting : fallback.arrowRouting;
  const textAlign = value.textAlign === "center" || value.textAlign === "right" || value.textAlign === "left" ? value.textAlign : fallback.textAlign;

  return {
    style: {
      strokeColor: typeof style.strokeColor === "string" ? style.strokeColor : fallback.style.strokeColor,
      backgroundColor: typeof style.backgroundColor === "string" ? style.backgroundColor : fallback.style.backgroundColor,
      strokeWidth,
      strokeStyle: style.strokeStyle === "dashed" || style.strokeStyle === "dotted" || style.strokeStyle === "solid" ? style.strokeStyle : fallback.style.strokeStyle,
      fillStyle: style.fillStyle === "solid" || style.fillStyle === "transparent" ? style.fillStyle : fallback.style.fillStyle,
      cornerStyle: style.cornerStyle === "sharp" || style.cornerStyle === "rounded" ? style.cornerStyle : fallback.style.cornerStyle,
      opacity,
    },
    snapToGrid: Boolean(value.snapToGrid),
    snapSize: typeof value.snapSize === "number" && Number.isFinite(value.snapSize) ? value.snapSize : fallback.snapSize,
    arrowRouting,
    fontSize: typeof value.fontSize === "number" && Number.isFinite(value.fontSize) ? value.fontSize : fallback.fontSize,
    fontFamily: typeof value.fontFamily === "string" ? value.fontFamily : fallback.fontFamily,
    textAlign,
  };
}

function parsePreferences(value: unknown): WorkspacePreferences {
  const fallback: WorkspacePreferences = {
    activeTool: "selection",
    toolSettingsByTool: {},
  };
  if (!isObject(value)) return fallback;

  const rawSettings = isObject(value.toolSettingsByTool) ? value.toolSettingsByTool : {};
  const settingsByTool = Object.fromEntries(
    Object.entries(rawSettings)
      .filter(([toolId]) => TOOL_IDS.has(toolId as ToolId))
      .flatMap(([toolId, settings]) => {
        const parsed = parseSettings(settings);
        return parsed ? [[toolId, parsed]] : [];
      }),
  ) as WorkspacePreferences["toolSettingsByTool"];

  return {
    activeTool: typeof value.activeTool === "string" && TOOL_IDS.has(value.activeTool as ToolId)
      ? value.activeTool as ToolId
      : fallback.activeTool,
    toolSettingsByTool: settingsByTool,
  };
}

function parseProject(value: unknown): WorkspaceProject {
  if (!isObject(value) || typeof value.id !== "string" || typeof value.name !== "string" || !Array.isArray(value.elements)) {
    throw new Error("В резервной копии найден повреждённый проект.");
  }

  const elements = deserializeScene(JSON.stringify({
    format: "drawtool-scene",
    version: 1,
    savedAt: new Date().toISOString(),
    elements: value.elements,
  }));

  return {
    id: value.id,
    name: value.name.trim() || "Импортированный проект",
    createdAt: typeof value.createdAt === "number" ? value.createdAt : Date.now(),
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : Date.now(),
    elements,
    viewport: parseViewport(value.viewport),
  };
}

export function parseWorkspaceSource(source: string): DrawToolWorkspace {
  let raw: unknown;
  try {
    raw = JSON.parse(source);
  } catch {
    throw new Error("Файл не содержит корректный JSON.");
  }

  if (!isObject(raw) || raw.format !== DRAWTOOL_WORKSPACE_FORMAT || raw.version !== DRAWTOOL_WORKSPACE_VERSION || !Array.isArray(raw.projects)) {
    throw new Error("Файл не похож на резервную копию DrawTool.");
  }

  if (raw.projects.length === 0 || raw.projects.length > MAX_PROJECTS) {
    throw new Error(`В резервной копии должно быть от 1 до ${MAX_PROJECTS} проектов.`);
  }

  const projects = raw.projects.map(parseProject);
  const ids = new Set(projects.map((project) => project.id));
  if (ids.size !== projects.length) {
    throw new Error("В резервной копии есть проекты с одинаковым ID.");
  }

  const activeProjectId = typeof raw.activeProjectId === "string" && ids.has(raw.activeProjectId)
    ? raw.activeProjectId
    : projects[0]?.id ?? null;

  return {
    format: DRAWTOOL_WORKSPACE_FORMAT,
    version: DRAWTOOL_WORKSPACE_VERSION,
    workspaceId: typeof raw.workspaceId === "string" && raw.workspaceId ? raw.workspaceId : createId("workspace"),
    revision: typeof raw.revision === "number" && Number.isInteger(raw.revision) && raw.revision >= 0 ? raw.revision : 0,
    savedAt: typeof raw.savedAt === "string" ? raw.savedAt : new Date().toISOString(),
    activeProjectId,
    projects,
    preferences: parsePreferences(raw.preferences),
  };
}

export async function parseWorkspaceFile(file: File) {
  if (!file.name.toLowerCase().endsWith(".json") && file.type !== "application/json") {
    throw new Error("Выберите JSON-файл резервной копии DrawTool.");
  }
  return parseWorkspaceSource(await file.text());
}

