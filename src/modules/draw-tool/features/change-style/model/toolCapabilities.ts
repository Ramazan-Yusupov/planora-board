import type { ToolId } from "@/modules/draw-tool/entities/tool";

export type ToolStyleCapabilities = {
  stroke: boolean;
  strokeControls?: boolean;
  strokeWidthControls?: boolean;
  strokeStyleControls?: boolean;
  strokeLabel?: string;
  strokeColorLabel?: string;
  fill: boolean;
  corner: boolean;
  opacity: boolean;
  snap: boolean;
  text: boolean;
  textAlign?: boolean;
  arrowRouting: boolean;
};

const SHAPE_CAPABILITIES: ToolStyleCapabilities = {
  stroke: true,
  fill: true,
  corner: false,
  opacity: true,
  snap: true,
  text: false,
  arrowRouting: false,
};

export const TOOL_SETTINGS_CAPABILITIES: Record<ToolId, ToolStyleCapabilities> = {
  pan: {
    stroke: false,
    fill: false,
    corner: false,
    opacity: false,
    snap: false,
    text: false,
    arrowRouting: false,
  },
  selection: {
    stroke: false,
    fill: false,
    corner: false,
    opacity: false,
    snap: false,
    text: false,
    arrowRouting: false,
  },
  rectangle: { ...SHAPE_CAPABILITIES, corner: true },
  ellipse: { ...SHAPE_CAPABILITIES },
  diamond: { ...SHAPE_CAPABILITIES },
  triangle: { ...SHAPE_CAPABILITIES },
  hexagon: { ...SHAPE_CAPABILITIES },
  badge: { ...SHAPE_CAPABILITIES, corner: false },
  star: { ...SHAPE_CAPABILITIES },
  cloud: { ...SHAPE_CAPABILITIES },
  frame: { ...SHAPE_CAPABILITIES, fill: false, corner: false },
  embed: { ...SHAPE_CAPABILITIES, corner: true },
  markdown: { ...SHAPE_CAPABILITIES, corner: true, snap: true },
  line: {
    ...SHAPE_CAPABILITIES,
    fill: false,
  },
  arrow: {
    ...SHAPE_CAPABILITIES,
    fill: false,
    arrowRouting: true,
  },
  freedraw: {
    ...SHAPE_CAPABILITIES,
    fill: false,
  },
  highlighter: {
    ...SHAPE_CAPABILITIES,
    fill: false,
    corner: false,
    strokeLabel: "Маркер",
    strokeColorLabel: "Цвет маркера",
    strokeStyleControls: false,
  },
  sticky: { ...SHAPE_CAPABILITIES, corner: true, snap: true, text: true, textAlign: false },
  callout: { ...SHAPE_CAPABILITIES, corner: true, snap: true, text: true, textAlign: false },
  table: { ...SHAPE_CAPABILITIES, corner: true, snap: true },
  measure: {
    ...SHAPE_CAPABILITIES,
    fill: false,
    corner: false,
    strokeLabel: "Линейка",
    strokeColorLabel: "Цвет линейки",
    strokeStyleControls: false,
  },
  eyedropper: {
    stroke: false, fill: false, corner: false, opacity: false, snap: false, text: false, arrowRouting: false,
  },
  laser: {
    stroke: false,
    fill: false,
    corner: false,
    opacity: false,
    snap: false,
    text: false,
    arrowRouting: false,
  },
  advanced: { ...SHAPE_CAPABILITIES, corner: true, snap: true },
  code: { ...SHAPE_CAPABILITIES, corner: true, snap: false },
  image: {
    stroke: false,
    fill: true,
    corner: false,
    opacity: true,
    snap: false,
    text: false,
    arrowRouting: false,
  },
  lasso: {
    stroke: false,
    fill: false,
    corner: false,
    opacity: false,
    snap: false,
    text: false,
    arrowRouting: false,
  },
  eraser: {
    stroke: false,
    fill: false,
    corner: false,
    opacity: false,
    snap: false,
    text: false,
    arrowRouting: false,
  },
  text: {
    stroke: true,
    strokeControls: false,
    strokeLabel: "Цвет текста",
    strokeColorLabel: "Цвет текста",
    fill: false,
    corner: false,
    opacity: true,
    snap: true,
    text: true,
    textAlign: true,
    arrowRouting: false,
  },
};

