import type { Point } from "./geometry";

/** Pointer coordinates in both browser and board coordinate spaces. */
export type PointerPosition = {
  client: Point;
  screen: Point;
  world: Point;
};

