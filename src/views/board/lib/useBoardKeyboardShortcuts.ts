"use client";

import { useEffect, type RefObject } from "react";

type UseBoardKeyboardShortcutsOptions = Readonly<{
  searchInputRef: RefObject<HTMLInputElement | null>;
  onOpenCommandPalette: () => void;
  onOpenProjects: () => void;
  onOpenQuickCreateCard: () => void;
  onOpenQuickCreateList: () => void;
  onRedo: () => void;
  onUndo: () => void;
}>;

function isTextEditingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  );
}

export function useBoardKeyboardShortcuts({
  searchInputRef,
  onOpenCommandPalette,
  onOpenProjects,
  onOpenQuickCreateCard,
  onOpenQuickCreateList,
  onRedo,
  onUndo,
}: UseBoardKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTextEditingTarget(event.target)) {
        return;
      }

      const key = event.key.toLocaleLowerCase();

      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        onOpenCommandPalette();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && key === "z") {
        event.preventDefault();
        if (event.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        return;
      }

      if (
        event.key === "/" &&
        !event.altKey &&
        !event.metaKey &&
        !event.ctrlKey
      ) {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (key === "b" && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        onOpenProjects();
        return;
      }

      if (key === "n" && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        onOpenQuickCreateCard();
        return;
      }

      if (key === "l" && !event.altKey && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        onOpenQuickCreateList();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onOpenCommandPalette,
    onOpenProjects,
    onOpenQuickCreateCard,
    onOpenQuickCreateList,
    onRedo,
    onUndo,
    searchInputRef,
  ]);
}
