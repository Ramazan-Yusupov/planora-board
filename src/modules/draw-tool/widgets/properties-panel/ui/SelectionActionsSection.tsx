import {
  BringToFront,
  Copy,
  MoveDown,
  MoveUp,
  Paintbrush,
  Pipette,
  SendToBack,
  Trash2,
} from "lucide-react";
import type { LayerAction } from "@/modules/draw-tool/features/change-layer";
import { cn } from "@/modules/draw-tool/shared/lib";
import { Button, IconButton } from "@/modules/draw-tool/shared/ui";

type SelectionActionsSectionProps = {
  canApplyStyle: boolean;
  canBringToFront: boolean;
  canMoveBackward: boolean;
  canMoveForward: boolean;
  canSendToBack: boolean;
  onApplyStyle: () => void;
  onChangeLayer: (action: LayerAction) => void;
  onCopyStyle: () => void;
  onDeleteSelection: () => void;
  onDuplicateSelection: () => void;
};

function getLayerButtonClass(isAvailable: boolean) {
  return cn(
    "grid h-9 place-items-center rounded-md transition-colors",
    isAvailable
      ? "bg-control text-text hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      : "cursor-not-allowed bg-control/60 text-text-muted/50",
  );
}

export function SelectionActionsSection({
  canApplyStyle,
  canBringToFront,
  canMoveBackward,
  canMoveForward,
  canSendToBack,
  onApplyStyle,
  onChangeLayer,
  onCopyStyle,
  onDeleteSelection,
  onDuplicateSelection,
}: SelectionActionsSectionProps) {
  return (
    <section className="space-y-3 border-t border-border pt-4">
      <p className="m-0 text-xs font-medium text-text-muted">Действия</p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          className="flex h-9 items-center justify-center gap-2 rounded-md bg-control text-xs text-text transition-colors hover:bg-surface-muted"
          onClick={onDuplicateSelection}
          title="Дублировать выбранные объекты"
          type="button"
        >
          <Copy aria-hidden size={15} />
          Копия
        </Button>

        <Button
          className="flex h-9 items-center justify-center gap-2 rounded-md bg-control text-xs text-text transition-colors hover:bg-surface-muted"
          onClick={onCopyStyle}
          title="Скопировать стиль выбранного объекта"
          type="button"
        >
          <Pipette aria-hidden size={15} />
          Стиль
        </Button>

        <Button
          className="flex h-9 items-center justify-center gap-2 rounded-md bg-control text-xs text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canApplyStyle}
          onClick={onApplyStyle}
          title="Применить скопированный стиль к выбранным объектам"
          type="button"
        >
          <Paintbrush aria-hidden size={15} />
          Вставить
        </Button>

        <Button
          className="flex h-9 items-center justify-center gap-2 rounded-md bg-red-500/20 text-xs font-medium text-red-600 transition-colors hover:bg-red-500/30 hover:text-red-700 active:scale-[0.98] active:bg-red-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50"
          onClick={onDeleteSelection}
          title="Удалить выбранные объекты"
          type="button"
        >
          <Trash2 aria-hidden size={15} />
          Удалить
        </Button>
      </div>

      <p className="m-0 pt-1 text-xs font-medium text-text-muted">
        Порядок слоёв
      </p>

      <div className="grid grid-cols-4 gap-1">
        <IconButton
          aria-label="На задний слой"
          className={getLayerButtonClass(canSendToBack)}
          disabled={!canSendToBack}
          onClick={() => onChangeLayer("back")}
          title="Поместить под все объекты этого слоя"
          type="button"
        >
          <SendToBack size={16} />
        </IconButton>

        <IconButton
          aria-label="Ниже на один слой"
          className={getLayerButtonClass(canMoveBackward)}
          disabled={!canMoveBackward}
          onClick={() => onChangeLayer("backward")}
          title="Переместить на один слой ниже"
          type="button"
        >
          <MoveDown size={16} />
        </IconButton>

        <IconButton
          aria-label="Выше на один слой"
          className={getLayerButtonClass(canMoveForward)}
          disabled={!canMoveForward}
          onClick={() => onChangeLayer("forward")}
          title="Переместить на один слой выше"
          type="button"
        >
          <MoveUp size={16} />
        </IconButton>

        <IconButton
          aria-label="На передний слой"
          className={getLayerButtonClass(canBringToFront)}
          disabled={!canBringToFront}
          onClick={() => onChangeLayer("front")}
          title="Поместить поверх всех объектов этого слоя"
          type="button"
        >
          <BringToFront size={16} />
        </IconButton>
      </div>
    </section>
  );
}

