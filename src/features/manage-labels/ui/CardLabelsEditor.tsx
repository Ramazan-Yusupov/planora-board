"use client";

import { Pencil, Plus, Settings2, Tag, Trash2 } from "lucide-react";
import { useId, useState } from "react";

import {
  BOARD_LABEL_COLOR_OPTIONS,
  BoardLabelSelector,
  type BoardLabel,
  type BoardLabelDraft,
} from "@/entities/board";
import { cn } from "@/shared/lib";
import { Button, ConfirmDialog, IconButton } from "@/shared/ui";

type CardLabelsEditorProps = Readonly<{
  labels: readonly BoardLabel[];
  selectedLabelIds: readonly string[];
  onChange: (labelIds: string[]) => void;
  onCreateLabel: (draft: BoardLabelDraft) => BoardLabel | null;
  onDeleteLabel: (labelId: string) => void;
  onUpdateLabel: (labelId: string, draft: BoardLabelDraft) => void;
}>;

type LabelEditorRowProps = Readonly<{
  label: BoardLabel;
  onDelete: () => void;
  onSave: (draft: BoardLabelDraft) => void;
}>;

function LabelColorChoices({
  color,
  onChange,
}: Readonly<{
  color: string;
  onChange: (color: string) => void;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Цвет метки">
      {BOARD_LABEL_COLOR_OPTIONS.map((option) => (
        <button
          key={option.value}
          aria-label={option.label}
          aria-pressed={color.toUpperCase() === option.value}
          className={cn(
            "grid size-7 place-items-center rounded-full border-2 transition",
            color.toUpperCase() === option.value
              ? "border-white scale-110"
              : "border-transparent hover:scale-105",
          )}
          style={{ backgroundColor: option.value }}
          type="button"
          onClick={() => onChange(option.value)}
        />
      ))}
      <label className="relative grid size-7 cursor-pointer place-items-center overflow-hidden rounded-full border border-white/25" title="Свой цвет">
        <span className="sr-only">Свой цвет метки</span>
        <span
          aria-hidden="true"
          className="absolute inset-1 rounded-full"
          style={{ backgroundColor: color }}
        />
        <input
          className="absolute inset-0 cursor-pointer opacity-0"
          type="color"
          value={color}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      </label>
    </div>
  );
}

function LabelEditorRow({ label, onDelete, onSave }: LabelEditorRowProps) {
  const [name, setName] = useState(label.name);
  const [color, setColor] = useState(label.color);

  const save = () => {
    onSave({ name, color });
  };

  return (
    <li className="rounded-xl border border-white/10 bg-panel/45 p-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor={`label-name-${label.id}`}>
            Название метки
          </label>
          <input
            id={`label-name-${label.id}`}
            className="h-10 w-full rounded-lg border border-white/10 bg-control/45 px-3 text-sm text-text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                save();
              }
            }}
          />
          <div className="mt-2">
            <LabelColorChoices color={color} onChange={setColor} />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconButton
            className="text-text-muted hover:bg-control hover:text-text"
            label={`Сохранить метку «${label.name}»`}
            size="sm"
            onClick={save}
          >
            <Pencil aria-hidden="true" size={16} />
          </IconButton>
          <IconButton
            className="text-text-muted hover:bg-red-500/15 hover:text-red-300"
            label={`Удалить метку «${label.name}»`}
            size="sm"
            onClick={onDelete}
          >
            <Trash2 aria-hidden="true" size={16} />
          </IconButton>
        </div>
      </div>
    </li>
  );
}

export function CardLabelsEditor({
  labels,
  selectedLabelIds,
  onChange,
  onCreateLabel,
  onDeleteLabel,
  onUpdateLabel,
}: CardLabelsEditorProps) {
  const [isCreationOpen, setIsCreationOpen] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState<string>(
    BOARD_LABEL_COLOR_OPTIONS[0].value,
  );
  const [creationError, setCreationError] = useState<string | null>(null);
  const [labelIdToDelete, setLabelIdToDelete] = useState<string | null>(null);
  const newLabelId = useId();
  const labelToDelete = labelIdToDelete
    ? labels.find((label) => label.id === labelIdToDelete) ?? null
    : null;

  const createLabel = () => {
    const label = onCreateLabel({ name: newLabelName, color: newLabelColor });

    if (!label) {
      setCreationError("Введите уникальное название метки.");
      return;
    }

    onChange([...selectedLabelIds, label.id]);
    setNewLabelName("");
    setNewLabelColor(BOARD_LABEL_COLOR_OPTIONS[0].value);
    setCreationError(null);
    setIsCreationOpen(false);
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-control/25 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Tag aria-hidden="true" className="text-text-muted" size={17} />
          <h3 className="text-sm font-semibold text-text">Метки</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setIsCreationOpen((current) => !current)}>
            <Plus aria-hidden="true" size={16} />
            Новая
          </Button>
          <IconButton
            className="text-text-muted hover:bg-control hover:text-text"
            label="Настроить метки проекта"
            size="sm"
            onClick={() => setIsManagerOpen((current) => !current)}
          >
            <Settings2 aria-hidden="true" size={17} />
          </IconButton>
        </div>
      </div>

      <div className="mt-3">
        <BoardLabelSelector
          labels={labels}
          selectedLabelIds={selectedLabelIds}
          onChange={onChange}
        />
      </div>

      {isCreationOpen ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-panel/50 p-3">
          <label className="sr-only" htmlFor={newLabelId}>
            Название новой метки
          </label>
          <input
            autoFocus
            id={newLabelId}
            className="h-10 w-full rounded-lg border border-white/10 bg-control/45 px-3 text-sm text-text placeholder:text-text-muted"
            placeholder="Например, На проверке"
            value={newLabelName}
            onChange={(event) => {
              setNewLabelName(event.target.value);
              setCreationError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                createLabel();
              }
              if (event.key === "Escape") {
                setIsCreationOpen(false);
                setCreationError(null);
              }
            }}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <LabelColorChoices color={newLabelColor} onChange={setNewLabelColor} />
            <Button size="sm" onClick={createLabel}>
              Создать метку
            </Button>
          </div>
          {creationError ? <p className="mt-2 text-xs text-red-300">{creationError}</p> : null}
        </div>
      ) : null}

      {isManagerOpen ? (
        <div className="mt-4 border-t border-white/10 pt-4">
          <p className="text-xs leading-5 text-text-muted">
            Переименование и изменение цвета сразу применяются ко всем карточкам проекта.
          </p>
          <ul className="mt-3 space-y-2" aria-label="Настройка меток">
            {labels.map((label) => (
              <LabelEditorRow
                key={`${label.id}-${label.updatedAt}`}
                label={label}
                onDelete={() => setLabelIdToDelete(label.id)}
                onSave={(draft) => onUpdateLabel(label.id, draft)}
              />
            ))}
          </ul>
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Удалить метку"
        description={
          labelToDelete
            ? `Метка «${labelToDelete.name}» будет удалена из проекта и всех его карточек.`
            : "Метка будет удалена из проекта и всех его карточек."
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
    </section>
  );
}
