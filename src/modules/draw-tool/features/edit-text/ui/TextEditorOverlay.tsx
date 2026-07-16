import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  getTextSize,
  TEXT_ELEMENT_PADDING,
  updateElement,
} from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { expandFramesToFitChildren, sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { toolStore } from "@/modules/draw-tool/entities/tool";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import { editingLockStore } from "@/modules/draw-tool/features/lock-editing";
import { toolLockStore } from "@/modules/draw-tool/features/tool-lock";
import {
  cloneTextElement,
  getTextColor,
  isEditableLabelElement,
  isEditableTextElement,
  type EditableTextElement,
} from "../model/editableTextElements";
import { textEditorStore } from "../model/textEditorStore";
import { getTextEditorLayout } from "./textEditorLayout";

export function TextEditorOverlay() {
  const editorState = useSyncExternalStore(
    textEditorStore.subscribe,
    textEditorStore.get,
    textEditorStore.get,
  );
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const draftRef = useRef("");
  const originalLabelRef = useRef<string | undefined>(undefined);
  const originalElementRef = useRef<EditableTextElement | null>(null);
  const isFinishingRef = useRef(false);
  const [draft, setDraft] = useState("");

  const scene = useSyncExternalStore(
    sceneStore.subscribe,
    sceneStore.get,
    sceneStore.get,
  );
  const viewport = useSyncExternalStore(
    viewportStore.subscribe,
    viewportStore.get,
    viewportStore.get,
  );
  const element = editorState.elementId
    ? scene.elements.find((item) => item.id === editorState.elementId)
    : null;
  const editingText = isEditableTextElement(element) ? element : null;
  const editingLabel =
    editorState.mode === "label" && isEditableLabelElement(element)
      ? element
      : null;

  useEffect(() => {
    const elementId = editorState.elementId;
    const currentElement = elementId
      ? sceneStore.get().elements.find((item) => item.id === elementId)
      : null;
    if (editorState.mode === "label") {
      if (!isEditableLabelElement(currentElement)) return;

      isFinishingRef.current = false;
      originalElementRef.current = null;
      originalLabelRef.current = currentElement.label;
      draftRef.current = currentElement.label ?? "";
      selectionStore.clear();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(currentElement.label ?? "");

      const frame = requestAnimationFrame(() => {
        const textarea = textareaRef.current;
        textarea?.focus();
        textarea?.select();
      });
      return () => cancelAnimationFrame(frame);
    }

    if (!isEditableTextElement(currentElement)) return;

    isFinishingRef.current = false;
    originalElementRef.current = cloneTextElement(currentElement);
    originalLabelRef.current = undefined;
    draftRef.current = currentElement.text;
    selectionStore.clear();
    setDraft(currentElement.text);

    const frame = requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      textarea?.focus();
      textarea?.setSelectionRange(textarea.value.length, textarea.value.length);
    });
    return () => cancelAnimationFrame(frame);
  }, [editorState.elementId, editorState.mode]);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || editorState.mode !== "text") return;

    textarea.scrollLeft = 0;
    textarea.scrollTop = 0;
  }, [draft, editorState.mode]);

  const activeElement = editingText ?? editingLabel;
  if (!activeElement) return null;
  const activeElementId = activeElement.id;
  const activeElementStyle = activeElement.style;
  const isArrowLabelMode = editingLabel?.type === "arrow";
  const isLabelMode = Boolean(editingLabel);
  const layout = getTextEditorLayout({
    draft,
    editingLabel,
    editingText,
    viewport,
  });

  function updateDraft(nextDraft: string) {
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  }

  function growParentFramesIfNeeded() {
    const currentElements = sceneStore.get().elements;
    const nextElements = expandFramesToFitChildren(currentElements);
    if (nextElements !== currentElements) sceneStore.setElements(nextElements);
  }

  function restoreNextToolAfterEditing() {
    if (editingLockStore.get().isLocked) {
      selectionStore.clear();
      toolStore.set("pan");
      return;
    }
    if (!toolLockStore.get()) toolStore.set("selection");
  }

  function commit() {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    const currentElement = sceneStore
      .get()
      .elements.find((item) => item.id === activeElementId);
    if (isLabelMode) {
      if (!isEditableLabelElement(currentElement)) {
        historyStore.cancel();
        selectionStore.clear();
        textEditorStore.close();
        restoreNextToolAfterEditing();
        return;
      }

      sceneStore.updateById(currentElement.id, (item) =>
        isEditableLabelElement(item)
          ? updateElement(item, { label: draftRef.current.trim() || undefined })
          : item,
      );
      historyStore.commit();
      textEditorStore.close();
      selectionStore.setElementIds([currentElement.id]);
      restoreNextToolAfterEditing();
      return;
    }

    if (!isEditableTextElement(currentElement)) {
      historyStore.cancel();
      selectionStore.clear();
      textEditorStore.close();
      restoreNextToolAfterEditing();
      return;
    }

    const text = draftRef.current.replace(/\r\n/g, "\n");
    if (text.length === 0 && editorState.wasCreated) {
      sceneStore.removeById(currentElement.id);
      selectionStore.clear();
      historyStore.commit();
      textEditorStore.close();
      restoreNextToolAfterEditing();
      return;
    }

    const size = getTextSize(
      text || " ",
      currentElement.fontSize,
      currentElement.fontFamily,
    );
    sceneStore.updateById(currentElement.id, (item) => {
      if (!isEditableTextElement(item)) return item;
      const isCard = item.type === "sticky" || item.type === "callout";
      return updateElement(item, {
        text,
        width: isCard
          ? Math.max(item.width, size.width + TEXT_ELEMENT_PADDING * 2)
          : size.width,
        height: isCard
          ? Math.max(item.height, size.height + TEXT_ELEMENT_PADDING * 2)
          : size.height,
      });
    });
    growParentFramesIfNeeded();
    historyStore.commit();
    textEditorStore.close();
    selectionStore.setElementIds([currentElement.id]);
    restoreNextToolAfterEditing();
  }

  function cancel() {
    if (isFinishingRef.current) return;
    isFinishingRef.current = true;
    if (editorState.wasCreated) {
      sceneStore.removeById(activeElementId);
      selectionStore.clear();
    } else if (isLabelMode) {
      sceneStore.updateById(activeElementId, (item) =>
        isEditableLabelElement(item)
          ? updateElement(item, { label: originalLabelRef.current })
          : item,
      );
      selectionStore.setElementIds([activeElementId]);
    } else if (originalElementRef.current) {
      const originalElement = originalElementRef.current;
      sceneStore.updateById(activeElementId, () =>
        cloneTextElement(originalElement),
      );
      selectionStore.setElementIds([activeElementId]);
    }
    historyStore.cancel();
    textEditorStore.close();
    restoreNextToolAfterEditing();
  }

  return (
    <textarea
      ref={textareaRef}
      aria-label="Редактирование текста"
      className={`absolute z-30 resize-none overflow-hidden outline-none ${
        isLabelMode
          ? isArrowLabelMode
            ? "rounded-md border border-border bg-slate-950/90 px-2 py-1 shadow-panel"
            : "border-0 bg-transparent p-0"
          : "border-0 bg-transparent p-0"
      }`}
      onBlur={commit}
      onChange={(event) => updateDraft(event.currentTarget.value)}
      onKeyDown={(event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          commit();
          return;
        }
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          commit();
          return;
        }
        if (event.key === "Escape") {
          event.preventDefault();
          cancel();
        }
      }}
      spellCheck={false}
      wrap="off"
      style={{
        borderRadius: isLabelMode ? 4 : 0,
        boxSizing: "border-box",
        left: isLabelMode ? layout.labelScreenX : layout.textEditorLeft,
        top: isLabelMode ? layout.labelScreenY : layout.textEditorTop,
        width: isLabelMode ? layout.labelWidth : layout.textEditorWidth,
        height: isLabelMode ? layout.labelHeight : layout.textEditorHeight,
        padding: isLabelMode
          ? `${layout.labelVerticalPadding}px ${layout.labelHorizontalPadding}px`
          : `${layout.textVerticalPadding}px ${layout.textHorizontalPadding}px`,
        caretColor: isLabelMode
          ? activeElementStyle.strokeColor
          : getTextColor(activeElement as EditableTextElement),
        color: isLabelMode
          ? activeElementStyle.strokeColor
          : getTextColor(activeElement as EditableTextElement),
        fontFamily: layout.editorFontFamily,
        fontSize: layout.fontSize,
        lineHeight: `${layout.lineHeight}px`,
        opacity: activeElementStyle.opacity,
        textAlign: isLabelMode ? "center" : layout.textAlign,
        whiteSpace: "pre",
      }}
      value={draft}
    />
  );
}

