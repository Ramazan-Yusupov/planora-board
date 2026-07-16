import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  Crosshair,
  Ellipsis,
  Globe2,
  LassoSelect,
  Network,
  Highlighter,
  MessageSquareText,
  Paintbrush,
  Pipette,
  Ruler,
  StickyNote,
  Table2,
  WandSparkles,
  Code2,
  Workflow,
  Minus,
  ChartNoAxesGantt,
  MonitorCloud,
  Wallpaper,
  Columns2,
  ChartBarIncreasing,
  Database,
  ListCollapse,
  CreditCard,
  LayoutTemplate,
  LibraryBig,
  SquareKanban,
  SquareDashedKanban,
  CalendarRange,
  DoorClosedLocked,
  Computer,
  FileText,
  Webhook,
} from "lucide-react";
import type { AdvancedElementKind } from "@/modules/draw-tool/entities/element";
import { toolStore } from "@/modules/draw-tool/entities/tool";
import { advancedShapeStore } from "@/modules/draw-tool/features/advanced-shapes";
import { ImageUploadMenuItem } from "@/modules/draw-tool/features/add-image";
import {
  applyCopiedStyleToSelectedElements,
  styleClipboardStore,
} from "@/modules/draw-tool/features/style-clipboard";
import { productivityToolsStore } from "@/modules/draw-tool/features/productivity-tools";
import { shapeLibraryDialogStore } from "@/modules/draw-tool/features/shape-library";
import { IconButton, Popover } from "@/modules/draw-tool/shared/ui";
import { useMoreToolsMenuPosition } from "../model/useMoreToolsMenuPosition";
import { MORE_SHAPE_ITEMS } from "../model/toolItems";
import { MoreToolsMenuItem } from "./MoreToolsMenuItem";

const BOARD_TOOLS = [
  { id: "sticky", label: "Стикер-заметка", shortcut: "N", icon: StickyNote },
  {
    id: "callout",
    label: "Комментарий / Callout",
    shortcut: "M",
    icon: MessageSquareText,
  },
  { id: "table", label: "Таблица", shortcut: "", icon: Table2 },
  { id: "markdown", label: "Markdown заметка", shortcut: "", icon: FileText },
  { id: "measure", label: "Линейка / измерение", shortcut: "", icon: Ruler },
  { id: "highlighter", label: "Маркер", shortcut: "", icon: Highlighter },
] as const;

const ADVANCED_TOOLS: readonly {
  icon: typeof Table2;
  kind: AdvancedElementKind;
  label: string;
}[] = [
  { kind: "swimlane", label: "Swimlane", icon: Table2 },
  { kind: "bpmn-task", label: "BPMN задача", icon: Workflow },
  { kind: "bpmn-event", label: "BPMN событие", icon: CalendarRange },
  { kind: "bpmn-gateway", label: "BPMN gateway", icon: DoorClosedLocked },
  { kind: "uml-class", label: "UML class", icon: Computer },
  { kind: "uml-actor", label: "UML actor", icon: ListCollapse },
  { kind: "erd-table", label: "ERD table", icon: Table2 },
  { kind: "kanban-board", label: "Kanban board", icon: SquareKanban },
  { kind: "timeline", label: "Timeline", icon: Minus },
  { kind: "mindmap-node", label: "Mind map", icon: ChartNoAxesGantt },
  { kind: "cloud-service", label: "Cloud service", icon: MonitorCloud },
  { kind: "wireframe", label: "Wireframe", icon: Wallpaper },
  { kind: "smart-connector", label: "Smart connector", icon: Workflow },
  { kind: "section-zone", label: "Section / Zone", icon: LayoutTemplate },
  { kind: "erd-relationship", label: "ERD relation", icon: Network },
  { kind: "flow-step", label: "Flow step", icon: Columns2 },
  { kind: "status-badge", label: "Status badge", icon: ChartBarIncreasing },
  { kind: "annotation-pin", label: "Annotation pin", icon: MessageSquareText },
  { kind: "template-stamp", label: "Template stamp", icon: SquareDashedKanban },
  { kind: "api-endpoint", label: "API endpoint", icon: Webhook },
  { kind: "database-cylinder", label: "Database", icon: Database },
  { kind: "org-card", label: "Org card", icon: CreditCard },
];

export function MoreToolsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const styleClipboard = useSyncExternalStore(
    styleClipboardStore.subscribe,
    styleClipboardStore.get,
    styleClipboardStore.get,
  );

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPosition = useMoreToolsMenuPosition(isOpen, buttonRef);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      const clickedButton = buttonRef.current?.contains(target);
      const clickedMenu = menuRef.current?.contains(target);

      if (!clickedButton && !clickedMenu) {
        setIsOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="shrink-0">
      <IconButton
        ref={buttonRef}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Больше инструментов"
        className="grid size-10 place-items-center rounded-lg text-text hover:bg-control max-lg:size-11"
        onClick={() => setIsOpen((open) => !open)}
        title="Больше инструментов"
        type="button"
      >
        <Ellipsis size={20} />
      </IconButton>

      {isOpen &&
        menuPosition &&
        createPortal(
          <div ref={menuRef}>
            <Popover
              aria-label="Дополнительные инструменты"
              className="fixed z-60 mt-2 mb-2"
              isOpen={isOpen}
              role="menu"
              style={menuPosition}
            >
              <div className="space-y-3">
                <div className="grid grid-cols-6 gap-2">
                  {MORE_SHAPE_ITEMS.slice(0, 2).map((item) => {
                    const Icon = item.icon;

                    return (
                      <MoreToolsMenuItem
                        icon={item.id === "embed" ? Globe2 : Icon}
                        key={item.id}
                        label={item.label}
                        onClick={() => {
                          toolStore.set(item.id);
                          setIsOpen(false);
                        }}
                        shortcut={item.shortcut}
                        shortcutHint={item.shortcutHint}
                        variant="icon"
                      />
                    );
                  })}

                  <ImageUploadMenuItem
                    onImageAdded={() => setIsOpen(false)}
                    variant="icon"
                  />

                  {BOARD_TOOLS.map((item) => {
                    return (
                      <MoreToolsMenuItem
                        icon={item.icon}
                        key={item.id}
                        label={item.label}
                        onClick={() => {
                          toolStore.set(item.id);
                          setIsOpen(false);
                        }}
                        shortcut={item.shortcut}
                        variant="icon"
                      />
                    );
                  })}

                  <MoreToolsMenuItem
                    icon={LibraryBig}
                    label="Shape Library"
                    onClick={() => {
                      shapeLibraryDialogStore.open();
                      setIsOpen(false);
                    }}
                    variant="icon"
                  />

                  <MoreToolsMenuItem
                    icon={WandSparkles}
                    label="Power tools"
                    onClick={() => {
                      productivityToolsStore.open();
                      setIsOpen(false);
                    }}
                    variant="icon"
                  />

                  <MoreToolsMenuItem
                    icon={Code2}
                    label="Блок кода"
                    onClick={() => {
                      toolStore.set("code");
                      setIsOpen(false);
                    }}
                    shortcut="J"
                    shortcutHint="J"
                    variant="icon"
                  />


                  <MoreToolsMenuItem
                    icon={Pipette}
                    label="Пипетка стиля"
                    onClick={() => {
                      toolStore.set("eyedropper");
                      setIsOpen(false);
                    }}
                    variant="icon"
                  />

                  <MoreToolsMenuItem
                    disabled={!styleClipboard.style}
                    icon={Paintbrush}
                    label="Применить стиль"
                    onClick={() => {
                      applyCopiedStyleToSelectedElements();
                      setIsOpen(false);
                    }}
                    variant="icon"
                  />

                  <MoreToolsMenuItem
                    icon={Crosshair}
                    label="Лазерная указка"
                    onClick={() => {
                      toolStore.set("laser");
                      setIsOpen(false);
                    }}
                    shortcut="K"
                    variant="icon"
                  />

                  <MoreToolsMenuItem
                    icon={LassoSelect}
                    label="Выделение лассо"
                    onClick={() => {
                      toolStore.set("lasso");
                      setIsOpen(false);
                    }}
                    shortcut="L"
                    variant="icon"
                  />
                </div>

                <p className="px-1 text-xs font-semibold text-text-muted">
                  Premium shapes
                </p>

                <div className="grid grid-cols-6 gap-2">
                  {ADVANCED_TOOLS.map((item) => (
                    <MoreToolsMenuItem
                      icon={item.icon}
                      key={item.kind}
                      label={item.label}
                      onClick={() => {
                        advancedShapeStore.set(item.kind);
                        toolStore.set("advanced");
                        setIsOpen(false);
                      }}
                      variant="icon"
                    />
                  ))}
                </div>
              </div>

              <p className="mb-1 mt-3 px-1 text-xs font-semibold text-text-muted">
                Другие фигуры
              </p>

              <div className="grid grid-cols-6 gap-2">
                {MORE_SHAPE_ITEMS.slice(2).map((item) => {
                  return (
                    <MoreToolsMenuItem
                      icon={item.icon}
                      key={item.id}
                      label={item.label}
                      onClick={() => {
                        toolStore.set(item.id);
                        setIsOpen(false);
                      }}
                      shortcutHint={item.shortcutHint}
                      title={`${item.label} (${item.shortcutHint})`}
                      variant="icon"
                    />
                  );
                })}
              </div>
            </Popover>
          </div>,
          document.body,
        )}
    </div>
  );
}

