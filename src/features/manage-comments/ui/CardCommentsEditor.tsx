"use client";

import { MessageSquare, Pencil, Send, Trash2, X } from "lucide-react";
import { type FormEvent, useState } from "react";

import type { BoardComment } from "@/entities/board";
import { Button, IconButton, Panel, Textarea } from "@/shared/ui";

type CardCommentsEditorProps = Readonly<{
  comments: readonly BoardComment[];
  onCreateComment: (message: string) => void;
  onDeleteComment: (commentId: string) => void;
  onUpdateComment: (commentId: string, message: string) => void;
}>;

function formatCommentTime(timestamp: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function CardCommentsEditor({
  comments,
  onCreateComment,
  onDeleteComment,
  onUpdateComment,
}: CardCommentsEditorProps) {
  const [draft, setDraft] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedDraft = draft.trim();

    if (!normalizedDraft) {
      return;
    }

    onCreateComment(normalizedDraft);
    setDraft("");
  };

  return (
    <Panel>
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-text">
          <MessageSquare aria-hidden="true" size={18} />
          Комментарии
        </h3>
        <p className="mt-1 text-xs leading-5 text-text-muted">
          Фиксируйте обсуждение и решения прямо в карточке.
        </p>
      </div>

      <form className="mt-3" onSubmit={submit}>
        <label className="sr-only" htmlFor="new-card-comment">
          Новый комментарий
        </label>
        <Textarea
          id="new-card-comment"
          className="min-h-24 resize-none"
          placeholder="Напишите комментарий..."
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
              event.preventDefault();
              const normalizedDraft = draft.trim();

              if (!normalizedDraft) {
                return;
              }

              onCreateComment(normalizedDraft);
              setDraft("");
            }
          }}
        />
        <div className="mt-2 flex justify-end">
          <Button disabled={!draft.trim()} size="sm" type="submit">
            <Send aria-hidden="true" size={15} />
            Отправить
          </Button>
        </div>
      </form>

      {comments.length > 0 ? (
        <ol className="mt-4 space-y-3">
          {comments.map((comment) => {
            const isEditing = editingCommentId === comment.id;

            return (
              <li key={comment.id} className="rounded-xl border border-white/10 bg-control/25 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-text">{comment.authorName}</p>
                    <p className="mt-0.5 text-xs text-text-muted tabular-nums">
                      {formatCommentTime(comment.createdAt)}
                      {comment.updatedAt !== comment.createdAt ? " · изменено" : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <IconButton
                      className="text-text-muted hover:bg-control hover:text-text"
                      label="Редактировать комментарий"
                      size="sm"
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditingDraft(comment.message);
                      }}
                    >
                      <Pencil aria-hidden="true" size={14} />
                    </IconButton>
                    <IconButton
                      className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                      label="Удалить комментарий"
                      size="sm"
                      onClick={() => onDeleteComment(comment.id)}
                    >
                      <Trash2 aria-hidden="true" size={14} />
                    </IconButton>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-3">
                    <Textarea
                      autoFocus
                      className="min-h-24 resize-none"
                      value={editingDraft}
                      onChange={(event) => setEditingDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          event.preventDefault();
                          setEditingCommentId(null);
                          setEditingDraft("");
                        }
                      }}
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingDraft("");
                        }}
                      >
                        <X aria-hidden="true" size={15} />
                        Отмена
                      </Button>
                      <Button
                        disabled={!editingDraft.trim()}
                        size="sm"
                        onClick={() => {
                          onUpdateComment(comment.id, editingDraft.trim());
                          setEditingCommentId(null);
                          setEditingDraft("");
                        }}
                      >
                        Сохранить
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-text">
                    {comment.message}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-white/15 px-3 py-3 text-sm text-text-muted">
          Комментариев пока нет.
        </p>
      )}
    </Panel>
  );
}
