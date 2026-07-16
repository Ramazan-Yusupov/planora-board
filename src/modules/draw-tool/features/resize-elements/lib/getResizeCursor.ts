import type { ResizeHandle } from "../model/types";

export function getResizeCursor(handle: ResizeHandle) {
  if (handle.startsWith("waypoint:")) {
    return "grab";
  }

  switch (handle) {
    case "n":
    case "s":
      return "ns-resize";
    case "e":
    case "w":
      return "ew-resize";
    case "nw":
    case "se":
      return "nwse-resize";
    case "ne":
    case "sw":
      return "nesw-resize";
    case "start":
    case "end":
    case "elbow":
    case "curve":
      return "grab";
  }
}

