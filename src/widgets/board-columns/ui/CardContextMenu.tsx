"use client";

import {
  Archive,
  CalendarDays,
  CircleOff,
  Copy,
  ExternalLink,
  Flag,
  Rows3,
  Trash2,
  X,
} from "lucide-react";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

import {
  CARD_PRIORITY_OPTIONS,
  CARD_STATUS_OPTIONS,
  type BoardCard,
  type BoardCardOption,
  type BoardChecklistTemplate,
  type BoardCustomFieldTemplate,
  type BoardLabel,
  type CardCover,
  type CardDraft,
  type CardPriority,
  type CardStatus,
} from "@/entities/board";
import { cn, createId } from "@/shared/lib";
import { useKeyboardListNavigation, useViewportMenuPosition } from "@/shared/ui";

type CardContextMenuPosition = Readonly<{
  x: number;
  y: number;
}>;

type CardContextMenuProps = Readonly<{
  card: BoardCard;
  checklistTemplates: readonly BoardChecklistTemplate[];
  coverColors: readonly string[];
  customFieldTemplates: readonly BoardCustomFieldTemplate[];
  labels: Readonly<Record<string, BoardLabel>>;
  priorityOptions: readonly BoardCardOption[];
  priorityLabels: Partial<Record<CardPriority, string>>;
  position: CardContextMenuPosition;
  statusOptions: readonly BoardCardOption[];
  statusLabels: Partial<Record<CardStatus, string>>;
  onArchive: (cardId: string) => void;
  onClose: () => void;
  onCreateChecklist: (cardId: string, title: string) => void;
  onDelete: (cardId: string) => void;
  onDuplicate: (cardId: string) => void;
  onOpen: (cardId: string) => void;
  onSave: (cardId: string, draft: CardDraft) => void;
}>;

function createDraft(card: BoardCard, patch: Partial<CardDraft>): CardDraft {
  return {
    title: card.title,
    description: card.description,
    status: card.status,
    priority: card.priority,
    startDate: card.startDate,
    dueDate: card.dueDate,
    labelIds: [...card.labelIds],
    customFields: card.customFields.map((field) => ({ ...field })),
    sticker: card.sticker,
    cover: card.cover,
    ...patch,
  };
}

function MenuSection({
  children,
  title,
}: Readonly<{ children: ReactNode; title: string }>) {
  return (
    <section className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">
        {title}
      </h3>
      {children}
    </section>
  );
}

function MenuButton({
  active,
  children,
  danger,
  isKeyboardActive,
  itemProps,
  onClick,
}: Readonly<{
  active?: boolean;
  children: ReactNode;
  danger?: boolean;
  isKeyboardActive?: boolean;
  itemProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  onClick: () => void;
}>) {
  return (
    <button
      {...itemProps}
      className={cn(
        "flex min-h-9 w-full min-w-0 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition",
        active || isKeyboardActive
          ? "bg-accent text-accent-foreground"
          : "text-text-muted hover:bg-control hover:text-text",
        danger && "text-red-300 hover:bg-red-500/10 hover:text-red-100",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

type MenuOption = Readonly<{
  value: string;
  label: string;
  color: string;
}>;

type CardContextMenuAction = Readonly<{
  id: string;
  onSelect: () => void;
}>;

function isFormFieldTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  );
}

export function CardContextMenu({
  card,
  checklistTemplates,
  coverColors,
  customFieldTemplates,
  labels,
  priorityOptions,
  priorityLabels,
  position,
  statusOptions,
  statusLabels,
  onArchive,
  onClose,
  onCreateChecklist,
  onDelete,
  onDuplicate,
  onOpen,
  onSave,
}: CardContextMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuPoint = useMemo(
    () => ({ x: position.x, y: position.y }),
    [position.x, position.y],
  );
  const { style: menuStyle } = useViewportMenuPosition({
    maxHeight: 672,
    menuRef,
    point: menuPoint,
    width: 464,
  });
  const boardLabels = Object.values(labels);
  const menuStatusOptions = useMemo<MenuOption[]>(
    () => [
      ...CARD_STATUS_OPTIONS.map((option) => ({
        value: option.value,
        label: statusLabels[option.value] ?? option.label,
        color: option.color,
      })),
      ...statusOptions.map((option) => ({
        value: option.id,
        label: option.name,
        color: option.color,
      })),
    ],
    [statusLabels, statusOptions],
  );
  const menuPriorityOptions = useMemo<MenuOption[]>(
    () => [
      ...CARD_PRIORITY_OPTIONS.map((option) => ({
        value: option.value,
        label: priorityLabels[option.value] ?? option.label,
        color: option.color,
      })),
      ...priorityOptions.map((option) => ({
        value: option.id,
        label: option.name,
        color: option.color,
      })),
    ],
    [priorityLabels, priorityOptions],
  );
  const save = useCallback(
    (patch: Partial<CardDraft>) => {
      onSave(card.id, createDraft(card, patch));
    },
    [card, onSave],
  );
  const toggleLabel = useCallback(
    (labelId: string) => {
      const labelIds = card.labelIds.includes(labelId)
        ? card.labelIds.filter((currentLabelId) => currentLabelId !== labelId)
        : [...card.labelIds, labelId];

      save({ labelIds });
    },
    [card.labelIds, save],
  );
  const setCover = useCallback(
    (cover: CardCover | undefined) => {
      save({ cover });
    },
    [save],
  );
  const addCustomFieldFromTemplate = useCallback(
    (template: BoardCustomFieldTemplate) => {
      const existingField = card.customFields.find(
        (field) => field.name === template.name,
      );
      const nextFields = existingField
        ? card.customFields.filter((field) => field.id !== existingField.id)
        : [
            ...card.customFields,
            {
              id: createId("card-field"),
              name: template.name,
              value: "",
              createdAt: template.createdAt,
              updatedAt: template.updatedAt,
            },
          ];

      save({ customFields: nextFields });
    },
    [card.customFields, save],
  );
  const menuCoverColors = coverColors;
  const menuActions = useMemo<readonly CardContextMenuAction[]>(
    () => [
      ...menuStatusOptions.map((option) => ({
        id: `status-${option.value}`,
        onSelect: () => save({ status: option.value }),
      })),
      ...menuPriorityOptions.map((option) => ({
        id: `priority-${option.value}`,
        onSelect: () => save({ priority: option.value }),
      })),
      ...boardLabels.map((label) => ({
        id: `label-${label.id}`,
        onSelect: () => toggleLabel(label.id),
      })),
      {
        id: "cover-none",
        onSelect: () => setCover(undefined),
      },
      ...menuCoverColors.map((color) => ({
        id: `cover-${color}`,
        onSelect: () => setCover({ type: "color" as const, color }),
      })),
      ...customFieldTemplates.map((template) => ({
        id: `field-${template.id}`,
        onSelect: () => addCustomFieldFromTemplate(template),
      })),
      ...checklistTemplates.map((template) => ({
        id: `checklist-${template.id}`,
        onSelect: () => onCreateChecklist(card.id, template.title),
      })),
      {
        id: "open",
        onSelect: () => onOpen(card.id),
      },
      {
        id: "duplicate",
        onSelect: () => onDuplicate(card.id),
      },
      {
        id: "archive",
        onSelect: () => onArchive(card.id),
      },
      {
        id: "delete",
        onSelect: () => onDelete(card.id),
      },
    ],
    [
      addCustomFieldFromTemplate,
      boardLabels,
      card.id,
      checklistTemplates,
      customFieldTemplates,
      menuCoverColors,
      menuPriorityOptions,
      menuStatusOptions,
      onArchive,
      onCreateChecklist,
      onDelete,
      onDuplicate,
      onOpen,
      save,
      setCover,
      toggleLabel,
    ],
  );
  const {
    activeIndex,
    activeItemId,
    getItemProps,
    handleKeyDown: handleMenuKeyDown,
  } = useKeyboardListNavigation({
    count: menuActions.length,
    getItemId: (index) => `card-context-action-${menuActions[index]?.id ?? index}`,
    onClose,
    onSelect: (index) => menuActions[index]?.onSelect(),
  });
  const statusOffset = 0;
  const priorityOffset = statusOffset + menuStatusOptions.length;
  const labelOffset = priorityOffset + menuPriorityOptions.length;
  const coverOffset = labelOffset + boardLabels.length;
  const customFieldOffset = coverOffset + 1 + menuCoverColors.length;
  const checklistOffset = customFieldOffset + customFieldTemplates.length;
  const actionsOffset = checklistOffset + checklistTemplates.length;

  useLayoutEffect(() => {
    const closeOnPointerDown = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }

      onClose();
    };

    const handleNavigationKeyDown = (event: KeyboardEvent) => {
      if (isFormFieldTarget(event.target) && event.key !== "Escape") {
        return;
      }

      if (
        event.key === "ArrowDown" ||
        event.key === "ArrowUp" ||
        event.key === "PageDown" ||
        event.key === "PageUp" ||
        event.key === "Home" ||
        event.key === "End" ||
        event.key === "Enter" ||
        event.key === "Escape"
      ) {
        handleMenuKeyDown(event);
      }
    };

    window.addEventListener("pointerdown", closeOnPointerDown);
    window.addEventListener("keydown", handleNavigationKeyDown);
    window.addEventListener("resize", onClose);

    return () => {
      window.removeEventListener("pointerdown", closeOnPointerDown);
      window.removeEventListener("keydown", handleNavigationKeyDown);
      window.removeEventListener("resize", onClose);
    };
  }, [handleMenuKeyDown, onClose]);

  return (
    <div
      ref={menuRef}
      aria-activedescendant={activeItemId}
      className="fixed z-[80] grid max-h-[min(80dvh,42rem)] w-[min(94vw,29rem)] gap-3 overflow-y-auto rounded-xl border border-white/10 bg-panel/98 p-3 text-text shadow-float backdrop-blur-2xl"
      role="menu"
      style={menuStyle}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (isFormFieldTarget(event.target) && event.key !== "Escape") {
          return;
        }

        handleMenuKeyDown(event);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text" title={card.title}>
            {card.title}
          </p>
          <p className="mt-1 text-xs text-text-muted">Быстрые действия карточки</p>
        </div>
        <button
          className="grid size-8 shrink-0 place-items-center rounded-lg text-text-muted hover:bg-control hover:text-text"
          type="button"
          onClick={onClose}
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>

      <MenuSection title="Статус">
        <div className="grid grid-cols-2 gap-1.5">
          {menuStatusOptions.map((option, optionIndex) => {
            const itemIndex = statusOffset + optionIndex;

            return (
            <MenuButton
              key={option.value}
              active={card.status === option.value}
              isKeyboardActive={activeIndex === itemIndex}
              itemProps={getItemProps(itemIndex)}
              onClick={() => save({ status: option.value })}
            >
              <Rows3
                aria-hidden="true"
                className="shrink-0"
                size={15}
                style={{ color: card.status === option.value ? "currentColor" : option.color }}
              />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </MenuButton>
            );
          })}
        </div>
      </MenuSection>

      <MenuSection title="Приоритет">
        <div className="grid grid-cols-2 gap-1.5">
          {menuPriorityOptions.map((option, optionIndex) => {
            const itemIndex = priorityOffset + optionIndex;

            return (
            <MenuButton
              key={option.value}
              active={card.priority === option.value}
              isKeyboardActive={activeIndex === itemIndex}
              itemProps={getItemProps(itemIndex)}
              onClick={() => save({ priority: option.value })}
            >
              <Flag
                aria-hidden="true"
                className="shrink-0"
                size={15}
                style={{ color: card.priority === option.value ? "currentColor" : option.color }}
              />
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </MenuButton>
            );
          })}
        </div>
      </MenuSection>

      <MenuSection title="Старт / срок">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-medium text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" size={14} />
              Старт
            </span>
            <input
              className="h-10 rounded-lg border border-white/10 bg-control/55 px-2 text-sm text-text"
              type="date"
              value={card.startDate ?? ""}
              onChange={(event) =>
                save({ startDate: event.currentTarget.value || undefined })
              }
            />
          </label>
          <label className="grid gap-1.5 text-xs font-medium text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden="true" size={14} />
              Срок
            </span>
            <input
              className="h-10 rounded-lg border border-white/10 bg-control/55 px-2 text-sm text-text"
              type="date"
              value={card.dueDate ?? ""}
              onChange={(event) =>
                save({ dueDate: event.currentTarget.value || undefined })
              }
            />
          </label>
        </div>
      </MenuSection>

      <MenuSection title="Метки">
        {boardLabels.length > 0 ? (
          <div className="grid gap-1.5">
            {boardLabels.map((label, labelIndex) => {
              const itemIndex = labelOffset + labelIndex;

              return (
              <MenuButton
                key={label.id}
                active={card.labelIds.includes(label.id)}
                isKeyboardActive={activeIndex === itemIndex}
                itemProps={getItemProps(itemIndex)}
                onClick={() => toggleLabel(label.id)}
              >
                <span
                  aria-hidden="true"
                  className="size-3 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span className="min-w-0 flex-1 truncate">{label.name}</span>
              </MenuButton>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-white/12 px-3 py-3 text-center text-xs text-text-muted">
            Метки ещё не созданы.
          </p>
        )}
      </MenuSection>

      <MenuSection title="Обложка">
        <div className="grid grid-cols-[repeat(8,minmax(0,1fr))] gap-1.5">
          <button
            {...getItemProps(coverOffset)}
            className={cn(
              "grid aspect-square place-items-center rounded-lg border border-white/10 bg-control/60 text-text-muted transition hover:bg-control-hover hover:text-text",
              (!card.cover || activeIndex === coverOffset) && "ring-2 ring-accent",
            )}
            title="Без обложки"
            type="button"
            onClick={() => setCover(undefined)}
          >
            <CircleOff aria-hidden="true" size={15} />
          </button>
          {menuCoverColors.map((color, colorIndex) => {
            const itemIndex = coverOffset + 1 + colorIndex;

            return (
            <button
              key={color}
              {...getItemProps(itemIndex)}
              className={cn(
                "aspect-square rounded-lg border border-white/10 transition hover:scale-105",
                ((card.cover?.type === "color" && card.cover.color === color) ||
                  activeIndex === itemIndex) &&
                  "ring-2 ring-white",
              )}
              style={{ backgroundColor: color }}
              title={color}
              type="button"
              onClick={() => setCover({ type: "color", color })}
            />
            );
          })}
        </div>
      </MenuSection>

      {customFieldTemplates.length > 0 ? (
        <MenuSection title="Доп. поля">
          <div className="grid gap-1.5">
            {customFieldTemplates.map((template, templateIndex) => {
              const isActive = card.customFields.some((field) => field.name === template.name);
              const itemIndex = customFieldOffset + templateIndex;

              return (
                <MenuButton
                  key={template.id}
                  active={isActive}
                  isKeyboardActive={activeIndex === itemIndex}
                  itemProps={getItemProps(itemIndex)}
                  onClick={() => addCustomFieldFromTemplate(template)}
                >
                  <Rows3 aria-hidden="true" className="shrink-0" size={15} />
                  <span className="min-w-0 flex-1 truncate">{template.name}</span>
                </MenuButton>
              );
            })}
          </div>
        </MenuSection>
      ) : null}

      {checklistTemplates.length > 0 ? (
        <MenuSection title="Чек-листы">
          <div className="grid gap-1.5">
            {checklistTemplates.map((template, templateIndex) => {
              const itemIndex = checklistOffset + templateIndex;

              return (
              <MenuButton
                key={template.id}
                isKeyboardActive={activeIndex === itemIndex}
                itemProps={getItemProps(itemIndex)}
                onClick={() => onCreateChecklist(card.id, template.title)}
              >
                <Rows3 aria-hidden="true" className="shrink-0" size={15} />
                <span className="min-w-0 flex-1 truncate">{template.title}</span>
              </MenuButton>
              );
            })}
          </div>
        </MenuSection>
      ) : null}

      <MenuSection title="Действия">
        <div className="grid gap-1.5">
          <MenuButton
            isKeyboardActive={activeIndex === actionsOffset}
            itemProps={getItemProps(actionsOffset)}
            onClick={() => onOpen(card.id)}
          >
            <ExternalLink aria-hidden="true" size={15} />
            Открыть редактирование
          </MenuButton>
          <MenuButton
            isKeyboardActive={activeIndex === actionsOffset + 1}
            itemProps={getItemProps(actionsOffset + 1)}
            onClick={() => onDuplicate(card.id)}
          >
            <Copy aria-hidden="true" size={15} />
            Создать копию
          </MenuButton>
          <MenuButton
            isKeyboardActive={activeIndex === actionsOffset + 2}
            itemProps={getItemProps(actionsOffset + 2)}
            onClick={() => onArchive(card.id)}
          >
            <Archive aria-hidden="true" size={15} />
            Архивировать
          </MenuButton>
          <MenuButton
            danger
            isKeyboardActive={activeIndex === actionsOffset + 3}
            itemProps={getItemProps(actionsOffset + 3)}
            onClick={() => onDelete(card.id)}
          >
            <Trash2 aria-hidden="true" size={15} />
            Удалить
          </MenuButton>
        </div>
      </MenuSection>
    </div>
  );
}
