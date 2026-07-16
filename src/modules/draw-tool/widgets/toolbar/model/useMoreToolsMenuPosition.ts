import { useLayoutEffect, useState } from "react";
import type { RefObject } from "react";

export type MenuPosition = {
  bottom?: number;
  left: number;
  maxHeight: number;
  top?: number;
  width: number;
};

const TOOLBAR_BOTTOM_BREAKPOINT = 1100;
const VIEWPORT_GUTTER = 8;
const MENU_GAP = 8;
const DESKTOP_MENU_WIDTH = 288;
const MOBILE_MENU_WIDTH = 320;

export function useMoreToolsMenuPosition(
  isOpen: boolean,
  buttonRef: RefObject<HTMLButtonElement | null>,
) {
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    function updateMenuPosition() {
      const button = buttonRef.current;

      if (!button) {
        return;
      }

      const rect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const isBottomToolbar = viewportWidth <= TOOLBAR_BOTTOM_BREAKPOINT;
      const width = Math.min(
        isBottomToolbar ? MOBILE_MENU_WIDTH : DESKTOP_MENU_WIDTH,
        viewportWidth - VIEWPORT_GUTTER * 2,
      );
      const left = Math.max(
        VIEWPORT_GUTTER,
        Math.min(rect.right - width, viewportWidth - width - VIEWPORT_GUTTER),
      );

      if (isBottomToolbar) {
        setMenuPosition({
          bottom: Math.max(
            VIEWPORT_GUTTER,
            viewportHeight - rect.top + MENU_GAP,
          ),
          left,
          maxHeight: Math.max(160, rect.top - VIEWPORT_GUTTER * 2),
          width,
        });
        return;
      }

      setMenuPosition({
        left,
        maxHeight: Math.max(
          180,
          viewportHeight - rect.bottom - VIEWPORT_GUTTER * 2,
        ),
        top: rect.bottom + MENU_GAP,
        width,
      });
    }

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [buttonRef, isOpen]);

  return menuPosition;
}

