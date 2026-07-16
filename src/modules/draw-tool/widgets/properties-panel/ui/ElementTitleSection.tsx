import type {
  AdvancedElement,
  BoardElement,
  CodeSketchElement,
  EmbedElement,
  FrameElement,
} from "@/modules/draw-tool/entities/element";
import { updateElement } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";

type TitleElement =
  | AdvancedElement
  | CodeSketchElement
  | EmbedElement
  | FrameElement;

type ElementTitleSectionProps = {
  element: TitleElement;
};

export function hasOwnTitle(
  element: BoardElement | null,
): element is TitleElement {
  return Boolean(
    element &&
    (element.type === "frame" ||
      element.type === "embed" ||
      (element.type === "code" && !("kind" in element))),
  );
}

function getTitleValue(element: TitleElement) {
  return element.type === "frame" ? element.name : element.title;
}

function updateTitle(element: TitleElement, title: string) {
  historyStore.begin();
  sceneStore.updateById(element.id, (current) => {
    if (current.type === "frame") {
      return updateElement(current, { name: title || "Frame" });
    }

    if (current.type === "embed") {
      return updateElement(current, { title: title || "Встроенная страница" });
    }

    if (current.type === "code") {
      return updateElement(current, { title: title || "Untitled" });
    }

    return current;
  });
  historyStore.commit();
}

export function ElementTitleSection({ element }: ElementTitleSectionProps) {
  return (
    <section className="space-y-2 border-t border-border pt-4">
      <div>
        <p className="m-0 text-sm font-medium text-text">Заголовок</p>
        <p className="m-0 text-xs text-text-muted">
          Для этого объекта используется title вместо label.
        </p>
      </div>

      <input
        className="h-9 w-full rounded-md border border-border bg-control px-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
        onChange={(event) => updateTitle(element, event.currentTarget.value)}
        value={getTitleValue(element)}
      />
    </section>
  );
}

