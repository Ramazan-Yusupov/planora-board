import { useCallback, useEffect, useRef } from "react";
import type { RefObject } from "react";
import { imageFileStore } from "@/modules/draw-tool/entities/image-file";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import { viewportStore } from "@/modules/draw-tool/entities/viewport";
import {
  arrowBindingIndicatorStore,
  renderArrowBindingIndicator,
} from "@/modules/draw-tool/features/arrow-binding";
import { renderSnapIndicator, snapIndicatorStore } from "@/modules/draw-tool/features/draw-shape";
import { textEditorStore } from "@/modules/draw-tool/features/edit-text/model/textEditorStore";
import { renderLaserPointer, laserPointerStore } from "@/modules/draw-tool/features/laser-pointer";
import { renderLasso, lassoStore } from "@/modules/draw-tool/features/lasso-select";
import {
  alignmentGuidesStore,
  renderAlignmentGuides,
} from "@/modules/draw-tool/features/move-elements";
import { clearCanvas } from "@/modules/draw-tool/shared/lib/canvas/clearCanvas";
import { prepareCanvas } from "@/modules/draw-tool/shared/lib/canvas/prepareCanvas";
import type { CanvasSize } from "@/modules/draw-tool/shared/lib/canvas/resizeCanvas";
import { renderGrid } from "../lib/renderGrid";
import { renderScene } from "../lib/renderScene";
import { useCanvasSize } from "./useCanvasSize";

export function useBoardRenderer(
  canvasRef: RefObject<HTMLCanvasElement | null>,
) {
  const frameRef = useRef<number | null>(null);
  const sizeRef = useRef<CanvasSize | null>(null);

  const render = useCallback(() => {
    frameRef.current = null;

    const canvas = canvasRef.current;
    const size = sizeRef.current;

    if (!canvas || !size) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const viewport = viewportStore.get();

    clearCanvas(context);
    prepareCanvas(context, size.dpr);

    renderGrid({ context, viewport, size });
    renderScene({ context, viewport, size });
    renderArrowBindingIndicator(context);
    renderAlignmentGuides(context, viewport);
    renderLasso(context, viewport);
    renderLaserPointer(context, viewport);
    renderSnapIndicator(context, viewport);
  }, [canvasRef]);

  const scheduleRender = useCallback(() => {
    if (frameRef.current !== null) {
      return;
    }

    frameRef.current = requestAnimationFrame(render);
  }, [render]);

  useCanvasSize({
    canvasRef,
    onResize: (size) => {
      sizeRef.current = size;
      scheduleRender();
    },
  });

  useEffect(() => {
    const unsubscribeViewport = viewportStore.subscribe(scheduleRender);
    const unsubscribeScene = sceneStore.subscribe(scheduleRender);
    const unsubscribeImages = imageFileStore.subscribe(scheduleRender);
    const unsubscribeSelection =
      selectionStore.subscribeElementIds(scheduleRender);
    const unsubscribeTextEditor = textEditorStore.subscribe(scheduleRender);
    const unsubscribeSnapIndicator =
      snapIndicatorStore.subscribe(scheduleRender);
    const unsubscribeLaser = laserPointerStore.subscribe(scheduleRender);
    const unsubscribeLasso = lassoStore.subscribe(scheduleRender);
    const unsubscribeAlignmentGuides =
      alignmentGuidesStore.subscribe(scheduleRender);
    const unsubscribeArrowBinding =
      arrowBindingIndicatorStore.subscribe(scheduleRender);

    scheduleRender();

    return () => {
      unsubscribeViewport();
      unsubscribeScene();
      unsubscribeImages();
      unsubscribeSelection();
      unsubscribeTextEditor();
      unsubscribeSnapIndicator();
      unsubscribeLaser();
      unsubscribeLasso();
      unsubscribeAlignmentGuides();
      unsubscribeArrowBinding();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = null;
    };
  }, [scheduleRender]);
}

