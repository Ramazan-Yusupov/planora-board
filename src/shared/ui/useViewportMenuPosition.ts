"use client";

import {
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

type ViewportMenuAlign = "start" | "end";
type ViewportMenuPlacement = "auto" | "bottom";

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
  placement?: ViewportMenuPlacement;
  placementKey?: number | string;
  point?: ViewportMenuPoint;
  retryCount?: number;
  width: number;
}>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getMeasuredMenuHeight(
  menuRef: RefObject<HTMLElement | null>,
  fallbackHeight: number,
): number {
  const menuRect = menuRef.current?.getBoundingClientRect();

  return menuRect?.height ? Math.min(menuRect.height, fallbackHeight) : fallbackHeight;
}

export function useViewportMenuPosition({
  align = "start",
  anchorRef,
  gap = 4,
  margin = 8,
  maxHeight,
  menuRef,
  placement = "auto",
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
      const availableBelow = window.innerHeight - preferredTop - margin;
      const availableAbove = anchorRect.top - gap - margin;
      const measuredHeight = getMeasuredMenuHeight(menuRef, nextMaxHeight);
      const shouldOpenBelow =
        placement === "bottom" ||
        availableBelow >= measuredHeight ||
        availableBelow >= availableAbove;
      const preferredMaxHeight = Math.max(
        96,
        Math.min(maxHeight, shouldOpenBelow ? availableBelow : availableAbove),
      );
      const positionedHeight = Math.min(measuredHeight, preferredMaxHeight);
      const top =
        shouldOpenBelow
          ? preferredTop
          : Math.max(margin, anchorRect.top - positionedHeight - gap);
      const preferredLeft =
        align === "end" ? anchorRect.right - menuWidth : anchorRect.left;

      setStyle({
        left: clamp(preferredLeft, margin, window.innerWidth - menuWidth - margin),
        maxHeight: preferredMaxHeight,
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
    placement,
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
