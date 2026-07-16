import {
  getElementBounds,
  renderElement,
} from "@/modules/draw-tool/entities/element";
import type { BoardElement, FrameElement } from "@/modules/draw-tool/entities/element";
import { getFrameContentBounds, getVisibleSceneElements } from "@/modules/draw-tool/entities/scene";
import { getVisibleBounds } from "@/modules/draw-tool/entities/viewport";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { textEditorStore } from "@/modules/draw-tool/features/edit-text/model/textEditorStore";
import { renderSelection } from "./renderSelection";
import type { Viewport } from "@/modules/draw-tool/entities/viewport";
import type { CanvasSize } from "@/modules/draw-tool/shared/lib/canvas/resizeCanvas";

type RenderSceneParams = {
  context: CanvasRenderingContext2D;
  viewport: Viewport;
  size: CanvasSize;
};

function isVisible(
  elementBounds: ReturnType<typeof getElementBounds>,
  visibleBounds: ReturnType<typeof getVisibleBounds>,
) {
  return !(
    elementBounds.x > visibleBounds.x + visibleBounds.width ||
    elementBounds.x + elementBounds.width < visibleBounds.x ||
    elementBounds.y > visibleBounds.y + visibleBounds.height ||
    elementBounds.y + elementBounds.height < visibleBounds.y
  );
}

function renderElementWithEditorState(
  context: CanvasRenderingContext2D,
  element: BoardElement,
  editingLabelId: string | null,
) {
  if (element.id !== editingLabelId) {
    renderElement(context, element);
    return;
  }

  renderElement(context, {
    ...element,
    style: {
      ...element.style,
      opacity: element.style.opacity * 0.5,
    },
  }, { hideLabel: true });
}

/**
 * Frames are containers. Their direct descendants are clipped to the inner
 * rectangle, so moving/resizing a Frame cannot reveal content outside it.
 */
function renderFrameChildren(
  context: CanvasRenderingContext2D,
  frame: FrameElement,
  childrenByParentId: Map<string, BoardElement[]>,
  visibleBounds: ReturnType<typeof getVisibleBounds>,
  renderTextPass: boolean,
  editingTextId: string | null,
  editingLabelId: string | null,
) {
  const children = childrenByParentId.get(frame.id) ?? [];
  const content = getFrameContentBounds(frame);

  context.save();
  // Axis-aligned clipping remains intentionally predictable while Frame
  // rotation is edited. Rotated Frame rendering still works; the clip simply
  // follows the unrotated logical content box for now.
  context.beginPath();
  context.rect(content.x, content.y, content.width, content.height);
  context.clip();

  children.forEach((child) => {
    if (child.id === editingTextId) return;
    if (!isVisible(getElementBounds(child), visibleBounds)) return;

    if (child.type === "frame") {
      if (!renderTextPass) {
        renderElementWithEditorState(context, child, editingLabelId);
        renderFrameChildren(
          context,
          child,
          childrenByParentId,
          visibleBounds,
          renderTextPass,
          editingTextId,
          editingLabelId,
        );
      } else {
        renderFrameChildren(
          context,
          child,
          childrenByParentId,
          visibleBounds,
          renderTextPass,
          editingTextId,
          editingLabelId,
        );
      }
      return;
    }

    if ((child.type === "text") === renderTextPass) {
      renderElementWithEditorState(context, child, editingLabelId);
    }
  });

  context.restore();
}

export function renderScene({ context, viewport, size }: RenderSceneParams) {
  const visibleBounds = getVisibleBounds(viewport, size);
  const scene = sceneStore.get();
  const elements = getVisibleSceneElements(scene);
  const editorState = textEditorStore.get();
  const editingTextId = editorState.mode === "text" ? editorState.elementId : null;
  const editingLabelId = editorState.mode === "label" ? editorState.elementId : null;
  const ids = new Set(elements.map((element) => element.id));
  const childrenByParentId = new Map<string, BoardElement[]>();

  elements.forEach((element) => {
    if (element.parentId && ids.has(element.parentId)) {
      const children = childrenByParentId.get(element.parentId) ?? [];
      children.push(element);
      childrenByParentId.set(element.parentId, children);
    }
  });

  const rootElements = elements.filter(
    (element) => !element.parentId || !ids.has(element.parentId),
  );

  context.save();
  context.translate(-viewport.x * viewport.zoom, -viewport.y * viewport.zoom);
  context.scale(viewport.zoom, viewport.zoom);

  // First pass: all shapes and frame containers.
  rootElements.forEach((element) => {
    if (!isVisible(getElementBounds(element), visibleBounds)) return;
    if (element.id === editingTextId) return;
    if (element.type === "text") return;

    renderElementWithEditorState(context, element, editingLabelId);

    if (element.type === "frame") {
      renderFrameChildren(
        context,
        element,
        childrenByParentId,
        visibleBounds,
        false,
        editingTextId,
        editingLabelId,
      );
    }
  });

  // Second pass: text stays above every regular shape, including Frame content.
  rootElements.forEach((element) => {
    if (!isVisible(getElementBounds(element), visibleBounds)) return;

    if (element.type === "text") {
      if (element.id !== editingTextId) {
        renderElementWithEditorState(context, element, editingLabelId);
      }
      return;
    }

    if (element.type === "frame") {
      renderFrameChildren(
        context,
        element,
        childrenByParentId,
        visibleBounds,
        true,
        editingTextId,
        editingLabelId,
      );
    }
  });

  context.restore();
  renderSelection(context, viewport);
}

