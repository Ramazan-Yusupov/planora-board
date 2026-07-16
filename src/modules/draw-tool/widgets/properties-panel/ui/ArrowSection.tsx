import { GitCommitHorizontal } from "lucide-react";
import { boardActions } from "@/modules/draw-tool/features/board-actions";
import type { ArrowElement } from "@/modules/draw-tool/entities/element";
import { Button } from "@/modules/draw-tool/shared/ui";

type ArrowSectionProps = {
  element: ArrowElement;
};

const MAX_WAYPOINTS = 10;

export function ArrowSection({ element }: ArrowSectionProps) {
  if (element.routing !== "straight") {
    return null;
  }

  const cornerStyle = element.routeCornerStyle ?? "sharp";
  const waypointsCount = element.waypoints?.length ?? 0;
  const isLimitReached = waypointsCount >= MAX_WAYPOINTS;

  return (
    <section className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center gap-2 text-sm font-medium text-text">
        <GitCommitHorizontal size={16} />
        Waypoints {waypointsCount > 0 && `(${waypointsCount}/${MAX_WAYPOINTS})`}
      </div>

      <p className="m-0 text-xs text-text-muted">
        Добавь точку маршрута и двигай её как handle на стрелке.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <Button
          className="h-9 rounded-md bg-control px-2 text-xs text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          onClick={boardActions.addWaypointToSelectedArrow}
          disabled={isLimitReached}
          type="button"
        >
          {isLimitReached ? "Лимит!" : "+ точка"}
        </Button>

        <Button
          className="h-9 rounded-md bg-control px-2 text-xs text-text transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!element.waypoints?.length}
          onClick={boardActions.clearSelectedArrowWaypoints}
          type="button"
        >
          очистить
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-lg bg-control p-1">
        <Button
          className={`h-8 rounded-md px-2 text-xs transition-colors ${
            cornerStyle === "sharp"
              ? "bg-primary text-white"
              : "text-text-muted hover:bg-surface-muted hover:text-text"
          }`}
          onClick={() => boardActions.setSelectedArrowCornerStyle("sharp")}
          type="button"
        >
          угловатый
        </Button>

        <Button
          className={`h-8 rounded-md px-2 text-xs transition-colors ${
            cornerStyle === "rounded"
              ? "bg-primary text-white"
              : "text-text-muted hover:bg-surface-muted hover:text-text"
          }`}
          onClick={() => boardActions.setSelectedArrowCornerStyle("rounded")}
          type="button"
        >
          скругленный
        </Button>
      </div>
    </section>
  );
}

