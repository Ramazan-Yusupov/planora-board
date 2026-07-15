"use client";

import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

type ViewportMenuAlign = "start" | "end";

type ViewportMenuPoint = Readonly<{
  x: number;
  y: number;
}>;

type UseViewportMenuPositionOptions = Readonly<{
  align?: ViewportMenuAlign;
  anchorRef?: RefObject<HTMLElement | null>;
  gap?: number;
  margin?: number;
  maxHeight: number;
  menuRef: RefObject<HTMLElement | null>;
  placementKey?: number | string;
  point?: ViewportMenuPoint;
  retryCount?: number;
  width: number;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function useViewportMenuPosition({
  align = "start",
  anchorRef,
  gap = 4,
  margin = 8,
  maxHeight,
  menuRef,
  placementKey = 0,
  point,
  retryCount = 8,
  width,
}: UseViewportMenuPositionOptions): {
  isPositioned: boolean;
  style: CSSProperties;
} {
  const [isPositioned, setIsPositioned] = useState(false);
  const [style, setStyle] = useState<CSSProperties>({
    left: margin,
    maxHeight,
    top: margin,
    width,
  });

  useLayoutEffect(() => {
    let animationFrameId: number | null = null;
    let attempts = 0;

    const updatePosition = () => {
      animationFrameId = null;

      const menuWidth = Math.min(width, window.innerWidth - margin * 2);
      const nextMaxHeight = Math.min(maxHeight, window.innerHeight - margin * 2);

      if (point) {
        const menuRect = menuRef.current?.getBoundingClientRect();
        const measuredHeight = menuRect?.height
          ? Math.min(menuRect.height, nextMaxHeight)
          : nextMaxHeight;

        setStyle({
          left: clamp(point.x, margin, window.innerWidth - menuWidth - margin),
          maxHeight: nextMaxHeight,
          top: clamp(
            point.y,
            margin,
            window.innerHeight - measuredHeight - margin,
          ),
          width: menuWidth,
        });
        setIsPositioned(true);
        return;
      }

      const anchor = anchorRef?.current;

      if (!anchor) {
        setIsPositioned(false);

        if (attempts < retryCount) {
          attempts += 1;
          animationFrameId = window.requestAnimationFrame(updatePosition);
        }

        return;
      }

      attempts = 0;
      const anchorRect = anchor.getBoundingClientRect();
      const preferredTop = anchorRect.bottom + gap;
      const top =
        preferredTop + nextMaxHeight <= window.innerHeight - margin
          ? preferredTop
          : Math.max(margin, anchorRect.top - nextMaxHeight - gap);
      const preferredLeft =
        align === "end" ? anchorRect.right - menuWidth : anchorRect.left;

      setStyle({
        left: clamp(preferredLeft, margin, window.innerWidth - menuWidth - margin),
        maxHeight: nextMaxHeight,
        top,
        width: menuWidth,
      });
      setIsPositioned(true);
    };

    const schedulePositionUpdate = () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = window.requestAnimationFrame(updatePosition);
    };

    window.addEventListener("resize", schedulePositionUpdate);
    window.addEventListener("scroll", schedulePositionUpdate, true);
    schedulePositionUpdate();

    return () => {
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }

      window.removeEventListener("resize", schedulePositionUpdate);
      window.removeEventListener("scroll", schedulePositionUpdate, true);
    };
  }, [
    align,
    anchorRef,
    gap,
    margin,
    maxHeight,
    menuRef,
    placementKey,
    point,
    retryCount,
    width,
  ]);

  return {
    isPositioned,
    style: {
      ...style,
      opacity: isPositioned ? 1 : 0,
      pointerEvents: isPositioned ? undefined : "none",
      position: "fixed",
    },
  };
}
