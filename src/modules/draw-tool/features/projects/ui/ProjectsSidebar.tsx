import { useState, useSyncExternalStore } from "react";
import {
  ChevronDown,
  FilePlus2,
  FolderTree,
  MoreHorizontal,
  PencilLine,
  Trash2,
  X,
} from "lucide-react";
import { projectStore } from "../model/projectStore";
import { MAX_PROJECTS } from "../model/types";
import { Button, IconButton } from "@/modules/draw-tool/shared/ui";
import { cn } from "@/modules/draw-tool/shared/lib";

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
  }).format(new Date(timestamp));
}

export function ProjectsSidebar() {
  const projectsState = useSyncExternalStore(
    projectStore.subscribe,
    projectStore.get,
    projectStore.get,
  );
  const [isRootOpen, setIsRootOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!projectsState.isSidebarOpen) {
    return null;
  }

  function notify(nextMessage: string) {
    setMessage(nextMessage);
    window.setTimeout(() => setMessage(null), 1800);
  }

  async function createProject() {
    const result = await projectStore.createProject(
      newProjectName || "Новый проект",
    );

    if (!result.ok) {
      notify(
        result.reason === "limit"
          ? `Достигнут лимит: ${MAX_PROJECTS} проектов`
          : "Не удалось создать проект",
      );
      return;
    }

    setNewProjectName("");
    setIsCreating(false);
  }

  async function renameProject(id: string) {
    const renamed = await projectStore.renameProject(id, editingName);

    if (!renamed) {
      notify("Введите название проекта");
      return;
    }

    setEditingProjectId(null);
    setEditingName("");
  }

  return (
    <>
      <Button
        aria-label="Закрыть список проектов"
        className="fixed inset-0 z-40 bg-slate-950/48 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none"
        onClick={() => projectStore.closeSidebar()}
        type="button"
      />

      <aside
        aria-label="Проекты"
        className="drawtool-projects-sidebar fixed inset-y-0 left-0 z-50 flex w-dvw max-w-full flex-col border-r border-border/90 bg-panel/96 shadow-float backdrop-blur-xl sm:w-88 lg:w-80"
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/80 p-4">
          <div className="flex min-w-0 items-center gap-2">
            <FolderTree className="shrink-0 text-accent" size={19} />
            <div className="min-w-0">
              <h2 className="m-0 text-sm font-semibold text-text">Проекты</h2>
              <p className="m-0 text-xs text-text-muted">
                {projectsState.projects.length} / {MAX_PROJECTS}
              </p>
            </div>
          </div>

          <IconButton
            aria-label="Закрыть проекты"
            className="grid size-10 place-items-center rounded-lg text-text-muted transition-colors hover:bg-control hover:text-text"
            onClick={() => projectStore.closeSidebar()}
            type="button"
          >
            <X size={18} />
          </IconButton>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <Button
            className="mb-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm font-medium text-text hover:bg-control"
            onClick={() => setIsRootOpen((open) => !open)}
            type="button"
          >
            <ChevronDown
              className={cn(
                "transition-transform",
                isRootOpen ? "rotate-0" : "-rotate-90",
              )}
              size={16}
            />
            <FolderTree size={16} />
            <span className="truncate">Мои проекты</span>
          </Button>

          {isRootOpen && (
            <div className="space-y-1 border-l border-border pl-3">
              {projectsState.projects.map((project) => {
                const isActive = project.id === projectsState.activeProjectId;
                const isEditing = editingProjectId === project.id;

                return (
                  <div
                    className={cn(
                      "group rounded-xl border transition-[background-color,border-color,box-shadow]",
                      isActive
                        ? "border-accent/70 bg-control-active/25 shadow-[inset_0_1px_0_rgb(255_255_255/4%)]"
                        : "border-transparent hover:border-border hover:bg-control/75",
                    )}
                    key={project.id}
                  >
                    <div className="flex min-w-0 items-center gap-1 px-2 py-1.5">
                      <Button
                        className="min-w-0 flex-1 text-left"
                        onClick={() =>
                          void projectStore.openProject(project.id)
                        }
                        type="button"
                      >
                        {isEditing ? (
                          <input
                            autoFocus
                            className="w-full rounded border border-accent bg-canvas px-2 py-1 text-xs text-text outline-none"
                            onBlur={() => void renameProject(project.id)}
                            onChange={(event) =>
                              setEditingName(event.currentTarget.value)
                            }
                            onKeyDown={(event) => {
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void renameProject(project.id);
                              }
                              if (event.key === "Escape") {
                                setEditingProjectId(null);
                              }
                            }}
                            value={editingName}
                          />
                        ) : (
                          <>
                            <p className="m-0 truncate text-sm font-medium text-text">
                              {project.name}
                            </p>
                            <p className="m-0 text-[11px] text-text-muted">
                              {formatDate(project.updatedAt)}
                            </p>
                          </>
                        )}
                      </Button>

                      <div className="flex shrink-0 items-center opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                        <IconButton
                          aria-label="Переименовать проект"
                          className="grid size-8 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text"
                          onClick={() => {
                            setEditingProjectId(project.id);
                            setEditingName(project.name);
                          }}
                          type="button"
                        >
                          <PencilLine size={14} />
                        </IconButton>
                        <IconButton
                          aria-label="Удалить проект"
                          className="grid size-8 place-items-center rounded-md text-text-muted hover:bg-red-500/20 hover:text-red-300"
                          onClick={() => {
                            if (
                              window.confirm(
                                `Удалить проект «${project.name}»?`,
                              )
                            ) {
                              void projectStore.deleteProject(project.id);
                            }
                          }}
                          type="button"
                        >
                          <Trash2 size={14} />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="shrink-0 border-t border-border p-3">
          {isCreating ? (
            <div className="space-y-2">
              <input
                autoFocus
                className="w-full rounded-xl border border-border bg-control px-3 py-2 text-sm text-text shadow-[inset_0_1px_0_rgb(255_255_255/3%)] outline-none focus:border-accent focus:ring-2 focus:ring-accent/15"
                onChange={(event) =>
                  setNewProjectName(event.currentTarget.value)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void createProject();
                  }
                  if (event.key === "Escape") {
                    setIsCreating(false);
                    setNewProjectName("");
                  }
                }}
                placeholder="Название проекта"
                value={newProjectName}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button
                  className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white hover:brightness-110"
                  onClick={() => void createProject()}
                  type="button"
                >
                  Создать
                </Button>
                <Button
                  className="rounded-lg bg-control px-3 py-2 text-sm text-text hover:bg-surface-muted"
                  onClick={() => {
                    setIsCreating(false);
                    setNewProjectName("");
                  }}
                  type="button"
                >
                  Отмена
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={projectsState.projects.length >= MAX_PROJECTS}
              onClick={() => setIsCreating(true)}
              type="button"
            >
              <FilePlus2 size={17} />
              Новый проект
            </Button>
          )}

          {message && (
            <p className="mt-2 flex items-center gap-2 text-xs text-red-300">
              <MoreHorizontal size={14} />
              {message}
            </p>
          )}
        </footer>
      </aside>
    </>
  );
}

