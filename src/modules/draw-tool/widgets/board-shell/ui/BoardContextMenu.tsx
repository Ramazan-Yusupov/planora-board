import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  AlignCenter,
  AlignHorizontalDistributeCenter,
  AlignLeft,
  AlignRight,
  AlignVerticalDistributeCenter,
  Copy,
  Download,
  ExternalLink,
  FileJson,
  Focus,
  Group,
  Image as ImageIcon,
  Lock,
  LockOpen,
  PackagePlus,
  PackageOpen,
  Tags,
  Ungroup,
  Trash2,
} from "lucide-react";
import { boardActions } from "@/modules/draw-tool/features/board-actions";
import { componentLibraryDialogStore } from "@/modules/draw-tool/features/component-library";
import { Divider, Popover } from "@/modules/draw-tool/shared/ui";
import { deleteSelectedElements } from "@/modules/draw-tool/features/delete-elements";
import { usePlanoraAdapter } from "@/modules/draw-tool/planora-adapter";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { selectionStore } from "@/modules/draw-tool/entities/selection";
import {
  getContextMenuFlags,
  getContextMenuPosition,
} from "../model/contextMenuState";
import { BoardContextMenuAction } from "./BoardContextMenuAction";

type BoardContextMenuProps = {
  left: number;
  onClose: () => void;
  targetElementId?: string;
  targetIsLocked?: boolean;
  top: number;
};

export function BoardContextMenu({
  left,
  onClose,
  targetElementId,
  targetIsLocked = false,
  top,
}: BoardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const scene = useSyncExternalStore(
    sceneStore.subscribe,
    sceneStore.get,
    sceneStore.get,
  );
  const selection = useSyncExternalStore(
    selectionStore.subscribeElementIds,
    selectionStore.get,
    selectionStore.get,
  );
  const selectedElements = scene.elements.filter((element) =>
    selection.elementIds.includes(element.id),
  );
  const { onOpenTask, tasks: planoraTasks } = usePlanoraAdapter();
  const targetElement = targetElementId
    ? scene.elements.find((element) => element.id === targetElementId)
    : selectedElements.length === 1
      ? selectedElements[0]
      : undefined;
  const linkedTask = targetElement?.metadata?.cardId
    ? planoraTasks.find((task) => task.id === targetElement.metadata?.cardId)
    : undefined;
  const {
    hasGroupSelection,
    hasGroupedSelection,
    hasSelectedFrame,
    hasSelection,
    showAlignActions,
    showDistributeActions,
    showLabelAction,
  } = getContextMenuFlags(selectedElements);
  const menuPosition = getContextMenuPosition(left, top);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (target instanceof Node && !menuRef.current?.contains(target)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function run(action: () => unknown | Promise<unknown>) {
    void Promise.resolve(action()).catch(() => undefined);
    onClose();
  }

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-120"
      style={{ left: menuPosition.left, top: menuPosition.top }}
    >
      <Popover
        aria-label="Контекстное меню доски"
        className="w-64 overflow-y-auto overscroll-contain"
        isOpen
        role="menu"
        style={{ maxHeight: menuPosition.maxHeight }}
      >
        {showLabelAction && (
          <BoardContextMenuAction
            onClick={() => {
              const label = window.prompt(
                "Подпись для выбранных элементов",
                "",
              );
              if (label !== null)
                run(() => boardActions.setSelectionLabel(label));
            }}
          >
            <Tags size={16} />
            <span>Подпись / label</span>
          </BoardContextMenuAction>
        )}

        {hasGroupSelection && (
          <BoardContextMenuAction
            onClick={() => run(boardActions.groupSelection)}
          >
            <Group size={16} />
            <span>Сгруппировать</span>
          </BoardContextMenuAction>
        )}
        {hasGroupedSelection && (
          <BoardContextMenuAction
            onClick={() => run(boardActions.ungroupSelection)}
          >
            <Ungroup size={16} />
            <span>Разгруппировать</span>
          </BoardContextMenuAction>
        )}
        {(hasSelection || targetElementId) && (
          <BoardContextMenuAction
            onClick={() =>
              run(() => boardActions.toggleLockSelection(targetElementId))
            }
          >
            {targetIsLocked ? <LockOpen size={16} /> : <Lock size={16} />}
            <span>{targetIsLocked ? "Unlock" : "Lock"}</span>
          </BoardContextMenuAction>
        )}
        {linkedTask && onOpenTask ? (
          <BoardContextMenuAction onClick={() => run(() => onOpenTask(linkedTask))}>
            <ExternalLink size={16} />
            <span>Открыть задачу в Board</span>
          </BoardContextMenuAction>
        ) : null}

        {showAlignActions && <Divider className="my-1.5" />}

        {showAlignActions && (
          <>
            <BoardContextMenuAction
              onClick={() => run(() => boardActions.alignSelection("left"))}
            >
              <AlignLeft size={16} />
              <span>Выровнять слева</span>
            </BoardContextMenuAction>
            <BoardContextMenuAction
              onClick={() => run(() => boardActions.alignSelection("center"))}
            >
              <AlignCenter size={16} />
              <span>Выровнять по центру</span>
            </BoardContextMenuAction>
            <BoardContextMenuAction
              onClick={() => run(() => boardActions.alignSelection("right"))}
            >
              <AlignRight size={16} />
              <span>Выровнять справа</span>
            </BoardContextMenuAction>
          </>
        )}

        {showDistributeActions && (
          <>
            <BoardContextMenuAction
              onClick={() =>
                run(() => boardActions.distributeSelection("horizontal"))
              }
            >
              <AlignHorizontalDistributeCenter size={16} />
              <span>Распределить горизонтально</span>
            </BoardContextMenuAction>
            <BoardContextMenuAction
              onClick={() =>
                run(() => boardActions.distributeSelection("vertical"))
              }
            >
              <AlignVerticalDistributeCenter size={16} />
              <span>Распределить вертикально</span>
            </BoardContextMenuAction>
          </>
        )}

        {hasSelection && (
          <>
            <Divider className="my-1.5" />
            <BoardContextMenuAction
              onClick={() => run(boardActions.copySelectionToClipboard)}
            >
              <Copy size={16} />
              <span>Copy JSON</span>
            </BoardContextMenuAction>
            <BoardContextMenuAction
              onClick={() => run(boardActions.copySelectionAsPng)}
            >
              <ImageIcon size={16} />
              <span>Copy PNG</span>
            </BoardContextMenuAction>
            <BoardContextMenuAction
              onClick={() => run(boardActions.copySelectionAsSvg)}
            >
              <FileJson size={16} />
              <span>Copy SVG</span>
            </BoardContextMenuAction>
          </>
        )}

        {hasSelection && (
          <BoardContextMenuAction
            onClick={() => {
              const name = window.prompt("Название компонента", "Компонент");
              if (name !== null)
                run(() => boardActions.saveSelectionToLibrary(name));
            }}
          >
            <PackagePlus size={16} />
            <span>В библиотеку</span>
          </BoardContextMenuAction>
        )}
        <BoardContextMenuAction
          onClick={() => run(componentLibraryDialogStore.open)}
        >
          <PackageOpen size={16} />
          <span>Компоненты</span>
        </BoardContextMenuAction>

        {hasSelectedFrame && (
          <>
            <Divider className="my-1.5" />
            <BoardContextMenuAction
              onClick={() => run(boardActions.focusSelectedFrame)}
            >
              <Focus size={16} />
              <span>Фокус на фрейм</span>
            </BoardContextMenuAction>
            <BoardContextMenuAction
              onClick={() => run(() => boardActions.exportSelectedFrame("png"))}
            >
              <Download size={16} />
              <span>Export frame PNG</span>
            </BoardContextMenuAction>
          </>
        )}
        <BoardContextMenuAction
          danger
          onClick={() => run(deleteSelectedElements)}
          disabled={!hasSelection}
        >
          <Trash2 size={16} />
          <span>Удалить выбранное</span>
        </BoardContextMenuAction>
      </Popover>
    </div>,
    document.body,
  );
}

