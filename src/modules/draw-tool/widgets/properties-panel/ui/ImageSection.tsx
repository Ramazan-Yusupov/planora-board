import { Image as ImageIcon } from "lucide-react";
import {
  updateElement,
  type ImageElement,
  type ImageShape,
} from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { Button, RangeField, SegmentedControl } from "@/modules/draw-tool/shared/ui";

type ImageSectionProps = {
  element: ImageElement;
};

const SHAPE_ITEMS = [
  { label: "Прямоугольник", value: "rectangle" },
  { label: "Круг", value: "circle" },
] as const;

function updateImage(
  element: ImageElement,
  patch: Partial<
    Pick<
      ImageElement,
      | "cornerRadius"
      | "height"
      | "objectFit"
      | "objectPosition"
      | "shape"
      | "width"
    >
  >,
) {
  historyStore.begin();
  sceneStore.updateById(element.id, (current) =>
    current.type === "image" ? updateElement(current, patch) : current,
  );
  historyStore.commit();
}

export function ImageSection({ element }: ImageSectionProps) {
  const cornerRadius = element.cornerRadius ?? 0;
  const shape = element.shape ?? "rectangle";
  const maxRadius = Math.round(
    Math.max(
      0,
      Math.min(Math.abs(element.width), Math.abs(element.height)) / 2,
    ),
  );

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <ImageIcon size={16} />
        Изображение
      </div>

      <SegmentedControl<ImageShape>
        items={SHAPE_ITEMS}
        label="Форма"
        onChange={(shape) => updateImage(element, { shape })}
        value={shape}
      />

      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-9 rounded-md bg-control px-2 text-xs text-text transition-colors hover:bg-surface-muted"
          onClick={() => {
            const size = Math.min(
              Math.abs(element.width),
              Math.abs(element.height),
            );
            updateImage(element, { width: size, height: size });
          }}
          type="button"
        >
          1:1
        </Button>

        <Button
          className="h-9 rounded-md bg-control px-2 text-xs text-text transition-colors hover:bg-surface-muted"
          onClick={() =>
            updateImage(element, {
              width: element.originalWidth,
              height: element.originalHeight,
            })
          }
          type="button"
        >
          оригинал
        </Button>
      </div>
      {shape === "rectangle" && (
        <RangeField
          label={`Скругление: ${cornerRadius}px`}
          max={Math.max(64, maxRadius)}
          min={0}
          onChange={(cornerRadius) => updateImage(element, { cornerRadius })}
          step={1}
          value={Math.min(cornerRadius, Math.max(64, maxRadius))}
        />
      )}
    </section>
  );
}

