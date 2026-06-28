"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib";
import { Modal, TextField } from "@/shared/ui";

export type CommandPaletteAction = Readonly<{
  id: string;
  label: string;
  description: string;
  shortcut?: string;
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
      `${action.label} ${action.description}`.toLocaleLowerCase("ru-RU").includes(normalizedQuery),
    );
  }, [actions, query]);

  if (!isOpen) {
    return null;
  }

  return (
    <Modal title="Команды" zIndexClassName="z-[85]" onClose={onClose}>
      <div className="space-y-4">
        <label className="relative block">
          <span className="sr-only">Поиск команды</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={17} />
          <TextField
            autoFocus
            className="pl-10"
            placeholder="Введите команду…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="max-h-[52dvh] space-y-1 overflow-y-auto scrollbar-none">
          {visibleActions.map((action) => (
            <button
              key={action.id}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-control focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-45",
              )}
              disabled={action.disabled}
              type="button"
              onClick={() => {
                action.onSelect();
                onClose();
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
