import type { ArrowRouting, ElementStyle } from "@/modules/draw-tool/entities/element";
import type { ToolId } from "@/modules/draw-tool/entities/tool";
import { CANVAS_CONFIG } from "@/modules/draw-tool/shared/config";
import { clamp } from "@/modules/draw-tool/shared/lib";
import { createToolSettings } from "./createToolSettings";
import type { ToolSettings } from "./types";

type SettingsListener = () => void;

const defaultSettings = createToolSettings();
let settingsByTool: Partial<Record<ToolId, ToolSettings>> = {};
const listeners = new Set<SettingsListener>();

function cloneSettings(settings: ToolSettings): ToolSettings {
  return { ...settings, style: { ...settings.style } };
}

function cloneAllSettings() {
  return Object.fromEntries(
    Object.entries(settingsByTool).map(([toolId, settings]) => [
      toolId,
      cloneSettings(settings),
    ]),
  ) as Partial<Record<ToolId, ToolSettings>>;
}

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function getSettings(toolId: ToolId) {
  return settingsByTool[toolId] ?? defaultSettings;
}

function updateSettings(
  toolId: ToolId,
  updater: (settings: ToolSettings) => ToolSettings,
) {
  settingsByTool = {
    ...settingsByTool,
    [toolId]: updater(getSettings(toolId)),
  };

  notifyListeners();
}

function normalizeSnapSize(value: number) {
  return clamp(
    Math.round(value),
    CANVAS_CONFIG.minSnapSize,
    CANVAS_CONFIG.maxSnapSize,
  );
}

export const toolSettingsStore = {
  get(toolId: ToolId) {
    return getSettings(toolId);
  },

  getAll() {
    return cloneAllSettings();
  },

  replaceAll(nextSettings: Partial<Record<ToolId, ToolSettings>>) {
    settingsByTool = Object.fromEntries(
      Object.entries(nextSettings).map(([toolId, settings]) => [
        toolId,
        cloneSettings(settings),
      ]),
    ) as Partial<Record<ToolId, ToolSettings>>;
    notifyListeners();
  },

  patchStyle(toolId: ToolId, patch: Partial<ElementStyle>) {
    updateSettings(toolId, (settings) => ({
      ...settings,
      style: { ...settings.style, ...patch },
    }));
  },

  setSnapToGrid(toolId: ToolId, snapToGrid: boolean) {
    updateSettings(toolId, (settings) => ({ ...settings, snapToGrid }));
  },

  setSnapSize(toolId: ToolId, snapSize: number) {
    updateSettings(toolId, (settings) => ({
      ...settings,
      snapSize: normalizeSnapSize(snapSize),
    }));
  },

  setArrowRouting(toolId: ToolId, arrowRouting: ArrowRouting) {
    updateSettings(toolId, (settings) => ({ ...settings, arrowRouting }));
  },

  setTextOptions(
    toolId: ToolId,
    patch: Pick<ToolSettings, "fontSize" | "fontFamily" | "textAlign">,
  ) {
    updateSettings(toolId, (settings) => ({ ...settings, ...patch }));
  },

  reset(toolId: ToolId) {
    updateSettings(toolId, () => createToolSettings());
  },

  subscribe(listener: SettingsListener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

