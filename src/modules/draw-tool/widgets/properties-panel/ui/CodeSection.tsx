import { Code2 } from "lucide-react";
import { updateElement, type CodeSketchElement } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";

type CodeSectionProps = {
  element: CodeSketchElement;
};

function updateCodeSketch(
  element: CodeSketchElement,
  patch: Partial<Pick<CodeSketchElement, "code" | "language">>,
) {
  historyStore.begin();
  sceneStore.updateById(element.id, (current) =>
    current.type === "code" && !("kind" in current)
      ? updateElement(current, patch)
      : current,
  );
  historyStore.commit();
}

export function CodeSection({ element }: CodeSectionProps) {
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <Code2 size={16} />
        Код
      </div>

      <label className="block space-y-1 text-xs text-text-muted">
        <span>Язык</span>
        <input
          className="h-9 w-full rounded-md border border-border bg-control px-2 font-mono text-xs text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
          onChange={(event) =>
            updateCodeSketch(element, {
              language: event.currentTarget.value.trim() || "text",
            })
          }
          spellCheck={false}
          value={element.language}
        />
      </label>

      <label className="block space-y-1 text-xs text-text-muted">
        <span>Содержимое</span>
        <textarea
          className="min-h-36 w-full resize-y rounded-md border border-border bg-control px-2 py-2 font-mono text-xs text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
          onChange={(event) =>
            updateCodeSketch(element, { code: event.currentTarget.value })
          }
          spellCheck={false}
          value={element.code}
        />
      </label>
    </section>
  );
}

