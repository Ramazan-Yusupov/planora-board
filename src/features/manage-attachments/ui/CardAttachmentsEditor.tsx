"use client";

import {
  Download,
  FilePlus2,
  FileText,
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  CARD_COVER_COLOR_OPTIONS,
  formatAttachmentSize,
  isImageAttachment,
  loadAttachmentBlob,
  saveAttachmentBlob,
  type BoardAttachment,
  type CardCover,
} from "@/entities/board";
import { Button, IconButton, Panel } from "@/shared/ui";

import {
  createBoardAttachment,
  MAX_ATTACHMENT_SIZE,
} from "../lib/attachmentOperations";

type AttachmentThumbnailProps = Readonly<{
  attachment: BoardAttachment;
  className?: string;
}>;

function AttachmentThumbnail({ attachment, className }: AttachmentThumbnailProps) {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let disposed = false;

    void loadAttachmentBlob(attachment.id).then((blob) => {
      if (!blob || disposed) {
        return;
      }

      objectUrl = URL.createObjectURL(blob);
      setSource(objectUrl);
    });

    return () => {
      disposed = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachment.id]);

  if (!source) {
    return <span className={className} aria-hidden="true" />;
  }

  // Blob URLs from IndexedDB are not handled by Next Image optimisation.
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" className={className} src={source} />;
}

function downloadAttachment(attachment: BoardAttachment) {
  void loadAttachmentBlob(attachment.id).then((blob) => {
    if (!blob) {
      return;
    }

    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = attachment.name;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  });
}

type CardAttachmentsEditorProps = Readonly<{
  cardId: string;
  attachments: readonly BoardAttachment[];
  cover: CardCover | undefined;
  onAddAttachment: (attachment: BoardAttachment) => void;
  onChangeCover: (cover: CardCover | undefined) => void;
  onDeleteAttachment: (attachmentId: string) => void;
}>;

export function CardAttachmentsEditor({
  cardId,
  attachments,
  cover,
  onAddAttachment,
  onChangeCover,
  onDeleteAttachment,
}: CardAttachmentsEditorProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const selectedFiles = [...files];
    const oversizedFile = selectedFiles.find((file) => file.size > MAX_ATTACHMENT_SIZE);

    if (oversizedFile) {
      setError(`«${oversizedFile.name}» больше 10 МБ.`);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      for (const file of selectedFiles) {
        const attachment = createBoardAttachment(cardId, file);
        await saveAttachmentBlob(attachment.id, file);
        onAddAttachment(attachment);
      }
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? `Не удалось добавить файл: ${uploadError.message}`
          : "Не удалось добавить файл.",
      );
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-3">
      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-text">Обложка</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Цвет или изображение из вложений.
            </p>
          </div>
          {cover ? (
            <Button size="sm" variant="ghost" onClick={() => onChangeCover(undefined)}>
              <X aria-hidden="true" size={15} />
              Убрать
            </Button>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {CARD_COVER_COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              aria-label={`Выбрать обложку ${color}`}
              aria-pressed={cover?.type === "color" && cover.color === color}
              className="size-8 rounded-lg border border-white/20 transition focus-visible:outline-offset-2"
              style={{ backgroundColor: color }}
              type="button"
              onClick={() => onChangeCover({ type: "color", color })}
            />
          ))}
        </div>

        {attachments.some(isImageAttachment) ? (
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {attachments.filter(isImageAttachment).map((attachment) => (
              <button
                key={attachment.id}
                aria-label={`Сделать «${attachment.name}» обложкой`}
                aria-pressed={
                  cover?.type === "attachment" && cover.attachmentId === attachment.id
                }
                className="relative aspect-square overflow-hidden rounded-xl border border-white/15 bg-panel transition hover:border-accent focus-visible:outline-offset-2"
                type="button"
                onClick={() =>
                  onChangeCover({ type: "attachment", attachmentId: attachment.id })
                }
              >
                <AttachmentThumbnail
                  attachment={attachment}
                  className="size-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
      </Panel>

      <Panel>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-text">Вложения</h3>
            <p className="mt-1 text-xs leading-5 text-text-muted">
              Файлы хранятся локально в браузере. Максимум 10 МБ на файл.
            </p>
          </div>
          <input
            ref={inputRef}
            className="sr-only"
            multiple
            type="file"
            onChange={(event) => void uploadFiles(event.target.files)}
          />
          <Button disabled={isUploading} size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
            {isUploading ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={16} />
            ) : (
              <FilePlus2 aria-hidden="true" size={16} />
            )}
            Добавить файл
          </Button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        {attachments.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-white/15 px-3 py-3 text-sm text-text-muted">
            Вложений пока нет.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-panel/45 p-2"
              >
                {isImageAttachment(attachment) ? (
                  <AttachmentThumbnail
                    attachment={attachment}
                    className="size-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-control text-text-muted">
                    <FileText aria-hidden="true" size={19} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text" title={attachment.name}>
                    {attachment.name}
                  </p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatAttachmentSize(attachment.size)}
                  </p>
                </div>
                <IconButton
                  className="text-text-muted hover:bg-control hover:text-text"
                  label={`Скачать ${attachment.name}`}
                  size="sm"
                  onClick={() => downloadAttachment(attachment)}
                >
                  <Download aria-hidden="true" size={16} />
                </IconButton>
                <IconButton
                  className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  label={`Удалить ${attachment.name}`}
                  size="sm"
                  onClick={() => onDeleteAttachment(attachment.id)}
                >
                  <Trash2 aria-hidden="true" size={16} />
                </IconButton>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
