import {
  getElementCenter,
  getTextContentSize,
  TEXT_ELEMENT_PADDING,
  TEXT_LINE_HEIGHT_RATIO,
} from "@/modules/draw-tool/entities/element";
import type { EditableLabelElement, EditableTextElement } from "../model/editableTextElements";

const TEXT_EDITOR_SIDE_PADDING_RATIO = 1;
const TEXT_EDITOR_MIN_SIDE_PADDING = 12;
const TEXT_EDITOR_TYPING_RESERVE_CHARS = 0;

type ViewportState = {
  x: number;
  y: number;
  zoom: number;
};

type TextEditorLayoutParams = {
  draft: string;
  editingLabel: EditableLabelElement | null;
  editingText: EditableTextElement | null;
  viewport: ViewportState;
};

function getTextEditorHorizontalPadding(fontSize: number, zoom: number) {
  return (
    Math.max(
      TEXT_EDITOR_MIN_SIDE_PADDING,
      fontSize * TEXT_EDITOR_SIDE_PADDING_RATIO,
    ) * zoom
  );
}

function getTextEditorTypingReserve(fontSize: number, zoom: number) {
  return fontSize * TEXT_EDITOR_TYPING_RESERVE_CHARS * 0.62 * zoom;
}

function getTextEditorLeft({
  align,
  contentLeft,
  contentRight,
  editorWidth,
  padding,
}: {
  align: CanvasTextAlign;
  contentLeft: number;
  contentRight: number;
  editorWidth: number;
  padding: number;
}) {
  if (align === "center") {
    return (contentLeft + contentRight) / 2 - editorWidth / 2;
  }

  if (align === "right") {
    return contentRight - editorWidth + padding;
  }

  return contentLeft - padding;
}

export function getTextEditorLayout({
  draft,
  editingLabel,
  editingText,
  viewport,
}: TextEditorLayoutParams) {
  const isLabelMode = Boolean(editingLabel);
  const labelCenter = editingLabel ? getElementCenter(editingLabel) : null;
  const editorFontSize = isLabelMode ? 15 : (editingText?.fontSize ?? 15);
  const editorFontFamily = isLabelMode
    ? "Inter, ui-sans-serif, system-ui, sans-serif"
    : (editingText?.fontFamily ??
      "Inter, ui-sans-serif, system-ui, sans-serif");
  const contentSize = getTextContentSize(
    draft || " ",
    editorFontSize,
    editorFontFamily,
  );
  const fontSize = editorFontSize * viewport.zoom;
  const lineHeight =
    Math.ceil(editorFontSize * TEXT_LINE_HEIGHT_RATIO) * viewport.zoom;
  const textAlign = editingText?.type === "text" ? editingText.textAlign : "left";
  const textHorizontalPadding = getTextEditorHorizontalPadding(
    editorFontSize,
    viewport.zoom,
  );
  const textVerticalPadding =
    Math.max(4, editorFontSize * 0.25) * viewport.zoom;
  const textContentWidth = contentSize.width * viewport.zoom;
  const textContentHeight = contentSize.height * viewport.zoom;
  const textTypingReserve = isLabelMode
    ? 0
    : getTextEditorTypingReserve(editorFontSize, viewport.zoom);
  const textEditorWidth = Math.max(
    textContentWidth + textHorizontalPadding * 2 + textTypingReserve,
    28 * viewport.zoom,
  );
  const textEditorHeight = Math.max(
    textContentHeight + textVerticalPadding * 2,
    lineHeight + textVerticalPadding * 2,
  );
  const textContentLeft = editingText
    ? (editingText.x + TEXT_ELEMENT_PADDING - viewport.x) * viewport.zoom
    : 0;
  const textContentRight = editingText
    ? (editingText.x + editingText.width - TEXT_ELEMENT_PADDING - viewport.x) *
      viewport.zoom
    : 0;
  const textContentTop = editingText
    ? (editingText.y +
        (editingText.height - contentSize.height) / 2 -
        viewport.y) *
      viewport.zoom
    : 0;
  const textEditorLeft = editingText
    ? getTextEditorLeft({
        align: textAlign,
        contentLeft: textContentLeft,
        contentRight: textContentRight,
        editorWidth: textEditorWidth,
        padding: textHorizontalPadding,
      })
    : 0;
  const textEditorTop = textContentTop - textVerticalPadding;
  const labelWidth = Math.max(contentSize.width * viewport.zoom + 24, 84);
  const labelHeight = Math.max(contentSize.height * viewport.zoom + 12, 30);
  const labelHorizontalPadding = 12;
  const labelVerticalPadding = Math.max(0, (labelHeight - lineHeight) / 2);
  const labelScreenX = labelCenter
    ? (labelCenter.x - viewport.x) * viewport.zoom - labelWidth / 2
    : 0;
  const labelScreenY = labelCenter
    ? (labelCenter.y - viewport.y) * viewport.zoom - labelHeight / 2
    : 0;

  return {
    editorFontFamily,
    fontSize,
    labelHeight,
    labelHorizontalPadding,
    labelScreenX,
    labelScreenY,
    labelVerticalPadding,
    labelWidth,
    lineHeight,
    textAlign,
    textEditorHeight,
    textEditorLeft,
    textEditorTop,
    textEditorWidth,
    textHorizontalPadding,
    textVerticalPadding,
  };
}

