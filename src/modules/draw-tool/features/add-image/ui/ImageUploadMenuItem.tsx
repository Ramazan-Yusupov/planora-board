import { ImagePlus } from "lucide-react";
import { useRef, useState } from "react";
import { Button, Tooltip } from "@/modules/draw-tool/shared/ui";
import { addImageFiles } from "../model/addImageFiles";
import { getViewportImageAnchor } from "../model/getViewportImageAnchor";

type ImageUploadMenuItemProps = {
  onImageAdded?: () => void;
  variant?: "default" | "icon";
};

/** Opens a file picker from the More tools menu and inserts selected images. */
export function ImageUploadMenuItem({
  onImageAdded,
  variant = "default",
}: ImageUploadMenuItemProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) {
      return;
    }

    setError(null);

    try {
      await addImageFiles(files, getViewportImageAnchor());
      onImageAdded?.();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Не удалось добавить изображение.",
      );
    }
  }

  const button =
    variant === "icon" ? (
      <Tooltip content="Вставить изображение (Ctrl/⌘V)" side="top">
        <Button
          aria-label="Вставить изображение"
          className="group relative grid size-12 place-items-center rounded-xl text-text hover:bg-control hover:shadow-sm focus-visible:bg-control"
          onClick={() => inputRef.current?.click()}
          title="Вставить изображение (Ctrl/⌘V)"
          type="button"
        >
          <ImagePlus
            className="text-text-muted transition-colors group-hover:text-text"
            size={24}
          />
        </Button>
      </Tooltip>
    ) : (
      <Button
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-control"
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <ImagePlus size={17} />
        <span className="flex-1">Вставить изображение</span>
        <kbd className="text-xs text-text-muted">Ctrl/⌘V</kbd>
      </Button>
    );

  return (
    <div className="relative">
      {button}

      <input
        accept="image/*"
        className="hidden"
        multiple
        onChange={(event) => {
          void handleFiles(event.currentTarget.files);
          event.currentTarget.value = "";
        }}
        ref={inputRef}
        type="file"
      />

      {error && (
        <p className="absolute left-0 top-full z-[100] mt-1 w-64 rounded-md border border-red-500/30 bg-panel px-2 py-1 text-xs text-red-500 shadow-panel">
          {error}
        </p>
      )}
    </div>
  );
}

