"use client";

import {
  CheckSquare,
  Flag,
  Palette,
  Plus,
  Rows3,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";

import {
  BOARD_LABEL_COLOR_OPTIONS,
  CARD_COVER_COLOR_OPTIONS,
  CARD_PRIORITY_OPTIONS,
  CARD_STATUS_OPTIONS,
  type Board,
  type BoardLabel,
  type BoardLabelDraft,
  type BoardMember,
  type BoardMemberDraft,
  type BoardCardOption,
  type CardPriority,
  type CardStatus,
} from "@/entities/board";
import { cn } from "@/shared/lib";
import { Button, ConfirmDialog, IconButton, TextField } from "@/shared/ui";

const MEMBER_COLOR_OPTIONS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#475569",
] as const;

const BOARD_TOOL_LIMIT = 10;

type BoardToolsSidebarProps = Readonly<{
  board: Board;
  isOpen: boolean;
  onClose: () => void;
  onCreatePriorityOption: (name: string, color: string) => void;
  onCreateStatusOption: (name: string, color: string) => void;
  onCreateChecklistTemplate: (title: string) => void;
  onCreateCustomFieldTemplate: (name: string) => void;
  onCreateLabel: (draft: BoardLabelDraft) => BoardLabel | null;
  onCreateMember: (draft: BoardMemberDraft) => BoardMember | null;
  onDeletePriorityOption: (optionId: string) => void;
  onDeleteStatusOption: (optionId: string) => void;
  onDeleteChecklistTemplate: (templateId: string) => void;
  onDeleteCustomFieldTemplate: (templateId: string) => void;
  onDeleteLabel: (labelId: string) => void;
  onDeleteMember: (memberId: string) => void;
  onUpdateChecklistTemplate: (templateId: string, title: string) => void;
  onUpdateCoverColors: (colors: string[]) => void;
  onUpdateCustomFieldTemplate: (templateId: string, name: string) => void;
  onUpdateLabel: (labelId: string, draft: BoardLabelDraft) => void;
  onUpdateMember: (memberId: string, draft: BoardMemberDraft) => void;
  onUpdatePriorityOption: (optionId: string, name: string, color: string) => void;
  onUpdateStatusOption: (optionId: string, name: string, color: string) => void;
  onUpdatePriorityLabel: (priority: CardPriority, label: string) => void;
  onUpdateStatusLabel: (status: CardStatus, label: string) => void;
}>;

function SidebarSection({
  children,
  count,
  icon,
  limit = BOARD_TOOL_LIMIT,
  title,
}: Readonly<{
  children: ReactNode;
  count?: number;
  icon: ReactNode;
  limit?: number;
  title: string;
}>) {
  const isLimitReached = count !== undefined && count >= limit;

  return (
    <section className="rounded-xl border border-white/10 bg-control/24 p-3">
      <h3 className="flex items-center justify-between gap-3 text-sm font-semibold text-text">
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className="min-w-0 truncate">{title}</span>
        </span>
        {count !== undefined ? (
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
              isLimitReached
                ? "border-amber-300/35 bg-amber-400/12 text-amber-100"
                : "border-white/10 bg-white/8 text-text-muted",
            )}
            title={
              isLimitReached
                ? `Лимит достигнут: ${count}/${limit}`
                : `Использовано: ${count}/${limit}`
            }
          >
            {count}/{limit}
          </span>
        ) : null}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ColorSwatch({
  active,
  color,
  onClick,
}: Readonly<{ active?: boolean; color: string; onClick: () => void }>) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "size-7 rounded-full border transition hover:scale-105",
        active
          ? "border-white ring-2 ring-accent ring-offset-2 ring-offset-panel"
          : "border-white/20",
      )}
      style={{ backgroundColor: color }}
      type="button"
      onClick={onClick}
    />
  );
}

function OptionNameRows<T extends string>({
  labels,
  options,
  onSave,
}: Readonly<{
  labels: Partial<Record<T, string>>;
  options: readonly { value: T; label: string; color: string }[];
  onSave: (value: T, label: string) => void;
}>) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <div key={option.value} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-3 shrink-0 rounded-full"
            style={{ backgroundColor: option.color }}
          />
          <TextField
            aria-label={option.label}
            className="h-9"
            defaultValue={labels[option.value] ?? option.label}
            onBlur={(event) => onSave(option.value, event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
        </div>
      ))}
    </div>
  );
}

function OptionEditorRow({
  option,
  onDelete,
  onSave,
}: Readonly<{
  option: BoardCardOption;
  onDelete: () => void;
  onSave: (name: string, color: string) => void;
}>) {
  const [name, setName] = useState(option.name);
  const [color, setColor] = useState(option.color);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-panel/45 p-2">
      <input
        aria-label={`Цвет ${option.name}`}
        className="size-8 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
        type="color"
        value={color}
        onChange={(event) => {
          setColor(event.currentTarget.value.toUpperCase());
          onSave(name, event.currentTarget.value.toUpperCase());
        }}
      />
      <TextField
        aria-label={`Название ${option.name}`}
        className="h-9"
        value={name}
        onBlur={(event) => onSave(event.currentTarget.value, color)}
        onChange={(event) => setName(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.currentTarget.blur();
          }
        }}
      />
      <IconButton
        className="text-text-muted hover:bg-red-500/10 hover:text-red-300"
        label={`Удалить ${option.name}`}
        size="sm"
        onClick={onDelete}
      >
        <Trash2 aria-hidden="true" size={15} />
      </IconButton>
    </div>
  );
}

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words
    .map((word) => word[0]?.toLocaleUpperCase("ru-RU") ?? "")
    .join("");
}

export function BoardToolsSidebar({
  board,
  isOpen,
  onClose,
  onCreatePriorityOption,
  onCreateStatusOption,
  onCreateChecklistTemplate,
  onCreateCustomFieldTemplate,
  onCreateLabel,
  onCreateMember,
  onDeletePriorityOption,
  onDeleteStatusOption,
  onDeleteChecklistTemplate,
  onDeleteCustomFieldTemplate,
  onDeleteLabel,
  onDeleteMember,
  onUpdateChecklistTemplate,
  onUpdateCoverColors,
  onUpdateCustomFieldTemplate,
  onUpdateLabel,
  onUpdateMember,
  onUpdatePriorityOption,
  onUpdateStatusOption,
  onUpdatePriorityLabel,
  onUpdateStatusLabel,
}: BoardToolsSidebarProps) {
  const labelNameId = useId();
  const memberNameId = useId();
  const fieldTemplateId = useId();
  const checklistTemplateId = useId();
  const statusNameId = useId();
  const priorityNameId = useId();
  const [statusName, setStatusName] = useState("");
  const [statusColor, setStatusColor] = useState("#38BDF8");
  const [priorityName, setPriorityName] = useState("");
  const [priorityColor, setPriorityColor] = useState("#F59E0B");
  const [labelName, setLabelName] = useState("");
  const [labelColor, setLabelColor] = useState<string>(
    BOARD_LABEL_COLOR_OPTIONS[0].value,
  );
  const [memberName, setMemberName] = useState("");
  const [memberColor, setMemberColor] = useState<string>(
    MEMBER_COLOR_OPTIONS[0],
  );
  const [fieldTemplateName, setFieldTemplateName] = useState("");
  const [checklistTemplateTitle, setChecklistTemplateTitle] = useState("");
  const [coverColor, setCoverColor] = useState<string>(
    CARD_COVER_COLOR_OPTIONS[0],
  );
  const [labelIdToDelete, setLabelIdToDelete] = useState<string | null>(null);
  const boardLabels = board.labelIds.flatMap((labelId) => {
    const label = board.labels[labelId];
    return label ? [label] : [];
  });
  const boardMembers = board.memberIds.flatMap((memberId) => {
    const member = board.members[memberId];
    return member ? [member] : [];
  });
  const labelToDelete = labelIdToDelete
    ? board.labels[labelIdToDelete]
    : undefined;
  const coverColors = board.coverColors;
  const statusOptionsCount = CARD_STATUS_OPTIONS.length + board.cardStatuses.length;
  const priorityOptionsCount =
    CARD_PRIORITY_OPTIONS.length + board.cardPriorities.length;
  const canCreateStatus = statusOptionsCount < BOARD_TOOL_LIMIT;
  const canCreatePriority = priorityOptionsCount < BOARD_TOOL_LIMIT;
  const canCreateLabel = boardLabels.length < BOARD_TOOL_LIMIT;
  const canCreateMember = boardMembers.length < BOARD_TOOL_LIMIT;
  const canCreateFieldTemplate =
    board.customFieldTemplates.length < BOARD_TOOL_LIMIT;
  const canCreateChecklistTemplate =
    board.checklistTemplates.length < BOARD_TOOL_LIMIT;
  const canCreateCoverColor = coverColors.length < BOARD_TOOL_LIMIT;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  const createLabel = () => {
    if (!canCreateLabel) {
      return;
    }

    const createdLabel = onCreateLabel({ name: labelName, color: labelColor });

    if (!createdLabel) {
      return;
    }

    setLabelName("");
    setLabelColor(BOARD_LABEL_COLOR_OPTIONS[0].value);
  };

  const createMember = () => {
    if (!canCreateMember) {
      return;
    }

    const createdMember = onCreateMember({
      name: memberName,
      avatarColor: memberColor,
    });

    if (!createdMember) {
      return;
    }

    setMemberName("");
    setMemberColor(MEMBER_COLOR_OPTIONS[0]);
  };

  const createFieldTemplate = () => {
    if (!canCreateFieldTemplate) {
      return;
    }

    onCreateCustomFieldTemplate(fieldTemplateName);
    setFieldTemplateName("");
  };

  const createChecklistTemplate = () => {
    if (!canCreateChecklistTemplate) {
      return;
    }

    onCreateChecklistTemplate(checklistTemplateTitle);
    setChecklistTemplateTitle("");
  };

  const addCoverColor = () => {
    if (!canCreateCoverColor) {
      return;
    }

    onUpdateCoverColors([...coverColors, coverColor]);
  };
  const createStatusOption = () => {
    if (!canCreateStatus) {
      return;
    }

    onCreateStatusOption(statusName, statusColor);
    setStatusName("");
  };
  const createPriorityOption = () => {
    if (!canCreatePriority) {
      return;
    }

    onCreatePriorityOption(priorityName, priorityColor);
    setPriorityName("");
  };

  return (
    <aside
      aria-label="Инструменты доски"
      className={cn(
        "absolute inset-y-0 right-0 z-40 flex w-[min(92vw,26rem)] shrink-0 flex-col border-r border-white/10 bg-panel/95 shadow-2xl backdrop-blur-xl transition-transform duration-200",
        isOpen ? "translate-x-0" : "translate-x-full",
      )}
    >
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            Доска
          </p>
          <h2 className="mt-1 text-base font-semibold text-text">
            Board tools
          </h2>
        </div>
        <IconButton
          className="text-text-muted hover:bg-control hover:text-text"
          label="Закрыть инструменты доски"
          size="lg"
          onClick={onClose}
        >
          <X aria-hidden="true" size={20} />
        </IconButton>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        <SidebarSection
          count={statusOptionsCount}
          icon={<Rows3 aria-hidden="true" size={18} />}
          title="Статусы"
        >
          <OptionNameRows
            labels={board.cardStatusLabels}
            options={CARD_STATUS_OPTIONS}
            onSave={onUpdateStatusLabel}
          />
          <div className="mt-3 grid gap-2">
            <div className="flex gap-2">
              <input
                aria-label="Цвет нового статуса"
                className="size-10 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                type="color"
                value={statusColor}
                onChange={(event) => setStatusColor(event.currentTarget.value.toUpperCase())}
              />
              <TextField
                id={statusNameId}
                placeholder="Новый статус"
                value={statusName}
                onChange={(event) => setStatusName(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    createStatusOption();
                  }
                }}
              />
              <Button
                disabled={!statusName.trim() || !canCreateStatus}
                size="sm"
                title={
                  canCreateStatus
                    ? "Создать статус"
                    : `Лимит статусов достигнут: ${statusOptionsCount}/${BOARD_TOOL_LIMIT}`
                }
                onClick={createStatusOption}
              >
                <Plus aria-hidden="true" size={16} />
              </Button>
            </div>
            {board.cardStatuses.map((option) => (
              <OptionEditorRow
                key={option.id}
                option={option}
                onDelete={() => onDeleteStatusOption(option.id)}
                onSave={(name, color) => onUpdateStatusOption(option.id, name, color)}
              />
            ))}
          </div>
        </SidebarSection>

        <SidebarSection
          count={priorityOptionsCount}
          icon={<Flag aria-hidden="true" size={18} />}
          title="Приоритеты"
        >
          <OptionNameRows
            labels={board.cardPriorityLabels}
            options={CARD_PRIORITY_OPTIONS}
            onSave={onUpdatePriorityLabel}
          />
          <div className="mt-3 grid gap-2">
            <div className="flex gap-2">
              <input
                aria-label="Цвет нового приоритета"
                className="size-10 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                type="color"
                value={priorityColor}
                onChange={(event) => setPriorityColor(event.currentTarget.value.toUpperCase())}
              />
              <TextField
                id={priorityNameId}
                placeholder="Новый приоритет"
                value={priorityName}
                onChange={(event) => setPriorityName(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    createPriorityOption();
                  }
                }}
              />
              <Button
                disabled={!priorityName.trim() || !canCreatePriority}
                size="sm"
                title={
                  canCreatePriority
                    ? "Создать приоритет"
                    : `Лимит приоритетов достигнут: ${priorityOptionsCount}/${BOARD_TOOL_LIMIT}`
                }
                onClick={createPriorityOption}
              >
                <Plus aria-hidden="true" size={16} />
              </Button>
            </div>
            {board.cardPriorities.map((option) => (
              <OptionEditorRow
                key={option.id}
                option={option}
                onDelete={() => onDeletePriorityOption(option.id)}
                onSave={(name, color) => onUpdatePriorityOption(option.id, name, color)}
              />
            ))}
          </div>
        </SidebarSection>

        <SidebarSection
          count={boardLabels.length}
          icon={<Tag aria-hidden="true" size={18} />}
          title="Метки"
        >
          <div className="grid gap-2">
            <TextField
              id={labelNameId}
              placeholder="Название метки"
              value={labelName}
              onChange={(event) => setLabelName(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createLabel();
                }
              }}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {BOARD_LABEL_COLOR_OPTIONS.map((option) => (
                <ColorSwatch
                  key={option.value}
                  active={labelColor === option.value}
                  color={option.value}
                  onClick={() => setLabelColor(option.value)}
                />
              ))}
              <Button
                disabled={!labelName.trim() || !canCreateLabel}
                size="sm"
                title={
                  canCreateLabel
                    ? "Создать метку"
                    : `Лимит меток достигнут: ${boardLabels.length}/${BOARD_TOOL_LIMIT}`
                }
                onClick={createLabel}
              >
                <Plus aria-hidden="true" size={16} />
                Создать
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            {boardLabels.map((label) => (
              <div
                key={label.id}
                className="flex items-center gap-2 rounded-lg border border-white/8 bg-panel/45 p-2"
              >
                <input
                  aria-label={`Цвет метки ${label.name}`}
                  className="size-8 shrink-0 cursor-pointer rounded-lg border border-white/10 bg-transparent"
                  type="color"
                  value={label.color}
                  onChange={(event) =>
                    onUpdateLabel(label.id, {
                      name: label.name,
                      color: event.currentTarget.value,
                    })
                  }
                />
                <TextField
                  aria-label={`Название метки ${label.name}`}
                  className="h-9"
                  defaultValue={label.name}
                  onBlur={(event) =>
                    onUpdateLabel(label.id, {
                      name: event.currentTarget.value,
                      color: label.color,
                    })
                  }
                />
                <IconButton
                  className="text-text-muted hover:bg-red-500/10 hover:text-red-300"
                  label={`Удалить метку ${label.name}`}
                  size="sm"
                  onClick={() => setLabelIdToDelete(label.id)}
                >
                  <Trash2 aria-hidden="true" size={15} />
                </IconButton>
              </div>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection
          count={boardMembers.length}
          icon={<Users aria-hidden="true" size={18} />}
          title="Участники"
        >
          <div className="grid gap-2">
            <TextField
              id={memberNameId}
              placeholder="Имя или роль"
              value={memberName}
              onChange={(event) => setMemberName(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createMember();
                }
              }}
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {MEMBER_COLOR_OPTIONS.map((color) => (
                <ColorSwatch
                  key={color}
                  active={memberColor === color}
                  color={color}
                  onClick={() => setMemberColor(color)}
                />
              ))}
              <Button
                disabled={!memberName.trim() || !canCreateMember}
                size="sm"
                title={
                  canCreateMember
                    ? "Создать участника"
                    : `Лимит участников достигнут: ${boardMembers.length}/${BOARD_TOOL_LIMIT}`
                }
                onClick={createMember}
              >
                <Plus aria-hidden="true" size={16} />
                Создать
              </Button>
            </div>
          </div>

          <div className="mt-3 grid gap-2">
            {boardMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 rounded-lg border border-white/8 bg-panel/45 p-2"
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: member.avatarColor }}
                >
                  {getInitials(member.name)}
                </span>
                <TextField
                  aria-label={`Имя участника ${member.name}`}
                  className="h-9"
                  defaultValue={member.name}
                  onBlur={(event) =>
                    onUpdateMember(member.id, {
                      name: event.currentTarget.value,
                      avatarColor: member.avatarColor,
                    })
                  }
                />
                <IconButton
                  className="text-text-muted hover:bg-red-500/10 hover:text-red-300"
                  label={`Удалить участника ${member.name}`}
                  size="sm"
                  onClick={() => onDeleteMember(member.id)}
                >
                  <Trash2 aria-hidden="true" size={15} />
                </IconButton>
              </div>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection
          count={board.customFieldTemplates.length}
          icon={<Rows3 aria-hidden="true" size={18} />}
          title="Дополнительные поля"
        >
          <div className="flex gap-2">
            <TextField
              id={fieldTemplateId}
              placeholder="Например, Риск"
              value={fieldTemplateName}
              onChange={(event) =>
                setFieldTemplateName(event.currentTarget.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createFieldTemplate();
                }
              }}
            />
            <Button
              disabled={!fieldTemplateName.trim() || !canCreateFieldTemplate}
              size="sm"
              title={
                canCreateFieldTemplate
                  ? "Создать поле"
                  : `Лимит полей достигнут: ${board.customFieldTemplates.length}/${BOARD_TOOL_LIMIT}`
              }
              onClick={createFieldTemplate}
            >
              <Plus aria-hidden="true" size={16} />
            </Button>
          </div>
          <div className="mt-3 grid gap-2">
            {board.customFieldTemplates.map((template) => (
              <div key={template.id} className="flex items-center gap-2">
                <TextField
                  aria-label={`Шаблон поля ${template.name}`}
                  className="h-9"
                  defaultValue={template.name}
                  onBlur={(event) =>
                    onUpdateCustomFieldTemplate(
                      template.id,
                      event.currentTarget.value,
                    )
                  }
                />
                <IconButton
                  className="text-text-muted hover:bg-red-500/10 hover:text-red-300"
                  label={`Удалить поле ${template.name}`}
                  size="sm"
                  onClick={() => onDeleteCustomFieldTemplate(template.id)}
                >
                  <Trash2 aria-hidden="true" size={15} />
                </IconButton>
              </div>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection
          count={board.checklistTemplates.length}
          icon={<CheckSquare aria-hidden="true" size={18} />}
          title="Чек-листы"
        >
          <div className="flex gap-2">
            <TextField
              id={checklistTemplateId}
              placeholder="Например, Definition of Done"
              value={checklistTemplateTitle}
              onChange={(event) =>
                setChecklistTemplateTitle(event.currentTarget.value)
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  createChecklistTemplate();
                }
              }}
            />
            <Button
              disabled={!checklistTemplateTitle.trim() || !canCreateChecklistTemplate}
              size="sm"
              title={
                canCreateChecklistTemplate
                  ? "Создать чек-лист"
                  : `Лимит чек-листов достигнут: ${board.checklistTemplates.length}/${BOARD_TOOL_LIMIT}`
              }
              onClick={createChecklistTemplate}
            >
              <Plus aria-hidden="true" size={16} />
            </Button>
          </div>
          <div className="mt-3 grid gap-2">
            {board.checklistTemplates.map((template) => (
              <div key={template.id} className="flex items-center gap-2">
                <TextField
                  aria-label={`Шаблон чек-листа ${template.title}`}
                  className="h-9"
                  defaultValue={template.title}
                  onBlur={(event) =>
                    onUpdateChecklistTemplate(
                      template.id,
                      event.currentTarget.value,
                    )
                  }
                />
                <IconButton
                  className="text-text-muted hover:bg-red-500/10 hover:text-red-300"
                  label={`Удалить чек-лист ${template.title}`}
                  size="sm"
                  onClick={() => onDeleteChecklistTemplate(template.id)}
                >
                  <Trash2 aria-hidden="true" size={15} />
                </IconButton>
              </div>
            ))}
          </div>
        </SidebarSection>

        <SidebarSection
          count={coverColors.length}
          icon={<Palette aria-hidden="true" size={18} />}
          title="Обложки"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {coverColors.map((color) => (
              <button
                key={color}
                className="size-8 rounded-lg border border-white/10"
                style={{ backgroundColor: color }}
                type="button"
                onClick={() =>
                  onUpdateCoverColors(
                    coverColors.filter(
                      (currentColor) => currentColor !== color,
                    ),
                  )
                }
              />
            ))}
            <input
              aria-label="Новый цвет обложки"
              className="size-8 cursor-pointer rounded-lg border border-white/10 bg-transparent"
              type="color"
              value={coverColor}
              onChange={(event) =>
                setCoverColor(event.currentTarget.value.toUpperCase())
              }
            />
            <Button
              disabled={!canCreateCoverColor}
              size="sm"
              title={
                canCreateCoverColor
                  ? "Добавить цвет обложки"
                  : `Лимит цветов достигнут: ${coverColors.length}/${BOARD_TOOL_LIMIT}`
              }
              variant="secondary"
              onClick={addCoverColor}
            >
              <Plus aria-hidden="true" size={16} />
              Цвет
            </Button>
          </div>
        </SidebarSection>
      </div>

      <ConfirmDialog
        confirmLabel="Удалить метку"
        description={
          labelToDelete
            ? `Метка «${labelToDelete.name}» будет удалена из проекта и всех карточек.`
            : "Метка будет удалена."
        }
        destructive
        isOpen={Boolean(labelToDelete)}
        title="Удалить метку?"
        onCancel={() => setLabelIdToDelete(null)}
        onConfirm={() => {
          if (labelToDelete) {
            onDeleteLabel(labelToDelete.id);
          }
          setLabelIdToDelete(null);
        }}
      />
    </aside>
  );
}
