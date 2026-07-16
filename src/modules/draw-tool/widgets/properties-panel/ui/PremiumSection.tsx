import type { AdvancedElement } from "@/modules/draw-tool/entities/element";
import { updateElement } from "@/modules/draw-tool/entities/element";
import { historyStore } from "@/modules/draw-tool/entities/history";
import { sceneStore } from "@/modules/draw-tool/entities/scene";
import { Button } from "@/modules/draw-tool/shared/ui";

type PremiumSectionProps = {
  element: AdvancedElement;
};

const STATUS_PRESETS = [
  ["Draft"],
  ["In review"],
  ["Done"],
  ["Blocked"],
  ["В разработке"],
  ["Завершен"],
  ["План", "В разработке", "Завершен"],
  ["Draft", "In review", "Done"],
  ["Backlog", "Doing", "Done"],
] as const;

const TEMPLATE_PRESETS: Partial<Record<AdvancedElement["kind"], string[]>> = {
  "status-badge": ["Draft", "In review", "Done"],
  "flow-step": ["Process step", "Outcome"],
  "annotation-pin": ["Review this area"],
  "api-endpoint": ["Request", "Response", "Auth"],
  "database-cylinder": ["users", "orders", "events"],
  "org-card": ["Role", "Owner", "Contact"],
};

const BODY_FIELD_LABELS: Partial<Record<AdvancedElement["kind"], string[]>> = {
  swimlane: ["Lane 1", "Lane 2", "Lane 3"],
  "bpmn-task": ["Owner", "Input", "Output"],
  "bpmn-event": ["Event note"],
  "bpmn-gateway": ["Yes path", "No path"],
  "uml-class": ["Property", "Method"],
  "uml-actor": ["Role / system"],
  "erd-table": ["Field 1", "Field 2", "Field 3"],
  "kanban-board": ["Column 1", "Column 2", "Column 3"],
  timeline: ["Milestone 1", "Milestone 2", "Milestone 3"],
  "mindmap-node": ["Branch 1", "Branch 2", "Branch 3"],
  "cloud-service": ["Service 1", "Service 2", "Service 3"],
  wireframe: ["Header", "Content", "CTA"],
  "smart-connector": ["Source", "Target", "Rule"],
  "section-zone": ["Scope", "Owner", "Status"],
  "erd-relationship": ["Source key", "Target key"],
  "flow-step": ["Step text", "Outcome"],
  "status-badge": ["Status 1", "Status 2", "Status 3"],
  "annotation-pin": ["Annotation text"],
  "template-stamp": ["Description", "Usage"],
  "api-endpoint": ["Request", "Response", "Auth"],
  "database-cylinder": ["Table 1", "Table 2", "Table 3"],
  "org-card": ["Role", "Owner", "Contact"],
};

function updateAdvancedElement(
  elementId: string,
  patch: Partial<Pick<AdvancedElement, "body" | "title">>,
) {
  historyStore.begin();
  sceneStore.updateById(elementId, (element) =>
    element.type === "code" && "kind" in element
      ? updateElement(element, patch)
      : element,
  );
  historyStore.commit();
}

function getBodyFieldLabels(element: AdvancedElement) {
  const labels = BODY_FIELD_LABELS[element.kind] ?? [];
  const count = Math.max(labels.length, element.body.length, 1);

  return Array.from({ length: count }, (_, index) => labels[index] ?? `Строка ${index + 1}`);
}

function updateBodyItem(element: AdvancedElement, index: number, value: string) {
  const body = [...element.body];
  body[index] = value;
  updateAdvancedElement(element.id, { body });
}

export function PremiumSection({ element }: PremiumSectionProps) {
  const bodyText = element.body.join("\n");
  const preset = TEMPLATE_PRESETS[element.kind];
  const bodyFieldLabels = getBodyFieldLabels(element);

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div>
        <p className="m-0 text-sm font-medium text-text">Premium content</p>
        <p className="m-0 text-xs text-text-muted">
          Заголовок и строки рендерятся с фирменным стилем блока.
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-text-muted">Заголовок</span>
        <input
          className="h-9 w-full rounded-md border border-border bg-control px-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
          onChange={(event) =>
            updateAdvancedElement(element.id, {
              title: event.currentTarget.value,
            })
          }
          value={element.title}
        />
      </label>

      <div className="space-y-2">
        <p className="m-0 text-xs font-medium text-text-muted">Структура</p>

        {bodyFieldLabels.map((label, index) => (
          <label className="block space-y-1" key={`${element.kind}-${index}`}>
            <span className="text-xs text-text-muted">{label}</span>
            <input
              className="h-9 w-full rounded-md border border-border bg-control px-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
              onChange={(event) =>
                updateBodyItem(element, index, event.currentTarget.value)
              }
              value={element.body[index] ?? ""}
            />
          </label>
        ))}

        <div className="grid grid-cols-2 gap-1.5">
          <Button
            className="rounded-md border border-border bg-control px-2 py-2 text-xs text-text transition-colors hover:bg-surface-muted"
            onClick={() =>
              updateAdvancedElement(element.id, {
                body: [...element.body, ""],
              })
            }
            type="button"
          >
            + строка
          </Button>

          <Button
            className="rounded-md border border-border bg-control px-2 py-2 text-xs text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            disabled={element.body.length <= 1}
            onClick={() =>
              updateAdvancedElement(element.id, {
                body: element.body.slice(0, -1),
              })
            }
            type="button"
          >
            - строка
          </Button>
        </div>
      </div>

      <details className="rounded-md border border-border bg-control/40 px-2 py-2">
        <summary className="cursor-pointer text-xs font-medium text-text-muted">
          Редактировать списком
        </summary>
        <textarea
          className="mt-2 min-h-24 w-full resize-y rounded-md border border-border bg-control px-2 py-2 text-sm text-text outline-none transition-colors placeholder:text-text-muted focus:border-accent"
          onChange={(event) =>
            updateAdvancedElement(element.id, {
              body: event.currentTarget.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            })
          }
          value={bodyText}
        />
      </details>

      {preset && (
        <Button
          className="w-full rounded-md border border-border bg-control px-2 py-2 text-xs text-text transition-colors hover:bg-surface-muted"
          onClick={() => updateAdvancedElement(element.id, { body: preset })}
          type="button"
        >
          Вставить шаблон
        </Button>
      )}

      {element.kind === "status-badge" && (
        <div className="grid grid-cols-2 gap-1.5">
          {STATUS_PRESETS.map((items) => (
            <Button
              className="rounded-md border border-border bg-control px-2 py-2 text-xs text-text transition-colors hover:bg-surface-muted"
              key={items.join("-")}
              onClick={() =>
                updateAdvancedElement(element.id, { body: [...items] })
              }
              type="button"
            >
              {items.join(" / ")}
            </Button>
          ))}
        </div>
      )}
    </section>
  );
}

