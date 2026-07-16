import { updateElement, type MarkdownElement } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { NumberField } from "@/modules/draw-tool/shared/ui";

type MarkdownSectionProps = {
  element: MarkdownElement;
};

function updateMarkdown(
  element: MarkdownElement,
  patch: Partial<Pick<MarkdownElement, "content" | "fontSize" | "title">>,
) {
  historyStore.begin();
  sceneStore.updateById(element.id, (current) =>
    current.type === "markdown" ? updateElement(current, patch) : current,
  );
  historyStore.commit();
}

export function MarkdownSection({ element }: MarkdownSectionProps) {
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div>
        <p className="m-0 text-sm font-medium text-text">Markdown</p>
        <p className="m-0 text-xs text-text-muted">
          Редактируемая заметка рядом с диаграммой.
        </p>
      </div>

      <label className="block space-y-1 text-xs text-text-muted">
        <span>Заголовок</span>
        <input
          className="h-9 w-full rounded-md border border-border bg-control px-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
          onChange={(event) =>
            updateMarkdown(element, {
              title: event.currentTarget.value || "Markdown note",
            })
          }
          value={element.title}
        />
      </label>

      <label className="block space-y-1 text-xs text-text-muted">
        <span>Содержимое</span>
        <textarea
          className="min-h-36 w-full resize-y rounded-md border border-border bg-control px-2 py-2 font-mono text-xs text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
          onChange={(event) =>
            updateMarkdown(element, { content: event.currentTarget.value })
          }
          spellCheck={false}
          value={element.content}
        />
      </label>

      <NumberField
        label="Размер текста"
        max={36}
        min={10}
        onChange={(fontSize) => updateMarkdown(element, { fontSize })}
        step={1}
        suffix="px"
        value={element.fontSize}
      />
    </section>
  );
}

