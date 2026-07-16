"use client";

import { Search } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib";
import { Modal, TextField, useKeyboardListNavigation } from "@/shared/ui";

export type CommandPaletteAction = Readonly<{
  id: string;
  label: string;
  description: string;
  group?: string;
  shortcut?: string;
  keywords?: string;
  icon: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
}>;

type CommandPaletteProps = Readonly<{
  actions: readonly CommandPaletteAction[];
  isOpen: boolean;
  onClose: () => void;
}>;

export function CommandPalette({ actions, isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const visibleActions = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");

    if (!normalizedQuery) {
      return actions;
    }

    return actions.filter((action) =>
      `${action.label} ${action.description} ${action.keywords ?? ""}`
        .toLocaleLowerCase("ru-RU")
        .includes(normalizedQuery),
    );
  }, [actions, query]);
  const visibleGroups = useMemo(() => {
    const groups = new Map<
      string,
      Array<Readonly<{ action: CommandPaletteAction; index: number }>>
    >();

    visibleActions.forEach((action, index) => {
      const group = action.group ?? "Команды";
      groups.set(group, [...(groups.get(group) ?? []), { action, index }]);
    });

    return [...groups.entries()];
  }, [visibleActions]);

  const closePalette = useCallback(() => {
    setQuery("");
    onClose();
  }, [onClose]);
  const selectAction = useCallback(
    (index: number) => {
      const action = visibleActions[index];

      if (!action || action.disabled) {
        return;
      }

      action.onSelect();
      closePalette();
    },
    [closePalette, visibleActions],
  );
  const isActionDisabled = useCallback(
    (index: number) => Boolean(visibleActions[index]?.disabled),
    [visibleActions],
  );
  const {
    activeIndex,
    activeItemId,
    getItemProps,
    handleKeyDown: handleActionKeyDown,
  } = useKeyboardListNavigation({
    count: visibleActions.length,
    getItemId: (index) => `command-palette-action-${visibleActions[index]?.id ?? index}`,
    isItemDisabled: isActionDisabled,
    onClose: closePalette,
    onSelect: selectAction,
  });

  if (!isOpen) {
    return null;
  }

  return (
    <Modal title="Команды" zIndexClassName="z-[85]" onClose={closePalette}>
      <div className="space-y-4">
        <label className="relative block">
          <span className="sr-only">Поиск команды</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={17} />
          <TextField
            aria-activedescendant={activeItemId}
            aria-controls="command-palette-actions"
            autoFocus
            className="pl-10"
            placeholder="Введите команду…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleActionKeyDown}
          />
        </label>

        <div
          className="max-h-[52dvh] space-y-3 overflow-y-auto scrollbar-none"
          id="command-palette-actions"
          role="listbox"
        >
          {visibleGroups.map(([group, groupActions]) => (
            <section key={group}>
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
                {group}
              </p>
              <div className="space-y-1">
                {groupActions.map(({ action, index }) => (
                  <button
                    key={action.id}
                    {...getItemProps(index)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-control focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45",
                      activeIndex === index && "bg-control",
                    )}
                    disabled={action.disabled}
                    aria-selected={activeIndex === index}
                    role="option"
                    type="button"
                    onClick={() => {
                      action.onSelect();
                      closePalette();
                    }}
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-control text-accent">
                      {action.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-text">{action.label}</span>
                      <span className="mt-0.5 block truncate text-xs text-text-muted">{action.description}</span>
                    </span>
                    {action.shortcut ? (
                      <kbd className="shrink-0 rounded-md border border-white/10 bg-panel px-1.5 py-1 text-[11px] text-text-muted">
                        {action.shortcut}
                      </kbd>
                    ) : null}
                  </button>
                ))}
              </div>
            </section>
          ))}
          {visibleActions.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-center text-sm text-text-muted">
              Команда не найдена.
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
