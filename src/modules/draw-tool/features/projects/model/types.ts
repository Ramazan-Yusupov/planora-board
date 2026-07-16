import type { BoardElement } from "@/modules/draw-tool/entities/element";
import type { SceneLayer } from "@/modules/draw-tool/entities/scene";
import type { Viewport } from "@/modules/draw-tool/entities/viewport";
import { APP_CONFIG } from "@/modules/draw-tool/shared/config";

export const MAX_PROJECTS = APP_CONFIG.projectLimit;

export type DrawToolProject = {
  activeLayerId?: string;
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  elements: BoardElement[];
  layers?: SceneLayer[];
  viewport: Viewport;
};

export type ProjectSummary = Omit<DrawToolProject, "elements" | "viewport">;

export type ProjectsState = {
  activeProjectId: string | null;
  isReady: boolean;
  isSidebarOpen: boolean;
  projects: ProjectSummary[];
};

