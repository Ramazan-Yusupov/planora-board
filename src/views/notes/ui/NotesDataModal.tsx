"use client";

import { Download, FileUp, LoaderCircle } from "lucide-react";
import { useRef, useState } from "react";

import {
  downloadNoteMarkdown,
  downloadNotesExport,
  parseNotesImport,
  type Note,
  type NotesImportResult,
} from "@/features/manage-notes";
import { Button, ConfirmDialog, Modal, Panel } from "@/shared/ui";

type NotesDataModalProps = Readonly<{
  activeNote: Note;
  isOpen: boolean;
  notes: readonly Note[];
  onClose: () => void;
  onReplaceNotes: (notes: Note[]) => void;
}>;

function getImportDescription(importResult: NotesImportResult | null): string {
  if (!importResult) {
    return "";
  }

  const sourceLabel =
    importResult.source === "workspace"
      ? "workspace backup"
      : importResult.source === "legacy"
        ? "старый notes JSON"
        : importResult.source === "markdown"
          ? "Markdown"
          : "notes backup";

  return `Будут заменены только заметки. Проекты и доски не изменятся. Источник: ${sourceLabel}. В файле: ${importResult.notes.length} заметк(и).`;
}

export function NotesDataModal({
  activeNote,
  isOpen,
  notes,
  onClose,
  onReplaceNotes,
}: NotesDataModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pendingImport, setPendingImport] = useState<NotesImportResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  if (!isOpen) {
    return null;
  }

  const chooseFile = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setIsReading(true);
    setError(null);

    try {
      setPendingImport(await parseNotesImport(file));
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Не удалось импортировать заметки.",
      );
    } finally {
      setIsReading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <>
      <Modal title="Backup заметок" onClose={onClose}>
        <div className="space-y-4">
          <Panel>
            <h3 className="text-sm font-semibold text-text">Экспорт</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Скачайте JSON только для заметок. Экспорт не включает доски,
              карточки и вложения.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Button
                className="sm:flex-1"
                variant="secondary"
                onClick={() => downloadNotesExport(notes, "note", activeNote.id)}
              >
                <Download aria-hidden="true" size={17} />
                JSON заметки
              </Button>
              <Button
                className="sm:flex-1"
                variant="secondary"
                onClick={() => downloadNoteMarkdown(activeNote)}
              >
                <Download aria-hidden="true" size={17} />
                Markdown
              </Button>
              <Button
                className="sm:flex-1"
                variant="secondary"
                onClick={() => downloadNotesExport(notes, "all")}
              >
                <Download aria-hidden="true" size={17} />
                Все заметки
              </Button>
            </div>
          </Panel>

          <Panel>
            <h3 className="text-sm font-semibold text-text">Импорт в Notes</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Импорт заменяет только заметки на этой странице. Можно выбрать
              `planora-notes` файл, Markdown или общий workspace backup, если в
              нём есть заметки.
            </p>
            <input
              ref={inputRef}
              accept="application/json,.json,text/markdown,.md,.markdown"
              className="sr-only"
              type="file"
              onChange={(event) => void chooseFile(event.target.files?.[0])}
            />
            <Button
              className="mt-3"
              disabled={isReading}
              variant="secondary"
              onClick={() => inputRef.current?.click()}
            >
              {isReading ? (
                <LoaderCircle
                  aria-hidden="true"
                  className="animate-spin"
                  size={17}
                />
              ) : (
                <FileUp aria-hidden="true" size={17} />
              )}
              Выбрать JSON
            </Button>
            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          </Panel>
        </div>
      </Modal>

      <ConfirmDialog
        confirmLabel="Заменить заметки"
        description={getImportDescription(pendingImport)}
        destructive
        isOpen={pendingImport !== null}
        title="Импортировать заметки?"
        onCancel={() => setPendingImport(null)}
        onConfirm={() => {
          if (pendingImport) {
            onReplaceNotes(pendingImport.notes);
          }
          setPendingImport(null);
          onClose();
        }}
      />
    </>
  );
}
