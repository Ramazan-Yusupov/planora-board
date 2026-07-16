import { useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export type PointerOwner =
  | "pan"
  | "selection"
  | "draw"
  | "freeDraw"
  | "eraser"
  | "laser"
  | "lasso";

type ActivePointerInteraction = {
  owner: PointerOwner;
  pointerId: number;
};

export function useActivePointerOwner() {
  const activePointerRef = useRef<ActivePointerInteraction | null>(null);

  function setActivePointerOwner(
    event: ReactPointerEvent<HTMLCanvasElement>,
    owner: PointerOwner,
  ) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      activePointerRef.current = { owner, pointerId: event.pointerId };
    }
  }

  function clearActivePointerOwner(event: ReactPointerEvent<HTMLCanvasElement>) {
    if (activePointerRef.current?.pointerId === event.pointerId) {
      activePointerRef.current = null;
    }
  }

  function getActivePointerOwner(event: ReactPointerEvent<HTMLCanvasElement>) {
    const interaction = activePointerRef.current;
    return interaction?.pointerId === event.pointerId ? interaction.owner : null;
  }

  return {
    clearActivePointerOwner,
    getActivePointerOwner,
    setActivePointerOwner,
  };
}

