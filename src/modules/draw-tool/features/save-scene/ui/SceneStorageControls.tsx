import {
  Download,
  FileJson,
  FolderTree,
  Focus,
  Keyboard,
  Layers3,
  Link2,
  MoreHorizontal,
  PackageOpen,
  Save,
  Trash2,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { resetScene } from "@/modules/draw-tool/entities/scene";
import { boardActions } from "@/modules/draw-tool/features/board-actions";
import { componentLibraryDialogStore } from "@/modules/draw-tool/features/component-library";
import { projectStore } from "@/modules/draw-tool/features/projects";
import { shortcutsHelpStore } from "@/modules/draw-tool/features/shortcuts-help";
import {
  WorkspaceBackupStatus,
  WorkspaceDataModal,
  workspacePersistenceStore,
} from "@/modules/draw-tool/features/workspace-backup";
import {
  Button,
  Divider,
  IconButton,
  Panel,
  Popover,
  usePopover,
} from "@/modules/draw-tool/shared/ui";

type FileMenuPosition = {
  left: number;
  maxHeight: number;
  top: number;
  width: number;
};

const FILE_MENU_GAP = 8;
const FILE_MENU_GUTTER = 8;
const FILE_MENU_WIDTH = 240;

type SceneStorageControlsProps = {
  isLayersOpen?: boolean;
  onToggleLayers?: () => void;
};

export function SceneStorageControls({
  isLayersOpen = false,
  onToggleLayers,
}: SceneStorageControlsProps) {
  const fileMenuButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileMenuRef = useRef<HTMLDivElement | null>(null);
  const [fileMenuPosition, setFileMenuPosition] =
    useState<FileMenuPosition | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const fileMenu = usePopover();

  function updateFileMenuPosition() {
    const menuButton = fileMenuButtonRef.current;
    const toolbarPanel = menuButton?.parentElement;
    if (!menuButton || !toolbarPanel) return;

    const panelRect = toolbarPanel.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(
      FILE_MENU_WIDTH,
      viewportWidth - FILE_MENU_GUTTER * 2,
    );

    setFileMenuPosition({
      left: Math.max(
        FILE_MENU_GUTTER,
        Math.min(panelRect.left, viewportWidth - width - FILE_MENU_GUTTER),
      ),
      top: panelRect.bottom + FILE_MENU_GAP,
      width,
      maxHeight: Math.max(
        160,
        viewportHeight - panelRect.bottom - FILE_MENU_GAP * 2,
      ),
    });
  }

  useLayoutEffect(() => {
    if (!fileMenu.isOpen) return;

    function handleOutsidePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const clickedMenu = fileMenuRef.current?.contains(target);
      const clickedMenuButton = fileMenuButtonRef.current?.contains(target);
      if (!clickedMenu && !clickedMenuButton) fileMenu.close();
    }

    updateFileMenuPosition();
    window.addEventListener("resize", updateFileMenuPosition);
    window.addEventListener("scroll", updateFileMenuPosition, true);
    document.addEventListener("pointerdown", handleOutsidePointerDown, true);

    return () => {
      window.removeEventListener("resize", updateFileMenuPosition);
      window.removeEventListener("scroll", updateFileMenuPosition, true);
      document.removeEventListener(
        "pointerdown",
        handleOutsidePointerDown,
        true,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileMenu.isOpen]);

  function notify(next: string) {
    setMessage(next);
    window.setTimeout(() => setMessage(null), 1800);
  }

  const menuButtonClass =
    "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm text-text transition-colors hover:bg-control/85";

  return (
    <>
      <Panel className="absolute left-34 top-20 z-20 flex items-center gap-1 rounded-2xl border border-border/90 bg-panel/92 p-1.5 shadow-panel backdrop-blur-xl max-sm:left-2 sm:top-4 max-lg:left-33 max-lg:gap-0.5">
        <IconButton
          aria-label="Открыть проекты"
          className="grid size-9 place-items-center rounded-xl text-text transition-colors hover:bg-control/85"
          onClick={() => projectStore.toggleSidebar()}
          title="Проекты"
          type="button"
        >
          <FolderTree aria-hidden size={17} />
        </IconButton>

        <IconButton
          aria-label="Сохранить рабочую область"
          className="grid size-9 place-items-center rounded-xl text-text transition-colors hover:bg-control/85"
          onClick={() => {
            void workspacePersistenceStore.saveNow().then((saved) => {
              notify(saved ? "Сохранено" : "Не удалось сохранить");
            });
          }}
          title="Сохранить проект и backup"
          type="button"
        >
          <Save aria-hidden size={17} />
        </IconButton>

        <IconButton
          aria-label="Открыть хранилище и резервные копии"
          className="grid size-9 place-items-center rounded-xl text-text transition-colors hover:bg-control/85"
          onClick={() => setIsWorkspaceModalOpen(true)}
          title="Хранилище и резервные копии"
          type="button"
        >
          <Download aria-hidden size={17} />
        </IconButton>

        <IconButton
          aria-label="Открыть горячие клавиши"
          className="grid size-9 place-items-center rounded-xl text-text transition-colors hover:bg-control/85"
          onClick={() => shortcutsHelpStore.open()}
          title="Горячие клавиши"
          type="button"
        >
          <Keyboard aria-hidden size={17} />
        </IconButton>

        <WorkspaceBackupStatus onOpen={() => setIsWorkspaceModalOpen(true)} />

        <IconButton
          aria-expanded={fileMenu.isOpen}
          aria-haspopup="menu"
          aria-label="Дополнительные действия с доской"
          className="grid size-9 place-items-center rounded-xl text-text transition-colors hover:bg-control/85"
          onClick={fileMenu.toggle}
          ref={fileMenuButtonRef}
          title="Дополнительно"
          type="button"
        >
          <MoreHorizontal aria-hidden size={18} />
        </IconButton>

        {fileMenu.isOpen &&
          fileMenuPosition &&
          createPortal(
            <div ref={fileMenuRef}>
              <Popover
                aria-label="Дополнительные действия с доской"
                className="fixed z-100 overflow-y-auto overscroll-contain"
                isOpen={fileMenu.isOpen}
                role="menu"
                style={fileMenuPosition}
              >
                <Button
                  className={menuButtonClass}
                  onClick={() => {
                    onToggleLayers?.();
                    fileMenu.close();
                  }}
                  type="button"
                >
                  <Layers3
                    aria-hidden
                    className={isLayersOpen ? "text-accent" : undefined}
                    size={17}
                  />
                  <span>Слои</span>
                </Button>

                <Button
                  className={menuButtonClass}
                  onClick={() => {
                    void boardActions.pasteElementsFromClipboard().then((ok) =>
                      notify(ok ? "Вставлено" : "Clipboard пуст"),
                    );
                    fileMenu.close();
                  }}
                  type="button"
                >
                  <FileJson aria-hidden size={17} />
                  <span>Вставить JSON</span>
                </Button>

                <Button
                  className={menuButtonClass}
                  onClick={() => {
                    componentLibraryDialogStore.open();
                    fileMenu.close();
                  }}
                  type="button"
                >
                  <PackageOpen aria-hidden size={17} />
                  <span>Компоненты</span>
                </Button>

                <Button
                  className={menuButtonClass}
                  onClick={() => {
                    const ok = boardActions.focusSelectedFrame();
                    notify(ok ? "Фрейм в фокусе" : "Выберите фрейм");
                    fileMenu.close();
                  }}
                  type="button"
                >
                  <Focus aria-hidden size={17} />
                  <span>Фокус на фрейм</span>
                </Button>

                <Button
                  className={menuButtonClass}
                  onClick={() => {
                    void boardActions.exportSelectedFrame("png").then((ok) =>
                      notify(ok ? "Фрейм экспортирован" : "Выберите фрейм"),
                    );
                    fileMenu.close();
                  }}
                  type="button"
                >
                  <Download aria-hidden size={17} />
                  <span>Экспорт фрейма PNG</span>
                </Button>

                <Button
                  className={menuButtonClass}
                  onClick={() => {
                    void boardActions.copyReadonlyShareLink().then(() =>
                      notify("Readonly link скопирован"),
                    );
                    fileMenu.close();
                  }}
                  type="button"
                >
                  <Link2 aria-hidden size={17} />
                  <span>Readonly link</span>
                </Button>

                <Divider className="my-2" />

                <Button
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10"
                  onClick={() => {
                    resetScene();
                    fileMenu.close();
                    notify("Доска очищена");
                  }}
                  type="button"
                >
                  <Trash2 aria-hidden size={17} />
                  <span>Очистить доску</span>
                </Button>
              </Popover>
            </div>,
            document.body,
          )}

        {message && (
          <span className="absolute left-0 top-12 whitespace-nowrap rounded-md border border-border bg-panel px-2 py-1 text-xs text-text shadow-panel">
            {message}
          </span>
        )}
      </Panel>

      <WorkspaceDataModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />
    </>
  );
}

