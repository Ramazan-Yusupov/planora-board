import { ArrowRightLeft, Route, Spline } from "lucide-react";
import type { ArrowRouting } from "@/modules/draw-tool/entities/element";
import { Button, SegmentedControl } from "@/modules/draw-tool/shared/ui";

const ARROW_ROUTING_ITEMS = [
  {
    label: "Прямая стрелка",
    value: "straight",
    icon: ArrowRightLeft,
    iconOnly: true,
  },
  {
    label: "Сгибающаяся стрелка",
    value: "elbow",
    icon: Route,
    iconOnly: true,
  },
  {
    label: "Плавная сгибающаяся стрелка",
    value: "curve",
    icon: Spline,
    iconOnly: true,
  },
] as const;

type ArrowRoutingSectionProps = {
  routing: ArrowRouting;
  showElbowAxisToggle: boolean;
  onChange: (routing: ArrowRouting) => void;
  onToggleElbowAxis: () => void;
};

export function ArrowRoutingSection({
  routing,
  showElbowAxisToggle,
  onChange,
  onToggleElbowAxis,
}: ArrowRoutingSectionProps) {
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <ArrowRightLeft size={16} />
        Тип стрелки
      </div>

      <SegmentedControl<ArrowRouting>
        items={ARROW_ROUTING_ITEMS}
        label="Маршрут"
        onChange={onChange}
        value={routing}
      />

      {showElbowAxisToggle && (
        <Button
          className="mt-2 w-full rounded-md border border-border bg-control px-2 py-2 text-xs text-text transition-colors hover:bg-surface-muted"
          onClick={onToggleElbowAxis}
          type="button"
        >
          Поменять направление сгиба
        </Button>
      )}
    </section>
  );
}

