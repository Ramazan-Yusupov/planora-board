"use client";

import { Check, Plus, Trash2, Users } from "lucide-react";
import { useId, useState } from "react";

import type {
  BoardMember,
  BoardMemberDraft,
} from "@/entities/board";
import { cn } from "@/shared/lib";
import { Button, IconButton, Panel, TextField } from "@/shared/ui";

const MEMBER_COLOR_OPTIONS = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#475569",
] as const;

type CardMembersEditorProps = Readonly<{
  members: readonly BoardMember[];
  selectedMemberIds: readonly string[];
  onCreateMember: (draft: BoardMemberDraft) => BoardMember | null;
  onDeleteMember: (memberId: string) => void;
  onToggleMember: (memberId: string) => void;
  onUpdateMember: (memberId: string, draft: BoardMemberDraft) => void;
}>;

function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word[0]?.toLocaleUpperCase("ru-RU") ?? "").join("");
}

export function CardMembersEditor({
  members,
  selectedMemberIds,
  onCreateMember,
  onDeleteMember,
  onToggleMember,
  onUpdateMember,
}: CardMembersEditorProps) {
  const nameId = useId();
  const [isAdding, setIsAdding] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [avatarColor, setAvatarColor] = useState<string>(MEMBER_COLOR_OPTIONS[0]);
  const selectedMemberIdSet = new Set(selectedMemberIds);

  const createMember = () => {
    const createdMember = onCreateMember({
      name: memberName,
      avatarColor,
    });

    if (!createdMember) {
      return;
    }

    onToggleMember(createdMember.id);
    setMemberName("");
    setAvatarColor(MEMBER_COLOR_OPTIONS[0]);
    setIsAdding(false);
  };

  return (
    <Panel>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
            <Users aria-hidden="true" size={18} />
            Участники
          </h3>
          <p className="mt-1 text-xs leading-5 text-text-muted">
            Назначайте людей или роли на карточку.
          </p>
        </div>
        {!isAdding ? (
          <Button size="sm" variant="secondary" onClick={() => setIsAdding(true)}>
            <Plus aria-hidden="true" size={16} />
            Добавить
          </Button>
        ) : null}
      </div>

      {members.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {members.map((member) => {
            const isSelected = selectedMemberIdSet.has(member.id);

            return (
              <div
                key={member.id}
                className={cn(
                  "flex min-w-0 items-center gap-2 rounded-xl border px-2 py-2 transition-[border-color,background-color]",
                  isSelected
                    ? "border-accent/55 bg-accent/10"
                    : "border-white/10 bg-control/25",
                )}
              >
                <button
                  aria-pressed={isSelected}
                  className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white shadow-sm"
                  style={{ backgroundColor: member.avatarColor }}
                  type="button"
                  onClick={() => onToggleMember(member.id)}
                >
                  {isSelected ? <Check aria-hidden="true" size={15} /> : getInitials(member.name)}
                </button>
                <TextField
                  aria-label={`Имя участника ${member.name}`}
                  className="h-9 min-w-0 flex-1 border-transparent bg-transparent px-2 text-sm"
                  value={member.name}
                  onChange={(event) =>
                    onUpdateMember(member.id, {
                      name: event.target.value,
                      avatarColor: member.avatarColor,
                    })
                  }
                />
                <IconButton
                  className="text-text-muted hover:bg-red-500/15 hover:text-red-300"
                  label={`Удалить участника ${member.name}`}
                  size="sm"
                  onClick={() => onDeleteMember(member.id)}
                >
                  <Trash2 aria-hidden="true" size={15} />
                </IconButton>
              </div>
            );
          })}
        </div>
      ) : !isAdding ? (
        <p className="mt-3 rounded-xl border border-dashed border-white/15 px-3 py-3 text-sm text-text-muted">
          Участников пока нет.
        </p>
      ) : null}

      {isAdding ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-control/25 p-3">
          <label className="sr-only" htmlFor={nameId}>
            Имя участника
          </label>
          <TextField
            autoFocus
            id={nameId}
            placeholder="Например, Мария или Backend"
            value={memberName}
            onChange={(event) => setMemberName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                createMember();
              }

              if (event.key === "Escape") {
                event.preventDefault();
                setIsAdding(false);
                setMemberName("");
              }
            }}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {MEMBER_COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                aria-label={`Цвет участника ${color}`}
                aria-pressed={avatarColor === color}
                className={cn(
                  "size-8 rounded-full border transition",
                  avatarColor === color
                    ? "border-white ring-2 ring-accent ring-offset-2 ring-offset-panel"
                    : "border-white/20 hover:border-white/60",
                )}
                style={{ backgroundColor: color }}
                type="button"
                onClick={() => setAvatarColor(color)}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAdding(false);
                setMemberName("");
              }}
            >
              Отмена
            </Button>
            <Button disabled={!memberName.trim()} size="sm" onClick={createMember}>
              Создать
            </Button>
          </div>
        </div>
      ) : null}
    </Panel>
  );
}
