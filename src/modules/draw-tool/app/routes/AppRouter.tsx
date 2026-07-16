import { useEffect } from "react";
import { BoardPage } from "@/modules/draw-tool/pages/board";
import { ROUTE_PATHS } from "./routePaths";

/**
 * Minimal route boundary kept dependency-free while DrawTool has one screen.
 * Unknown URLs return to the board route instead of displaying an empty page.
 */
export function AppRouter() {
  useEffect(() => {
    if (window.location.pathname !== ROUTE_PATHS.board) {
      window.history.replaceState(null, "", ROUTE_PATHS.board);
    }
  }, []);

  return <BoardPage />;
}

