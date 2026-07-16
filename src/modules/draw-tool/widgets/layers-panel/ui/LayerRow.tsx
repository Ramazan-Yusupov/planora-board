import { Check } from "lucide-react";
import { cn } from "@/modules/draw-tool/shared/lib";
import { Button } from "@/modules/draw-tool/shared/ui";
import { ShapePreview } from "@/modules/draw-tool/widgets/board-shell/ui/ShapePreview";
import type { BoardLayer } from "../model/getLayers";

type LayerRowProps = {
  layer: BoardLayer;
  isSelected: boolean;
  isDisabled?: boolean;
  onSelect: (id: string) => void;
};

/** Clickable row representing one scene element in layer order. */
export function LayerRow({ layer, isDisabled = false, isSelected, onSelect }: LayerRowProps) {
  return (
    <Button
      className={cn(
        "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm",
        isDisabled && "opacity-50",
        isSelected ? "bg-accent/15 text-accent" : "hover:bg-control",
      )}
      disabled={isDisabled}
      onClick={() => onSelect(layer.element.id)}
      type="button"
    >
      <ShapePreview
        className="size-7 shrink-0 rounded border border-border bg-canvas"
        element={layer.element}
        size={28}
      />
      <span className="min-w-0 flex-1 truncate">{layer.label}</span>
      {isSelected && <Check aria-hidden size={15} />}
    </Button>
  );
}

